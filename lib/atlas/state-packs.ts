import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type {
  DocumentTypeDefinition,
  StageCode,
  StatePack,
  StructureType
} from "@/lib/atlas/types";

const ROOT = process.cwd();
const STATE_PACK_DIR = path.join(ROOT, "config", "state-packs");
const DOCUMENT_TYPE_PATH = path.join(ROOT, "config", "document-types.json");

const STAGE_LABELS: Record<StageCode, string> = {
  lead_intake: "Lead Intake",
  screening: "Screening",
  structure_selected: "Structure Selected",
  term_sheet: "Term Sheet",
  deposit_received: "Deposit Received",
  due_diligence: "Due Diligence",
  packet_build: "Packet Build",
  legal_review: "Legal Review",
  signing: "Signing",
  closing: "Closing",
  servicing: "Servicing",
  closed: "Closed",
  declined: "Declined"
};

const CATEGORY_LABELS: Record<string, string> = {
  core_legal: "Core Legal",
  closing_settlement: "Closing - Settlement",
  title_recorded: "Title - Recorded",
  entity_jv: "Entity - JV",
  funding_escrow: "Funding - Escrow",
  insurance_support: "Insurance - Support",
  market_data: "Photos - Market Data",
  archive: "Archive"
};

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function getDocumentTypes(): DocumentTypeDefinition[] {
  return readJsonFile<DocumentTypeDefinition[]>(DOCUMENT_TYPE_PATH);
}

export function getStatePacks(): StatePack[] {
  const files = readdirSync(STATE_PACK_DIR)
    .filter((file) => file.endsWith(".json") && file !== "state-pack.schema.json")
    .sort();

  return files.map((file) => readJsonFile<StatePack>(path.join(STATE_PACK_DIR, file)));
}

export function getStatePackByCode(stateCode: string): StatePack | undefined {
  return getStatePacks().find((statePack) => statePack.state === stateCode.toUpperCase());
}

export function getStructureDocuments(
  statePack: StatePack,
  structureType: StructureType
) {
  return statePack.documents.filter((document) => document.structure_type === structureType);
}

export function getDocumentTypeLabel(documentType: string): string {
  const match = getDocumentTypes().find((entry) => entry.code === documentType);
  return match?.label ?? documentType;
}

export function getDocumentType(documentType: string) {
  return getDocumentTypes().find((entry) => entry.code === documentType);
}

export function getStageLabel(stage: StageCode): string {
  return STAGE_LABELS[stage];
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function summarizePack(statePack: StatePack) {
  const required = statePack.documents.filter(
    (document) => document.requirement_level === "required"
  ).length;
  const placeholders = statePack.documents.filter(
    (document) => document.requirement_level === "placeholder"
  ).length;
  const optional = statePack.documents.filter(
    (document) => document.requirement_level === "optional"
  ).length;

  return {
    required,
    placeholders,
    optional,
    checklistItems: statePack.checklist_items.length
  };
}
