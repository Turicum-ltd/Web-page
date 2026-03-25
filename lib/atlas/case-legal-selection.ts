import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { listPrecedents } from "@/lib/atlas/precedents";

const ROOT = process.cwd();
const CASE_LEGAL_SELECTIONS_PATH = path.join(ROOT, "data", "case-legal-selections.json");

export interface CaseLegalSelectionRecord {
  caseId: string;
  groupKey: string;
  precedentId: string;
  precedentTitle: string;
  documentType: string;
  state: string;
  structureType: string;
  sourceRelativePath?: string;
  sourceCaseCode?: string;
  googleDriveFileId?: string;
  googleDriveFolderId?: string;
  sourceFolderUrl?: string;
  selectedAt: string;
}

async function readSelections(): Promise<CaseLegalSelectionRecord[]> {
  try {
    const raw = await readFile(CASE_LEGAL_SELECTIONS_PATH, "utf8");
    return JSON.parse(raw) as CaseLegalSelectionRecord[];
  } catch {
    return [];
  }
}

async function writeSelections(items: CaseLegalSelectionRecord[]) {
  await writeFile(CASE_LEGAL_SELECTIONS_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function backfillSelection(selection: CaseLegalSelectionRecord) {
  const precedents = listPrecedents();
  const match = precedents.find((item) =>
    item.id === selection.precedentId ||
    item.title === selection.precedentTitle ||
    (item.state === selection.state &&
      item.structureType === selection.structureType &&
      item.documentType === selection.documentType &&
      item.title === selection.precedentTitle)
  );

  if (!match) {
    return { changed: false, selection };
  }

  const next: CaseLegalSelectionRecord = {
    ...selection,
    sourceRelativePath: selection.sourceRelativePath || match.relativePath || undefined,
    sourceCaseCode: selection.sourceCaseCode || match.sourceCaseCode || undefined
  };

  const changed =
    next.sourceRelativePath !== selection.sourceRelativePath ||
    next.sourceCaseCode !== selection.sourceCaseCode;

  return { changed, selection: next };
}

async function readSelectionsWithBackfill() {
  const items = await readSelections();
  let changed = false;
  const next = items.map((item) => {
    const result = backfillSelection(item);
    if (result.changed) {
      changed = true;
    }
    return result.selection;
  });

  if (changed) {
    await writeSelections(next);
  }

  return next;
}

export async function getCaseLegalSelection(caseId: string) {
  const items = await readSelectionsWithBackfill();
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseLegalSelection(selection: Omit<CaseLegalSelectionRecord, "selectedAt">) {
  const items = await readSelectionsWithBackfill();
  const next: CaseLegalSelectionRecord = {
    ...selection,
    selectedAt: new Date().toISOString()
  };
  const filtered = items.filter((item) => item.caseId !== selection.caseId);
  filtered.push(next);
  await writeSelections(filtered);
  return next;
}

export async function clearCaseLegalSelection(caseId: string) {
  const items = await readSelectionsWithBackfill();
  const filtered = items.filter((item) => item.caseId !== caseId);
  await writeSelections(filtered);
}
