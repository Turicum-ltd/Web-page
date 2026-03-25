import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getDocumentType } from "@/lib/atlas/state-packs";
import type { CaseDocumentRecord, CategoryCode } from "@/lib/atlas/types";

const ROOT = process.cwd();
const CASE_DOCUMENTS_PATH = path.join(ROOT, "data", "case-documents.json");
const STORAGE_ROOT = path.join(ROOT, "storage", "case-documents");
const SUPABASE_STORAGE_PREFIX = "supabase://";
const URL_PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

interface StoredCaseDocumentRecord extends CaseDocumentRecord {}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "atlas-documents";

  if (!url || !key) {
    return null;
  }

  return { url, key, bucket };
}

function getSupabaseAdmin() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function isRecoverableSupabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("fetch failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("econnreset") ||
    normalized.includes("econnrefused") ||
    normalized.includes("etimedout") ||
    normalized.includes("enotfound")
  );
}

async function ensureSupabaseBucket() {
  const supabase = getSupabaseAdmin();
  const config = getSupabaseConfig();

  if (!supabase || !config) {
    return null;
  }

  const { data: existing, error: getError } = await supabase.storage.getBucket(config.bucket);

  if (!getError && existing) {
    return config.bucket;
  }

  const { error: createError } = await supabase.storage.createBucket(config.bucket, {
    public: false,
    fileSizeLimit: "50MB"
  });

  if (createError && !String(createError.message).toLowerCase().includes("already exists")) {
    throw new Error(`Failed to create storage bucket: ${createError.message}`);
  }

  return config.bucket;
}

async function readLocalCaseDocuments(): Promise<StoredCaseDocumentRecord[]> {
  const raw = await readFile(CASE_DOCUMENTS_PATH, "utf8");
  return JSON.parse(raw) as StoredCaseDocumentRecord[];
}

async function writeLocalCaseDocuments(items: StoredCaseDocumentRecord[]) {
  await writeFile(CASE_DOCUMENTS_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapSupabaseRow(row: Record<string, unknown>): CaseDocumentRecord {
  return {
    id: String(row.id),
    caseId: String(row.case_id),
    documentTypeCode: String(row.document_type_code),
    category: String(row.category) as CategoryCode,
    status: String(row.status) as CaseDocumentRecord["status"],
    title: String(row.title ?? row.file_name ?? row.document_type_code),
    fileName: String(row.file_name ?? ""),
    mimeType: String(row.mime_type ?? "application/octet-stream"),
    storagePath: String(row.storage_path),
    uploadedAt: String(row.uploaded_at ?? new Date().toISOString())
  };
}

function buildSupabaseStoragePath(bucket: string, objectPath: string) {
  return `${SUPABASE_STORAGE_PREFIX}${bucket}/${objectPath}`;
}

function parseSupabaseStoragePath(storagePath: string) {
  if (!storagePath.startsWith(SUPABASE_STORAGE_PREFIX)) {
    return null;
  }

  const remainder = storagePath.slice(SUPABASE_STORAGE_PREFIX.length);
  const slashIndex = remainder.indexOf("/");

  if (slashIndex === -1) {
    return null;
  }

  return {
    bucket: remainder.slice(0, slashIndex),
    objectPath: remainder.slice(slashIndex + 1)
  };
}

export function isExternalDocumentReference(storagePath: string) {
  return URL_PROTOCOL_PATTERN.test(storagePath) && !storagePath.startsWith(SUPABASE_STORAGE_PREFIX);
}

export function isGoogleDriveUrl(storagePath: string) {
  try {
    const url = new URL(storagePath);
    return url.hostname === "drive.google.com" || url.hostname === "docs.google.com";
  } catch {
    return false;
  }
}

export async function listCaseDocuments(caseId: string): Promise<CaseDocumentRecord[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const items = await readLocalCaseDocuments();
    return items
      .filter((item) => item.caseId === caseId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  try {
    const { data, error } = await supabase
      .from("case_documents")
      .select(
        "id, case_id, document_type_code, category, status, title, file_name, mime_type, storage_path, uploaded_at"
      )
      .eq("case_id", caseId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load case documents from Supabase: ${error.message}`);
    }

    return (data ?? []).map((row) => mapSupabaseRow(row as Record<string, unknown>));
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }

    const items = await readLocalCaseDocuments();
    return items
      .filter((item) => item.caseId === caseId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }
}

export async function getCaseDocumentById(
  caseId: string,
  documentId: string
): Promise<CaseDocumentRecord | null> {
  const items = await listCaseDocuments(caseId);
  return items.find((item) => item.id === documentId) ?? null;
}

export async function readCaseDocumentBinary(document: CaseDocumentRecord) {
  if (isExternalDocumentReference(document.storagePath)) {
    throw new Error("External document references are opened by redirect, not binary download.");
  }

  const supabaseLocation = parseSupabaseStoragePath(document.storagePath);

  if (supabaseLocation) {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      throw new Error("Supabase is not configured for storage reads.");
    }

    const { data, error } = await supabase.storage
      .from(supabaseLocation.bucket)
      .download(supabaseLocation.objectPath);

    if (error || !data) {
      throw new Error(`Failed to download document from Supabase Storage: ${error?.message ?? "missing file"}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return {
      bytes: buffer,
      mimeType: document.mimeType,
      fileName: document.fileName
    };
  }

  await stat(document.storagePath);
  const bytes = await readFile(document.storagePath);
  return {
    bytes,
    mimeType: document.mimeType,
    fileName: document.fileName
  };
}

export async function createCaseDocumentReference(input: {
  caseId: string;
  documentTypeCode: string;
  storagePath: string;
  category?: CategoryCode;
  status?: CaseDocumentRecord["status"];
  title?: string;
  fileName?: string;
  mimeType?: string;
}) {
  const documentType = getDocumentType(input.documentTypeCode);

  if (!documentType) {
    throw new Error(`Unknown document type: ${input.documentTypeCode}`);
  }

  let referenceUrl: URL;

  try {
    referenceUrl = new URL(input.storagePath);
  } catch {
    throw new Error("A valid Google Drive or document URL is required.");
  }

  const now = new Date().toISOString();
  const category = input.category ?? documentType.default_category;
  const status = input.status ?? "uploaded";
  const title = input.title?.trim() || documentType.label;
  const fileName = input.fileName?.trim() || title;
  const mimeType = input.mimeType?.trim() || "application/vnd.google-apps.document";
  const storagePath = referenceUrl.toString();
  const caseId = input.caseId;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const record: StoredCaseDocumentRecord = {
      id: randomUUID(),
      caseId,
      documentTypeCode: input.documentTypeCode,
      category,
      status,
      title,
      fileName,
      mimeType,
      storagePath,
      uploadedAt: now
    };

    const items = await readLocalCaseDocuments();
    items.unshift(record);
    await writeLocalCaseDocuments(items);
    return record;
  }

  const { data, error } = await supabase
    .from("case_documents")
    .insert({
      case_id: caseId,
      document_type_code: input.documentTypeCode,
      category,
      status,
      title,
      file_name: fileName,
      mime_type: mimeType,
      storage_path: storagePath
    })
    .select(
      "id, case_id, document_type_code, category, status, title, file_name, mime_type, storage_path, uploaded_at"
    )
    .single();

  if (error) {
    throw new Error(`Failed to create linked case document in Supabase: ${error.message}`);
  }

  return mapSupabaseRow(data as Record<string, unknown>);
}

export async function createCaseDocument(input: {
  caseId: string;
  documentTypeCode: string;
  category?: CategoryCode;
  status?: CaseDocumentRecord["status"];
  file: File;
}) {
  const file = input.file;

  if (!file || file.size === 0) {
    throw new Error("A file is required.");
  }

  const documentType = getDocumentType(input.documentTypeCode);

  if (!documentType) {
    throw new Error(`Unknown document type: ${input.documentTypeCode}`);
  }

  const now = new Date().toISOString();
  const caseId = input.caseId;
  const category = input.category ?? documentType.default_category;
  const status = input.status ?? "uploaded";
  const originalName = file.name || `${input.documentTypeCode}.bin`;
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const safeName = sanitizeSegment(baseName) || input.documentTypeCode;
  const bytes = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const documentId = randomUUID();
    const fileName = `${Date.now()}-${safeName}${extension}`;
    const caseDir = path.join(STORAGE_ROOT, caseId);
    const absoluteStoragePath = path.join(caseDir, fileName);

    await mkdir(caseDir, { recursive: true });
    await writeFile(absoluteStoragePath, bytes);

    const record: StoredCaseDocumentRecord = {
      id: documentId,
      caseId,
      documentTypeCode: input.documentTypeCode,
      category,
      status,
      title: documentType.label,
      fileName: originalName,
      mimeType: file.type || "application/octet-stream",
      storagePath: absoluteStoragePath,
      uploadedAt: now
    };

    const items = await readLocalCaseDocuments();
    items.unshift(record);
    await writeLocalCaseDocuments(items);
    return record;
  }

  const bucket = await ensureSupabaseBucket();

  if (!bucket) {
    throw new Error("Supabase bucket could not be resolved.");
  }

  const tempId = randomUUID();
  const objectPath = `${caseId}/${tempId}-${safeName}${extension}`;
  const storagePath = buildSupabaseStoragePath(bucket, objectPath);

  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (uploadError) {
    throw new Error(`Failed to upload document to Supabase Storage: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from("case_documents")
    .insert({
      case_id: caseId,
      document_type_code: input.documentTypeCode,
      category,
      status,
      title: documentType.label,
      file_name: originalName,
      mime_type: file.type || "application/octet-stream",
      storage_path: storagePath
    })
    .select(
      "id, case_id, document_type_code, category, status, title, file_name, mime_type, storage_path, uploaded_at"
    )
    .single();

  if (error) {
    await supabase.storage.from(bucket).remove([objectPath]);
    throw new Error(`Failed to create case document in Supabase: ${error.message}`);
  }

  return mapSupabaseRow(data as Record<string, unknown>);
}
