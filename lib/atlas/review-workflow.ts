import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DealIntakeAssessment } from "@/lib/atlas/deal-intake";
import { getSupabaseWorkflowRecord, saveSupabaseWorkflowRecord } from "@/lib/atlas/workflow-state";

const ROOT = process.cwd();
const AI_REVIEW_PATH = path.join(ROOT, "data", "case-ai-reviews.json");
const LEGAL_REVIEW_PATH = path.join(ROOT, "data", "case-legal-reviews.json");
const CLOSING_DILIGENCE_PATH = path.join(ROOT, "data", "case-closing-diligence.json");
const AI_REVIEW_WORKFLOW = "case_ai_review";
const LEGAL_REVIEW_WORKFLOW = "case_legal_review";
const CLOSING_DILIGENCE_WORKFLOW = "case_closing_diligence";

export type ReviewSeverity = "high" | "medium" | "info";
export type AiReviewStatus = "not_started" | "in_review" | "flagged" | "ready_for_legal";
export type LegalReviewStatus = "pending" | "in_review" | "changes_requested" | "approved";
export type ClosingDiligenceStatus = "pending" | "in_review" | "changes_requested" | "cleared";
export type VendorReviewStatus = "pending" | "ordered" | "received" | "reviewed" | "cleared";

export interface AiReviewFinding {
  id: string;
  title: string;
  detail: string;
  severity: ReviewSeverity;
}

export interface CaseAiReviewRecord {
  caseId: string;
  status: AiReviewStatus;
  summary: string;
  reviewerModel: string;
  notes: string;
  findings: AiReviewFinding[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseLegalReviewRecord {
  caseId: string;
  status: LegalReviewStatus;
  lawyerName: string;
  summary: string;
  comments: string;
  approvedForSignature: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseClosingDiligenceRecord {
  caseId: string;
  status: ClosingDiligenceStatus;
  titleCompanyName: string;
  titleStatus: VendorReviewStatus;
  insuranceStatus: VendorReviewStatus;
  taxStatus: VendorReviewStatus;
  summary: string;
  comments: string;
  approvedForExecution: boolean;
  createdAt: string;
  updatedAt: string;
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filePath: string, items: T[]) {
  await writeFile(filePath, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function makeFindingId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

export function buildSuggestedAiFindings(assessment: DealIntakeAssessment, hasTemplate: boolean) {
  const findings: AiReviewFinding[] = [];

  if (!hasTemplate) {
    findings.push({
      id: "template-1",
      title: "No template selected",
      detail: "Choose a precedent before contract AI review can score clause fit or template quality.",
      severity: "high"
    });
  }

  assessment.aiReviewFocus.forEach((detail, index) => {
    findings.push({
      id: makeFindingId("focus", index),
      title: "AI review focus",
      detail,
      severity: index === 0 ? "high" : "medium"
    });
  });

  assessment.clauseChecklist.forEach((detail, index) => {
    findings.push({
      id: makeFindingId("clause", index),
      title: "Clause check",
      detail,
      severity: "medium"
    });
  });

  assessment.supplementalDocuments.forEach((doc, index) => {
    findings.push({
      id: makeFindingId("supplement", index),
      title: `${doc.label} should be reviewed`,
      detail: doc.reason,
      severity: "info"
    });
  });

  return findings.slice(0, 12);
}

export async function getCaseAiReview(caseId: string) {
  const supabaseRecord = await getSupabaseWorkflowRecord<CaseAiReviewRecord>(AI_REVIEW_WORKFLOW, caseId);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseAiReviewRecord>(AI_REVIEW_PATH);
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseAiReview(input: Omit<CaseAiReviewRecord, "createdAt" | "updatedAt">) {
  const supabaseRecord = await saveSupabaseWorkflowRecord<CaseAiReviewRecord>(AI_REVIEW_WORKFLOW, input);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseAiReviewRecord>(AI_REVIEW_PATH);
  const existing = items.find((item) => item.caseId === input.caseId);
  const now = new Date().toISOString();
  const next: CaseAiReviewRecord = {
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  const filtered = items.filter((item) => item.caseId !== input.caseId);
  filtered.push(next);
  await writeJsonFile(AI_REVIEW_PATH, filtered);
  return next;
}

export async function getCaseLegalReview(caseId: string) {
  const supabaseRecord = await getSupabaseWorkflowRecord<CaseLegalReviewRecord>(LEGAL_REVIEW_WORKFLOW, caseId);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseLegalReviewRecord>(LEGAL_REVIEW_PATH);
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseLegalReview(input: Omit<CaseLegalReviewRecord, "createdAt" | "updatedAt">) {
  const supabaseRecord = await saveSupabaseWorkflowRecord<CaseLegalReviewRecord>(LEGAL_REVIEW_WORKFLOW, input);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseLegalReviewRecord>(LEGAL_REVIEW_PATH);
  const existing = items.find((item) => item.caseId === input.caseId);
  const now = new Date().toISOString();
  const next: CaseLegalReviewRecord = {
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  const filtered = items.filter((item) => item.caseId !== input.caseId);
  filtered.push(next);
  await writeJsonFile(LEGAL_REVIEW_PATH, filtered);
  return next;
}

export async function getCaseClosingDiligence(caseId: string) {
  const supabaseRecord = await getSupabaseWorkflowRecord<CaseClosingDiligenceRecord>(CLOSING_DILIGENCE_WORKFLOW, caseId);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseClosingDiligenceRecord>(CLOSING_DILIGENCE_PATH);
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseClosingDiligence(input: Omit<CaseClosingDiligenceRecord, "createdAt" | "updatedAt">) {
  const supabaseRecord = await saveSupabaseWorkflowRecord<CaseClosingDiligenceRecord>(CLOSING_DILIGENCE_WORKFLOW, input);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseClosingDiligenceRecord>(CLOSING_DILIGENCE_PATH);
  const existing = items.find((item) => item.caseId === input.caseId);
  const now = new Date().toISOString();
  const next: CaseClosingDiligenceRecord = {
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  const filtered = items.filter((item) => item.caseId !== input.caseId);
  filtered.push(next);
  await writeJsonFile(CLOSING_DILIGENCE_PATH, filtered);
  return next;
}

const TITLE_AGENCY_DOCUMENT_CODES = new Set([
  "title_commitment",
  "marked_up_title",
  "title_policy",
  "closing_statement",
  "closing_package",
  "mortgage",
  "mortgage_or_deed_of_trust",
  "warranty_deed"
]);

export function getClosingDiligenceDocumentBuckets(assessment: DealIntakeAssessment | null) {
  if (!assessment) {
    return {
      titleAgencyDocuments: [] as Array<{ code: string; label: string; reason: string }>,
      atlasPreparedDocuments: [] as Array<{ code: string; label: string; reason: string }>
    };
  }

  return {
    titleAgencyDocuments: assessment.contractStack.filter((item) => TITLE_AGENCY_DOCUMENT_CODES.has(item.code)),
    atlasPreparedDocuments: assessment.contractStack.filter((item) => !TITLE_AGENCY_DOCUMENT_CODES.has(item.code))
  };
}
