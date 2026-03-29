import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CaseDocumentIntake } from "@/components/turicum/case-document-intake";
import { TuricumNav } from "@/components/turicum/nav";
import { getCaseLegalSelection } from "@/lib/turicum/case-legal-selection";
import { assessDealProfile, getCaseDealProfile } from "@/lib/turicum/deal-intake";
import { getBorrowerPortalByCaseId, getBorrowerPromotionReadinessForCase, getExecutionReadiness } from "@/lib/turicum/intake";
import { getCaseAiReview, getCaseClosingDiligence, getCaseLegalReview } from "@/lib/turicum/review-workflow";
import { getCaseInvestorPromotion } from "@/lib/turicum/investor-promotion";
import { getCaseExitWorkflow, getCaseFundingWorkflow, getCaseServicingRecord } from "@/lib/turicum/lifecycle";
import { withBasePath } from "@/lib/turicum/runtime";
import { buildGoogleDriveFolderHref, normalizeGoogleDriveFileInput } from "@/lib/turicum/google-drive";
import { createCaseDocument, createCaseDocumentReference, isGoogleDriveUrl, listCaseDocuments } from "@/lib/turicum/case-documents";
import { getCaseById, isSupabaseConfigured, listCaseChecklistItems, updateCaseGoogleDriveFolder } from "@/lib/turicum/cases";
import { getCategoryLabel, getDocumentTypes, getStageLabel } from "@/lib/turicum/state-packs";
import { resolveSupabaseStaffSessionFromCookies } from "@/lib/turicum/staff-supabase-auth";

export const dynamic = "force-dynamic";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildGoogleDriveFileHref(fileId: string | undefined) {
  if (!fileId) {
    return null;
  }

  const trimmed = fileId.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://drive.google.com/file/d/${trimmed}/view`;
}

function formatTimestamp(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString();
}

function buildInitialActionState(mode: "drive" | "upload") {
  return { status: "idle" as const, message: "", mode };
}

export default async function CaseDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: SearchParams;
}) {
  const { id } = await params;
  const routeParams = (await searchParams) ?? {};
  const status = readString(routeParams.status);
  const item = await getCaseById(id);

  if (!item) {
    notFound();
  }

  const checklist = await listCaseChecklistItems(id);
  const documents = await listCaseDocuments(id);
  const documentTypes = getDocumentTypes();
  const dealProfile = await getCaseDealProfile(id);
  const dealAssessment = dealProfile ? assessDealProfile(dealProfile) : null;
  const legalSelection = await getCaseLegalSelection(id);
  const aiReview = await getCaseAiReview(id);
  const legalReview = await getCaseLegalReview(id);
  const closingDiligence = await getCaseClosingDiligence(id);
  const portal = await getBorrowerPortalByCaseId(id);
  const borrowerReadiness = portal ? await getBorrowerPromotionReadinessForCase(id, portal) : null;
  const investorPromotion = await getCaseInvestorPromotion(id);
  const fundingWorkflow = await getCaseFundingWorkflow(id);
  const servicingRecord = await getCaseServicingRecord(id);
  const exitWorkflow = await getCaseExitWorkflow(id);
  const investorPromotionComplete = Boolean(
    investorPromotion &&
    (investorPromotion.status === "promoted" || investorPromotion.status === "investor_committed") &&
    borrowerReadiness?.borrowerInfoComplete &&
    dealProfile?.validationStatus === "approved"
  );
  const validationApproved = dealProfile?.validationStatus === "approved";
  const executionReadiness = portal && dealProfile ? getExecutionReadiness(portal, dealProfile.notaryRequirement) : null;
  const latestDraft = portal?.signatureRequests?.[0] ?? null;
  const latestSigned = portal?.signatureRequests?.find((request) => request.status === "signed") ?? null;
  const legalSelectionHref = legalSelection
    ? withBasePath(`/library/templates/${encodeURIComponent(legalSelection.groupKey)}`)
    : withBasePath("/library/templates");
  const caseDriveFolderHref = buildGoogleDriveFolderHref(item.googleDriveFolderId);

  async function submitDocumentEntry(
    _previousState: { status: "idle" | "success" | "error"; message: string; mode: "drive" | "upload" },
    formData: FormData
  ) {
    "use server";

    const mode: "drive" | "upload" = formData.get("entryMode") === "upload" ? "upload" : "drive";

    try {
      const cookieStore = await cookies();
      const staffProfile = await resolveSupabaseStaffSessionFromCookies(cookieStore);

      if (!staffProfile) {
        return {
          status: "error" as const,
          message: "Your staff session expired. Sign in again before adding documents.",
          mode
        };
      }

      if (mode === "upload") {
        const file = formData.get("file");

        if (!(file instanceof File) || file.size === 0) {
          return {
            status: "error" as const,
            message: "Choose a file before submitting the upload.",
            mode
          };
        }

        await createCaseDocument({
          caseId: id,
          documentTypeCode: String(formData.get("documentTypeCode") ?? ""),
          category: String(formData.get("category") ?? "core_legal") as Parameters<
            typeof createCaseDocument
          >[0]["category"],
          status: String(formData.get("status") ?? "uploaded") as Parameters<
            typeof createCaseDocument
          >[0]["status"],
          file
        });

        revalidatePath(`/cases/${id}`);

        return {
          status: "success" as const,
          message: `Uploaded ${file.name} into the case file set.`,
          mode
        };
      }

      const driveUrl = String(formData.get("driveUrl") ?? "").trim();

      if (!driveUrl) {
        return {
          status: "error" as const,
          message: "Paste a Google Drive file URL or file ID before submitting.",
          mode
        };
      }

      const normalizedDriveFile = normalizeGoogleDriveFileInput(driveUrl);

      if (!normalizedDriveFile) {
        return {
          status: "error" as const,
          message: "Use a Google Drive file URL, Google Docs URL, or bare file ID. Folder links are not accepted here.",
          mode
        };
      }

      await createCaseDocumentReference({
        caseId: id,
        documentTypeCode: String(formData.get("documentTypeCode") ?? ""),
        category: String(formData.get("category") ?? "core_legal") as Parameters<
          typeof createCaseDocumentReference
        >[0]["category"],
        status: String(formData.get("status") ?? "uploaded") as Parameters<
          typeof createCaseDocumentReference
        >[0]["status"],
        title: String(formData.get("title") ?? ""),
        fileName: String(formData.get("fileName") ?? ""),
        mimeType: "application/vnd.google-apps.document",
        storagePath: normalizedDriveFile
      });

      revalidatePath(`/cases/${id}`);

      return {
        status: "success" as const,
        message: "Google Drive document linked to this case.",
        mode
      };
    } catch (error) {
      return {
        status: "error" as const,
        message: error instanceof Error ? error.message : "Document intake failed. Try again.",
        mode
      };
    }
  }

  async function saveCaseDriveFolder(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const staffProfile = await resolveSupabaseStaffSessionFromCookies(cookieStore);

    if (!staffProfile) {
      redirect(withBasePath("/team-login"));
    }

    const driveFolderInput = String(formData.get("googleDriveFolderId") ?? "");
    await updateCaseGoogleDriveFolder(id, driveFolderInput);
    revalidatePath(`/cases/${id}`);
    revalidatePath(`/cases/${id}/intake`);
    redirect(withBasePath(`/cases/${id}?status=drive-folder-saved`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Case Detail</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{item.title}</h1>
              <p>
                {item.code} · {item.state} · {item.structureType}
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="pill">
                  <strong>Stage:</strong> {getStageLabel(item.stage)}
                </div>
                <div className="pill">
                  <strong>Status:</strong> {item.status}
                </div>
                <div className="pill">
                  <strong>Requested:</strong> {item.requestedAmount}
                </div>
                <div className="pill">
                  <strong>Data mode:</strong> {isSupabaseConfigured() ? "Supabase" : "Local fallback"}
                </div>
              </div>
              <p className="helper">Deal, paper, next action.</p>
            </div>
          </div>
        </section>

        {status ? (
          <section className={status === "error" ? "panel subtle turicum-form-callout-error" : "panel subtle turicum-form-callout-success"}>
            <strong>
              {status === "case-opened"
                ? "Matter opened."
                : status === "drive-folder-saved"
                  ? "Case Drive folder saved."
                  : "Case updated."}
            </strong>
            <p className="helper">
              {status === "case-opened"
                ? "The workspace is live. Next best steps are setting the case Drive folder, adding the first borrower, and attaching the initial documents."
                : status === "drive-folder-saved"
                  ? "Turicum will now prefer this folder across intake and downstream case workflows."
                  : "The case detail page has been refreshed."}
            </p>
          </section>
        ) : null}

        <section className="three-up">
          <div className="panel">
            <p className="eyebrow">Funding</p>
            <h2>Money movement</h2>
            <p>{fundingWorkflow?.fundingMemo || "Escrow, reserves, and release conditions have not been recorded yet."}</p>
            <p className="helper">Status: {(fundingWorkflow?.status ?? "not_started").replaceAll("_", " ")}</p>
            <div className="form-actions">
              <Link className="secondary-button" href={withBasePath(`/cases/${id}/funding`)}>Open funding lane</Link>
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">Servicing</p>
            <h2>Monthly investor updates</h2>
            <p>{servicingRecord?.servicerNotes || "Servicing has not been staged yet."}</p>
            <p className="helper">Status: {(servicingRecord?.status ?? "setup").replaceAll("_", " ")} · Next payment: {servicingRecord?.nextPaymentDate || "not set"}</p>
            <div className="form-actions">
              <Link className="secondary-button" href={withBasePath(`/cases/${id}/servicing`)}>Open servicing lane</Link>
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">Exit</p>
            <h2>Payoff or rollover</h2>
            <p>{exitWorkflow?.exitSummary || "Exit planning has not started yet."}</p>
            <p className="helper">Status: {(exitWorkflow?.status ?? "not_started").replaceAll("_", " ")} · Type: {(exitWorkflow?.exitType ?? "undecided").replaceAll("_", " ")}</p>
            <div className="form-actions">
              <Link className="secondary-button" href={withBasePath(`/cases/${id}/exit`)}>Open exit lane</Link>
              <Link className="secondary-button" href={withBasePath(`/cases/${id}/investors`)}>Investor workspace</Link>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel">
            <p className="eyebrow">Summary</p>
            <h2>Deal context</h2>
            <p>{item.propertySummary || "No property summary yet."}</p>
          </div>

          <div className="panel">
            <p className="eyebrow">Case Drive Workspace</p>
            <h2>Attach the main folder once and reuse it everywhere</h2>
            <p>
              Set the primary Google Drive folder for this case here. Turicum can then point intake,
              validation, and document work back to the same workspace instead of relying on pasted links.
            </p>
            <form action={saveCaseDriveFolder} className="form-grid">
              <label className="field">
                <span>Case Google Drive folder</span>
                <input
                  name="googleDriveFolderId"
                  type="text"
                  defaultValue={item.googleDriveFolderId ?? ""}
                  placeholder="Drive folder ID or full Google Drive folder URL"
                />
              </label>
              <div className="form-actions">
                <button type="submit">Save case Drive folder</button>
                {caseDriveFolderHref ? (
                  <a className="secondary-button" href={caseDriveFolderHref} target="_blank" rel="noreferrer">
                    Open case Drive folder
                  </a>
                ) : null}
              </div>
            </form>
          </div>

          <div className="panel">
            <p className="eyebrow">Legal Starting Point</p>
            <h2>Chosen legal starting point</h2>
            {legalSelection ? (
              <>
                <p>
                  <strong>{legalSelection.precedentTitle}</strong>
                </p>
                <p className="helper">
                  {legalSelection.state} {legalSelection.structureType} · {legalSelection.documentType}
                </p>
                {legalSelection.sourceRelativePath ? (
                  <p className="helper">Source file: {legalSelection.sourceRelativePath}</p>
                ) : null}
                {buildGoogleDriveFileHref(legalSelection.googleDriveFileId) ? (
                  <p className="helper">
                    <a href={buildGoogleDriveFileHref(legalSelection.googleDriveFileId) ?? "#"} target="_blank" rel="noreferrer">
                      Open saved Drive file
                    </a>
                  </p>
                ) : null}
                <div className="form-actions">
                  <Link className="secondary-button" href={legalSelectionHref}>
                    Review template detail
                  </Link>
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/contract-ai-review`)}>
                    Run contract AI review
                  </Link>
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/intake`)}>
                    Open intake with saved template
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p>No legal template is saved on this case yet.</p>
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath("/library/templates")}>
                    Choose from template selector
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {dealProfile && dealAssessment ? (
          <>
            <section className="two-up">
          <div className="panel">
            <p className="eyebrow">Deal Intake</p>
            <h2>Facts driving validation and structuring</h2>
            <div className="pill-row">
                  <div className="pill"><strong>Deal shape:</strong> {dealProfile.dealShape}</div>
                  <div className="pill"><strong>Target investors:</strong> {dealProfile.lenderCount}</div>
                  <div className="pill"><strong>Property:</strong> {dealProfile.propertyType}</div>
                  <div className="pill"><strong>Notary:</strong> {dealProfile.notaryRequirement}</div>
                </div>
                <ul className="list">
                  <li>Borrower entity: {dealProfile.borrowerEntityType}</li>
                  <li>Title holder: {dealProfile.titleHolderType}</li>
                  <li>Guarantors: {dealProfile.guarantorCount}</li>
                  <li>Occupancy / collateral: {dealProfile.occupancySummary || "not specified"}</li>
                  <li>Final investor structure is confirmed after borrower/property validation and investor promotion.</li>
                </ul>
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/validation`)}>
                    Open validation
                  </Link>
                </div>
              </div>

          <div className="panel">
            <p className="eyebrow">Capital Path</p>
            <h2>Validation and investor promotion</h2>
            <p>{dealAssessment.capitalSummary}</p>
            <div className="pill-row">
              <div className="pill"><strong>Capital path:</strong> {dealAssessment.capitalPath.replaceAll("_", " ")}</div>
              <div className="pill"><strong>Execution:</strong> {dealAssessment.signaturePath.replaceAll("_", " ")}</div>
            </div>
            <p className="eyebrow" style={{ marginTop: 16 }}>Investor promotion focus</p>
            <ul className="list">
              {dealAssessment.investorPromotionFocus.length > 0 ? dealAssessment.investorPromotionFocus.map((item) => (
                <li key={item}>{item}</li>
              )) : (
                <li>Promote the validated deal and confirm whether one investor or several investors will close the file.</li>
              )}
            </ul>
            <p className="eyebrow" style={{ marginTop: 16 }}>Current promotion state</p>
            <div className="pill-row">
              <div className="pill"><strong>Status:</strong> {(investorPromotion?.status ?? (borrowerReadiness?.borrowerInfoComplete ? "ready_for_investors" : "gathering_borrower_info")).replaceAll("_", " ")}</div>
              <div className="pill"><strong>Final investors:</strong> {investorPromotion?.finalInvestorCount ?? 0}</div>
              <div className="pill"><strong>Structure:</strong> {(investorPromotion?.finalStructure ?? "undecided").replaceAll("_", " ")}</div>
            </div>
            {!validationApproved ? (
              <p className="helper">Borrower + property validation still has to be approved before Turicum LLC should treat investor promotion as final.</p>
            ) : null}
            {borrowerReadiness && !borrowerReadiness.borrowerInfoComplete ? (
              <p className="helper">Borrower information still has to be completed before Turicum LLC should treat investor promotion as done. Supporting documents attached: {borrowerReadiness.supportingDocumentsCount}.</p>
            ) : null}
            <div className="form-actions">
              <Link className="secondary-button" href={withBasePath(`/cases/${id}/investor-promotion`)}>
                Open investor promotion
              </Link>
            </div>
            <p className="eyebrow" style={{ marginTop: 16 }}>Execution recommendation</p>
            <p>
                  {dealAssessment.signaturePath === "google_esign"
                    ? "Google Workspace after legal approval."
                    : dealAssessment.signaturePath === "google_esign_then_notary"
                      ? "Split path. Google for non-notary paper, separate notary lane for the rest."
                      : "Hold execution until legal decides the path."}
                </p>
              </div>
            </section>

            <section className="two-up">
          <div className="panel">
            <p className="eyebrow">Contract Stack</p>
            <h2>Required contracts and add-ons</h2>
                <ul className="list">
                  {dealAssessment.contractStack.map((contract) => (
                    <li key={contract.code}>
                      <strong>{contract.label}:</strong> {contract.reason}
                    </li>
                  ))}
                </ul>
                {dealAssessment.supplementalDocuments.length > 0 ? (
                  <>
                    <p className="eyebrow" style={{ marginTop: 16 }}>Supplemental docs</p>
                    <ul className="list">
                      {dealAssessment.supplementalDocuments.map((doc) => (
                        <li key={doc.label}>
                          <strong>{doc.label}:</strong> {doc.reason}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>

	              <div className="panel">
	                <p className="eyebrow">Borrower + Property Validation</p>
	                <h2>First-call facts and screening placeholders</h2>
                <div className="pill-row">
                  <div className="pill"><strong>Validation:</strong> {(dealProfile.validationStatus ?? "pending").replaceAll("_", " ")}</div>
                  <div className="pill"><strong>Screening:</strong> {(dealProfile.screeningPlan ?? "borrower_to_provide").replaceAll("_", " ")}</div>
                  <div className="pill"><strong>Needed by:</strong> {dealProfile.fundingNeededBy || "not recorded"}</div>
                </div>
	                <ul className="list">
	                  <li><strong>Asset:</strong> {dealProfile.assetAddress || "not recorded"}</li>
	                  <li><strong>Description:</strong> {dealProfile.assetDescription || "not recorded"}</li>
	                  <li><strong>Ownership / liens:</strong> {dealProfile.ownershipStatus || "not recorded"}</li>
	                  <li><strong>Title held:</strong> {dealProfile.titleHoldingDetail || "not recorded"}</li>
	                  <li><strong>Estimated value:</strong> {dealProfile.estimatedValue || "not recorded"}{dealProfile.valueEstimateBasis ? ` (${dealProfile.valueEstimateBasis})` : ""}</li>
	                  <li><strong>Credit / background / criminal:</strong> {(dealProfile.creditCheckStatus ?? "pending")} / {(dealProfile.backgroundCheckStatus ?? "pending")} / {(dealProfile.criminalCheckStatus ?? "pending")}</li>
	                </ul>
	                {borrowerReadiness?.supportingDocumentChecklist?.length ? (
	                  <>
	                    <p className="eyebrow" style={{ marginTop: 16 }}>Borrower document checklist</p>
	                    <ul className="list">
	                      {borrowerReadiness.supportingDocumentChecklist.map((item) => (
	                        <li key={item.id}>
	                          <strong>{item.label}:</strong> {item.ready ? `ready (${item.matchedCount})` : "missing"}
	                        </li>
	                      ))}
	                    </ul>
	                  </>
	                ) : null}
	                <div className="form-actions">
	                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/validation`)}>
	                    Open borrower + property validation
	                  </Link>
	                </div>
              </div>

          <div className="panel">
            <p className="eyebrow">Review Gates</p>
            <h2>AI review, document review, and closing diligence</h2>
                <div className="dashboard-band">
                  <div className="band-card">
                    <p className="eyebrow">AI review</p>
                    <strong>{aiReview?.status?.replaceAll("_", " ") ?? "not started"}</strong>
                    <p className="helper">contract issue screening</p>
                  </div>
                  <div className="band-card">
                    <p className="eyebrow">Legal review</p>
                    <strong>{legalReview?.status?.replaceAll("_", " ") ?? "pending"}</strong>
                    <p className="helper">document review</p>
                  </div>
                  <div className="band-card">
                    <p className="eyebrow">Closing diligence</p>
                    <strong>{closingDiligence?.status?.replaceAll("_", " ") ?? "pending"}</strong>
                    <p className="helper">title / insurance / tax</p>
                  </div>
                  <div className="band-card">
                    <p className="eyebrow">Signature gate</p>
                    <strong>{legalReview?.approvedForSignature && closingDiligence?.approvedForExecution && investorPromotionComplete ? "send ready" : "blocked"}</strong>
                    <p className="helper">pre-execution gate</p>
                  </div>
                  <div className="band-card">
                    <p className="eyebrow">Execution complete</p>
                    <strong>{executionReadiness?.executionComplete ? "complete" : "open"}</strong>
                    <p className="helper">signature and notary path</p>
                  </div>
                </div>
                <p className="eyebrow">Contract AI review</p>
                <ul className="list">
                  {dealAssessment.aiReviewFocus.length > 0 ? dealAssessment.aiReviewFocus.map((item) => (
                    <li key={item}>{item}</li>
                  )) : (
                    <li>Run state-pack completeness and clause consistency review.</li>
                  )}
                </ul>
                <p className="eyebrow" style={{ marginTop: 16 }}>Legal review</p>
                <ul className="list">
                  {dealAssessment.legalReviewFocus.length > 0 ? dealAssessment.legalReviewFocus.map((item) => (
                    <li key={item}>{item}</li>
                  )) : (
                    <li>Lawyer review is still required before signature.</li>
                  )}
                </ul>
                <p className="eyebrow" style={{ marginTop: 16 }}>Clause checklist</p>
                <ul className="list">
                  {dealAssessment.clauseChecklist.length > 0 ? dealAssessment.clauseChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  )) : (
                    <li>No extra clause flags beyond the base state pack.</li>
                  )}
                </ul>
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/contract-ai-review`)}>
                    Open contract AI review
                  </Link>
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/legal-review`)}>
                    Open legal review
                  </Link>
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/closing-diligence`)}>
                    Open closing diligence
                  </Link>
                </div>
              </div>
            </section>
          </>
        ) : null}

	        <section className="two-up">
	          <div className="panel">
	            <p className="eyebrow">Legal Timeline</p>
	            <h2>Template and signature milestones</h2>
            <ul className="list">
              <li>
                Template selected:
                {" "}
                {legalSelection?.selectedAt ? formatTimestamp(legalSelection.selectedAt) : "not yet"}
              </li>
              <li>
                Closing diligence cleared:
                {" "}
                {closingDiligence?.approvedForExecution ? formatTimestamp(closingDiligence.updatedAt) : "not yet"}
              </li>
              <li>
                Latest draft prepared:
                {" "}
                {latestDraft?.createdAt ? formatTimestamp(latestDraft.createdAt) : "not yet"}
              </li>
              <li>
                Last request sent:
                {" "}
                {latestDraft?.sentAt ? formatTimestamp(latestDraft.sentAt) : "not yet"}
              </li>
              <li>
                Signed:
                {" "}
                {latestSigned?.signedAt ? formatTimestamp(latestSigned.signedAt) : "not yet"}
              </li>
              <li>
                Execution complete:
                {" "}
                {executionReadiness?.executionComplete ? "yes" : "not yet"}
              </li>
	            </ul>
	          </div>

	          <div className="panel">
	            <p className="eyebrow">Execution Status</p>
	            <h2>Signature and notary completion</h2>
	            <ul className="list">
	              <li>
	                <strong>Signature-required forms:</strong> {executionReadiness?.signatureRequiredForms.length ?? 0}
	              </li>
	              <li>
	                <strong>Signed forms:</strong> {executionReadiness?.signedSignatureFormsCount ?? 0}
	              </li>
	              <li>
	                <strong>Notary required:</strong> {executionReadiness?.notaryRequired ? "yes" : "no"}
	              </li>
	              <li>
	                <strong>Notary complete:</strong> {executionReadiness?.notaryComplete ? "yes" : "no"}
	              </li>
	              <li>
	                <strong>Execution complete:</strong> {executionReadiness?.executionComplete ? "yes" : "not yet"}
	              </li>
	            </ul>
	            {executionReadiness?.missingItems?.length ? (
	              <>
	                <p className="eyebrow" style={{ marginTop: 16 }}>Open items</p>
	                <ul className="list">
	                  {executionReadiness.missingItems.map((item) => (
	                    <li key={item}>{item}</li>
	                  ))}
	                </ul>
	              </>
	            ) : null}
	          </div>

	          <div className="panel">
	            <p className="eyebrow">Latest Signature Draft</p>
            <h2>Most recent lender-facing send prep</h2>
            {!legalReview?.approvedForSignature || !closingDiligence?.approvedForExecution || !investorPromotionComplete || !executionReadiness?.executionComplete ? (
              <div className="callout">
                <p className="eyebrow">Signature still gated</p>
                <p>
                  {!legalReview?.approvedForSignature && !closingDiligence?.approvedForExecution && !investorPromotionComplete
                    ? "Document review, closing diligence, and investor promotion are all still open. Turicum LLC should treat any draft here as preparation only."
                    : !legalReview?.approvedForSignature
                      ? "Legal document review has not cleared this case for execution yet. Turicum LLC should treat any draft here as preparation, not a final send decision."
                      : !closingDiligence?.approvedForExecution
                        ? "Title work, insurance, and tax diligence still have to clear before Turicum LLC should treat the signature lane as send-ready."
                        : !executionReadiness?.executionComplete
                          ? "Execution is not complete yet. Finish all signed forms and the notary path, if required, before treating funding as ready."
                          : "Investor promotion is not final yet. Lock the investor structure before treating the signature lane as send-ready."}
                </p>
              </div>
            ) : null}
            {latestDraft ? (
              <>
                <p>
                  <strong>{latestDraft.title}</strong>
                </p>
                <p className="helper">
                  {latestDraft.status} · {latestDraft.provider.replaceAll("_", " ")}
                </p>
                {latestDraft.providerRequestId ? (
                  <p className="helper">Draft ID: {latestDraft.providerRequestId}</p>
                ) : null}
                {latestDraft.providerTemplateId ? (
                  <p className="helper">Template ID: {latestDraft.providerTemplateId}</p>
                ) : null}
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/intake`)}>
                    Open intake and signature queue
                  </Link>
                  {latestDraft.providerUrl ? (
                    <a className="secondary-button" href={latestDraft.providerUrl} target="_blank" rel="noreferrer">
                      Open draft link
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p>No draft has been prepared yet for this case.</p>
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}/intake`)}>
                    Prepare from intake
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="panel">
            <p className="eyebrow">Borrower Portal</p>
            <h2>Borrower-facing workflow</h2>
            <p>
              Intake, portal sharing, and execution prep.
            </p>
            <div className="form-actions">
              <Link className="secondary-button" href={withBasePath(`/cases/${id}/intake`)}>
                Open borrower intake workspace
              </Link>
            </div>
          </div>
        </section>

        <section className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Task</th>
                <th>Stage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((checklistItem) => (
                <tr key={checklistItem.id}>
                  <td>{checklistItem.code}</td>
                  <td>{checklistItem.label}</td>
                  <td>{getStageLabel(checklistItem.stage)}</td>
                  <td>{checklistItem.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="three-up">
          <div className="panel">
            <p className="eyebrow">Document Intake</p>
            <h2>Add the next document without leaving the case</h2>
            <p>
              Keep the operator in one place. Choose whether the file already lives in Google Drive or needs a direct upload,
              then save it into the packet with inline confirmation.
            </p>

            <CaseDocumentIntake
              documentTypes={documentTypes}
              action={submitDocumentEntry}
              caseDriveFolderHref={caseDriveFolderHref}
            />
          </div>

          <div className="panel">
            <p className="eyebrow">Packet Documents</p>
            <h2>Current case file set</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>File</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No documents uploaded yet.</td>
                    </tr>
                  ) : (
                    documents.map((document) => (
                      <tr key={document.id}>
                        <td>{document.title}</td>
                        <td>{getCategoryLabel(document.category)}</td>
                        <td>{document.status}</td>
                        <td>
                          <a href={withBasePath(`/api/cases/${id}/documents/${document.id}`)} target={isGoogleDriveUrl(document.storagePath) ? "_blank" : undefined} rel={isGoogleDriveUrl(document.storagePath) ? "noreferrer" : undefined}>
                            {document.fileName}
                          </a>
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
