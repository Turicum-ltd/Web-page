import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDocumentTypeLabel, getStatePackByCode, getStructureDocuments } from "@/lib/turicum/state-packs";
import type { StructureType } from "@/lib/turicum/types";
import { getSupabaseWorkflowRecord, saveSupabaseWorkflowRecord } from "@/lib/turicum/workflow-state";

const ROOT = process.cwd();
const CASE_DEAL_PROFILES_PATH = path.join(ROOT, "data", "case-deal-profiles.json");
const DEAL_PROFILE_WORKFLOW = "case_deal_profile";

export const dealShapeOptions = ["loan", "purchase", "purchase_leaseback"] as const;
export const propertyTypeOptions = ["single_family", "multifamily", "mixed_use", "retail", "office", "industrial", "land", "other"] as const;
export const entityTypeOptions = ["individual", "llc", "corporation", "trust", "jv", "other"] as const;
export const notaryOptions = ["no", "yes", "depends"] as const;
export const screeningPlanOptions = ["borrower_to_provide", "vendor_required", "already_available"] as const;
export const screeningStatusOptions = ["pending", "requested", "received", "reviewed"] as const;
export const validationStatusOptions = ["pending", "in_review", "approved"] as const;

export type DealShape = typeof dealShapeOptions[number];
export type PropertyType = typeof propertyTypeOptions[number];
export type EntityType = typeof entityTypeOptions[number];
export type NotaryRequirement = typeof notaryOptions[number];
export type ScreeningPlan = typeof screeningPlanOptions[number];
export type ScreeningCheckStatus = typeof screeningStatusOptions[number];
export type ValidationStatus = typeof validationStatusOptions[number];

export interface CaseDealProfileRecord {
  caseId: string;
  state: string;
  structureType: StructureType;
  dealShape: DealShape;
  lenderCount: number;
  propertyType: PropertyType;
  borrowerEntityType: EntityType;
  titleHolderType: EntityType;
  guarantorCount: number;
  notaryRequirement: NotaryRequirement;
  assetAddress?: string;
  assetDescription?: string;
  ownershipStatus?: string;
  acquisitionDate?: string;
  acquisitionPrice?: string;
  improvementSpend?: string;
  titleHoldingDetail?: string;
  estimatedValue?: string;
  valueEstimateBasis?: string;
  fundingNeededBy?: string;
  screeningPlan?: ScreeningPlan;
  screeningProvider?: string;
  screeningNotes?: string;
  creditCheckStatus?: ScreeningCheckStatus;
  backgroundCheckStatus?: ScreeningCheckStatus;
  criminalCheckStatus?: ScreeningCheckStatus;
  validationStatus?: ValidationStatus;
  occupancySummary: string;
  complexityNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractRecommendation {
  code: string;
  label: string;
  source: "state_pack" | "rule";
  reason: string;
  required: boolean;
}

export interface SupplementalDocumentRecommendation {
  label: string;
  reason: string;
}

export interface ReviewStageRecommendation {
  code: "deal_intake" | "borrower_property_validation" | "investor_promotion" | "contract_ai_review" | "legal_review" | "signature" | "notary";
  label: string;
  status: "required" | "recommended" | "optional";
  notes: string;
}

export interface DealIntakeAssessment {
  contractStack: ContractRecommendation[];
  supplementalDocuments: SupplementalDocumentRecommendation[];
  clauseChecklist: string[];
  aiReviewFocus: string[];
  legalReviewFocus: string[];
  investorPromotionFocus: string[];
  reviewStages: ReviewStageRecommendation[];
  signaturePath: "google_esign" | "google_esign_then_notary" | "legal_review_first";
  capitalPath: "single_investor" | "multiple_investors" | "undetermined";
  capitalSummary: string;
}

function clampCount(value: number, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }
  return Math.max(0, Math.round(numeric));
}

async function readProfiles(): Promise<CaseDealProfileRecord[]> {
  try {
    const raw = await readFile(CASE_DEAL_PROFILES_PATH, "utf8");
    return JSON.parse(raw) as CaseDealProfileRecord[];
  } catch {
    return [];
  }
}

async function writeProfiles(items: CaseDealProfileRecord[]) {
  await writeFile(CASE_DEAL_PROFILES_PATH, JSON.stringify(items, null, 2) + "\n");
}

export async function getCaseDealProfile(caseId: string) {
  const supabaseRecord = await getSupabaseWorkflowRecord<CaseDealProfileRecord>(DEAL_PROFILE_WORKFLOW, caseId);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const items = await readProfiles();
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveCaseDealProfile(input: Omit<CaseDealProfileRecord, "createdAt" | "updatedAt">) {
  const items = await readProfiles();
  const existing = items.find((item) => item.caseId === input.caseId);
  const now = new Date().toISOString();
  const normalizedInput: Omit<CaseDealProfileRecord, "createdAt" | "updatedAt"> = {
    ...input,
    lenderCount: clampCount(input.lenderCount, 1),
    guarantorCount: clampCount(input.guarantorCount, 0),
    assetAddress: input.assetAddress?.trim() ?? "",
    assetDescription: input.assetDescription?.trim() ?? "",
    ownershipStatus: input.ownershipStatus?.trim() ?? "",
    acquisitionDate: input.acquisitionDate?.trim() ?? "",
    acquisitionPrice: input.acquisitionPrice?.trim() ?? "",
    improvementSpend: input.improvementSpend?.trim() ?? "",
    titleHoldingDetail: input.titleHoldingDetail?.trim() ?? "",
    estimatedValue: input.estimatedValue?.trim() ?? "",
    valueEstimateBasis: input.valueEstimateBasis?.trim() ?? "",
    fundingNeededBy: input.fundingNeededBy?.trim() ?? "",
    screeningPlan: input.screeningPlan ?? "borrower_to_provide",
    screeningProvider: input.screeningProvider?.trim() ?? "",
    screeningNotes: input.screeningNotes?.trim() ?? "",
    creditCheckStatus: input.creditCheckStatus ?? "pending",
    backgroundCheckStatus: input.backgroundCheckStatus ?? "pending",
    criminalCheckStatus: input.criminalCheckStatus ?? "pending",
    validationStatus: input.validationStatus ?? "pending"
  };
  const supabaseRecord = await saveSupabaseWorkflowRecord<CaseDealProfileRecord>(DEAL_PROFILE_WORKFLOW, normalizedInput);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const next: CaseDealProfileRecord = {
    ...normalizedInput,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  const filtered = items.filter((item) => item.caseId !== input.caseId);
  filtered.push(next);
  await writeProfiles(filtered);
  return next;
}

function uniqueByCode(items: ContractRecommendation[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.code)) return false;
    seen.add(item.code);
    return true;
  });
}

export function assessDealProfile(
  profile: Pick<
    CaseDealProfileRecord,
    | "state"
    | "structureType"
    | "dealShape"
    | "lenderCount"
    | "propertyType"
    | "borrowerEntityType"
    | "titleHolderType"
    | "guarantorCount"
    | "notaryRequirement"
    | "assetAddress"
    | "assetDescription"
    | "ownershipStatus"
    | "acquisitionDate"
    | "acquisitionPrice"
    | "improvementSpend"
    | "titleHoldingDetail"
    | "estimatedValue"
    | "valueEstimateBasis"
    | "fundingNeededBy"
    | "screeningPlan"
    | "screeningProvider"
    | "screeningNotes"
    | "creditCheckStatus"
    | "backgroundCheckStatus"
    | "criminalCheckStatus"
    | "validationStatus"
    | "occupancySummary"
    | "complexityNotes"
  >
): DealIntakeAssessment {
  const statePack = getStatePackByCode(profile.state);
  const baseStructure: StructureType = profile.structureType;
  const statePackDocs = statePack ? getStructureDocuments(statePack, baseStructure) : [];

  const contractStack = uniqueByCode(
    statePackDocs
      .filter((doc) => doc.requirement_level === "required")
      .map((doc) => ({
        code: doc.document_type,
        label: getDocumentTypeLabel(doc.document_type),
        source: "state_pack" as const,
        reason: `Required by the ${profile.state} ${baseStructure} state pack at ${doc.stage.replaceAll("_", " ")} stage.`,
        required: true
      }))
  );

  const supplementalDocuments: SupplementalDocumentRecommendation[] = [];
  const clauseChecklist: string[] = [];
  const aiReviewFocus: string[] = [];
  const legalReviewFocus: string[] = [];
  const investorPromotionFocus: string[] = [];
  const reviewStages: ReviewStageRecommendation[] = [
    {
      code: "deal_intake",
      label: "Deal intake",
      status: "required",
      notes: "Capture the six borrower first-call questions, state, structure, title, ownership, value basis, timing, and screening plan before underwriting and legal selection."
    },
    {
      code: "borrower_property_validation",
      label: "Borrower + property validation",
      status: "required",
      notes: "Validate the borrower, collateral, value basis, and placeholder credit/background/criminal checks before investor-facing promotion or final paper selection."
    },
    {
      code: "investor_promotion",
      label: "Investor promotion",
      status: "required",
      notes:
        profile.lenderCount > 1
          ? "Promote the validated deal into a syndication path and confirm the final investor count before finalizing multi-investor paper."
          : "Promote the validated deal to confirm whether one investor will take the full position or whether the deal needs a broader investor stack."
    },
    {
      code: "contract_ai_review",
      label: "Contract AI review",
      status: "required",
      notes: "Check selected templates against the state pack, clause checklist, investor structure, and collateral facts."
    },
    {
      code: "legal_review",
      label: "Legal review",
      status: "required",
      notes: "Lawyer approves or corrects the selected paper stack before signature routing."
    }
  ];

  if (profile.dealShape === "purchase_leaseback") {
    supplementalDocuments.push(
      { label: "Leaseback agreement", reason: "Purchase-leaseback structures need the lease economics and post-close occupancy documented explicitly." },
      { label: "Option / repurchase mechanics addendum", reason: "Purchase-leaseback deals often need a defined repurchase or option path." }
    );
    clauseChecklist.push(
      "Leaseback rent, term, renewal, and default mechanics",
      "Cross-default between purchase and leaseback documents",
      "Repurchase / option timing and pricing formula"
    );
    aiReviewFocus.push("Check that purchase and leaseback papers are internally consistent and that default remedies align across both sets.");
    legalReviewFocus.push("Confirm the leaseback economics, title transfer mechanics, and any repurchase rights are enforceable in the selected state.");
  }

  let capitalPath: DealIntakeAssessment["capitalPath"] = "undetermined";
  let capitalSummary = "Promote the validated deal to investors and lock the final capital stack before final execution.";

  if (profile.lenderCount > 1) {
    capitalPath = "multiple_investors";
    capitalSummary = `Turicum LLC should promote this as a syndicated opportunity with an expected ${profile.lenderCount}-investor stack. Final allocations and control rights need to be locked before execution.`;
    supplementalDocuments.push({
      label: "Multi-lender / participation addendum",
      reason: "More than one lender usually requires economics, voting, and enforcement rights to be defined clearly."
    });
    clauseChecklist.push(
      "Lender voting thresholds and amendment control",
      "Pro-rata funding and payment waterfall",
      "Enforcement, standstill, and intercreditor mechanics"
    );
    aiReviewFocus.push("Flag missing multi-lender economics, agency, voting, and enforcement clauses.");
    legalReviewFocus.push("Confirm whether an intercreditor, participation, or agent structure is needed for the investor stack.");
    investorPromotionFocus.push(
      "Prepare a syndication summary with validated borrower, property, and valuation highlights.",
      "Confirm final investor count, economics, voting rights, and lead investor control before final paper goes out."
    );
  } else if (profile.lenderCount === 1) {
    capitalPath = "single_investor";
    capitalSummary = "Turicum LLC should promote the validated deal for a single lead investor first, while keeping the file clean enough to widen to a club deal if the market response requires it.";
    investorPromotionFocus.push(
      "Prepare a concise investor memo that can win a single lead investor quickly.",
      "Keep the package ready for syndication if one investor does not take the full position."
    );
  }

  if (profile.assetDescription?.trim()) {
    aiReviewFocus.push(`Keep the paper stack aligned with the actual asset description: ${profile.assetDescription.trim()}`);
    investorPromotionFocus.push(`Investor summary should use this asset description clearly: ${profile.assetDescription.trim()}`);
  }

  if (profile.ownershipStatus?.trim()) {
    aiReviewFocus.push(`Check lien, payoff, and ownership assumptions against this borrower statement: ${profile.ownershipStatus.trim()}`);
    legalReviewFocus.push(`Confirm title, lien, and payoff assumptions against the stated ownership position: ${profile.ownershipStatus.trim()}`);
  }

  if (profile.estimatedValue?.trim() || profile.valueEstimateBasis?.trim()) {
    investorPromotionFocus.push(
      `Investor memo should explain the current value view${profile.estimatedValue?.trim() ? ` (${profile.estimatedValue.trim()})` : ""}${profile.valueEstimateBasis?.trim() ? ` and basis (${profile.valueEstimateBasis.trim()})` : ""}.`
    );
  }

  if (profile.fundingNeededBy?.trim()) {
    investorPromotionFocus.push(`Timing matters: investors should see the requested funding date (${profile.fundingNeededBy.trim()}) in the promotion summary.`);
  }

  if (profile.screeningPlan === "borrower_to_provide") {
    supplementalDocuments.push({
      label: "Borrower-provided credit and background package",
      reason: "Turicum LLC should collect borrower-provided credit, background, and criminal screening reports before investor promotion is treated as fully validated."
    });
  }

  if (profile.screeningPlan === "vendor_required") {
    supplementalDocuments.push({
      label: "Third-party screening order",
      reason: "A screening vendor needs to be selected case by case to obtain credit, background, and criminal checks."
    });
    legalReviewFocus.push("Do not treat borrower validation as final until the external screening vendor has delivered the required reports.");
  }

  if (
    profile.creditCheckStatus !== "reviewed" ||
    profile.backgroundCheckStatus !== "reviewed" ||
    profile.criminalCheckStatus !== "reviewed"
  ) {
    aiReviewFocus.push("Borrower validation should stay provisional until credit, background, and criminal screening placeholders have been reviewed or waived.");
  }

  if (profile.validationStatus !== "approved") {
    investorPromotionFocus.push("Investor promotion should not be treated as final until borrower and property validation is approved.");
  }

  if (profile.borrowerEntityType === "trust" || profile.titleHolderType === "trust") {
    supplementalDocuments.push({
      label: "Trust authority package",
      reason: "Trust structures need authority and trustee capacity confirmed before legal approval."
    });
    clauseChecklist.push("Trustee authority, trust certification, and signatory capacity");
    legalReviewFocus.push("Review trust authority, beneficial ownership, and signing authority requirements.");
  }

  if (profile.borrowerEntityType === "jv") {
    supplementalDocuments.push({
      label: "JV governance rider",
      reason: "Joint-venture borrowers need governance and authority language aligned with the financing documents."
    });
    clauseChecklist.push("JV approvals, member authority, transfer restrictions, and distributions");
    legalReviewFocus.push("Confirm JV governance and signing authority match the finance documents.");
  }

  if (profile.propertyType === "land") {
    clauseChecklist.push("Access, survey, legal description, and development/use restrictions");
    aiReviewFocus.push("Check the paper stack for land-specific title, survey, and access gaps.");
    investorPromotionFocus.push("Investor summary should explain land basis, development assumptions, and entitlement risk.");
  }

  if (profile.propertyType === "mixed_use" || profile.propertyType === "retail" || profile.propertyType === "multifamily") {
    clauseChecklist.push("Assignment of rents, operating covenants, tenant / lease representations");
    aiReviewFocus.push("Check whether operating-income collateral and rent assignment protections are covered.");
    investorPromotionFocus.push("Investor summary should show rent roll quality, occupancy, and in-place cash flow support.");
  }

  if (profile.guarantorCount > 0) {
    clauseChecklist.push(`Guaranty coverage for ${profile.guarantorCount} guarantor(s), including joint/several liability if intended`);
    legalReviewFocus.push("Confirm guarantor obligations, carve-outs, and joinder structure.");
    investorPromotionFocus.push("Include guarantor support and recourse profile in the investor summary.");
  }

  if (profile.notaryRequirement !== "no") {
    reviewStages.push({
      code: "notary",
      label: "Notary / RON review",
      status: "required",
      notes: "This deal should not go straight to Google eSignature without confirming the notarization path."
    });
  }

  reviewStages.push({
    code: "signature",
    label: "Signature routing",
    status: profile.notaryRequirement === "no" ? "required" : "recommended",
    notes:
      profile.notaryRequirement === "no"
        ? "Google Workspace eSignature can be the primary execution path once legal review is complete and the investor structure is final."
        : "Use Google only for non-notarized documents; route notarized papers through a separate notary workflow."
  });

  const signaturePath =
    profile.notaryRequirement === "yes"
      ? "google_esign_then_notary"
      : profile.notaryRequirement === "depends"
        ? "legal_review_first"
        : "google_esign";

  if (profile.occupancySummary.trim()) {
    aiReviewFocus.push(`Check occupancy-specific provisions against: ${profile.occupancySummary.trim()}`);
    investorPromotionFocus.push(`Investor summary should address this occupancy/collateral point: ${profile.occupancySummary.trim()}`);
  }

  if (profile.complexityNotes.trim()) {
    legalReviewFocus.push(`Lawyer should also review this flagged complexity: ${profile.complexityNotes.trim()}`);
    investorPromotionFocus.push(`Investor packaging should explain this complexity clearly: ${profile.complexityNotes.trim()}`);
  }

  return {
    contractStack,
    supplementalDocuments,
    clauseChecklist: Array.from(new Set(clauseChecklist)),
    aiReviewFocus: Array.from(new Set(aiReviewFocus)),
    legalReviewFocus: Array.from(new Set(legalReviewFocus)),
    investorPromotionFocus: Array.from(new Set(investorPromotionFocus)),
    reviewStages,
    signaturePath,
    capitalPath,
    capitalSummary
  };
}
