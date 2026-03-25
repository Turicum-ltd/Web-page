export type SupportLevel = "production" | "provisional" | "draft";
export type StructureType = "loan" | "purchase";
export type RequirementLevel = "required" | "optional" | "placeholder";

export type StageCode =
  | "lead_intake"
  | "screening"
  | "structure_selected"
  | "term_sheet"
  | "deposit_received"
  | "due_diligence"
  | "packet_build"
  | "legal_review"
  | "signing"
  | "closing"
  | "servicing"
  | "closed"
  | "declined";

export type CategoryCode =
  | "core_legal"
  | "closing_settlement"
  | "title_recorded"
  | "entity_jv"
  | "funding_escrow"
  | "insurance_support"
  | "market_data"
  | "archive";

export type IntakeFormCode =
  | "commercial_loan_application"
  | "guarantor_authorization"
  | "lender_fee_agreement";

export type BorrowerPortalStatus =
  | "draft"
  | "ready_to_share"
  | "in_progress"
  | "submitted"
  | "closed";

export type SignatureProvider = "google_workspace" | "documenso" | "manual_upload";

export type SignatureRequestStatus =
  | "draft"
  | "prepared"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "voided"
  | "failed";

export type SignatureEventType =
  | "draft"
  | "prepared"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "voided"
  | "failed"
  | "note"
  | "synced";

export type IntakeFormResponse = Record<string, string | boolean>;

export interface StatePackDocument {
  structure_type: StructureType;
  document_type: string;
  category: CategoryCode;
  stage: StageCode;
  requirement_level: RequirementLevel;
  notes?: string;
}

export interface ChecklistItem {
  code: string;
  label: string;
  stage: StageCode;
  required_for?: StructureType[];
}

export interface StatePack {
  state: string;
  version: string;
  enabled: boolean;
  support_level: SupportLevel;
  notes?: string;
  supported_structures: StructureType[];
  documents: StatePackDocument[];
  checklist_items: ChecklistItem[];
}

export interface DocumentTypeDefinition {
  code: string;
  label: string;
  default_category: CategoryCode;
}

export interface CaseRecord {
  id: string;
  code: string;
  title: string;
  state: string;
  structureType: StructureType;
  status: string;
  stage: StageCode;
  propertySummary: string;
  requestedAmount: string;
  sourceType: string;
}

export interface NewCaseInput {
  title: string;
  state: string;
  structureType: StructureType;
  sourceType: string;
  requestedAmount: string;
  propertySummary: string;
}

export interface CaseChecklistItemRecord {
  id: string;
  caseId: string;
  code: string;
  label: string;
  stage: StageCode;
  status: "not_started" | "requested" | "received" | "reviewed" | "waived" | "rejected";
  requiredFor: StructureType[];
}

export interface CaseDocumentRecord {
  id: string;
  caseId: string;
  documentTypeCode: string;
  category: CategoryCode;
  status:
    | "uploaded"
    | "under_review"
    | "approved"
    | "signed"
    | "recorded"
    | "final";
  title: string;
  fileName: string;
  mimeType: string;
  storagePath: string;
  uploadedAt: string;
}

export interface SignatureEventRecord {
  id: string;
  type: SignatureEventType;
  at: string;
  summary: string;
  metadata?: Record<string, string>;
}

export interface SignatureRequestRecord {
  id: string;
  formCode: IntakeFormCode;
  title: string;
  provider: SignatureProvider;
  status: SignatureRequestStatus;
  recipientName: string;
  recipientEmail: string;
  note: string;
  providerRequestId?: string;
  providerTemplateId?: string;
  providerUrl?: string;
  googleDriveFileId?: string;
  googleDriveFolderId?: string;
  providerStatus?: string;
  lastSyncedAt?: string;
  createdAt: string;
  sentAt?: string;
  signedAt?: string;
  events: SignatureEventRecord[];
}

export interface BorrowerPortalRecord {
  id: string;
  caseId: string;
  accessToken: string;
  portalTitle: string;
  borrowerName: string;
  borrowerEmail: string;
  portalStatus: BorrowerPortalStatus;
  assignedForms: IntakeFormCode[];
  submittedForms: IntakeFormCode[];
  signatureRequests: SignatureRequestRecord[];
  formResponses: Partial<Record<IntakeFormCode, IntakeFormResponse>>;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowerPortalSetupInput {
  borrowerName: string;
  borrowerEmail: string;
  portalTitle: string;
  assignedForms: IntakeFormCode[];
}

export interface CreateSignatureRequestInput {
  caseId: string;
  formCode: IntakeFormCode;
  provider: SignatureProvider;
  recipientName: string;
  recipientEmail: string;
  note?: string;
  providerRequestId?: string;
  providerTemplateId?: string;
  providerUrl?: string;
  googleDriveFileId?: string;
  googleDriveFolderId?: string;
  providerStatus?: string;
}
