import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function resolveAnalysisPath() {
  const configured = process.env.TURICUM_LEGAL_ANALYSIS_PATH?.trim();
  const candidates = [
    configured,
    path.join(process.cwd(), "data", "turicum-legal-analysis-latest.json")
  ].filter((value): value is string => Boolean(value));

  return candidates.find((candidate) => existsSync(path.resolve(candidate))) ?? candidates[0] ?? path.join(process.cwd(), "data", "turicum-legal-analysis-latest.json");
}

export interface TuricumLegalCoverageRow {
  state: string;
  version: string;
  structureType: "loan" | "purchase";
  supportLevel: string;
  requiredDocumentCount: number;
  coveredRequiredCount: number;
  missingRequiredCount: number;
  present: Array<{
    documentType: string;
    documentLabel: string;
    bestCandidate: {
      id: string;
      title: string;
      candidateScore: number;
      isExecuted: boolean;
      isRecorded: boolean;
      hasText: boolean;
    };
    precedentCount: number;
  }>;
  missing: Array<{
    documentType: string;
    documentLabel: string;
  }>;
}

export interface TuricumLegalGroup {
  key: string;
  state: string;
  structureType: "loan" | "purchase";
  documentType: string;
  documentLabel: string;
  precedentCount: number;
  executedCount: number;
  recordedCount: number;
  readableCount: number;
  bestCandidate: {
    id: string;
    title: string;
    candidateScore: number;
    isExecuted: boolean;
    isRecorded: boolean;
    hasText: boolean;
  };
  alternatives: Array<{
    id: string;
    title: string;
    candidateScore: number;
    isExecuted: boolean;
    isRecorded: boolean;
    hasText: boolean;
  }>;
}

export interface TuricumLegalAnalysis {
  generatedAt: string;
  turicumPlatformRoot: string;
  sourceFolders: Array<{ label: string; url: string }>;
  corpusMode: string;
  summary: {
    totalPrecedents: number;
    executedPrecedents: number;
    recordedPrecedents: number;
    readablePrecedents: number;
    states: string[];
    structures: string[];
    documentTypes: string[];
    corpusRootsResolved: string[];
    referenceRootsResolved: string[];
    referenceDocCount: number;
    statePackCoverage: Array<{
      state: string;
      structureType: string;
      coverage: number;
    }>;
  };
  coverage: TuricumLegalCoverageRow[];
  groups: TuricumLegalGroup[];
}

export function decodeLegalGroupKey(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getLatestLegalCorpusAnalysis(): TuricumLegalAnalysis | null {
  try {
    return JSON.parse(readFileSync(path.resolve(resolveAnalysisPath()), "utf8")) as TuricumLegalAnalysis;
  } catch {
    return null;
  }
}

export function getLegalGroupByKey(groupKey: string, analysis?: TuricumLegalAnalysis | null) {
  const resolved = analysis ?? getLatestLegalCorpusAnalysis();
  if (!resolved) {
    return null;
  }

  const decoded = decodeLegalGroupKey(groupKey);
  return resolved.groups.find((group) => group.key === decoded) ?? null;
}
