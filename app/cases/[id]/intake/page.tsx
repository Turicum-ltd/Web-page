import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TuricumNav } from "@/components/turicum/nav";
import { clearCaseLegalSelection, getCaseLegalSelection, saveCaseLegalSelection } from "@/lib/turicum/case-legal-selection";
import { buildGoogleDriveFolderHref, buildGoogleDriveFileHref } from "@/lib/turicum/google-drive";
import { buildAppUrl, withBasePath } from "@/lib/turicum/runtime";
import { getCaseById, isSupabaseConfigured } from "@/lib/turicum/cases";
import { getAssignedIntakeForms, getIntakeForms } from "@/lib/turicum/intake-forms";
import {
  createSignatureRequest,
  getBorrowerPortalForCase,
  getBorrowerPortalNextSteps,
  getBorrowerPortalSummary,
  getBorrowerPromotionReadinessForCase,
  getExecutionReadiness,
  getFormProgressSummary,
  getPortalFormStatus,
  getSignatureRequestsForForm,
  saveBorrowerPortalSetup,
  updateSignatureRequestStatus
} from "@/lib/turicum/intake";
import type { IntakeFormCode, SignatureRequestStatus } from "@/lib/turicum/types";
import { getCaseClosingDiligence, getCaseLegalReview } from "@/lib/turicum/review-workflow";
import { getCaseDealProfile } from "@/lib/turicum/deal-intake";
import { getCaseInvestorPromotion } from "@/lib/turicum/investor-promotion";

export const dynamic = "force-dynamic";

const signatureProviderLabels = {
  google_workspace: "Google Workspace eSignature",
  documenso: "Documenso",
  manual_upload: "Manual upload"
} as const;

const formStatusLabels = {
  awaiting_borrower: "awaiting borrower",
  submitted: "submitted",
  signature_prepared: "signature prepared",
  signature_sent: "signature sent",
  signed: "signed"
} as const;

function normalizeIntakeFormCode(value: FormDataEntryValue | null): IntakeFormCode {
  return value === "guarantor_authorization" || value === "lender_fee_agreement"
    ? value
    : "commercial_loan_application";
}

function normalizeSignatureStatus(value: FormDataEntryValue | null): SignatureRequestStatus {
  return value === "sent" || value === "signed" || value === "declined" || value === "viewed" || value === "voided" || value === "failed"
    ? value
    : value === "draft"
      ? "draft"
      : "prepared";
}

function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getPreferredSignatureForm(forms: IntakeFormCode[]): IntakeFormCode {
  if (forms.includes("lender_fee_agreement")) {
    return "lender_fee_agreement";
  }

  if (forms.includes("guarantor_authorization")) {
    return "guarantor_authorization";
  }

  return "commercial_loan_application";
}

export default async function CaseIntakePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }
  const currentCase = caseItem;
  const currentCaseDealProfile = await getCaseDealProfile(id);

  const portal = await getBorrowerPortalForCase(id);

  if (!portal) {
    notFound();
  }
  const currentPortal = portal;

  const requestHeaders = await headers();
  const portalUrl = buildAppUrl(requestHeaders, `/borrower/${portal.accessToken}`);
  const forms = getAssignedIntakeForms(portal.assignedForms);
  const summary = getBorrowerPortalSummary(portal);
  const borrowerReadiness = await getBorrowerPromotionReadinessForCase(id, portal);
  const nextSteps = getBorrowerPortalNextSteps(portal);
  const legalReview = await getCaseLegalReview(id);
  const investorPromotion = await getCaseInvestorPromotion(id);
  const querySelectedTemplate = {
    groupKey: readSearchParam(query.templateGroup),
    precedentId: readSearchParam(query.precedentId),
    precedentTitle: readSearchParam(query.precedentTitle),
    documentType: readSearchParam(query.documentType),
    state: readSearchParam(query.state),
    structureType: readSearchParam(query.structure),
    googleDriveFileId: readSearchParam(query.googleDriveFileId),
    googleDriveFolderId: readSearchParam(query.googleDriveFolderId)
  };
  const savedTemplate = await getCaseLegalSelection(id);
  const closingDiligence = await getCaseClosingDiligence(id);
  const selectedTemplate = querySelectedTemplate.precedentTitle ? querySelectedTemplate : {
    groupKey: savedTemplate?.groupKey ?? "",
    precedentId: savedTemplate?.precedentId ?? "",
    precedentTitle: savedTemplate?.precedentTitle ?? "",
    documentType: savedTemplate?.documentType ?? "",
    state: savedTemplate?.state ?? "",
    structureType: savedTemplate?.structureType ?? "",
    googleDriveFileId: savedTemplate?.googleDriveFileId ?? "",
    googleDriveFolderId: savedTemplate?.googleDriveFolderId ?? ""
  };
  const selectedTemplateHref = selectedTemplate.groupKey
    ? withBasePath(`/library/templates/${encodeURIComponent(selectedTemplate.groupKey)}`)
    : "";
  const caseDriveFolderHref = buildGoogleDriveFolderHref(currentCase.googleDriveFolderId);
  const activeDriveFolderHref = buildGoogleDriveFolderHref(
    currentCase.googleDriveFolderId || selectedTemplate.googleDriveFolderId
  );
  const selectedTemplateNote = selectedTemplate.precedentTitle
    ? `Use ${selectedTemplate.precedentTitle} as the starting paper for ${selectedTemplate.documentType || "the selected document family"} on ${caseItem.code}.`
    : "";
  const preferredSignatureForm = getPreferredSignatureForm(portal.assignedForms);
  const executionReadiness = getExecutionReadiness(portal, currentCaseDealProfile?.notaryRequirement ?? "depends");
  const latestRequest = portal.signatureRequests[0] ?? null;
  const latestRequestLabel = latestRequest ? latestRequest.title : "No signature request prepared yet";
  const investorPromotionComplete = Boolean(
    investorPromotion &&
    (investorPromotion.status === "promoted" || investorPromotion.status === "investor_committed") &&
    borrowerReadiness.borrowerInfoComplete
  );
  const executionBlockers = [
    !selectedTemplate.precedentTitle ? "Save a legal template to this case before preparing signature drafts." : null,
    !borrowerReadiness.borrowerInfoComplete ? `Finish the borrower packet before investor promotion and signature prep are treated as complete. Supporting documents attached: ${borrowerReadiness.supportingDocumentsCount}.` : null,
    !investorPromotionComplete ? "Complete investor promotion and lock the final investor structure before signature prep." : null,
    !legalReview?.approvedForSignature ? "Legal document review must approve the case before Turicum LLC prepares or queues execution." : null,
    !closingDiligence?.approvedForExecution ? "Closing diligence must clear title work, insurance, and tax before Turicum LLC prepares or queues execution." : null
  ].filter(Boolean) as string[];
  const fundingBlockers = [
    ...executionBlockers,
    ...executionReadiness.missingItems
  ].filter((item, index, array) => array.indexOf(item) === index);
  const signaturePrepReady = executionBlockers.length === 0;

  async function saveSelectedTemplateFromQuery() {
    "use server";

    if (!querySelectedTemplate.precedentTitle || !querySelectedTemplate.groupKey) {
      redirect(withBasePath(`/cases/${id}/intake`));
    }

    await saveCaseLegalSelection({
      caseId: id,
      groupKey: querySelectedTemplate.groupKey,
      precedentId: querySelectedTemplate.precedentId,
      precedentTitle: querySelectedTemplate.precedentTitle,
      documentType: querySelectedTemplate.documentType,
      state: querySelectedTemplate.state || currentCase.state,
      structureType: querySelectedTemplate.structureType || currentCase.structureType,
      googleDriveFileId: querySelectedTemplate.googleDriveFileId || undefined,
      googleDriveFolderId: querySelectedTemplate.googleDriveFolderId || undefined
    });

    redirect(withBasePath(`/cases/${id}/intake`));
  }

  async function clearSelectedTemplate() {
    "use server";

    await clearCaseLegalSelection(id);
    redirect(withBasePath(`/cases/${id}/intake`));
  }

  async function saveTemplateDriveFileId(formData: FormData) {
    "use server";

    if (!selectedTemplate.precedentTitle || !selectedTemplate.groupKey) {
      redirect(withBasePath(`/cases/${id}/intake`));
    }

    await saveCaseLegalSelection({
      caseId: id,
      groupKey: selectedTemplate.groupKey,
      precedentId: selectedTemplate.precedentId,
      precedentTitle: selectedTemplate.precedentTitle,
      documentType: selectedTemplate.documentType,
      state: selectedTemplate.state || currentCase.state,
      structureType: selectedTemplate.structureType || currentCase.structureType,
      sourceRelativePath: savedTemplate?.sourceRelativePath,
      sourceCaseCode: savedTemplate?.sourceCaseCode,
      googleDriveFileId: String(formData.get("googleDriveFileId") ?? "").trim() || undefined,
      googleDriveFolderId: selectedTemplate.googleDriveFolderId || undefined,
      sourceFolderUrl: savedTemplate?.sourceFolderUrl
    });

    redirect(withBasePath(`/cases/${id}/intake`));
  }

  async function prepareGoogleDraftFromTemplate() {
    "use server";

    if (!selectedTemplate.precedentTitle) {
      redirect(withBasePath(`/cases/${id}/intake`));
    }

    if (!borrowerReadiness.borrowerInfoComplete || !investorPromotionComplete) {
      redirect(withBasePath(`/cases/${id}/investor-promotion`));
    }

    if (!legalReview?.approvedForSignature) {
      redirect(withBasePath(`/cases/${id}/legal-review`));
    }

    if (!closingDiligence?.approvedForExecution) {
      redirect(withBasePath(`/cases/${id}/closing-diligence`));
    }

    const providerRequestId = `gw-draft-${id.slice(0, 8)}-${Date.now().toString().slice(-6)}`;

    await createSignatureRequest(id, {
      caseId: id,
      formCode: preferredSignatureForm,
      provider: "google_workspace",
      recipientName: currentPortal.borrowerName,
      recipientEmail: currentPortal.borrowerEmail,
      note: `${selectedTemplateNote} Prepared directly from the saved Turicum LLC legal template.`,
      providerRequestId,
      providerTemplateId: selectedTemplate.precedentId || undefined,
      providerUrl: selectedTemplateHref || undefined,
      googleDriveFileId: selectedTemplate.googleDriveFileId || savedTemplate?.googleDriveFileId,
      googleDriveFolderId: currentCase.googleDriveFolderId || selectedTemplate.googleDriveFolderId || undefined,
      providerStatus: "prepared"
    });

    redirect(withBasePath(`/cases/${id}/intake`));
  }

  async function saveSetup(formData: FormData) {
    "use server";

    const assignedForms = formData
      .getAll("assignedForms")
      .filter(
        (value): value is IntakeFormCode =>
          value === "commercial_loan_application" ||
          value === "guarantor_authorization" ||
          value === "lender_fee_agreement"
      );

    await saveBorrowerPortalSetup(id, {
      borrowerName: String(formData.get("borrowerName") ?? ""),
      borrowerEmail: String(formData.get("borrowerEmail") ?? ""),
      portalTitle: String(formData.get("portalTitle") ?? ""),
      assignedForms
    });

    redirect(withBasePath(`/cases/${id}/intake`));
  }

  async function queueSignature(formData: FormData) {
    "use server";

    if (!borrowerReadiness.borrowerInfoComplete || !investorPromotionComplete) {
      redirect(withBasePath(`/cases/${id}/investor-promotion`));
    }

    if (!legalReview?.approvedForSignature) {
      redirect(withBasePath(`/cases/${id}/legal-review`));
    }

    if (!closingDiligence?.approvedForExecution) {
      redirect(withBasePath(`/cases/${id}/closing-diligence`));
    }

    const provider =
      formData.get("provider") === "documenso"
        ? "documenso"
        : formData.get("provider") === "manual_upload"
          ? "manual_upload"
          : "google_workspace";

    await createSignatureRequest(id, {
      caseId: id,
      formCode: normalizeIntakeFormCode(formData.get("formCode")),
      provider,
      recipientName: String(formData.get("recipientName") ?? ""),
      recipientEmail: String(formData.get("recipientEmail") ?? ""),
      note: String(formData.get("note") ?? ""),
      providerRequestId: String(formData.get("providerRequestId") ?? ""),
      providerTemplateId: String(formData.get("providerTemplateId") ?? ""),
      providerUrl: String(formData.get("providerUrl") ?? ""),
      googleDriveFileId: String(formData.get("googleDriveFileId") ?? ""),
      googleDriveFolderId: String(formData.get("googleDriveFolderId") ?? "").trim() || currentCase.googleDriveFolderId || ""
    });

    redirect(withBasePath(`/cases/${id}/intake`));
  }

  async function updateSignature(formData: FormData) {
    "use server";

    await updateSignatureRequestStatus(
      id,
      String(formData.get("requestId") ?? ""),
      normalizeSignatureStatus(formData.get("status"))
    );

    redirect(withBasePath(`/cases/${id}/intake`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Borrower Intake</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{caseItem.title}</h1>
              <p>
                Run the borrower packet, legal handoff, and signature prep from one place. This page
                should tell the team what is ready to send, what still needs review, and which paper is
                currently driving the execution lane.
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Case</p>
                  <strong>{caseItem.code}</strong>
                  <p className="helper">active lender workspace</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Portal</p>
                  <strong>{portal.portalStatus.replaceAll("_", " ")}</strong>
                  <p className="helper">borrower access state</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Forms</p>
                  <strong>{summary.submittedForms}/{summary.totalForms}</strong>
                  <p className="helper">submitted borrower items</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">In flight</p>
                  <strong>{summary.inFlightRequests}</strong>
                  <p className="helper">signature requests underway</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Investor promotion</p>
                  <strong>{(investorPromotion?.status ?? (borrowerReadiness.borrowerInfoComplete ? "ready_for_investors" : "gathering_borrower_info")).replaceAll("_", " ")}</strong>
                  <p className="helper">capital structure gate</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead">
            <p className="eyebrow">Workflow Progress</p>
            <h2>See the borrower handoff at a glance</h2>
            <div className="progress-shell">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.round(summary.completionRatio * 100)}%` }}
                />
              </div>
              <p className="helper">
                {summary.submittedForms} of {summary.totalForms} form(s) submitted.
              </p>
            </div>
	            <ul className="list">
	              {nextSteps.map((step) => (
	                <li key={step}>{step}</li>
	              ))}
	            </ul>
	            {borrowerReadiness.supportingDocumentChecklist.length ? (
	              <div className="subpanel">
	                <p className="eyebrow">Required borrower documents</p>
	                <ul className="list">
	                  {borrowerReadiness.supportingDocumentChecklist.map((item) => (
	                    <li key={item.id}>
	                      <strong>{item.label}:</strong> {item.ready ? `ready (${item.matchedCount})` : "missing"}
	                    </li>
	                  ))}
	                </ul>
	              </div>
	            ) : null}
	            <div className="dashboard-band">
	              <div className="band-card">
	                <p className="eyebrow">Preferred send form</p>
                <strong>{forms.find((form) => form.code === preferredSignatureForm)?.title ?? "Commercial loan application"}</strong>
                <p className="helper">first document Turicum LLC will prepare for signature</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Latest request</p>
                <strong>{latestRequestLabel}</strong>
                <p className="helper">{latestRequest ? latestRequest.status.replaceAll("_", " ") : "Nothing prepared yet"}</p>
              </div>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">Borrower Access</p>
            <h2>Share a direct link to the intake workspace</h2>
            <p>
              Turicum LLC gives the borrower a single portal where they can complete the application,
              confirm guarantor authorization details, and prepare the fee agreement for signature.
            </p>
            <div className="portal-link-box">{portalUrl}</div>
            <div className="status-grid compact-grid">
              <div className="status-card">
                <p className="eyebrow">Current mode</p>
                <strong>{portal.portalStatus.replaceAll("_", " ")}</strong>
                <p className="helper">Send this only after the borrower contact and assigned forms are correct.</p>
              </div>
              <div className="status-card">
                <p className="eyebrow">Core data</p>
                <strong>{isSupabaseConfigured() ? "Supabase" : "Local fallback"}</strong>
                <p className="helper">Borrower portal packets currently persist in local JSON while cases stay live in Supabase.</p>
              </div>
              <div className="status-card">
                <p className="eyebrow">Case Drive folder</p>
                <strong>{caseDriveFolderHref ? "attached" : "not set"}</strong>
                <p className="helper">
                  {caseDriveFolderHref ? "The main case workspace is ready for packet and diligence references." : "Attach the case Drive folder on the case detail page to anchor the workspace."}
                </p>
              </div>
            </div>
            {caseDriveFolderHref ? (
              <div className="form-actions" style={{ marginTop: 14 }}>
                <a className="secondary-button" href={caseDriveFolderHref} target="_blank" rel="noreferrer">
                  Open case Drive folder
                </a>
              </div>
            ) : null}
          </div>
        </section>

        <section className="two-up">
          <div className="panel">
            <p className="eyebrow">Borrower Packet</p>
            <h2>Assign the portal contents before you send access</h2>
            <form action={saveSetup} className="form-grid">
              <label className="field">
                <span>Portal title</span>
                <input name="portalTitle" type="text" defaultValue={portal.portalTitle} />
              </label>

              <div className="two-up">
                <label className="field">
                  <span>Borrower contact name</span>
                  <input name="borrowerName" type="text" defaultValue={portal.borrowerName} />
                </label>

                <label className="field">
                  <span>Borrower contact email</span>
                  <input name="borrowerEmail" type="email" defaultValue={portal.borrowerEmail} />
                </label>
              </div>

              <div className="field">
                <span>Assigned forms</span>
                <div className="checkbox-grid">
                  {getIntakeForms().map((form) => (
                    <label key={form.code} className="checkbox-item">
                      <input
                        type="checkbox"
                        name="assignedForms"
                        value={form.code}
                        defaultChecked={portal.assignedForms.includes(form.code)}
                      />
                      <span>
                        <strong>{form.title}</strong>
                        <small>{form.description}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">Save portal setup</button>
              </div>
            </form>
          </div>

          <div className="panel">
            <p className="eyebrow">Assigned Forms</p>
            <h2>Track each intake item without leaving the case</h2>
            <div className="status-grid">
              {forms.map((form) => {
                const progress = getFormProgressSummary(portal, form.code);
                const signatureCount = getSignatureRequestsForForm(portal, form.code).length;
                const status = getPortalFormStatus(portal, form.code);

                return (
                  <article key={form.code} className="status-card">
                    <div className="section-head">
                      <div>
                        <h3>{form.title}</h3>
                        <p className="helper">{form.sourceDocumentLabel}</p>
                      </div>
                      <span className={`badge ${status === "signed" ? "production" : status === "awaiting_borrower" ? "optional" : "provisional"}`}>
                        {formStatusLabels[status]}
                      </span>
                    </div>
                    <p>{form.description}</p>
                    <div className="tag-row">
                      <span className="tag">
                        {progress.answeredCount}/{progress.totalFields} fields answered
                      </span>
                      <span className="tag">
                        {form.signatureRequired ? `${signatureCount} signature request(s)` : "no formal signature required"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead">
            <p className="eyebrow">Execution Lane</p>
            <h2>Prepare the next document send</h2>
            <div className="dashboard-band">
              <div className="band-card">
                <p className="eyebrow">Prepared requests</p>
                <strong>{portal.signatureRequests.filter((request) => request.status === "prepared").length}</strong>
                <p className="helper">ready to move into send review</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Sent</p>
                <strong>{portal.signatureRequests.filter((request) => request.status === "sent" || request.status === "viewed").length}</strong>
                <p className="helper">currently out with a signer</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Signed</p>
                <strong>{portal.signatureRequests.filter((request) => request.status === "signed").length}</strong>
                <p className="helper">completed execution items</p>
              </div>
            </div>
            {executionBlockers.length > 0 ? (
              <div className="callout" style={{ marginBottom: 16 }}>
                <p className="eyebrow">Execution blockers</p>
                <p>Turicum LLC should not prepare or queue signature work until these gates are clear.</p>
                <ul className="list">
                  {executionBlockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/validation`)}>
                    Open validation
                  </Link>
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/investor-promotion`)}>
                    Open investor promotion
                  </Link>
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/legal-review`)}>
                    Open legal review
                  </Link>
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/closing-diligence`)}>
                    Open closing diligence
                  </Link>
                </div>
              </div>
            ) : null}
            {selectedTemplate.precedentTitle ? (
              <div className="subpanel">
                <p className="eyebrow">Selected legal template</p>
                <strong>{selectedTemplate.precedentTitle}</strong>
                <p className="helper">
                  {selectedTemplate.state || caseItem.state} {selectedTemplate.structureType || caseItem.structureType}
                  {selectedTemplate.documentType ? ` · ${selectedTemplate.documentType}` : ""}
                </p>
                {savedTemplate?.sourceRelativePath ? (
                  <p className="helper">Source file: {savedTemplate.sourceRelativePath}</p>
                ) : null}
                {buildGoogleDriveFileHref(selectedTemplate.googleDriveFileId || savedTemplate?.googleDriveFileId) ? (
                  <p className="helper">
                    Specific Drive doc linked.{" "}
                    <a href={buildGoogleDriveFileHref(selectedTemplate.googleDriveFileId || savedTemplate?.googleDriveFileId) ?? "#"} target="_blank" rel="noreferrer">
                      Open file
                    </a>
                  </p>
                ) : null}
                <form action={saveTemplateDriveFileId} className="form-grid" style={{ marginTop: 12 }}>
                  <label className="field">
                    <span>Google Drive file ID</span>
                    <input
                      name="googleDriveFileId"
                      type="text"
                      defaultValue={selectedTemplate.googleDriveFileId || savedTemplate?.googleDriveFileId || ""}
                      placeholder="Optional specific Google Doc or PDF file id"
                    />
                  </label>
                  <div className="form-actions">
                    <button type="submit" className="secondary-button">Save Drive file</button>
                  </div>
                </form>
                <div className="form-actions" style={{ marginTop: 12 }}>
                  {selectedTemplateHref ? (
                    <Link className="secondary-button" href={selectedTemplateHref}>
                      Back to template detail
                    </Link>
                  ) : null}
                  <form action={prepareGoogleDraftFromTemplate}>
                    <button type="submit" className="secondary-button" disabled={!signaturePrepReady}>Prepare Google draft</button>
                  </form>
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/investor-promotion`)}>
                    Investor promotion
                  </Link>
                  {querySelectedTemplate.precedentTitle ? (
                    <form action={saveSelectedTemplateFromQuery}>
                      <button type="submit" className="secondary-button">Save to case</button>
                    </form>
                  ) : null}
                  {savedTemplate?.precedentTitle ? (
                    <form action={clearSelectedTemplate}>
                      <button type="submit" className="secondary-button">Clear saved template</button>
                    </form>
                  ) : null}
                  {activeDriveFolderHref ? (
                    <a className="secondary-button" href={activeDriveFolderHref} target="_blank" rel="noreferrer">
                      Open Drive folder
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="subpanel">
              <div className="stack-sm">
                <p className="eyebrow">Manual queue entry</p>
                <h3>Create or backfill a signature request</h3>
                <p className="helper">
                  Use this when a request is being staged outside the one-click template path or when you need
                  to log an existing Google or Documenso draft into the case timeline.
                </p>
              </div>
              <form action={queueSignature} className="form-grid">
              <div className="two-up">
                <label className="field">
                  <span>Form</span>
                  <select name="formCode" defaultValue="guarantor_authorization">
                    {forms.map((form) => (
                      <option key={form.code} value={form.code}>
                        {form.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Provider</span>
                  <select name="provider" defaultValue="google_workspace">
                    <option value="google_workspace">Google Workspace eSignature</option>
                    <option value="documenso">Documenso</option>
                    <option value="manual_upload">Manual upload</option>
                  </select>
                </label>
              </div>

              <div className="two-up">
                <label className="field">
                  <span>Recipient name</span>
                  <input
                    name="recipientName"
                    type="text"
                    defaultValue={portal.borrowerName}
                    placeholder="Authorized signer or guarantor"
                  />
                </label>

                <label className="field">
                  <span>Recipient email</span>
                  <input
                    name="recipientEmail"
                    type="email"
                    defaultValue={portal.borrowerEmail}
                    placeholder="name@example.com"
                  />
                </label>
              </div>

              <label className="field">
                <span>Ops note</span>
                <textarea
                  name="note"
                  rows={4}
                  defaultValue={selectedTemplateNote}
                  placeholder="Example: send after borrower completes the loan application and entity docs are reviewed."
                />
              </label>

              <div className="two-up">
                <label className="field">
                  <span>Google request or draft ID</span>
                  <input
                    name="providerRequestId"
                    type="text"
                    placeholder="Optional envelope, request, or draft identifier"
                  />
                </label>

                <label className="field">
                  <span>Google template or doc ID</span>
                  <input
                    name="providerTemplateId"
                    type="text"
                    placeholder="Optional source doc or template ID"
                  />
                </label>
              </div>

              <div className="two-up">
                <label className="field">
                  <span>Tracking URL</span>
                  <input
                    name="providerUrl"
                    type="url"
                    placeholder="Optional Google Workspace draft or request URL"
                  />
                </label>

                <label className="field">
                  <span>Drive file or folder ID</span>
                  <input
                    name="googleDriveFolderId"
                    type="text"
                    defaultValue={currentCase.googleDriveFolderId || selectedTemplate.googleDriveFolderId}
                    placeholder="Optional Drive folder for executed files"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={!signaturePrepReady}>Create signature request</button>
              </div>
              </form>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">Signature Timeline</p>
            <h2>Track what has been prepared, sent, or signed</h2>
            <div className="dashboard-band">
              <div className="band-card">
                <p className="eyebrow">Google Workspace</p>
                <strong>{portal.signatureRequests.filter((request) => request.provider === "google_workspace").length}</strong>
                <p className="helper">requests logged in Turicum LLC</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Documenso</p>
                <strong>{portal.signatureRequests.filter((request) => request.provider === "documenso").length}</strong>
                <p className="helper">alternative e-sign path</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Manual upload</p>
                <strong>{portal.signatureRequests.filter((request) => request.provider === "manual_upload").length}</strong>
                <p className="helper">offline execution path</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Provider</th>
                    <th>Recipient</th>
                    <th>Tracking</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portal.signatureRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No signature requests yet.</td>
                    </tr>
                  ) : (
                    portal.signatureRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.title}</td>
                        <td>{signatureProviderLabels[request.provider]}</td>
                        <td>
                          {request.recipientName || "Recipient not set"}
                          <br />
                          <span className="helper">{request.recipientEmail || "No email yet"}</span>
                        </td>
                        <td>
                          {request.providerRequestId ? (
                            <div className="helper"><strong>ID:</strong> {request.providerRequestId}</div>
                          ) : null}
                          {request.providerTemplateId ? (
                            <div className="helper"><strong>Template:</strong> {request.providerTemplateId}</div>
                          ) : null}
                          {request.googleDriveFolderId ? (
                            <div className="helper">
                              <strong>Drive:</strong> {request.googleDriveFolderId}
                              {buildGoogleDriveFolderHref(request.googleDriveFolderId) ? (
                                <>
                                  {' '}·{' '}
                                  <a href={buildGoogleDriveFolderHref(request.googleDriveFolderId) ?? '#'} target="_blank" rel="noreferrer">Open Drive folder</a>
                                </>
                              ) : null}
                            </div>
                          ) : null}
                          {request.providerUrl ? (
                            <div className="helper"><a href={request.providerUrl} target="_blank" rel="noreferrer">Open provider link</a></div>
                          ) : null}
                          {request.lastSyncedAt ? (
                            <div className="helper">Last sync {new Date(request.lastSyncedAt).toLocaleString()}</div>
                          ) : null}
                        </td>
                        <td>
                          <strong>{request.status.replaceAll("_", " ")}</strong>
                          {request.providerStatus && request.providerStatus !== request.status ? (
                            <div className="helper">Provider: {request.providerStatus.replaceAll("_", " ")}</div>
                          ) : null}
                          {request.events.length > 0 ? (
                            <div className="helper" style={{ marginTop: 8 }}>
                              {request.events.slice(0, 3).map((event) => (
                                <div key={event.id}>
                                  {event.summary} · {new Date(event.at).toLocaleString()}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <div className="table-actions">
                            <form action={updateSignature}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <input type="hidden" name="status" value="sent" />
                              <button type="submit" className="secondary-button">
                                Mark sent
                              </button>
                            </form>
                            <form action={updateSignature}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <input type="hidden" name="status" value="viewed" />
                              <button type="submit" className="secondary-button">
                                Mark viewed
                              </button>
                            </form>
                            <form action={updateSignature}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <input type="hidden" name="status" value="signed" />
                              <button type="submit" className="secondary-button">
                                Mark signed
                              </button>
                            </form>
                            <form action={updateSignature}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <input type="hidden" name="status" value="declined" />
                              <button type="submit" className="secondary-button">
                                Mark declined
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
