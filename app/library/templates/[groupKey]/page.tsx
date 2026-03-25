import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AtlasNav } from "@/components/atlas/nav";
import { saveCaseLegalSelection } from "@/lib/atlas/case-legal-selection";
import { listCases } from "@/lib/atlas/cases";
import {
  decodeLegalGroupKey,
  getLatestLegalCorpusAnalysis,
  getLegalGroupByKey
} from "@/lib/atlas/legal-analysis";
import { listPrecedents } from "@/lib/atlas/precedents";
import { withBasePath } from "@/lib/atlas/runtime";

export const dynamic = "force-dynamic";

const DEMO_CASE_ID = "case-in-001";

function extractDriveFolderId(url: string | undefined) {
  if (!url) {
    return "";
  }

  const match = url.match(/\/folders\/([^/?]+)/i);
  return match?.[1] ?? "";
}

export default async function TemplateDetailPage({
  params
}: {
  params: Promise<{ groupKey: string }>;
}) {
  const { groupKey } = await params;
  const analysis = getLatestLegalCorpusAnalysis();

  if (!analysis) {
    notFound();
  }

  const group = getLegalGroupByKey(groupKey, analysis);

  if (!group) {
    notFound();
  }
  const currentGroup = group;

  const matchedPrecedents = listPrecedents()
    .filter((item) =>
      item.state === group.state &&
      item.structureType === group.structureType &&
      item.documentType === group.documentType
    )
    .sort((a, b) => {
      const aScore = Number(a.id === group.bestCandidate.id) * 100 + Number(a.isExecuted) * 10 + Number(a.isRecorded) * 5;
      const bScore = Number(b.id === group.bestCandidate.id) * 100 + Number(b.isExecuted) * 10 + Number(b.isRecorded) * 5;
      return bScore - aScore || a.title.localeCompare(b.title);
    });

  const bestPrecedentRecord = matchedPrecedents.find((item) => item.id === currentGroup.bestCandidate.id) ?? matchedPrecedents[0] ?? null;

  const relatedCoverage = analysis.coverage.find((row) => row.state === group.state && row.structureType === group.structureType) ?? null;
  const sourceFolder = analysis.sourceFolders[0];
  const sourceFolderId = extractDriveFolderId(sourceFolder?.url);
  const cases = await listCases();
  const suggestedCases = cases.slice(0, 3);
  const decodedGroupKey = decodeLegalGroupKey(groupKey);
  const reviewHref = withBasePath(`/library/templates?state=${group.state}&structure=${group.structureType}&documentType=${group.documentType}&group=${encodeURIComponent(decodedGroupKey)}`);

  async function applyTemplateToCase(formData: FormData) {
    "use server";

    const caseId = String(formData.get("caseId") ?? "");
    if (!caseId) {
      return;
    }

    await saveCaseLegalSelection({
      caseId,
      groupKey: decodedGroupKey,
      precedentId: currentGroup.bestCandidate.id,
      precedentTitle: currentGroup.bestCandidate.title,
      documentType: currentGroup.documentType,
      state: currentGroup.state,
      structureType: currentGroup.structureType,
      sourceRelativePath: bestPrecedentRecord?.relativePath,
      sourceCaseCode: bestPrecedentRecord?.sourceCaseCode ?? undefined,
      googleDriveFolderId: sourceFolderId || undefined,
      sourceFolderUrl: sourceFolder?.url
    });

    redirect(withBasePath(`/cases/${caseId}/intake`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Template Detail</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{group.state} {group.structureType} · {group.documentLabel}</h1>
              <p>
                This is the working decision page for one legal family. Use it to confirm the lead precedent,
                understand what still blocks production use, and push the recommendation directly into a live case.
              </p>
            </div>
            <div className="hero-aside">
              <AtlasNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Lead score</p>
                  <strong>{group.bestCandidate.candidateScore}</strong>
                  <p className="helper">current ranking</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Alternatives</p>
                  <strong>{Math.max(matchedPrecedents.length - 1, 0)}</strong>
                  <p className="helper">backup precedents</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Coverage</p>
                  <strong>{relatedCoverage ? `${relatedCoverage.coveredRequiredCount}/${relatedCoverage.requiredDocumentCount}` : "n/a"}</strong>
                  <p className="helper">required families covered</p>
                </div>
              </div>
	              <div className="form-actions">
	                <Link className="secondary-button" href={reviewHref}>Back to selector</Link>
	                <Link className="secondary-button" href={withBasePath("/cases")}>Open live case workspace</Link>
	                {sourceFolder ? (
	                  <a className="secondary-button" href={sourceFolder.url} target="_blank" rel="noreferrer">Open source folder</a>
	                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead">
            <p className="eyebrow">Lead Precedent</p>
            <h2>{group.bestCandidate.title}</h2>
            <p>
              Turicum LLC currently recommends this paper for <strong>{group.documentLabel}</strong> because it is the strongest available blend of execution history, recording history, and precedent density for this state and structure.
            </p>
            <div className="dashboard-band">
              <div className="band-card">
                <p className="eyebrow">Score</p>
                <strong>{group.bestCandidate.candidateScore}</strong>
                <p className="helper">lead ranking signal</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Executed</p>
                <strong>{group.executedCount}</strong>
                <p className="helper">historical closes</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Recorded</p>
                <strong>{group.recordedCount}</strong>
                <p className="helper">public filings</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Readable</p>
                <strong>{group.readableCount}</strong>
                <p className="helper">ready for clause review</p>
              </div>
            </div>
            <div className="subpanel">
              <div className="stack-sm">
                <p className="eyebrow">Why it leads</p>
                <p className="helper">
                  Use this paper when you want the strongest available operational starting point for this family.
                  If the deal facts differ materially from the source case, use one of the alternatives below as the comparison set.
                </p>
              </div>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">State-Pack Readiness</p>
            <h2>What still blocks a production-ready paper stack</h2>
            {relatedCoverage ? (
              <>
                <div className="pill-row">
                  <div className="pill"><strong>Coverage:</strong> {relatedCoverage.coveredRequiredCount}/{relatedCoverage.requiredDocumentCount}</div>
                  <div className="pill"><strong>Missing families:</strong> {relatedCoverage.missingRequiredCount}</div>
                </div>
                {relatedCoverage.missing.length > 0 ? (
                  <ul className="list" style={{ marginTop: 16 }}>
                    {relatedCoverage.missing.map((item) => (
                      <li key={item.documentType}>{item.documentLabel}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="helper" style={{ marginTop: 16 }}>
                    This state pack currently has full required-family coverage for {group.structureType}.
                  </p>
                )}
              </>
            ) : (
              <p className="helper">No matching state-pack coverage row was found.</p>
            )}
          </div>
        </section>

        <section className="panel lead">
          <div className="section-head">
            <div>
              <p className="eyebrow">Use On A Case</p>
              <h2>Push this recommendation into lender workflow</h2>
            </div>
          </div>
          <p>
            These links prefill the intake/signature workspace with the selected precedent so we can test the legal handoff in the borrower-lender flow before deeper Google document automation is wired in.
          </p>
          <div className="status-grid">
            <article className="status-card">
              <p className="eyebrow">Recommended handoff</p>
              <strong>Greenwood demo case</strong>
              <p className="helper">Use the seeded borrower-lender walkthrough to validate the template, intake flow, and signature prep together.</p>
              <form action={applyTemplateToCase} className="form-actions">
                <input type="hidden" name="caseId" value={DEMO_CASE_ID} />
                <button type="submit" className="secondary-button">Use on Greenwood demo case</button>
              </form>
            </article>
            {suggestedCases.map((caseItem) => (
              <article key={caseItem.id} className="status-card">
                <p className="eyebrow">Live case</p>
                <strong>{caseItem.code}</strong>
                <p className="helper">{caseItem.title}</p>
                <form action={applyTemplateToCase} className="form-actions">
                  <input type="hidden" name="caseId" value={caseItem.id} />
                  <button type="submit" className="secondary-button">Use on {caseItem.code}</button>
                </form>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Comparison Set</p>
              <h2>Lead paper and backup precedents</h2>
            </div>
            <p className="page-note helper">
              Use the lead paper for speed. Use the backup set when you need to compare entity structure, collateral language, or closing mechanics before AI or legal review.
            </p>
          </div>
          <div className="status-grid">
            {matchedPrecedents.length === 0 ? (
              <article className="status-card">
                <strong>No precedents matched this legal family.</strong>
                <p className="helper">Go back to the selector and widen the filter set.</p>
              </article>
            ) : matchedPrecedents.map((item) => (
              <article key={item.id} className="status-card">
                <p className="eyebrow">{item.id === group.bestCandidate.id ? "Current recommendation" : "Alternative precedent"}</p>
                <strong>{item.title}</strong>
                <p className="helper">{item.caseName}</p>
                <div className="kicker-row">
                  {item.isExecuted ? <span className="tag">executed</span> : <span className="tag">draft</span>}
                  {item.isRecorded ? <span className="tag">recorded</span> : null}
                  {item.sourceCaseCode ? <span className="tag">{item.sourceCaseCode}</span> : null}
                </div>
                <p className="helper">{item.relativePath || item.fileName}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
