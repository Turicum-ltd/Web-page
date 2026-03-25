import Link from "next/link";
import { AtlasNav } from "@/components/atlas/nav";
import { getLatestLegalCorpusAnalysis } from "@/lib/atlas/legal-analysis";
import { withBasePath } from "@/lib/atlas/runtime";

export const dynamic = "force-dynamic";

function normalizeFilter(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "all";
  }

  return value ?? "all";
}

function buildFilterHref(filters: Record<string, string>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return withBasePath(`/library/templates${query ? `?${query}` : ""}`);
}

function buildDetailHref(groupKey: string) {
  return withBasePath(`/library/templates/${encodeURIComponent(groupKey)}`);
}

function activeButtonClass(active: boolean) {
  return active ? "secondary-button is-active" : "secondary-button";
}

export default async function TemplateSelectionPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const analysis = getLatestLegalCorpusAnalysis();
  const filters = (await searchParams) ?? {};

  if (!analysis) {
    return (
      <main>
        <div className="shell">
          <section className="hero">
            <p className="eyebrow">Template Selection</p>
            <div className="hero-grid">
              <div className="panel" style={{ padding: 0, border: "none", boxShadow: "none", background: "transparent" }}>
                <h1>No legal corpus analysis yet.</h1>
                <p>Run the OpenClaw legal corpus tool first so Turicum LLC can recommend templates by state and structure.</p>
              </div>
              <div className="panel">
                <AtlasNav />
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath("/library")}>Back to library</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const state = normalizeFilter(filters.state);
  const structure = normalizeFilter(filters.structure);
  const documentType = normalizeFilter(filters.documentType);
  const groupKey = normalizeFilter(filters.group);

  const stateOptions = Array.from(new Set(analysis.groups.map((group) => group.state))).sort();
  const structureOptions = Array.from(new Set(analysis.groups.map((group) => group.structureType))).sort();
  const documentTypeOptions = Array.from(new Set(analysis.groups.map((group) => group.documentType))).sort();

  const filteredGroups = analysis.groups.filter((group) => {
    if (state !== "all" && group.state !== state) return false;
    if (structure !== "all" && group.structureType !== structure) return false;
    if (documentType !== "all" && group.documentType !== documentType) return false;
    return true;
  });

  const filteredCoverage = analysis.coverage.filter((row) => {
    if (state !== "all" && row.state !== state) return false;
    if (structure !== "all" && row.structureType !== structure) return false;
    return true;
  });

  const currentFilters = { state, structure, documentType, group: groupKey };
  const selectedGroup = filteredGroups.find((group) => group.key === groupKey) ?? filteredGroups[0] ?? null;
  const selectedCoverage = selectedGroup
    ? analysis.coverage.find((row) => row.state === selectedGroup.state && row.structureType === selectedGroup.structureType) ?? null
    : null;
  const readyCoverageCount = filteredCoverage.filter((row) => row.missingRequiredCount === 0).length;
  const missingFamilies = filteredCoverage.reduce((sum, row) => sum + row.missingRequiredCount, 0);

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Template Selection</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Template selection.</h1>
              <p>
                Jurisdiction, structure, document family.
              </p>
            </div>
            <div className="hero-aside">
              <AtlasNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Mode</p>
                  <strong>{analysis.corpusMode}</strong>
                  <p className="helper">analysis source</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Precedents</p>
                  <strong>{analysis.summary.totalPrecedents}</strong>
                  <p className="helper">eligible files</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Executed</p>
                  <strong>{analysis.summary.executedPrecedents}</strong>
                  <p className="helper">preferred starting set</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Readable</p>
                  <strong>{analysis.summary.readablePrecedents}</strong>
                  <p className="helper">ready for deeper review</p>
                </div>
              </div>
              <div className="form-actions">
                <Link className="secondary-button" href={withBasePath("/library")}>Open precedent library</Link>
                {analysis.sourceFolders[0] ? (
                  <a className="secondary-button" href={analysis.sourceFolders[0].url} target="_blank" rel="noreferrer">Open source folder</a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="panel lead">
          <div className="section-head">
            <div>
              <p className="eyebrow">Selection Controls</p>
              <h2>Narrow the recommendation set before you draft</h2>
            </div>
          </div>
          <div className="dashboard-band" style={{ marginBottom: 16 }}>
            <div className="band-card">
              <p className="eyebrow">Matching groups</p>
              <strong>{filteredGroups.length}</strong>
              <p className="helper">recommendation candidates</p>
            </div>
            <div className="band-card">
              <p className="eyebrow">Ready packs</p>
              <strong>{readyCoverageCount}</strong>
              <p className="helper">without required-family gaps</p>
            </div>
            <div className="band-card">
              <p className="eyebrow">Missing families</p>
              <strong>{missingFamilies}</strong>
              <p className="helper">still blocking production use</p>
            </div>
          </div>
          <div className="pill-row">
            <div>
              <p className="eyebrow">State</p>
              <div className="pill-row" style={{ marginTop: 10 }}>
                <Link className={activeButtonClass(state === "all")} href={buildFilterHref({ ...currentFilters, state: "all" })}>All states</Link>
                {stateOptions.map((value) => (
                  <Link key={value} className={activeButtonClass(state === value)} href={buildFilterHref({ ...currentFilters, state: value })}>{value}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow">Structure</p>
              <div className="pill-row" style={{ marginTop: 10 }}>
                <Link className={activeButtonClass(structure === "all")} href={buildFilterHref({ ...currentFilters, structure: "all" })}>All structures</Link>
                {structureOptions.map((value) => (
                  <Link key={value} className={activeButtonClass(structure === value)} href={buildFilterHref({ ...currentFilters, structure: value })}>{value}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow">Document family</p>
              <div className="pill-row" style={{ marginTop: 10 }}>
                <Link className={activeButtonClass(documentType === "all")} href={buildFilterHref({ ...currentFilters, documentType: "all" })}>All documents</Link>
                {documentTypeOptions.slice(0, 12).map((value) => (
                  <Link key={value} className={activeButtonClass(documentType === value)} href={buildFilterHref({ ...currentFilters, documentType: value })}>{value}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {selectedGroup ? (
          <section className="two-up">
            <div className="panel lead">
              <p className="eyebrow">Current Recommendation</p>
              <h2>{selectedGroup.state} {selectedGroup.structureType} · {selectedGroup.documentLabel}</h2>
              <p>
                <strong>{selectedGroup.bestCandidate.title}</strong> is the current lead.
              </p>
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Score</p>
                  <strong>{selectedGroup.bestCandidate.candidateScore}</strong>
                  <p className="helper">current lead ranking</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Precedents</p>
                  <strong>{selectedGroup.precedentCount}</strong>
                  <p className="helper">in this group</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Executed</p>
                  <strong>{selectedGroup.executedCount}</strong>
                  <p className="helper">historical closes</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Readable</p>
                  <strong>{selectedGroup.readableCount}</strong>
                  <p className="helper">ready for clause checks</p>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <Link className="secondary-button" href={buildFilterHref({ ...currentFilters, group: "all" })}>Clear selection</Link>
                {analysis.sourceFolders[0] ? (
                  <a className="secondary-button" href={analysis.sourceFolders[0].url} target="_blank" rel="noreferrer">Open source folder</a>
                ) : null}
              </div>
            </div>

            <div className="panel">
              <p className="eyebrow">Drafting Checklist</p>
              <h2>Review checks</h2>
              <ul className="list">
                <li>Match lender, borrower, and collateral structure.</li>
                <li>Confirm the state pack is complete.</li>
                <li>Check alternatives if the lead precedent is thin.</li>
                <li>Run clause comparison before finalizing paper.</li>
              </ul>
              {selectedCoverage ? (
                <div className="pill-row" style={{ marginTop: 16 }}>
                  <div className="pill"><strong>Coverage:</strong> {selectedCoverage.coveredRequiredCount}/{selectedCoverage.requiredDocumentCount}</div>
                  <div className="pill"><strong>Missing:</strong> {selectedCoverage.missingRequiredCount}</div>
                </div>
              ) : null}
              {selectedCoverage?.missing?.length ? (
                <p className="muted" style={{ marginTop: 12 }}>
                  Missing required families for this state pack: {selectedCoverage.missing.map((item) => item.documentLabel).join(", ")}
                </p>
              ) : (
                <p className="muted" style={{ marginTop: 12 }}>
                  Full required-family coverage for this structure.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <section className="two-up">
          <div className="panel subtle">
            <p className="eyebrow">Coverage Snapshot</p>
            <h2>State-pack readiness for this filter set</h2>
            <div className="status-grid">
              {filteredCoverage.length === 0 ? (
                <article className="status-card">
                  <strong>No coverage rows match the current filters.</strong>
                  <p className="helper">Change the state or structure filters to reopen the recommendation set.</p>
                </article>
              ) : filteredCoverage.map((row) => (
                <article key={`${row.state}-${row.structureType}`} className="status-card">
                  <p className="eyebrow">{row.state} {row.structureType}</p>
                  <strong>{row.coveredRequiredCount}/{row.requiredDocumentCount} families covered</strong>
                  <p className="helper">
                    {row.missingRequiredCount === 0
                      ? "No required-family gaps flagged."
                      : `Missing ${row.missingRequiredCount}: ${row.missing.map((item) => item.documentLabel).join(", ")}`}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="panel subtle">
            <p className="eyebrow">How to use this</p>
            <h2>Drafting workflow</h2>
            <ul className="list">
              <li>Pick the state and structure first, because those drive the state pack and required paper stack.</li>
              <li>Start from the highest-ranked executed precedent when one exists.</li>
              <li>If a required family is missing, treat that as a drafting gap before treating the state pack as production-ready.</li>
              <li>Once the synced markdown corpus is mounted here, this view can move from precedent metadata to clause-level comparison.</li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Recommendation Set</p>
              <h2>Review the active template candidates</h2>
            </div>
            <p className="page-note helper">
              Use the detail page when you’re ready to push a precedent into a case or compare the alternatives more closely.
            </p>
          </div>
          <div className="status-grid">
            {filteredGroups.length === 0 ? (
              <article className="status-card">
                <strong>No template groups match the current filters.</strong>
                <p className="helper">Clear one or more filters to reopen the recommendation set.</p>
              </article>
            ) : filteredGroups.map((group) => (
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
                <p className="helper">
                  {group.alternatives.length === 0
                    ? "No alternatives currently ranked behind the lead precedent."
                    : `Alternatives: ${group.alternatives.slice(0, 3).map((item) => item.title).join(", ")}`}
                </p>
                <div className="form-actions">
                  <Link className="secondary-button" href={buildDetailHref(group.key)}>
                    Review template
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
