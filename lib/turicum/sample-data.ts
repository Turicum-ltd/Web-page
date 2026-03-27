import type { CaseRecord } from "@/lib/turicum/types";

export const sampleCases: CaseRecord[] = [
  {
    id: "case-fl-001",
    code: "FL-PUR-001",
    title: "Palm Beach Lease-Option Set",
    state: "FL",
    structureType: "purchase",
    status: "packet_in_progress",
    stage: "packet_build",
    propertySummary: "West Palm Beach art studio",
    requestedAmount: "$265,000",
    sourceType: "referral_partner"
  },
  {
    id: "case-tx-001",
    code: "TX-PUR-001",
    title: "Whitney Land Option Closing",
    state: "TX",
    structureType: "purchase",
    status: "legal_review",
    stage: "legal_review",
    propertySummary: "Hill County land parcel",
    requestedAmount: "$450,000",
    sourceType: "direct"
  },
  {
    id: "case-in-001",
    code: "IN-LOAN-001",
    title: "Greenwood Loan Placeholder Pack",
    state: "IN",
    structureType: "loan",
    status: "due_diligence_open",
    stage: "due_diligence",
    propertySummary: "Commercial group modification precedent",
    requestedAmount: "$790,000",
    sourceType: "referral_partner"
  }
];

export const pipelineCards = [
  {
    title: "Lead Intake",
    summary: "Capture deal source, address, amount, debt, and entity context."
  },
  {
    title: "Screening",
    summary: "Apply state, LTV, asset-class, and structure fit rules."
  },
  {
    title: "Packet Build",
    summary: "Generate a document checklist from the state pack and upload the case packet."
  },
  {
    title: "Closing",
    summary: "Track signatures, closing statement, recorded docs, and servicing handoff."
  }
];
