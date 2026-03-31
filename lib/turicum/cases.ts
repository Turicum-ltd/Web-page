import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type {
  CaseChecklistItemRecord,
  CaseRecord,
  NewCaseInput,
  StructureType
} from "@/lib/turicum/types";
import { getStatePackByCode } from "@/lib/turicum/state-packs";

const ROOT = process.cwd();
const CASES_PATH = path.join(ROOT, "data", "cases.json");
const CASE_CHECKLIST_ITEMS_PATH = path.join(ROOT, "data", "case-checklist-items.json");
const CASES_TABLE = "cases";
const CASE_CHECKLIST_ITEMS_TABLE = "case_checklist_items";
const CASE_SELECT_BASE =
  "id, case_code, title, state, structure_type, status, stage, summary, requested_amount, source_type";
const CASE_SELECT_WITH_DRIVE_FOLDER = `${CASE_SELECT_BASE}, google_drive_folder_id`;

interface StoredCaseRecord {
  id: string;
  code: string;
  title: string;
  state: string;
  structureType: "loan" | "purchase";
  status: string;
  stage: CaseRecord["stage"];
  propertySummary: string;
  requestedAmount: string;
  sourceType: string;
  googleDriveFolderId?: string;
}

interface StoredCaseChecklistItemRecord extends CaseChecklistItemRecord {}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
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

function isMissingSupabaseTableError(message: string, tableName: string) {
  const normalized = message.toLowerCase();
  return (
    (normalized.includes("could not find the table") && normalized.includes(tableName)) ||
    (normalized.includes("relation") && normalized.includes(tableName) && normalized.includes("does not exist"))
  );
}

function isMissingSupabaseColumnError(message: string, tableName: string, columnName: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") &&
    normalized.includes(tableName.toLowerCase()) &&
    normalized.includes(columnName.toLowerCase())
  );
}

async function ensureJsonFile(filePath: string) {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, "[]\n", "utf8");
  }
}

async function readLocalCases(): Promise<StoredCaseRecord[]> {
  await ensureJsonFile(CASES_PATH);
  const raw = await readFile(CASES_PATH, "utf8");
  return JSON.parse(raw) as StoredCaseRecord[];
}

async function writeLocalCases(cases: StoredCaseRecord[]) {
  await writeFile(CASES_PATH, JSON.stringify(cases, null, 2) + "\n", "utf8");
}

async function readLocalCaseChecklistItems(): Promise<StoredCaseChecklistItemRecord[]> {
  await ensureJsonFile(CASE_CHECKLIST_ITEMS_PATH);
  const raw = await readFile(CASE_CHECKLIST_ITEMS_PATH, "utf8");
  return JSON.parse(raw) as StoredCaseChecklistItemRecord[];
}

async function writeLocalCaseChecklistItems(items: StoredCaseChecklistItemRecord[]) {
  await writeFile(CASE_CHECKLIST_ITEMS_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
}

async function selectCasesWithSchemaTolerance(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>
) {
  const primary = await supabase
    .from(CASES_TABLE)
    .select(CASE_SELECT_WITH_DRIVE_FOLDER)
    .order("created_at", { ascending: false });

  if (!primary.error || !isMissingSupabaseColumnError(primary.error.message, CASES_TABLE, "google_drive_folder_id")) {
    return primary;
  }

  return supabase
    .from(CASES_TABLE)
    .select(CASE_SELECT_BASE)
    .order("created_at", { ascending: false });
}

async function selectCaseByIdWithSchemaTolerance(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  caseId: string
) {
  const primary = await supabase
    .from(CASES_TABLE)
    .select(CASE_SELECT_WITH_DRIVE_FOLDER)
    .eq("id", caseId)
    .maybeSingle();

  if (!primary.error || !isMissingSupabaseColumnError(primary.error.message, CASES_TABLE, "google_drive_folder_id")) {
    return primary;
  }

  return supabase
    .from(CASES_TABLE)
    .select(CASE_SELECT_BASE)
    .eq("id", caseId)
    .maybeSingle();
}

function normalizeMoneyInput(value: string) {
  const digits = value.replace(/[^\d.]/g, "");
  if (!digits) {
    return "0";
  }

  const numeric = Number(digits);
  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return numeric.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function buildCaseCode(state: string, structureType: "loan" | "purchase") {
  const prefix = structureType === "loan" ? "LOAN" : "PUR";
  const stamp = Date.now().toString().slice(-6);
  return `${state}-${prefix}-${stamp}`;
}

function shouldIncludeChecklistItem(
  requiredFor: StructureType[] | undefined,
  structureType: StructureType
) {
  return !requiredFor || requiredFor.length === 0 || requiredFor.includes(structureType);
}

function mapSupabaseRow(row: Record<string, unknown>): CaseRecord {
  return {
    id: String(row.id),
    code: String(row.case_code),
    title: String(row.title),
    state: String(row.state),
    structureType: row.structure_type === "loan" ? "loan" : "purchase",
    status: String(row.status),
    stage: String(row.stage) as CaseRecord["stage"],
    propertySummary: String(row.summary ?? ""),
    requestedAmount:
      typeof row.requested_amount === "number"
        ? row.requested_amount.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
          })
        : "$0",
    sourceType: String(row.source_type ?? ""),
    googleDriveFolderId: typeof row.google_drive_folder_id === "string" ? row.google_drive_folder_id : undefined
  };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export async function listCases(): Promise<CaseRecord[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const cases = await readLocalCases();
    return cases.sort((a, b) => a.code.localeCompare(b.code)).reverse();
  }

  try {
    const { data, error } = await selectCasesWithSchemaTolerance(supabase);

    if (error) {
      if (isMissingSupabaseTableError(error.message, CASES_TABLE)) {
        const cases = await readLocalCases();
        return cases.sort((a, b) => a.code.localeCompare(b.code)).reverse();
      }
      throw new Error(`Failed to load cases from Supabase: ${error.message}`);
    }

    return (data ?? []).map((row) => mapSupabaseRow(row as Record<string, unknown>));
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }

    const cases = await readLocalCases();
    return cases.sort((a, b) => a.code.localeCompare(b.code)).reverse();
  }
}

export async function getCaseById(caseId: string): Promise<CaseRecord | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const cases = await readLocalCases();
    return cases.find((item) => item.id === caseId) ?? null;
  }

  try {
    const { data, error } = await selectCaseByIdWithSchemaTolerance(supabase, caseId);

    if (error) {
      if (isMissingSupabaseTableError(error.message, CASES_TABLE)) {
        const cases = await readLocalCases();
        return cases.find((item) => item.id === caseId) ?? null;
      }
      throw new Error(`Failed to load case from Supabase: ${error.message}`);
    }

    return data ? mapSupabaseRow(data as Record<string, unknown>) : null;
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }

    const cases = await readLocalCases();
    return cases.find((item) => item.id === caseId) ?? null;
  }
}

export async function listCaseChecklistItems(caseId: string): Promise<CaseChecklistItemRecord[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const items = await readLocalCaseChecklistItems();
    return items.filter((item) => item.caseId === caseId);
  }

  try {
    const { data, error } = await supabase
      .from(CASE_CHECKLIST_ITEMS_TABLE)
      .select(
        "id, case_id, status, state_pack_checklist_item:state_pack_checklist_item_id (code, label, stage, required_for)"
      )
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });

    if (error) {
      if (isMissingSupabaseTableError(error.message, CASE_CHECKLIST_ITEMS_TABLE)) {
        const items = await readLocalCaseChecklistItems();
        return items.filter((item) => item.caseId === caseId);
      }
      throw new Error(`Failed to load checklist items from Supabase: ${error.message}`);
    }

    return (data ?? []).flatMap((row) => {
      const linked = Array.isArray(row.state_pack_checklist_item)
        ? row.state_pack_checklist_item[0]
        : row.state_pack_checklist_item;

      if (!linked) {
        return [];
      }

      return [
        {
          id: String(row.id),
          caseId: String(row.case_id),
          code: String(linked.code),
          label: String(linked.label),
          stage: String(linked.stage) as CaseChecklistItemRecord["stage"],
          status: String(row.status) as CaseChecklistItemRecord["status"],
          requiredFor: Array.isArray(linked.required_for)
            ? (linked.required_for as StructureType[])
            : []
        }
      ];
    });
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }

    const items = await readLocalCaseChecklistItems();
    return items.filter((item) => item.caseId === caseId);
  }
}

async function initializeLocalChecklistItems(
  caseId: string,
  structureType: StructureType,
  stateCode: string
) {
  const statePack = getStatePackByCode(stateCode);

  if (!statePack) {
    return;
  }

  const existing = await readLocalCaseChecklistItems();
  const additions: StoredCaseChecklistItemRecord[] = statePack.checklist_items
    .filter((item) => shouldIncludeChecklistItem(item.required_for, structureType))
    .map((item) => ({
      id: randomUUID(),
      caseId,
      code: item.code,
      label: item.label,
      stage: item.stage,
      status: "not_started",
      requiredFor: item.required_for ?? []
    }));

  await writeLocalCaseChecklistItems([...existing, ...additions]);
}

async function initializeSupabaseChecklistItems(
  caseId: string,
  structureType: StructureType,
  statePackId: string,
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>
) {
  const { data, error } = await supabase
    .from("state_pack_checklist_items")
    .select("id, required_for")
    .eq("state_pack_id", statePackId);

  if (error) {
    throw new Error(`Failed to load state pack checklist items: ${error.message}`);
  }

  const itemsToInsert = (data ?? [])
    .filter((item) => shouldIncludeChecklistItem(item.required_for as StructureType[] | undefined, structureType))
    .map((item) => ({
      case_id: caseId,
      state_pack_checklist_item_id: item.id,
      status: "not_started"
    }));

  if (itemsToInsert.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("case_checklist_items").insert(itemsToInsert);

  if (insertError) {
    throw new Error(`Failed to initialize case checklist items: ${insertError.message}`);
  }
}

export async function createCase(input: NewCaseInput): Promise<CaseRecord> {
  const cleanedState = input.state.toUpperCase();
  const structureType = input.structureType;
  const requestedAmount = normalizeMoneyInput(input.requestedAmount);
  const statePack = getStatePackByCode(cleanedState);
  const code = buildCaseCode(cleanedState, structureType);
  const title = input.title.trim();
  const propertySummary = input.propertySummary.trim();
  const sourceType = input.sourceType.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!statePack) {
    throw new Error(`Unsupported state: ${cleanedState}`);
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const cases = await readLocalCases();
      const newCase: StoredCaseRecord = {
        id: randomUUID(),
        code,
        title,
        state: cleanedState,
      structureType,
      status: "lead",
        stage: "lead_intake",
        propertySummary,
        requestedAmount,
        sourceType,
        googleDriveFolderId: undefined
      };

    cases.unshift(newCase);
    await writeLocalCases(cases);
    await initializeLocalChecklistItems(newCase.id, structureType, cleanedState);
    return newCase;
  }

  const { data: matchingPack, error: packError } = await supabase
    .from("state_packs")
    .select("id")
    .eq("state_code", cleanedState)
    .eq("enabled", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (packError) {
    throw new Error(`Failed to resolve state pack in Supabase: ${packError.message}`);
  }

  const numericAmount = Number(input.requestedAmount.replace(/[^\d.]/g, "")) || 0;
  const insertPayload = {
    case_code: code,
    title,
    state: cleanedState,
    structure_type: structureType,
    source_type: sourceType,
    stage: "lead_intake",
    status: "lead",
    summary: propertySummary,
    requested_amount: numericAmount,
    state_pack_id: matchingPack?.id ?? null,
    google_drive_folder_id: null
  };
  let createResult = await supabase
    .from("cases")
    .insert(insertPayload)
    .select(CASE_SELECT_WITH_DRIVE_FOLDER)
    .single();

  if (createResult.error && isMissingSupabaseColumnError(createResult.error.message, CASES_TABLE, "google_drive_folder_id")) {
    const { google_drive_folder_id: _ignoredDriveFolder, ...fallbackInsertPayload } = insertPayload;
    createResult = await supabase
      .from("cases")
      .insert(fallbackInsertPayload)
      .select(CASE_SELECT_BASE)
      .single();
  }

  const { data, error } = createResult;

  if (error) {
    throw new Error(`Failed to create case in Supabase: ${error.message}`);
  }

  if (matchingPack?.id) {
    await initializeSupabaseChecklistItems(
      String(data.id),
      structureType,
      matchingPack.id,
      supabase
    );
  }

  return mapSupabaseRow(data as Record<string, unknown>);
}

export async function updateCaseGoogleDriveFolder(caseId: string, googleDriveFolderId?: string | null) {
  const normalizedFolderId = googleDriveFolderId?.trim() || undefined;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const cases = await readLocalCases();
    const index = cases.findIndex((item) => item.id === caseId);

    if (index === -1) {
      throw new Error("Case not found.");
    }

    cases[index] = {
      ...cases[index],
      googleDriveFolderId: normalizedFolderId
    };

    await writeLocalCases(cases);
    return cases[index];
  }

  const { data, error } = await supabase
    .from(CASES_TABLE)
    .update({
      google_drive_folder_id: normalizedFolderId ?? null
    })
    .eq("id", caseId)
    .select(
      "id, case_code, title, state, structure_type, status, stage, summary, requested_amount, source_type, google_drive_folder_id"
    )
    .single();

  if (error) {
    throw new Error(`Failed to update case Drive folder in Supabase: ${error.message}`);
  }

  return mapSupabaseRow(data as Record<string, unknown>);
}
