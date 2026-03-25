import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AtlasNav } from "@/components/atlas/nav";
import { listCaseDocuments, isGoogleDriveUrl } from "@/lib/atlas/case-documents";
import { getCaseById } from "@/lib/atlas/cases";
import { getCaseLegalSelection } from "@/lib/atlas/case-legal-selection";
import { getCaseDealProfile } from "@/lib/atlas/deal-intake";
import { buildGoogleDriveFileHref, buildGoogleDriveFolderHref } from "@/lib/atlas/google-drive";
import { getBorrowerPortalForCase, getBorrowerPromotionReadinessForCase, getExecutionReadiness } from "@/lib/atlas/intake";
import { getCaseInvestorPromotion } from "@/lib/atlas/investor-promotion";
import { getCaseFundingWorkflow, saveCaseFundingWorkflow, type FundingStatus } from "@/lib/atlas/lifecycle";
import { getCaseClosingDiligence, getCaseLegalReview } from "@/lib/atlas/review-workflow";
import { withBasePath } from "@/lib/atlas/runtime";

export const dynamic = "force-dynamic";

const fundingStatuses: FundingStatus[] = [
  "not_started",
  "escrow_setup",
  "reserves_defined",
  "ready_to_fund",
  "funded"
];

function canAdvanceFundingStatus(status: FundingStatus) {
  return status === "ready_to_fund" || status === "funded";
}

export default async function FundingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  const funding = await getCaseFundingWorkflow(id);
  const investorPromotion = await getCaseInvestorPromotion(id);
  const dealProfile = await getCaseDealProfile(id);
  const portal = await getBorrowerPortalForCase(id);
  const legalReview = await getCaseLegalReview(id);
  const closingDiligence = await getCaseClosingDiligence(id);
  const legalSelection = await getCaseLegalSelection(id);
  const driveDocuments = (await listCaseDocuments(id)).filter((document) => isGoogleDriveUrl(document.storagePath));
  const borrowerReadiness = portal ? await getBorrowerPromotionReadinessForCase(id, portal) : null;
  const executionReadiness =
    portal && dealProfile ? getExecutionReadiness(portal, dealProfile.notaryRequirement) : null;

  const investorReady = Boolean(
    investorPromotion &&
      (investorPromotion.status === "promoted" || investorPromotion.status === "investor_committed") &&
      borrowerReadiness?.borrowerInfoComplete &&
      dealProfile?.validationStatus === "approved"
  );
  const legalReady = Boolean(legalReview?.approvedForSignature);
  const diligenceReady = Boolean(closingDiligence?.approvedForExecution);
  const executionReady = Boolean(executionReadiness?.executionComplete);
  const fundingGateReady = investorReady && legalReady && diligenceReady && executionReady;
  const fundingGateBlockers = [
    !investorReady ? "Investor promotion must be complete before Turicum LLC treats the file as ready to fund." : null,
    !legalReady ? "Legal review must approve the paper stack before funding can advance." : null,
    !diligenceReady ? "Closing diligence must clear title, insurance, and tax before funding can advance." : null,
    ...(executionReadiness?.missingItems ?? [])
  ].filter((item, index, array): item is string => Boolean(item) && array.indexOf(item) === index);

  async function saveFunding(formData: FormData) {
    "use server";

    const requestedStatus = String(formData.get("status") ?? "not_started") as FundingStatus;
    const latestInvestorPromotion = await getCaseInvestorPromotion(id);
    const latestDealProfile = await getCaseDealProfile(id);
    const latestPortal = await getBorrowerPortalForCase(id);
    const latestLegalReview = await getCaseLegalReview(id);
    const latestClosingDiligence = await getCaseClosingDiligence(id);
    const latestBorrowerReadiness = latestPortal
      ? await getBorrowerPromotionReadinessForCase(id, latestPortal)
      : null;
    const latestExecutionReadiness =
      latestPortal && latestDealProfile
        ? getExecutionReadiness(latestPortal, latestDealProfile.notaryRequirement)
        : null;
    const latestInvestorReady = Boolean(
      latestInvestorPromotion &&
        (latestInvestorPromotion.status === "promoted" ||
          latestInvestorPromotion.status === "investor_committed") &&
        latestBorrowerReadiness?.borrowerInfoComplete &&
        latestDealProfile?.validationStatus === "approved"
    );
    const latestFundingGateReady = Boolean(
      latestInvestorReady &&
        latestLegalReview?.approvedForSignature &&
        latestClosingDiligence?.approvedForExecution &&
        latestExecutionReadiness?.executionComplete
    );

    if (canAdvanceFundingStatus(requestedStatus) && !latestFundingGateReady) {
      redirect(withBasePath(`/cases/${id}/funding`));
    }

    await saveCaseFundingWorkflow({
      caseId: id,
      status: requestedStatus,
      escrowProvider: String(formData.get("escrowProvider") ?? "").trim(),
      escrowAccountLabel: String(formData.get("escrowAccountLabel") ?? "").trim(),
      reserveStructure: String(formData.get("reserveStructure") ?? "").trim(),
      reserveAmount: String(formData.get("reserveAmount") ?? "").trim(),
      wireInstructionsReady: formData.get("wireInstructionsReady") === "on",
      fundingMemo: String(formData.get("fundingMemo") ?? "").trim(),
      releaseConditions: String(formData.get("releaseConditions") ?? "").trim(),
      fundedAmount: String(formData.get("fundedAmount") ?? "").trim(),
      fundedAt: String(formData.get("fundedAt") ?? "").trim() || undefined
    });
    redirect(withBasePath(`/cases/${id}/funding`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Funding</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{caseItem.title}</h1>
              <p>
                Move from signed paper into escrow, reserves, and final funding release. Turicum LLC should
                not treat closing as complete until execution, diligence, and investor gates are all clear.
              </p>
            </div>
            <div className="hero-aside">
              <AtlasNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Investor path</p>
                  <strong>{investorReady ? "ready" : "blocked"}</strong>
                  <p className="helper">promotion outcome</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Legal gate</p>
                  <strong>{legalReady ? "approved" : "blocked"}</strong>
                  <p className="helper">document review</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Diligence gate</p>
                  <strong>{diligenceReady ? "approved" : "blocked"}</strong>
                  <p className="helper">title / insurance / tax</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Execution</p>
                  <strong>{executionReady ? "complete" : "open"}</strong>
                  <p className="helper">signed docs / notary</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Funding</p>
                  <strong>{(funding?.status ?? "not_started").replaceAll("_", " ")}</strong>
                  <p className="helper">money movement</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead">
            <p className="eyebrow">Funding Control</p>
            <h2>Escrow, reserves, and release conditions</h2>
            <form action={saveFunding} className="form-grid">
              <div className="two-up">
                <label className="field">
                  <span>Status</span>
                  <select name="status" defaultValue={funding?.status ?? "not_started"}>
                    {fundingStatuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                        disabled={canAdvanceFundingStatus(status) && !fundingGateReady}
                      >
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Funded amount</span>
                  <input
                    name="fundedAmount"
                    type="text"
                    defaultValue={funding?.fundedAmount ?? ""}
                    placeholder="$0"
                  />
                </label>
              </div>
              <label className="field">
                <span>Escrow provider</span>
                <input name="escrowProvider" type="text" defaultValue={funding?.escrowProvider ?? ""} />
              </label>
              <label className="field">
                <span>Escrow account label</span>
                <input name="escrowAccountLabel" type="text" defaultValue={funding?.escrowAccountLabel ?? ""} />
              </label>
              <div className="two-up">
                <label className="field">
                  <span>Reserve structure</span>
                  <textarea name="reserveStructure" rows={4} defaultValue={funding?.reserveStructure ?? ""} />
                </label>
                <label className="field">
                  <span>Reserve amount</span>
                  <input name="reserveAmount" type="text" defaultValue={funding?.reserveAmount ?? ""} />
                </label>
              </div>
              <label className="checkbox-item">
                <input
                  name="wireInstructionsReady"
                  type="checkbox"
                  defaultChecked={funding?.wireInstructionsReady ?? false}
                />
                <span>
                  <strong>Wire instructions ready</strong>
                  <small>Keep this explicit before release.</small>
                </span>
              </label>
              <label className="field">
                <span>Funding memo</span>
                <textarea name="fundingMemo" rows={5} defaultValue={funding?.fundingMemo ?? ""} />
              </label>
              <label className="field">
                <span>Release conditions</span>
                <textarea name="releaseConditions" rows={4} defaultValue={funding?.releaseConditions ?? ""} />
              </label>
              <label className="field">
                <span>Funded at</span>
                <input
                  name="fundedAt"
                  type="datetime-local"
                  defaultValue={funding?.fundedAt ? new Date(funding.fundedAt).toISOString().slice(0, 16) : ""}
                />
              </label>
              <div className="form-actions">
                <button type="submit">Save funding workflow</button>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}`)}>
                  Back to case
                </Link>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}/closing-diligence`)}>
                  Open closing diligence
                </Link>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}/servicing`)}>
                  Open servicing lane
                </Link>
              </div>
            </form>
          </div>

          <div className="panel">
            <p className="eyebrow">Funding gates</p>
            <h2>What Turicum LLC should know before money moves</h2>
            <ul className="list">
              <li>
                <strong>Investor promotion:</strong> {investorReady ? "complete" : "not complete"}
              </li>
              <li>
                <strong>Legal approval:</strong> {legalReady ? "complete" : "not complete"}
              </li>
              <li>
                <strong>Closing diligence:</strong> {diligenceReady ? "complete" : "not complete"}
              </li>
              <li>
                <strong>Execution complete:</strong> {executionReady ? "yes" : "no"}
              </li>
              <li>
                <strong>Escrow account:</strong> {funding?.escrowAccountLabel ? "named" : "missing"}
              </li>
              <li>
                <strong>Reserve plan:</strong> {funding?.reserveStructure ? "drafted" : "missing"}
              </li>
              <li>
                <strong>Wire instructions:</strong> {funding?.wireInstructionsReady ? "ready" : "not ready"}
              </li>
            </ul>
            {!fundingGateReady ? (
              <>
                <p className="eyebrow" style={{ marginTop: 16 }}>
                  Blockers
                </p>
                <ul className="list">
                  {fundingGateBlockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="helper">
              Funding is the post-execution control surface: escrow, reserve policy, release conditions,
              and confirmation of money movement.
            </p>
          </div>
        </section>

        <section className="two-up">
          <div className="panel">
            <p className="eyebrow">Google Drive references</p>
            <h2>Docs ops should have on hand while funding</h2>
            <ul className="list">
              {buildGoogleDriveFolderHref(legalSelection?.googleDriveFolderId) ? (
                <li>
                  <strong>Case folder:</strong>{" "}
                  <a
                    href={buildGoogleDriveFolderHref(legalSelection?.googleDriveFolderId) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    open Drive folder
                  </a>
                </li>
              ) : null}
              {buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) ? (
                <li>
                  <strong>Lead legal file:</strong>{" "}
                  <a
                    href={buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    open saved Drive file
                  </a>
                </li>
              ) : null}
              {driveDocuments.slice(0, 4).map((document) => (
                <li key={document.id}>
                  <strong>{document.title}:</strong>{" "}
                  <a href={document.storagePath} target="_blank" rel="noreferrer">
                    open linked Drive document
                  </a>
                </li>
              ))}
              {!buildGoogleDriveFolderHref(legalSelection?.googleDriveFolderId) &&
              !buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) &&
              driveDocuments.length === 0 ? (
                <li>No Google Drive references are attached to this case yet.</li>
              ) : null}
            </ul>
            <p className="helper">
              Keep the operating file in Drive and let Turicum LLC control the gates, approvals, and
              money-movement state around it.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
