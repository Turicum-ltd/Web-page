import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseWorkflowRecord, saveSupabaseWorkflowRecord } from "@/lib/turicum/workflow-state";

const ROOT = process.cwd();
const INVESTOR_PROMOTION_PATH = path.join(ROOT, "data", "case-investor-promotions.json");
const INVESTOR_PROMOTION_WORKFLOW = "case_investor_promotion";

export type InvestorPromotionStatus =
  | "pending"
  | "gathering_borrower_info"
  | "ready_for_investors"
  | "promoted"
  | "investor_committed";

export type InvestorStructure = "undecided" | "single_investor" | "multiple_investors";

export interface CaseInvestorPromotionRecord {
  caseId: string;
  status: InvestorPromotionStatus;
  headline: string;
  validationSummary: string;
  investorSummary: string;
  promotionNotes: string;
  leadInvestorName: string;
  targetInvestorCount: number;
  finalInvestorCount: number;
  finalStructure: InvestorStructure;
  promotedAt?: string;
  committedAt?: string;
  createdAt: string;
  updatedAt: string;
}

async function readInvestorPromotions(): Promise<CaseInvestorPromotionRecord[]> {
  try {
    const raw = await readFile(INVESTOR_PROMOTION_PATH, "utf8");
    return JSON.parse(raw) as CaseInvestorPromotionRecord[];
  } catch {
    return [];
  }
}

async function writeInvestorPromotions(items: CaseInvestorPromotionRecord[]) {
  await writeFile(INVESTOR_PROMOTION_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function clampCount(value: number, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }

  return Math.max(0, Math.round(numeric));
}

export async function getCaseInvestorPromotion(caseId: string) {
  const supabaseRecord = await getSupabaseWorkflowRecord<CaseInvestorPromotionRecord>(INVESTOR_PROMOTION_WORKFLOW, caseId);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readInvestorPromotions();
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseInvestorPromotion(
  input: Omit<CaseInvestorPromotionRecord, "createdAt" | "updatedAt" | "promotedAt" | "committedAt"> &
    Partial<Pick<CaseInvestorPromotionRecord, "promotedAt" | "committedAt">>
) {
  const existingSupabase = await getSupabaseWorkflowRecord<CaseInvestorPromotionRecord>(INVESTOR_PROMOTION_WORKFLOW, input.caseId);
  const now = new Date().toISOString();
  const normalizedInput: Omit<CaseInvestorPromotionRecord, "createdAt" | "updatedAt"> = {
    ...input,
    targetInvestorCount: clampCount(input.targetInvestorCount, 1),
    finalInvestorCount: clampCount(input.finalInvestorCount, 0),
    promotedAt:
      input.status === "promoted" || input.status === "investor_committed"
        ? input.promotedAt ?? existingSupabase?.promotedAt ?? now
        : undefined,
    committedAt:
      input.status === "investor_committed"
        ? input.committedAt ?? existingSupabase?.committedAt ?? now
        : undefined
  };
  const supabaseRecord = await saveSupabaseWorkflowRecord<CaseInvestorPromotionRecord>(INVESTOR_PROMOTION_WORKFLOW, normalizedInput);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readInvestorPromotions();
  const existing = items.find((item) => item.caseId === input.caseId);

  const next: CaseInvestorPromotionRecord = {
    ...normalizedInput,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  const filtered = items.filter((item) => item.caseId !== input.caseId);
  filtered.push(next);
  await writeInvestorPromotions(filtered);
  return next;
}
