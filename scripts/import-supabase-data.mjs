import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

function loadEnvFile() {
  const envPath = path.join(root, ".env.local");
  const content = readFileSync(envPath, "utf8");
  const vars = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    vars[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }

  return vars;
}

function loadJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function formatAmount(value) {
  if (!value) return 0;
  return Number(String(value).replace(/[^\d.]/g, "")) || 0;
}

const env = loadEnvFile();
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const documentTypes = loadJson("config/document-types.json");
const cases = loadJson("data/cases.json");
const checklistItems = loadJson("data/case-checklist-items.json");
const caseDocuments = loadJson("data/case-documents.json");
const precedents = loadJson("data/precedents.json");

for (const extra of [
  { code: "contact_sheet", label: "Contact Sheet", default_category: "core_legal" },
  { code: "other", label: "Other", default_category: "archive" }
]) {
  if (!documentTypes.find((entry) => entry.code === extra.code)) {
    documentTypes.push(extra);
  }
}

async function seedDocumentTypes() {
  const { error } = await supabase.from("document_types").upsert(documentTypes, {
    onConflict: "code"
  });

  if (error) throw error;
}

async function fetchStatePacks() {
  const { data, error } = await supabase
    .from("state_packs")
    .select("id, state_code, version")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

async function fetchStatePackChecklistItems() {
  const { data, error } = await supabase
    .from("state_pack_checklist_items")
    .select("id, state_pack_id, code");

  if (error) throw error;

  return data ?? [];
}

async function upsertCases(statePacks) {
  const caseIdMap = new Map();

  for (const item of cases) {
    const matchingStatePack = statePacks.find((pack) => pack.state_code === item.state);

    const payload = {
      case_code: item.code,
      title: item.title,
      state: item.state,
      structure_type: item.structureType,
      source_type: item.sourceType,
      stage: item.stage,
      status: item.status,
      summary: item.propertySummary,
      requested_amount: formatAmount(item.requestedAmount),
      state_pack_id: matchingStatePack?.id ?? null
    };

    const { data: existing, error: existingError } = await supabase
      .from("cases")
      .select("id")
      .eq("case_code", item.code)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing?.id) {
      const { error } = await supabase.from("cases").update(payload).eq("id", existing.id);
      if (error) throw error;
      caseIdMap.set(item.id, existing.id);
    } else {
      const { data, error } = await supabase
        .from("cases")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      caseIdMap.set(item.id, data.id);
    }
  }

  return caseIdMap;
}

async function syncChecklistItems(caseIdMap, statePacks, statePackChecklistItems) {
  for (const item of cases) {
    const dbCaseId = caseIdMap.get(item.id);
    if (!dbCaseId) continue;

    const matchingStatePack = statePacks.find((pack) => pack.state_code === item.state);
    if (!matchingStatePack) continue;

    const { error: deleteError } = await supabase
      .from("case_checklist_items")
      .delete()
      .eq("case_id", dbCaseId);

    if (deleteError) throw deleteError;

    const relatedItems = checklistItems.filter((checklistItem) => checklistItem.caseId === item.id);

    if (relatedItems.length === 0) continue;

    const payload = relatedItems
      .map((checklistItem) => {
        const statePackChecklistItem = statePackChecklistItems.find(
          (entry) => entry.state_pack_id === matchingStatePack.id && entry.code === checklistItem.code
        );

        if (!statePackChecklistItem) return null;

        return {
          case_id: dbCaseId,
          state_pack_checklist_item_id: statePackChecklistItem.id,
          status: checklistItem.status
        };
      })
      .filter(Boolean);

    if (payload.length === 0) continue;

    const { error } = await supabase.from("case_checklist_items").insert(payload);
    if (error) throw error;
  }
}

async function syncCaseDocuments(caseIdMap) {
  for (const item of cases) {
    const dbCaseId = caseIdMap.get(item.id);
    if (!dbCaseId) continue;

    const { error: deleteError } = await supabase
      .from("case_documents")
      .delete()
      .eq("case_id", dbCaseId);

    if (deleteError) throw deleteError;

    const relatedDocuments = caseDocuments
      .filter((document) => document.caseId === item.id)
      .map((document) => ({
        case_id: dbCaseId,
        document_type_code: document.documentTypeCode,
        category: document.category,
        status: document.status,
        title: document.title,
        file_name: document.fileName,
        mime_type: document.mimeType,
        storage_path: document.storagePath,
        uploaded_at: document.uploadedAt
      }));

    if (relatedDocuments.length === 0) continue;

    const { error } = await supabase.from("case_documents").insert(relatedDocuments);
    if (error) throw error;
  }
}

async function syncPrecedents() {
  const byPath = new Map();
  const { data: existing, error: existingError } = await supabase
    .from("templates")
    .select("id, storage_path");

  if (existingError) throw existingError;

  for (const item of existing ?? []) {
    byPath.set(item.storage_path, item.id);
  }

  for (const item of precedents) {
    const payload = {
      title: item.title,
      state: item.state || null,
      structure_type: item.structureType,
      document_type_code: item.documentType,
      template_kind: item.templateKind,
      storage_path: item.sourcePath,
      version: "v1",
      is_active: true,
      review_status: item.isExecuted ? "ops_approved" : "unreviewed",
      source_case_code: item.sourceCaseCode,
      is_executed: item.isExecuted,
      is_recorded: item.isRecorded,
      notes: item.caseName
    };

    const existingId = byPath.get(item.sourcePath);

    if (existingId) {
      const { error } = await supabase.from("templates").update(payload).eq("id", existingId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("templates")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      byPath.set(item.sourcePath, data.id);
    }
  }
}

async function main() {
  await seedDocumentTypes();
  const statePacks = await fetchStatePacks();
  const statePackChecklistItems = await fetchStatePackChecklistItems();
  const caseIdMap = await upsertCases(statePacks);
  await syncChecklistItems(caseIdMap, statePacks, statePackChecklistItems);
  await syncCaseDocuments(caseIdMap);
  await syncPrecedents();

  console.log(
    `Imported ${cases.length} cases, ${checklistItems.length} checklist items, ${caseDocuments.length} case documents, and ${precedents.length} precedents into Supabase.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
