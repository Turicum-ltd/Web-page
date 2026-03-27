import Link from "next/link";
import { TuricumNav } from "@/components/turicum/nav";
import { getLatestLegalCorpusAnalysis } from "@/lib/turicum/legal-analysis";
import { withBasePath } from "@/lib/turicum/runtime";
import { listPrecedents, summarizePrecedents } from "@/lib/turicum/precedents";

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  const items = listPrecedents();
  const summary = summarizePrecedents();
  const legalAnalysis = getLatestLegalCorpusAnalysis();
  const urgentCoverageGaps = legalAnalysis
    ? legalAnalysis.coverage
        .filter((row) => row.missingRequiredCount > 0)
        .sort((a, b) => b.missingRequiredCount - a.missingRequiredCount || a.state.localeCompare(b.state))
        .slice(0, 5)
    : [];

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Precedent Library</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Turn past closings into a confident drafting starting point.</h1>
              <p>
                Turicum LLC treats extracted legal files as an operating corpus. Instead of digging through
                folders, we can see where the precedent stack is strong, where state packs are thin,
                and which paper should lead the next draft.
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Corpus</p>
                  <strong>{summary.total}</strong>
                  <p className="helper">indexed files</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">States</p>
                  <strong>{summary.states}</strong>
                  <p className="helper">active precedent sets</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Executed</p>
                  <strong>{summary.executed}</strong>
                  <p className="helper">strongest reference layer</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Recorded</p>
                  <strong>{summary.recorded}</strong>
                  <p className="helper">publicly finalized files</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {legalAnalysis ? (
          <>
            <section className="panel lead">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Operating View</p>
                  <h2>See coverage, weak spots, and the best starting paper</h2>
                </div>
                <span className={`badge ${legalAnalysis.corpusMode === "full-corpus" ? "production" : "provisional"}`}>
                  {legalAnalysis.corpusMode}
                </span>
              </div>
              <p>
                Turicum LLC turns the legal corpus analysis into a drafting control surface. It shows which
                required families are covered, where the state packs break down, and which precedent
                currently deserves to lead the next deal file.
              </p>
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Total precedents</p>
                  <strong>{legalAnalysis.summary.totalPrecedents}</strong>
                  <p className="helper">in the working corpus</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Executed</p>
                  <strong>{legalAnalysis.summary.executedPrecedents}</strong>
                  <p className="helper">usable starting templates</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Readable</p>
                  <strong>{legalAnalysis.summary.readablePrecedents}</strong>
                  <p className="helper">ready for clause review</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Reference docs</p>
                  <strong>{legalAnalysis.summary.referenceDocCount}</strong>
                  <p className="helper">external comparison sources</p>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <Link className="secondary-button" href={withBasePath("/library/templates")}>
                  Open template selector
                </Link>
                {legalAnalysis.sourceFolders.length > 0 ? legalAnalysis.sourceFolders.map((folder) => (
                  <a key={folder.url} className="secondary-button" href={folder.url} target="_blank" rel="noreferrer">
                    Open source folder
                  </a>
                )) : null}
              </div>
            </section>

            {urgentCoverageGaps.length > 0 ? (
              <section className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Drafting Gaps</p>
                    <h2>State packs that need attention first</h2>
                  </div>
                </div>
                <div className="status-grid">
                  {urgentCoverageGaps.map((row) => (
                    <article key={`${row.state}-${row.structureType}`} className="status-card">
                      <p className="eyebrow">{row.state} {row.structureType}</p>
                      <strong>{row.missingRequiredCount} required families missing</strong>
                      <p className="helper">
                        {row.missing.map((item) => item.documentLabel).join(", ")}
                      </p>
                      <div className="form-actions">
                        <Link
                          className="secondary-button"
                          href={withBasePath(`/library/templates?state=${row.state}&structure=${row.structureType}`)}
                        >
                          Review this state pack
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="two-up">
              <div className="panel subtle">
                <p className="eyebrow">Coverage Snapshot</p>
                <h2>Where the state packs are ready</h2>
                <div className="status-grid">
                  {legalAnalysis.coverage.slice(0, 8).map((row) => (
                    <article key={`${row.state}-${row.structureType}`} className="status-card">
                      <p className="eyebrow">{row.state} {row.structureType}</p>
                      <strong>{row.coveredRequiredCount}/{row.requiredDocumentCount} families covered</strong>
                      <p className="helper">
                        {row.missingRequiredCount === 0
                          ? "No required-family gaps flagged."
                          : `Still missing ${row.missingRequiredCount}: ${row.missing.map((item) => item.documentLabel).join(", ")}`}
                      </p>
                      <div className="form-actions">
                        <Link
                          className="secondary-button"
                          href={withBasePath(`/library/templates?state=${row.state}&structure=${row.structureType}`)}
                        >
                          Open template view
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="panel subtle">
                <p className="eyebrow">Lead Recommendations</p>
                <h2>Best current starting paper by group</h2>
                <div className="status-grid">
                  {legalAnalysis.groups.slice(0, 8).map((group) => (
                    <article key={group.key} className="status-card">
                      <p className="eyebrow">{group.state} {group.structureType}</p>
                      <strong>{group.documentLabel}</strong>
                      <p className="helper">{group.bestCandidate.title}</p>
                      <div className="kicker-row">
                        <span className="tag">score {group.bestCandidate.candidateScore}</span>
                        {group.bestCandidate.isExecuted ? <span className="tag">executed</span> : null}
                        {group.bestCandidate.isRecorded ? <span className="tag">recorded</span> : null}
                        {group.bestCandidate.hasText ? <span className="tag">readable</span> : null}
                      </div>
                      <div className="form-actions">
                        <Link
                          className="secondary-button"
                          href={withBasePath(`/library/templates/${encodeURIComponent(group.key)}`)}
                        >
                          Review template
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Corpus Register</p>
              <h2>Full legal file inventory</h2>
            </div>
            <p className="page-note helper">
              Keep the full register here for verification and backtracking. The recommendation views above
              should be the working surface for drafting decisions.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>State</th>
                  <th>Structure</th>
                  <th>Document Type</th>
                  <th>Kind</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <br />
                      <span className="muted">{item.caseName}</span>
                    </td>
                    <td>{item.state}</td>
                    <td>{item.structureType}</td>
                    <td>{item.documentType}</td>
                    <td>{item.templateKind}</td>
                    <td>
                      {item.isExecuted ? "executed" : "draft"}
                      {item.isRecorded ? " / recorded" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
