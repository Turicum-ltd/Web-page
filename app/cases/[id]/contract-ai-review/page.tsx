import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TuricumNav } from "@/components/turicum/nav";
import { assessDealProfile, getCaseDealProfile } from "@/lib/turicum/deal-intake";
import { getCaseLegalSelection } from "@/lib/turicum/case-legal-selection";
import { getCaseById } from "@/lib/turicum/cases";
import {
  buildSuggestedAiFindings,
  getCaseAiReview,
  saveCaseAiReview,
  type AiReviewStatus
} from "@/lib/turicum/review-workflow";
import { withBasePath } from "@/lib/turicum/runtime";

export const dynamic = "force-dynamic";

function normalizeStatus(value: FormDataEntryValue | null): AiReviewStatus {
  return value === "in_review" || value === "flagged" || value === "ready_for_legal"
    ? value
    : "not_started";
}

export default async function ContractAiReviewPage({
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
  const savedReview = await getCaseAiReview(id);
  const assessment = dealProfile ? assessDealProfile(dealProfile) : null;
  const suggestedFindings = assessment
    ? buildSuggestedAiFindings(assessment, Boolean(legalSelection))
    : [];
  const findings = savedReview?.findings?.length ? savedReview.findings : suggestedFindings;

  async function saveReview(formData: FormData) {
    "use server";

    if (!assessment) {
      redirect(withBasePath(`/cases/${id}`));
    }

    await saveCaseAiReview({
      caseId: id,
      status: normalizeStatus(formData.get("status")),
      summary: String(formData.get("summary") ?? "").trim(),
      reviewerModel: String(formData.get("reviewerModel") ?? "").trim() || "Turicum LLC contract AI",
      notes: String(formData.get("notes") ?? "").trim(),
      findings: suggestedFindings
    });

    redirect(withBasePath(`/cases/${id}/contract-ai-review`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Contract AI Review</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{caseItem.title}</h1>
              <p>
                Run the contract stack through an AI review before legal sign-off. This is where Turicum LLC
                turns the intake facts, clause checklist, and chosen precedent into a concrete issue list.
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Status</p>
                  <strong>{savedReview?.status?.replaceAll("_", " ") ?? "not started"}</strong>
                  <p className="helper">current review state</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Template</p>
                  <strong>{legalSelection ? "selected" : "missing"}</strong>
                  <p className="helper">precedent basis</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Findings</p>
                  <strong>{findings.length}</strong>
                  <p className="helper">issues and checks surfaced</p>
                </div>
              </div>
              <div className="form-actions">
                <Link className="secondary-button" href={withBasePath(`/cases/${id}`)}>Back to case</Link>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}/legal-review`)}>Open legal review</Link>
              </div>
            </div>
          </div>
        </section>

        {!assessment ? (
          <section className="panel lead">
            <p className="eyebrow">Needs intake</p>
            <h2>Deal intake has to be completed first</h2>
            <p>
              Turicum LLC needs the deal facts before it can generate a meaningful contract AI review.
            </p>
            <div className="form-actions">
              <Link className="secondary-button" href={withBasePath("/cases/new")}>Create or update deal intake</Link>
            </div>
          </section>
        ) : (
          <>
            <section className="two-up">
              <div className="panel lead">
                <p className="eyebrow">AI Review Scope</p>
                <h2>What Turicum LLC is checking</h2>
                <div className="dashboard-band">
                  <div className="band-card">
                    <p className="eyebrow">Contract stack</p>
                    <strong>{assessment.contractStack.length}</strong>
                    <p className="helper">required core documents</p>
                  </div>
                  <div className="band-card">
                    <p className="eyebrow">Supplements</p>
                    <strong>{assessment.supplementalDocuments.length}</strong>
                    <p className="helper">extra documents flagged</p>
                  </div>
                  <div className="band-card">
                    <p className="eyebrow">Clause checks</p>
                    <strong>{assessment.clauseChecklist.length}</strong>
                    <p className="helper">checklist items</p>
                  </div>
                </div>
                <ul className="list">
                  {assessment.aiReviewFocus.length > 0 ? assessment.aiReviewFocus.map((item) => (
                    <li key={item}>{item}</li>
                  )) : (
                    <li>Run state-pack completeness and clause consistency review.</li>
                  )}
                </ul>
              </div>

              <div className="panel">
                <p className="eyebrow">Review Summary</p>
                <h2>Record the AI outcome</h2>
                <form action={saveReview} className="form-grid">
                  <label className="field">
                    <span>Status</span>
                    <select name="status" defaultValue={savedReview?.status ?? "in_review"}>
                      <option value="not_started">not started</option>
                      <option value="in_review">in review</option>
                      <option value="flagged">flagged</option>
                      <option value="ready_for_legal">ready for legal</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Reviewer model</span>
                    <input name="reviewerModel" type="text" defaultValue={savedReview?.reviewerModel ?? "Turicum LLC contract AI"} />
                  </label>
                  <label className="field">
                    <span>Summary</span>
                    <textarea
                      name="summary"
                      rows={4}
                      defaultValue={savedReview?.summary ?? (legalSelection
                        ? "Template selected. AI review should confirm clause fit, state-pack coverage, and any structure-specific gaps."
                        : "No template selected yet. Choose a legal starting point before blessing the paper stack.")}
                    />
                  </label>
                  <label className="field">
                    <span>Notes</span>
                    <textarea
                      name="notes"
                      rows={6}
                      defaultValue={savedReview?.notes ?? ""}
                      placeholder="Capture any AI redlines, clause concerns, or unresolved questions for legal review."
                    />
                  </label>
                  <div className="form-actions">
                    <button type="submit">Save AI review</button>
                  </div>
                </form>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Findings</p>
                  <h2>Issues Turicum LLC wants reviewed before legal sign-off</h2>
                </div>
                <p className="page-note helper">
                  This is the working issue list for the contract AI pass. Legal review should start from here, not from a blank page.
                </p>
              </div>
              <div className="status-grid">
                {findings.map((finding) => (
                  <article key={finding.id} className="status-card">
                    <p className="eyebrow">{finding.severity}</p>
                    <strong>{finding.title}</strong>
                    <p className="helper">{finding.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
