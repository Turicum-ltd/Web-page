import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AtlasNav } from "@/components/atlas/nav";
import { assessDealProfile, getCaseDealProfile } from "@/lib/atlas/deal-intake";
import { getCaseInvestorPromotion, saveCaseInvestorPromotion, type InvestorPromotionStatus, type InvestorStructure } from "@/lib/atlas/investor-promotion";
import { getBorrowerPortalForCase, getBorrowerPortalSummary, getBorrowerPromotionReadinessForCase } from "@/lib/atlas/intake";
import { withBasePath } from "@/lib/atlas/runtime";
import { getCaseById } from "@/lib/atlas/cases";

export const dynamic = "force-dynamic";

const statusOptions: InvestorPromotionStatus[] = [
  "pending",
  "gathering_borrower_info",
  "ready_for_investors",
  "promoted",
  "investor_committed"
];

const structureOptions: InvestorStructure[] = ["undecided", "single_investor", "multiple_investors"];

function normalizeStatus(value: FormDataEntryValue | null): InvestorPromotionStatus {
  return value === "gathering_borrower_info" || value === "ready_for_investors" || value === "promoted" || value === "investor_committed"
    ? value
    : "pending";
}

function normalizeStructure(value: FormDataEntryValue | null): InvestorStructure {
  return value === "single_investor" || value === "multiple_investors" ? value : "undecided";
}

function normalizeCount(value: FormDataEntryValue | null, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }

  return Math.max(0, Math.round(numeric));
}

export default async function InvestorPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  const dealProfile = await getCaseDealProfile(id);
  const portal = await getBorrowerPortalForCase(id);

  if (!dealProfile || !portal) {
    notFound();
  }

  const currentDealProfile = dealProfile;
  const currentPortal = portal;
  const assessment = assessDealProfile(currentDealProfile);
  const borrowerReadiness = await getBorrowerPromotionReadinessForCase(id, currentPortal);
  const portalSummary = getBorrowerPortalSummary(currentPortal);
  const existingPromotion = await getCaseInvestorPromotion(id);
  const validationApproved = currentDealProfile.validationStatus === "approved";
  const promotionPrereqsReady = borrowerReadiness.borrowerInfoComplete && validationApproved;
  const recommendedStatus: InvestorPromotionStatus = promotionPrereqsReady
    ? existingPromotion?.status === "gathering_borrower_info"
      ? "ready_for_investors"
      : existingPromotion?.status ?? "ready_for_investors"
    : "gathering_borrower_info";

  async function savePromotion(formData: FormData) {
    "use server";

    const requestedStatus = normalizeStatus(formData.get("status"));
    const finalInvestorCount = normalizeCount(formData.get("finalInvestorCount"), 0);
    const targetInvestorCount = normalizeCount(formData.get("targetInvestorCount"), currentDealProfile.lenderCount);

    const forcedStatus = promotionPrereqsReady ? requestedStatus : "gathering_borrower_info";
    const inferredStructure: InvestorStructure = finalInvestorCount > 1
      ? "multiple_investors"
      : finalInvestorCount === 1
        ? "single_investor"
        : normalizeStructure(formData.get("finalStructure"));

    await saveCaseInvestorPromotion({
      caseId: id,
      status: forcedStatus,
      headline: String(formData.get("headline") ?? "").trim(),
      validationSummary: String(formData.get("validationSummary") ?? "").trim(),
      investorSummary: String(formData.get("investorSummary") ?? "").trim(),
      promotionNotes: String(formData.get("promotionNotes") ?? "").trim(),
      leadInvestorName: String(formData.get("leadInvestorName") ?? "").trim(),
      targetInvestorCount,
      finalInvestorCount,
      finalStructure: inferredStructure
    });

    redirect(withBasePath(`/cases/${id}/investor-promotion`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Investor Promotion</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{caseItem.title}</h1>
              <p>Package the validated deal for investors, record market response, and lock the final investor structure before legal and execution move forward.</p>
            </div>
            <div className="hero-aside">
              <AtlasNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Borrower packet</p>
                  <strong>{borrowerReadiness.borrowerInfoComplete ? "ready" : "incomplete"}</strong>
                  <p className="helper">{portalSummary.submittedForms}/{portalSummary.totalForms} forms submitted</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Validation</p>
                  <strong>{(currentDealProfile.validationStatus ?? "pending").replaceAll("_", " ")}</strong>
                  <p className="helper">borrower + property gate</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Promotion status</p>
                  <strong>{(existingPromotion?.status ?? recommendedStatus).replaceAll("_", " ")}</strong>
                  <p className="helper">capital-markets readiness</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!promotionPrereqsReady ? (
          <section className="panel">
            <p className="eyebrow">Blocker</p>
            <h2>Borrower information and validation must be complete first</h2>
            <p>Turicum LLC should not treat investor promotion as complete until the borrower packet is complete and borrower/property validation is approved.</p>
            <ul className="list">
              {borrowerReadiness.missingItems.map((item) => <li key={item}>{item}</li>)}
              {!validationApproved ? <li>Borrower + property validation still needs approval before investor promotion can finalize.</li> : null}
            </ul>
            <div className="form-actions">
              <Link className="secondary-button" href={withBasePath(`/cases/${id}/intake`)}>Open borrower intake workspace</Link>
              <Link className="secondary-button" href={withBasePath(`/cases/${id}/validation`)}>Open validation</Link>
            </div>
          </section>
        ) : null}

        <section className="two-up">
          <div className="panel lead">
            <p className="eyebrow">Promotion Brief</p>
            <h2>Record the investor-facing summary and outcome</h2>
            <form action={savePromotion} className="form-grid">
              <label className="field">
                <span>Headline</span>
                <input name="headline" type="text" defaultValue={existingPromotion?.headline ?? `${caseItem.state} ${currentDealProfile.structureType} opportunity`} />
              </label>

              <div className="two-up">
                <label className="field">
                  <span>Status</span>
                  <select name="status" defaultValue={existingPromotion?.status ?? recommendedStatus}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Final structure</span>
                  <select name="finalStructure" defaultValue={existingPromotion?.finalStructure ?? "undecided"}>
                    {structureOptions.map((structure) => (
                      <option key={structure} value={structure}>{structure.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="two-up">
                <label className="field">
                  <span>Target investors</span>
                  <input name="targetInvestorCount" type="number" min={1} defaultValue={existingPromotion?.targetInvestorCount ?? currentDealProfile.lenderCount} />
                </label>
                <label className="field">
                  <span>Final investor count</span>
                  <input name="finalInvestorCount" type="number" min={0} defaultValue={existingPromotion?.finalInvestorCount ?? 0} />
                </label>
              </div>

              <label className="field">
                <span>Lead investor</span>
                <input name="leadInvestorName" type="text" defaultValue={existingPromotion?.leadInvestorName ?? ""} placeholder="Optional lead investor or anchor account" />
              </label>

              <label className="field">
                <span>Validation summary</span>
                <textarea name="validationSummary" rows={4} defaultValue={existingPromotion?.validationSummary ?? "Borrower and property diligence support investor outreach once the packet is complete."} />
              </label>

              <label className="field">
                <span>Investor summary</span>
                <textarea name="investorSummary" rows={4} defaultValue={existingPromotion?.investorSummary ?? assessment.capitalSummary} />
              </label>

              <label className="field">
                <span>Promotion notes</span>
                <textarea name="promotionNotes" rows={5} defaultValue={existingPromotion?.promotionNotes ?? assessment.investorPromotionFocus.join("\n")} />
              </label>

              <div className="form-actions">
                <button type="submit">Save investor promotion</button>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}`)}>Back to case</Link>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}/intake`)}>Open intake workspace</Link>
              </div>
            </form>
          </div>

          <div className="panel">
            <p className="eyebrow">Readiness</p>
            <h2>What Turicum LLC requires before investor take-up is final</h2>
	            <ul className="list">
	              <li><strong>Borrower contact:</strong> {borrowerReadiness.contactReady ? "saved" : "missing"}</li>
	              <li><strong>Forms assigned:</strong> {borrowerReadiness.formsAssigned ? "yes" : "no"}</li>
	              <li><strong>Forms complete:</strong> {borrowerReadiness.formsComplete ? "yes" : "no"}</li>
	              <li><strong>Supporting docs attached:</strong> {borrowerReadiness.supportingDocumentsCount}</li>
	              <li><strong>Validation approved:</strong> {validationApproved ? "yes" : "no"}</li>
	              <li><strong>Final investor count:</strong> {existingPromotion?.finalInvestorCount ?? 0}</li>
	            </ul>
	            {borrowerReadiness.supportingDocumentChecklist.length ? (
	              <>
	                <p className="eyebrow" style={{ marginTop: 16 }}>Required borrower documents</p>
	                <ul className="list">
	                  {borrowerReadiness.supportingDocumentChecklist.map((item) => (
	                    <li key={item.id}>
	                      <strong>{item.label}:</strong> {item.ready ? `ready (${item.matchedCount})` : "missing"}
	                    </li>
	                  ))}
	                </ul>
	              </>
	            ) : null}
	            <p className="eyebrow" style={{ marginTop: 16 }}>Investor-promotion focus</p>
	            <ul className="list">
	              {assessment.investorPromotionFocus.map((item) => <li key={item}>{item}</li>)}
	            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
