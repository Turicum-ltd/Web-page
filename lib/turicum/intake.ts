import "server-only";

import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCaseById } from "@/lib/turicum/cases";
import { listCaseDocuments } from "@/lib/turicum/case-documents";
import { countAnsweredFields, getIntakeForm, getIntakeForms } from "@/lib/turicum/intake-forms";
import type { CategoryCode } from "@/lib/turicum/types";
import type {
  BorrowerPortalRecord,
  BorrowerPortalSetupInput,
  CaseDocumentRecord,
  CaseRecord,
  CreateSignatureRequestInput,
  IntakeFormCode,
  IntakeFormResponse,
  SignatureEventRecord,
  SignatureRequestRecord,
  SignatureRequestStatus
} from "@/lib/turicum/types";
import type { NotaryRequirement } from "@/lib/turicum/deal-intake";

const ROOT = process.cwd();
const BORROWER_PORTALS_PATH = path.join(ROOT, "data", "borrower-portals.json");

interface StoredBorrowerPortalRecord extends BorrowerPortalRecord {}

type PortalFormStatus =
  | "awaiting_borrower"
  | "submitted"
  | "signature_prepared"
  | "signature_sent"
  | "signed";

function buildSignatureEvent(
  type: SignatureRequestStatus | "note" | "synced",
  summary: string,
  at = new Date().toISOString(),
  metadata: Record<string, string> = {}
): SignatureEventRecord {
  return {
    id: randomUUID(),
    type,
    at,
    summary,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {})
  };
}

function normalizeSignatureRequests(requests: SignatureRequestRecord[] | undefined) {
  return (requests ?? []).map((request) => ({
    ...request,
    providerStatus: request.providerStatus ?? request.status,
    events: Array.isArray(request.events) ? request.events : []
  }));
}

async function readBorrowerPortals(): Promise<StoredBorrowerPortalRecord[]> {
  const raw = await readFile(BORROWER_PORTALS_PATH, "utf8");
  return (JSON.parse(raw) as StoredBorrowerPortalRecord[]).map((portal) => ({
    ...portal,
    signatureRequests: normalizeSignatureRequests(portal.signatureRequests)
  }));
}

async function writeBorrowerPortals(items: StoredBorrowerPortalRecord[]) {
  await writeFile(BORROWER_PORTALS_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function defaultAssignedForms(): IntakeFormCode[] {
  return getIntakeForms().map((form) => form.code);
}

function normalizeAssignedForms(codes: IntakeFormCode[]) {
  const validCodes = new Set(getIntakeForms().map((form) => form.code));
  const unique = Array.from(new Set(codes.filter((code) => validCodes.has(code))));
  return unique.length > 0 ? unique : defaultAssignedForms();
}

function derivePortalStatus(portal: {
  borrowerName: string;
  borrowerEmail: string;
  assignedForms: IntakeFormCode[];
  submittedForms: IntakeFormCode[];
}) {
  if (!portal.borrowerName.trim() && !portal.borrowerEmail.trim()) {
    return "draft" as const;
  }

  if (portal.assignedForms.length === 0) {
    return "draft" as const;
  }

  if (portal.submittedForms.length >= portal.assignedForms.length) {
    return "submitted" as const;
  }

  if (portal.submittedForms.length > 0) {
    return "in_progress" as const;
  }

  return "ready_to_share" as const;
}

const BORROWER_SUPPORTING_DOCUMENT_REQUIREMENTS: Array<{
  id: string;
  label: string;
  description: string;
  documentTypeCodes?: string[];
  categories?: CategoryCode[];
}> = [
  {
    id: "entity-authority",
    label: "Entity and authority documents",
    description: "Articles, operating agreement, JV, or comparable authority support for the borrower entity.",
    documentTypeCodes: ["articles_of_organization", "operating_agreement", "jv_agreement", "disposition_agreement"],
    categories: ["entity_jv"]
  },
  {
    id: "property-collateral",
    label: "Property or collateral support",
    description: "Photos, collateral package, or other property support that lets underwriting and investors see the asset clearly.",
    documentTypeCodes: ["other"],
    categories: ["market_data"]
  },
  {
    id: "ownership-title-liens",
    label: "Ownership, title, or lien backup",
    description: "Title, deed, mortgage, or other ownership/lien evidence supporting the existing capital stack.",
    documentTypeCodes: [
      "title_commitment",
      "title_policy",
      "marked_up_title",
      "mortgage",
      "mortgage_or_deed_of_trust",
      "mortgage_modification",
      "warranty_deed"
    ],
    categories: ["title_recorded"]
  }
];

function matchesBorrowerSupportingDocumentRequirement(
  document: CaseDocumentRecord,
  requirement: (typeof BORROWER_SUPPORTING_DOCUMENT_REQUIREMENTS)[number]
) {
  return (
    requirement.documentTypeCodes?.includes(document.documentTypeCode) ||
    requirement.categories?.includes(document.category) ||
    false
  );
}

function buildBorrowerSupportingDocumentChecklist(documents: CaseDocumentRecord[]) {
  return BORROWER_SUPPORTING_DOCUMENT_REQUIREMENTS.map((requirement) => {
    const matchedDocuments = documents.filter((document) =>
      matchesBorrowerSupportingDocumentRequirement(document, requirement)
    );

    return {
      id: requirement.id,
      label: requirement.label,
      description: requirement.description,
      ready: matchedDocuments.length > 0,
      matchedCount: matchedDocuments.length,
      matchedDocuments: matchedDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        documentTypeCode: document.documentTypeCode,
        category: document.category,
        status: document.status
      }))
    };
  });
}

function buildSeedResponses(caseRecord: CaseRecord): BorrowerPortalRecord["formResponses"] {
  const requestedAmount = caseRecord.requestedAmount || "";
  const propertySummary = caseRecord.propertySummary || "";

  return {
    commercial_loan_application: {
      requestedAmount,
      propertyAddress: propertySummary,
      loanPurpose: caseRecord.structureType === "loan" ? "refinance" : "purchase"
    },
    lender_fee_agreement: {
      requestedLoanAmount: requestedAmount,
      subjectProperty: propertySummary,
      borrowerEntity: caseRecord.title,
      guarantorName: ""
    }
  };
}

function createBlankPortal(caseRecord: CaseRecord): BorrowerPortalRecord {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    caseId: caseRecord.id,
    accessToken: randomUUID().replace(/-/g, ""),
    portalTitle: `${caseRecord.title} borrower intake`,
    borrowerName: "",
    borrowerEmail: "",
    portalStatus: "draft",
    assignedForms: defaultAssignedForms(),
    submittedForms: [],
    signatureRequests: [],
    formResponses: buildSeedResponses(caseRecord),
    createdAt: now,
    updatedAt: now
  };
}

export async function getBorrowerPortalForCase(caseId: string): Promise<BorrowerPortalRecord | null> {
  const items = await readBorrowerPortals();
  const existing = items.find((item) => item.caseId === caseId);

  if (existing) {
    return existing;
  }

  const caseRecord = await getCaseById(caseId);

  if (!caseRecord) {
    return null;
  }

  const portal = createBlankPortal(caseRecord);
  items.unshift(portal);
  await writeBorrowerPortals(items);
  return portal;
}

export async function getBorrowerPortalByToken(
  accessToken: string
): Promise<BorrowerPortalRecord | null> {
  const items = await readBorrowerPortals();
  return items.find((item) => item.accessToken === accessToken) ?? null;
}

export async function getBorrowerPortalByCaseId(
  caseId: string
): Promise<BorrowerPortalRecord | null> {
  const items = await readBorrowerPortals();
  return items.find((item) => item.caseId === caseId) ?? null;
}

export async function saveBorrowerPortalSetup(
  caseId: string,
  input: BorrowerPortalSetupInput
): Promise<BorrowerPortalRecord> {
  const items = await readBorrowerPortals();
  const index = items.findIndex((item) => item.caseId === caseId);
  const now = new Date().toISOString();

  const basePortal =
    index >= 0
      ? items[index]
      : (() => {
          throw new Error("Borrower portal must be initialized before saving setup.");
        })();

  const assignedForms = normalizeAssignedForms(input.assignedForms);
  const submittedForms = basePortal.submittedForms.filter((formCode) => assignedForms.includes(formCode));

  const updated: BorrowerPortalRecord = {
    ...basePortal,
    borrowerName: input.borrowerName.trim(),
    borrowerEmail: input.borrowerEmail.trim(),
    portalTitle: input.portalTitle.trim() || basePortal.portalTitle,
    assignedForms,
    submittedForms,
    portalStatus: derivePortalStatus({
      borrowerName: input.borrowerName,
      borrowerEmail: input.borrowerEmail,
      assignedForms,
      submittedForms
    }),
    updatedAt: now
  };

  items[index] = updated;
  await writeBorrowerPortals(items);
  return updated;
}

export async function submitBorrowerPortalForm(
  accessToken: string,
  formCode: IntakeFormCode,
  response: IntakeFormResponse
): Promise<BorrowerPortalRecord> {
  const items = await readBorrowerPortals();
  const index = items.findIndex((item) => item.accessToken === accessToken);

  if (index === -1) {
    throw new Error("Borrower portal not found.");
  }

  const portal = items[index];
  const assignedForms = portal.assignedForms.includes(formCode)
    ? portal.assignedForms
    : normalizeAssignedForms([...portal.assignedForms, formCode]);
  const submittedForms = portal.submittedForms.includes(formCode)
    ? portal.submittedForms
    : [...portal.submittedForms, formCode];
  const now = new Date().toISOString();

  const updated: BorrowerPortalRecord = {
    ...portal,
    assignedForms,
    submittedForms,
    formResponses: {
      ...portal.formResponses,
      [formCode]: {
        ...(portal.formResponses[formCode] ?? {}),
        ...response
      }
    },
    portalStatus: derivePortalStatus({
      borrowerName: portal.borrowerName,
      borrowerEmail: portal.borrowerEmail,
      assignedForms,
      submittedForms
    }),
    updatedAt: now
  };

  items[index] = updated;
  await writeBorrowerPortals(items);
  return updated;
}

export async function createSignatureRequest(
  caseId: string,
  input: CreateSignatureRequestInput
): Promise<SignatureRequestRecord> {
  const items = await readBorrowerPortals();
  const index = items.findIndex((item) => item.caseId === caseId);

  if (index === -1) {
    throw new Error("Borrower portal not found.");
  }

  const portal = items[index];
  const now = new Date().toISOString();
  const title = getIntakeForm(input.formCode)?.title ?? input.formCode;
  const request: SignatureRequestRecord = {
    id: randomUUID(),
    formCode: input.formCode,
    title,
    provider: input.provider,
    status: "prepared",
    recipientName: input.recipientName.trim(),
    recipientEmail: input.recipientEmail.trim(),
    note: input.note?.trim() ?? "",
    providerRequestId: input.providerRequestId?.trim() || undefined,
    providerTemplateId: input.providerTemplateId?.trim() || undefined,
    providerUrl: input.providerUrl?.trim() || undefined,
    googleDriveFileId: input.googleDriveFileId?.trim() || undefined,
    googleDriveFolderId: input.googleDriveFolderId?.trim() || undefined,
    providerStatus: input.providerStatus?.trim() || "prepared",
    lastSyncedAt: now,
    createdAt: now,
    events: [
      buildSignatureEvent(
        "prepared",
        `Prepared ${title} for ${input.provider.replaceAll("_", " ")}` ,
        now,
        input.providerRequestId ? { providerRequestId: input.providerRequestId.trim() } : {}
      )
    ]
  };

  const updated: BorrowerPortalRecord = {
    ...portal,
    signatureRequests: [request, ...portal.signatureRequests],
    updatedAt: now
  };

  items[index] = updated;
  await writeBorrowerPortals(items);
  return request;
}

export async function updateSignatureRequestStatus(
  caseId: string,
  requestId: string,
  status: SignatureRequestStatus
): Promise<BorrowerPortalRecord> {
  const items = await readBorrowerPortals();
  const index = items.findIndex((item) => item.caseId === caseId);

  if (index === -1) {
    throw new Error("Borrower portal not found.");
  }

  const portal = items[index];
  const now = new Date().toISOString();

  const updated: BorrowerPortalRecord = {
    ...portal,
    signatureRequests: portal.signatureRequests.map((request) => {
      if (request.id !== requestId) {
        return request;
      }

      const eventSummaryByStatus: Record<SignatureRequestStatus, string> = {
        draft: "Returned request to draft",
        prepared: "Prepared request in Turicum LLC",
        sent: "Marked request as sent",
        viewed: "Signer viewed the request",
        signed: "Signer completed the request",
        declined: "Signer declined the request",
        voided: "Request was voided",
        failed: "Request failed and needs attention"
      };

      return {
        ...request,
        status,
        providerStatus: status,
        lastSyncedAt: now,
        sentAt: status === "sent" && !request.sentAt ? now : request.sentAt,
        signedAt: status === "signed" ? now : request.signedAt,
        events: [
          buildSignatureEvent(status, eventSummaryByStatus[status], now),
          ...(request.events ?? [])
        ]
      };
    }),
    updatedAt: now
  };

  items[index] = updated;
  await writeBorrowerPortals(items);
  return updated;
}

export function getSignatureRequestsForForm(
  portal: BorrowerPortalRecord,
  formCode: IntakeFormCode
) {
  return portal.signatureRequests.filter((request) => request.formCode === formCode);
}

export function getPortalFormStatus(
  portal: BorrowerPortalRecord,
  formCode: IntakeFormCode
): PortalFormStatus {
  const requests = getSignatureRequestsForForm(portal, formCode);

  if (requests.some((request) => request.status === "signed")) {
    return "signed";
  }

  if (requests.some((request) => request.status === "sent" || request.status === "viewed")) {
    return "signature_sent";
  }

  if (requests.some((request) => request.status === "prepared")) {
    return "signature_prepared";
  }

  if (portal.submittedForms.includes(formCode)) {
    return "submitted";
  }

  return "awaiting_borrower";
}

export function getFormProgressSummary(portal: BorrowerPortalRecord, formCode: IntakeFormCode) {
  const definition = getIntakeForm(formCode);

  if (!definition) {
    return { answeredCount: 0, totalFields: 0, status: "awaiting_borrower" as PortalFormStatus };
  }

  return {
    answeredCount: countAnsweredFields(definition, portal.formResponses[formCode]),
    totalFields: definition.sections.flatMap((section) => section.fields).length,
    status: getPortalFormStatus(portal, formCode)
  };
}

export function getBorrowerPortalSummary(portal: BorrowerPortalRecord) {
  const totalForms = portal.assignedForms.length;
  const submittedForms = portal.submittedForms.length;
  const signedRequests = portal.signatureRequests.filter((request) => request.status === "signed").length;
  const inFlightRequests = portal.signatureRequests.filter(
    (request) => request.status === "prepared" || request.status === "sent" || request.status === "viewed"
  ).length;

  return {
    totalForms,
    submittedForms,
    signatureRequests: portal.signatureRequests.length,
    signedRequests,
    inFlightRequests,
    completionRatio: totalForms === 0 ? 0 : submittedForms / totalForms
  };
}

export function getBorrowerPromotionReadiness(portal: BorrowerPortalRecord) {
  const summary = getBorrowerPortalSummary(portal);
  const contactReady = Boolean(portal.borrowerName.trim() && portal.borrowerEmail.trim());
  const formsAssigned = summary.totalForms > 0;
  const formsComplete = formsAssigned && summary.submittedForms >= summary.totalForms;
  const missingItems: string[] = [];

  if (!contactReady) {
    missingItems.push("Borrower contact name and email must be saved.");
  }

  if (!formsAssigned) {
    missingItems.push("At least one borrower form must be assigned.");
  }

  if (formsAssigned && !formsComplete) {
    missingItems.push("All assigned borrower forms must be submitted before investor promotion is treated as complete.");
  }

  return {
    contactReady,
    formsAssigned,
    formsComplete,
    supportingDocumentsReady: false,
    supportingDocumentsCount: 0,
    supportingDocumentChecklist: [],
    borrowerInfoComplete: contactReady && formsComplete,
    missingItems,
    summary
  };
}

export async function getBorrowerPromotionReadinessForCase(caseId: string, portal: BorrowerPortalRecord) {
  const base = getBorrowerPromotionReadiness(portal);
  const documents = await listCaseDocuments(caseId);
  const supportingDocumentChecklist = buildBorrowerSupportingDocumentChecklist(documents);
  const supportingDocumentsCount = supportingDocumentChecklist.reduce(
    (count, item) => count + item.matchedCount,
    0
  );
  const supportingDocumentsReady = supportingDocumentChecklist.every((item) => item.ready);
  const missingItems = [...base.missingItems];

  if (!supportingDocumentsReady) {
    const missingLabels = supportingDocumentChecklist
      .filter((item) => !item.ready)
      .map((item) => item.label.toLowerCase());
    missingItems.push(
      `Attach the required borrower support documents before investor promotion is treated as complete: ${missingLabels.join(", ")}.`
    );
  }

  return {
    ...base,
    supportingDocumentsReady,
    supportingDocumentsCount,
    supportingDocumentChecklist,
    borrowerInfoComplete: base.contactReady && base.formsComplete && supportingDocumentsReady,
    missingItems
  };
}

export function getExecutionReadiness(portal: BorrowerPortalRecord, notaryRequirement: NotaryRequirement) {
  const signatureRequiredForms = portal.assignedForms.filter((formCode) => getIntakeForm(formCode)?.signatureRequired);
  const signedForms = signatureRequiredForms.filter((formCode) => getPortalFormStatus(portal, formCode) === "signed");
  const allSignatureFormsSigned =
    signatureRequiredForms.length > 0 && signedForms.length === signatureRequiredForms.length;
  const signedRequests = portal.signatureRequests.filter((request) => request.status === "signed");
  const notaryRequired = notaryRequirement === "yes";
  const notaryComplete = !notaryRequired || signedRequests.some((request) => request.provider !== "google_workspace");
  const missingItems: string[] = [];

  if (signatureRequiredForms.length === 0) {
    missingItems.push("Assign at least one signature-required form before Turicum LLC treats execution as complete.");
  }

  if (signatureRequiredForms.length > 0 && !allSignatureFormsSigned) {
    missingItems.push("All signature-required borrower forms must be fully signed before funding can complete.");
  }

  if (notaryRequired && !notaryComplete) {
    missingItems.push("Record a completed notary or RON step before funding can complete.");
  }

  return {
    signatureRequiredForms,
    signedForms,
    allSignatureFormsSigned,
    signedSignatureFormsCount: signedForms.length,
    notaryRequired,
    notaryComplete,
    executionComplete: allSignatureFormsSigned && notaryComplete,
    missingItems
  };
}

export function getBorrowerPortalNextSteps(portal: BorrowerPortalRecord) {
  const steps: string[] = [];

  if (!portal.borrowerName.trim() || !portal.borrowerEmail.trim()) {
    steps.push("Add the borrower contact name and email before sharing the portal.");
  }

  const remainingForms = portal.assignedForms.filter((formCode) => !portal.submittedForms.includes(formCode));
  if (remainingForms.length > 0) {
    steps.push(`Borrower still needs to complete ${remainingForms.length} assigned form(s).`);
  }

  const signatureNeeded = portal.assignedForms.filter((formCode) => getIntakeForm(formCode)?.signatureRequired);
  const unsigned = signatureNeeded.filter((formCode) => {
    const status = getPortalFormStatus(portal, formCode);
    return status !== "signed";
  });

  if (unsigned.length > 0) {
    steps.push(`Prepare or send signature requests for ${unsigned.length} signature-required form(s).`);
  }

  const retryRequests = portal.signatureRequests.filter((request) =>
    request.status === "declined" || request.status === "failed" || request.status === "voided"
  );

  if (retryRequests.length > 0) {
    steps.push(`Resolve ${retryRequests.length} signature request(s) that need to be resent or replaced.`);
  }

  if (steps.length === 0) {
    steps.push("Borrower intake is complete. Review the packet and move the case into legal review or closing prep.");
  }

  return steps;
}
