import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AtlasNav } from "@/components/atlas/nav";
import { getCaseLegalSelection } from "@/lib/atlas/case-legal-selection";
import { assessDealProfile, getCaseDealProfile } from "@/lib/atlas/deal-intake";
import { getCaseById } from "@/lib/atlas/cases";
import {
  getCaseClosingDiligence,
  getCaseAiReview,
  getCaseLegalReview,
  saveCaseLegalReview,
  type LegalReviewStatus
} from "@/lib/atlas/review-workflow";
import { withBasePath } from "@/lib/atlas/runtime";

export const dynamic = "force-dynamic";

function normalizeStatus(value: FormDataEntryValue | null): LegalReviewStatus {
  return value === "in_review" || value === "changes_requested" || value === "approved"
    ? value
    : "pending";
}

export default async function LegalReviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseItem = await getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  const dealProfile = await getCaseDealProfile(id);
  const legalSelection = await getCaseLegalSelection(id);
  const aiReview = await getCaseAiReview(id);
  const legalReview = await getCaseLegalReview(id);
  const closingDiligence = await getCaseClosingDiligence(id);
  const assessment = dealProfile ? assessDealProfile(dealProfile) : null;
  const aiReady = aiReview?.status === "ready_for_legal";

  async function saveReview(formData: FormData) {
    "use server";

    await saveCaseLegalReview({
      caseId: id,
      status: normalizeStatus(formData.get("status")),
      lawyerName: String(formData.get("lawyerName") ?? "").trim(),
      summary: String(formData.get("summary") ?? "").trim(),
      comments: String(formData.get("comments") ?? "").trim(),
      approvedForSignature: formData.get("approvedForSignature") === "on"
    });

    redirect(withBasePath(`/cases/${id}/legal-review`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Legal Review</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{caseItem.title}</h1>
              <p>
                This is the legal document-review gate before signature routing. Title work, insurance,
                and tax diligence live in a separate closing-diligence step and must clear independently.
              </p>
            </div>
            <div className="hero-aside">
              <AtlasNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">AI review</p>
                  <strong>{aiReview?.status?.replaceAll("_", " ") ?? "not started"}</strong>
                  <p className="helper">upstream gate</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Legal status</p>
                  <strong>{legalReview?.status?.replaceAll("_", " ") ?? "pending"}</strong>
                  <p className="helper">current legal state</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Signature gate</p>
                  <strong>{legalReview?.approvedForSignature && closingDiligence?.approvedForExecution ? "cleared" : "blocked"}</strong>
                  <p className="helper">both gates required</p>
                </div>
              </div>
              <div className="form-actions">
                <Link className="secondary-button" href={withBasePath(`/cases/${id}`)}>Back to case</Link>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}/contract-ai-review`)}>Open AI review</Link>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}/closing-diligence`)}>Open closing diligence</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead">
            <p className="eyebrow">Review Readiness</p>
            <h2>What legal should use as the starting record</h2>
            <div className="status-grid">
              <article className="status-card">
                <p className="eyebrow">Template</p>
                <strong>{legalSelection?.precedentTitle ?? "No template selected"}</strong>
                <p className="helper">current drafting basis</p>
              </article>
              <article className="status-card">
                <p className="eyebrow">AI gate</p>
                <strong>{aiReady ? "Ready for legal review" : "Still needs AI review"}</strong>
                <p className="helper">
                  {aiReady
                    ? "Legal can review against a completed AI issue list."
                    : "Run the contract AI review before approving the paper stack for signature."}
                </p>
              </article>
            </div>
            {assessment ? (
              <ul className="list">
                {assessment.legalReviewFocus.length > 0 ? assessment.legalReviewFocus.map((item) => (
                  <li key={item}>{item}</li>
                )) : (
                  <li>Lawyer review is still required before signature.</li>
                )}
              </ul>
            ) : (
              <p className="helper">Complete deal intake first so legal review has deal facts to reference.</p>
            )}
          </div>

          <div className="panel">
            <p className="eyebrow">Legal Decision</p>
            <h2>Record legal corrections and document approval</h2>
            <form action={saveReview} className="form-grid">
              <label className="field">
                <span>Lawyer name</span>
                <input name="lawyerName" type="text" defaultValue={legalReview?.lawyerName ?? ""} placeholder="Who reviewed the paper stack?" />
              </label>
              <label className="field">
                <span>Status</span>
                <select name="status" defaultValue={legalReview?.status ?? "pending"}>
                  <option value="pending">pending</option>
                  <option value="in_review">in review</option>
                  <option value="changes_requested">changes requested</option>
                  <option value="approved">approved</option>
                </select>
              </label>
              <label className="field">
                <span>Summary</span>
                <textarea
                  name="summary"
                  rows={4}
                  defaultValue={legalReview?.summary ?? (aiReady
                    ? "Legal review can proceed from the AI issue list and current template selection."
                    : "AI review is not complete yet, so legal review should be treated as preliminary only.")}
                />
              </label>
              <label className="field">
                <span>Comments and requested changes</span>
                <textarea
                  name="comments"
                  rows={7}
                  defaultValue={legalReview?.comments ?? ""}
                  placeholder="Capture redlines, clause corrections, signer changes, or other legal instructions."
                />
              </label>
              <label className="checkbox-item">
                <input type="checkbox" name="approvedForSignature" defaultChecked={legalReview?.approvedForSignature ?? false} />
                <span>
                  <strong>Approved for signature routing</strong>
                  <small>This clears the document-review side only. Closing diligence still has to clear title, insurance, and tax before execution.</small>
                </span>
              </label>
              <div className="form-actions">
                <button type="submit">Save legal review</button>
              </div>
            </form>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Execution Gate</p>
              <h2>What needs to be true before Turicum LLC sends documents</h2>
            </div>
          </div>
          <div className="status-grid">
            <article className="status-card">
              <p className="eyebrow">Template selected</p>
              <strong>{legalSelection ? "yes" : "no"}</strong>
              <p className="helper">The case should have a chosen legal starting point.</p>
            </article>
            <article className="status-card">
              <p className="eyebrow">AI review ready</p>
              <strong>{aiReady ? "yes" : "no"}</strong>
              <p className="helper">AI review should be ready for legal unless counsel is doing a preliminary pass.</p>
            </article>
            <article className="status-card">
              <p className="eyebrow">Legal approval</p>
              <strong>{legalReview?.approvedForSignature ? "yes" : "no"}</strong>
              <p className="helper">This is the document-review gate only.</p>
            </article>
            <article className="status-card">
              <p className="eyebrow">Closing diligence</p>
              <strong>{closingDiligence?.approvedForExecution ? "yes" : "no"}</strong>
              <p className="helper">Title work, insurance, and tax still need their own separate clearance.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
