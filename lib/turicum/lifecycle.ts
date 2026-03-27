import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseWorkflowRecord, saveSupabaseWorkflowRecord } from "@/lib/turicum/workflow-state";

const ROOT = process.cwd();
const FUNDING_PATH = path.join(ROOT, "data", "case-funding-workflows.json");
const SERVICING_PATH = path.join(ROOT, "data", "case-servicing-records.json");
const EXIT_PATH = path.join(ROOT, "data", "case-exit-workflows.json");
const FUNDING_WORKFLOW = "case_funding_workflow";
const SERVICING_WORKFLOW = "case_servicing_record";
const EXIT_WORKFLOW = "case_exit_workflow";

export type FundingStatus = "not_started" | "escrow_setup" | "reserves_defined" | "ready_to_fund" | "funded";
export type ServicingStatus = "setup" | "performing" | "watchlist" | "delinquent" | "resolved";
export type ExitStatus = "not_started" | "payoff_requested" | "extension_review" | "rollover_review" | "closed";
export type ExitType = "payoff" | "sale" | "refinance" | "extension" | "rollover" | "undecided";

export interface CaseFundingWorkflowRecord {
  caseId: string;
  status: FundingStatus;
  escrowProvider: string;
  escrowAccountLabel: string;
  reserveStructure: string;
  reserveAmount: string;
  wireInstructionsReady: boolean;
  fundingMemo: string;
  releaseConditions: string;
  fundedAmount: string;
  fundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyInvestorUpdate {
  id: string;
  periodLabel: string;
  paymentStatus: "scheduled" | "paid" | "late";
  amountSummary: string;
  reserveSummary: string;
  occupancySummary: string;
  narrative: string;
  sentAt?: string;
}

export interface CaseServicingRecord {
  caseId: string;
  status: ServicingStatus;
  nextPaymentDate: string;
  monthlyPaymentAmount: string;
  reserveBalance: string;
  servicerNotes: string;
  investorDistributionSummary: string;
  updates: MonthlyInvestorUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseExitWorkflowRecord {
  caseId: string;
  status: ExitStatus;
  exitType: ExitType;
  targetCloseDate: string;
  payoffAmount: string;
  rolloverVehicle: string;
  payoffStatementReady: boolean;
  exitSummary: string;
  investorCommunication: string;
  completedAt?: string;
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

function upsertByCaseId<T extends { caseId: string; createdAt: string; updatedAt: string }>(items: T[], next: Omit<T, "createdAt" | "updatedAt">) {
  const existing = items.find((item) => item.caseId === next.caseId);
  const now = new Date().toISOString();
  const merged = {
    ...next,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  } as T;
  return [...items.filter((item) => item.caseId !== next.caseId), merged];
}

export async function getCaseFundingWorkflow(caseId: string) {
  const supabaseRecord = await getSupabaseWorkflowRecord<CaseFundingWorkflowRecord>(FUNDING_WORKFLOW, caseId);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseFundingWorkflowRecord>(FUNDING_PATH);
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseFundingWorkflow(input: Omit<CaseFundingWorkflowRecord, "createdAt" | "updatedAt">) {
  const payload = {
    ...input,
    fundedAt: input.status === "funded" ? input.fundedAt ?? new Date().toISOString() : undefined
  };
  const supabaseRecord = await saveSupabaseWorkflowRecord<CaseFundingWorkflowRecord>(FUNDING_WORKFLOW, payload);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseFundingWorkflowRecord>(FUNDING_PATH);
  const next = upsertByCaseId(items, payload);
  await writeJsonFile(FUNDING_PATH, next);
  return next.find((item) => item.caseId === input.caseId) ?? null;
}

export async function getCaseServicingRecord(caseId: string) {
  const supabaseRecord = await getSupabaseWorkflowRecord<CaseServicingRecord>(SERVICING_WORKFLOW, caseId);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseServicingRecord>(SERVICING_PATH);
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseServicingRecord(input: Omit<CaseServicingRecord, "createdAt" | "updatedAt">) {
  const payload = { ...input, updates: Array.isArray(input.updates) ? input.updates : [] };
  const supabaseRecord = await saveSupabaseWorkflowRecord<CaseServicingRecord>(SERVICING_WORKFLOW, payload);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseServicingRecord>(SERVICING_PATH);
  const next = upsertByCaseId(items, payload);
  await writeJsonFile(SERVICING_PATH, next);
  return next.find((item) => item.caseId === input.caseId) ?? null;
}

export async function getCaseExitWorkflow(caseId: string) {
  const supabaseRecord = await getSupabaseWorkflowRecord<CaseExitWorkflowRecord>(EXIT_WORKFLOW, caseId);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseExitWorkflowRecord>(EXIT_PATH);
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseExitWorkflow(input: Omit<CaseExitWorkflowRecord, "createdAt" | "updatedAt">) {
  const payload = {
    ...input,
    completedAt: input.status === "closed" ? input.completedAt ?? new Date().toISOString() : undefined
  };
  const supabaseRecord = await saveSupabaseWorkflowRecord<CaseExitWorkflowRecord>(EXIT_WORKFLOW, payload);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readJsonFile<CaseExitWorkflowRecord>(EXIT_PATH);
  const next = upsertByCaseId(items, payload);
  await writeJsonFile(EXIT_PATH, next);
  return next.find((item) => item.caseId === input.caseId) ?? null;
}

export function buildDefaultInvestorUpdates(): MonthlyInvestorUpdate[] {
  return [
    {
      id: "update-1",
      periodLabel: "Month 1",
      paymentStatus: "scheduled",
      amountSummary: "Initial servicing cycle not yet posted",
      reserveSummary: "Reserve ledger to be confirmed after funding",
      occupancySummary: "No post-close occupancy update yet",
      narrative: "Turicum LLC will track borrower payment, reserve balance, and the investor narrative each month."
    },
    {
      id: "update-2",
      periodLabel: "Month 2",
      paymentStatus: "scheduled",
      amountSummary: "Awaiting first completed investor distribution cycle",
      reserveSummary: "Reserve plan follows the funding memo",
      occupancySummary: "Update once property reporting starts",
      narrative: "Use this lane for monthly investor updates after the deal funds."
    }
  ];
}
