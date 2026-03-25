import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

export interface PrecedentRecord {
  id: string;
  title: string;
  state: string;
  structureType: "loan" | "purchase";
  caseName: string;
  sourceCaseCode: string | null;
  fileName: string;
  sourcePath: string;
  relativePath: string;
  documentType: string;
  templateKind: "template" | "precedent" | "supporting_example";
  isExecuted: boolean;
  isRecorded: boolean;
}

const ROOT = process.cwd();
const PRECEDENTS_PATH = path.join(ROOT, "data", "precedents.json");

export function listPrecedents(): PrecedentRecord[] {
  return JSON.parse(readFileSync(PRECEDENTS_PATH, "utf8")) as PrecedentRecord[];
}

export function summarizePrecedents() {
  const items = listPrecedents();
  const states = new Set(items.map((item) => item.state)).size;
  const executed = items.filter((item) => item.isExecuted).length;
  const recorded = items.filter((item) => item.isRecorded).length;

  return {
    total: items.length,
    states,
    executed,
    recorded
  };
}
