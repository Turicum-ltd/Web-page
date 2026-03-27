import Link from "next/link";
import { TuricumNav } from "@/components/turicum/nav";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { isSupabaseConfigured, listCases } from "@/lib/turicum/cases";
import { pipelineCards } from "@/lib/turicum/sample-data";
import { getStatePacks, summarizePack } from "@/lib/turicum/state-packs";
import { listBorrowerIntroCallRequests } from "@/lib/turicum/borrower-intro-requests";
import { getCaseDealProfile } from "@/lib/turicum/deal-intake";
import { getBorrowerPortalByCaseId, getExecutionReadiness } from "@/lib/turicum/intake";
import { withBasePath } from "@/lib/turicum/runtime";
import type { CaseRecord } from "@/lib/turicum/types";

function describeCaseBlocker(caseItem: CaseRecord) {
  if (caseItem.stage === "packet_build" || caseItem.status === "packet_in_progress") {
    return {
      label: "Borrower packet still open",
      detail: "Forms and supporting documents still need to be completed before promotion can finish.",
      tone: "warning"
    } as const;
  }

  if (caseItem.stage === "legal_review" || caseItem.status === "legal_review") {
    return {
      label: "Legal review still open",
      detail: "Document review is still active, so execution cannot move forward yet.",
      tone: "danger"
    } as const;
  }

  if (caseItem.stage === "due_diligence" || caseItem.status === "due_diligence_open") {
    return {
      label: "Closing diligence still open",
      detail:
        "Title, insurance, and tax still need to clear before the file can move into execution and funding.",
      tone: "warning"
    } as const;
  }

  if (caseItem.stage === "lead_intake" || caseItem.status === "lead") {
    return {
      label: "First-call intake still open",
      detail:
        "Requested amount, asset details, title hold, timing, and ownership position still need to be locked.",
      tone: "warning"
    } as const;
  }

  return {
    label: "Case still in motion",
    detail: "This file is still progressing through the Turicum operating workflow.",
    tone: "info"
  } as const;
}

function countCasesByBucket(cases: CaseRecord[]) {
  return {
    borrower: cases.filter(
      (caseItem) =>
        caseItem.stage === "lead_intake" ||
        caseItem.stage === "packet_build" ||
        caseItem.status === "packet_in_progress"
    ).length,
    legal: cases.filter(
      (caseItem) =>
        caseItem.stage === "legal_review" ||
        caseItem.stage === "due_diligence" ||
        caseItem.status === "legal_review" ||
        caseItem.status === "due_diligence_open"
    ).length,
    execution: cases.filter(
      (caseItem) =>
        caseItem.stage === "signing" ||
        caseItem.stage === "closing" ||
        caseItem.stage === "servicing" ||
        caseItem.stage === "closed"
    ).length
  };
}

const teamLanes = [
  {
    eyebrow: "Today",
    title: "Start with the live blocker queue",
    description:
      "Borrower packet gaps, legal review, and diligence are the fastest reads on what needs action before funding can move."
  },
  {
    eyebrow: "Operations",
    title: "Use cases, flows, and templates together",
    description:
      "Cases show file-specific work. Flows show the operating design. Templates and state packs show what paper and jurisdiction support exist."
  },
  {
    eyebrow: "Boundary",
    title: "Keep the public promise outside and the secret sauce inside",
    description:
      "Borrowers and investors stay in their public lanes while the team manages underwriting, paper, diligence, execution, and servicing here."
  }
];

const operatingRules = [
  "Investor promotion stays blocked until borrower forms, supporting documents, and validation are complete.",
  "AI review, legal review, and closing diligence are separate gates and all matter.",
  "Signature-required forms must be signed, and notary must be complete when required.",
  "Funding cannot advance to ready-to-fund or funded until execution is complete.",
  "Documents stay in Google Drive while workflow state moves toward Supabase-backed persistence."
];

const reviewSurfaces = [
  {
    eyebrow: "Public root",
    title: "Landing page",
    description: "Borrower and investor-facing marketing, entry logic, and team sign-in boundary.",
    href: "/",
    label: "Open landing page"
  },
  {
    eyebrow: "Borrower path",
    title: "Borrower portal",
    description: "First-call request flow, process explanation, and secure-intake boundary.",
    href: "/portal",
    label: "Open borrower portal"
  },
  {
    eyebrow: "Investor path",
    title: "Investor portal",
    description: "Secure investor access for promoted matters, servicing visibility, and resolution updates.",
    href: "/investors",
    label: "Open investor portal"
  },
  {
    eyebrow: "Workflow",
    title: "Process map",
    description: "Three-lane operating model for borrower, Turicum, and investor movement across the deal lifecycle.",
    href: "/flows",
    label: "Open process map"
  }
];

const deploymentNotes = [
  "The public root now stays external-facing while /review and /cases stay protected.",
  "Google Drive remains the source-of-truth document layer during transfer.",
  "Workflow state is ready for incremental Supabase migration without changing the public product model.",
  "Deployment artifacts for nginx, PM2, env setup, and cutover checks already exist in the repo."
];

export async function TuricumReviewOverview() {
  const statePacks = getStatePacks();
  const cases = await listCases();
  const introRequests = await listBorrowerIntroCallRequests();
  const summary = statePacks.map((statePack) => ({
    ...statePack,
    counts: summarizePack(statePack)
  }));
  const featuredCases = cases.slice(0, 4);
  const blockers = featuredCases.map((caseItem) => ({
    caseItem,
    ...describeCaseBlocker(caseItem)
  }));
  const blockerCounts = countCasesByBucket(cases);
  const queueMetrics = await Promise.all(
    cases.map(async (caseItem) => {
      const portal = await getBorrowerPortalByCaseId(caseItem.id);
      const dealProfile = await getCaseDealProfile(caseItem.id);
      if (!portal || !dealProfile) {
        return null;
      }

      const execution = getExecutionReadiness(portal, dealProfile.notaryRequirement);
      return {
        caseId: caseItem.id,
        signatureRequests: portal.signatureRequests.length,
        executionComplete: execution.executionComplete,
        notaryRequired: execution.notaryRequired,
        notaryComplete: execution.notaryComplete,
        signedForms: execution.signedForms.length,
        signatureRequiredForms: execution.signatureRequiredForms.length
      };
    })
  );

  const activeQueueMetrics = queueMetrics.filter((item): item is NonNullable<typeof item> => item !== null);
  const introNewCount = introRequests.filter((item) => item.status === "new").length;
  const introScheduledCount = introRequests.filter((item) => item.status === "scheduled").length;
  const pendingSignatureFiles = activeQueueMetrics.filter(
    (item) => item.signatureRequiredForms > 0 && !item.executionComplete
  ).length;
  const pendingSignatureRequests = activeQueueMetrics.reduce(
    (count, item) => count + item.signatureRequests,
    0
  );
  const notaryOutstandingCount = activeQueueMetrics.filter(
    (item) => item.notaryRequired && !item.notaryComplete
  ).length;

  return (
    <main>
      <div className="shell">
        <section className="hero turicum-review-hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Turicum Team Hub</p>
              <div className="hero-brand-lockup">
                <TuricumWordmark />
              </div>
              <h1>Run the borrower, investor, and operations stack from one protected staff surface.</h1>
              <p>
                `/review` is now the internal home for the Turicum team: live blockers, casework,
                workflow controls, state coverage, and deployment readiness in one place.
              </p>
              <div className="kicker-row">
                <span className="tag">public marketing outside</span>
                <span className="tag">workflow control inside</span>
                <span className="tag">execution before funding</span>
                <span className="tag">drive docs plus app state</span>
              </div>
              <div className="turicum-review-rail">
                <div className="turicum-review-stat">
                  <span>Open blockers</span>
                  <strong>{blockers.length}</strong>
                  <small>files needing action today</small>
                </div>
                <div className="turicum-review-stat">
                  <span>Borrower lane</span>
                  <strong>{blockerCounts.borrower}</strong>
                  <small>intake and packet files</small>
                </div>
                <div className="turicum-review-stat">
                  <span>Legal lane</span>
                  <strong>{blockerCounts.legal}</strong>
                  <small>review and diligence files</small>
                </div>
                <div className="turicum-review-stat">
                  <span>Execution lane</span>
                  <strong>{blockerCounts.execution}</strong>
                  <small>signing, closing, servicing</small>
                </div>
              </div>
              <div className="form-actions turicum-review-quick-actions">
                <Link className="secondary-button turicum-primary-button" href={withBasePath("/cases")}>
                  Open live cases
                </Link>
                <Link className="secondary-button" href={withBasePath("/flows")}>
                  Open process map
                </Link>
                <Link className="secondary-button" href={withBasePath("/library/templates")}>
                  Open templates
                </Link>
              </div>
            </div>
            <div className="hero-aside turicum-review-aside">
              <p className="eyebrow">Platform snapshot</p>
              <div className="dashboard-band">
                <div className="band-card turicum-review-band-card">
                  <p className="eyebrow">States</p>
                  <strong>{statePacks.length}</strong>
                  <p className="helper">active jurisdictions</p>
                </div>
                <div className="band-card turicum-review-band-card">
                  <p className="eyebrow">Live cases</p>
                  <strong>{cases.length}</strong>
                  <p className="helper">open matters</p>
                </div>
                <div className="band-card turicum-review-band-card">
                  <p className="eyebrow">State mode</p>
                  <strong>{isSupabaseConfigured() ? "Supabase" : "Local fallback"}</strong>
                  <p className="helper">workflow persistence</p>
                </div>
              </div>
              <TuricumNav />
            </div>
          </div>
        </section>

        <section className="panel turicum-review-panel turicum-team-queue-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Team queue</p>
              <h2>What is waiting in the staff lane right now</h2>
            </div>
            <p className="muted page-note">
              This pulls from live intro-call requests and case execution state so the team hub starts with actual operational pressure.
            </p>
          </div>
          <div className="status-grid turicum-team-queue-grid">
            <article className="status-card turicum-review-card turicum-team-queue-card">
              <p className="eyebrow">Borrower intake</p>
              <strong>{introNewCount} new intro-call request{introNewCount === 1 ? "" : "s"}</strong>
              <p className="helper">{introScheduledCount} already scheduled and waiting on the next conversation or packet launch.</p>
            </article>
            <article className="status-card turicum-review-card turicum-team-queue-card">
              <p className="eyebrow">Execution</p>
              <strong>{pendingSignatureFiles} file{pendingSignatureFiles === 1 ? "" : "s"} still missing signature completion</strong>
              <p className="helper">{pendingSignatureRequests} active signature request{pendingSignatureRequests === 1 ? "" : "s"} exist across the current case set.</p>
            </article>
            <article className="status-card turicum-review-card turicum-team-queue-card">
              <p className="eyebrow">Notary</p>
              <strong>{notaryOutstandingCount} file{notaryOutstandingCount === 1 ? "" : "s"} still need the notary path closed</strong>
              <p className="helper">Use the execution lane and funding gate together so notarized paper does not slip through as ready-to-fund too early.</p>
            </article>
          </div>
        </section>

        <section className="panel turicum-blocker-strip">
          <div className="section-head">
            <div>
              <p className="eyebrow">Current blockers</p>
              <h2>What still needs operator attention right now</h2>
            </div>
            <p className="muted page-note">
              These cards are derived from live case stage and status so the team can start the day from a real queue instead of a static project memo.
            </p>
          </div>
          <div className="status-grid">
            {blockers.length === 0 ? (
              <article className="turicum-blocker-card tone-info">
                <p className="eyebrow">No open blockers</p>
                <strong>Current files are clear.</strong>
                <p className="helper">If new matters open, they will show up here automatically based on live case state.</p>
              </article>
            ) : (
              blockers.map(({ caseItem, label, detail, tone }) => (
                <article key={caseItem.id} className={`turicum-blocker-card tone-${tone}`}>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">{caseItem.code}</p>
                      <strong>{label}</strong>
                    </div>
                    <span className={`badge ${tone === "danger" ? "draft" : "provisional"}`}>
                      {caseItem.stage.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="helper">{caseItem.title}</p>
                  <p>{detail}</p>
                  <div className="kicker-row">
                    <span className="tag">{caseItem.state}</span>
                    <span className="tag">{caseItem.structureType}</span>
                    <span className="tag">{caseItem.status.replaceAll("_", " ")}</span>
                  </div>
                  <div className="form-actions">
                    <Link className="secondary-button" href={withBasePath(`/cases/${caseItem.id}`)}>
                      Open case
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead turicum-review-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Team lanes</p>
                <h2>How to use this protected staff layer</h2>
              </div>
            </div>
            <div className="status-grid">
              {teamLanes.map((lane) => (
                <article key={lane.title} className="status-card turicum-review-card">
                  <p className="eyebrow">{lane.eyebrow}</p>
                  <strong>{lane.title}</strong>
                  <p className="helper">{lane.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="panel turicum-review-panel turicum-review-rule-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Operating rules</p>
                <h2>What must be true in the file</h2>
              </div>
            </div>
            <ul className="list turicum-review-list">
              {operatingRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel turicum-review-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Integrated lifecycle</p>
              <h2>One operating model from first call to exit</h2>
            </div>
            <p className="muted page-note">
              The public promise, protected execution, and investor follow-through now sit inside one coherent lifecycle.
            </p>
          </div>
          <div className="three-up">
            <div className="metric turicum-review-metric">
              <h3>1. Intake</h3>
              <p>Capture the first-call facts, requested amount, property details, title hold, equity position, and timing.</p>
            </div>
            <div className="metric turicum-review-metric">
              <h3>2. Packet</h3>
              <p>Assign forms, collect supporting documents, and make borrower readiness explicit rather than implied.</p>
            </div>
            <div className="metric turicum-review-metric">
              <h3>3. Validation</h3>
              <p>Clear borrower, property, screening placeholders, and internal underwriting before promotion opens.</p>
            </div>
            <div className="metric turicum-review-metric">
              <h3>4. Promotion</h3>
              <p>Package the validated matter, record take-up, and lock the final capital structure before paper is finalized.</p>
            </div>
            <div className="metric turicum-review-metric">
              <h3>5. Paper and diligence</h3>
              <p>Choose the paper, run AI review, clear legal, and separately clear title, insurance, and tax.</p>
            </div>
            <div className="metric turicum-review-metric">
              <h3>6. Funding to exit</h3>
              <p>Execute, notary when needed, fund, service the deal, update investors, and manage payoff or rollover.</p>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead turicum-review-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Review surfaces</p>
                <h2>Where the team can inspect the full system</h2>
              </div>
            </div>
            <div className="status-grid">
              {reviewSurfaces.map((surface) => (
                <article key={surface.title} className="status-card turicum-review-card">
                  <p className="eyebrow">{surface.eyebrow}</p>
                  <strong>{surface.title}</strong>
                  <p className="helper">{surface.description}</p>
                  <div className="form-actions">
                    <Link className="secondary-button" href={surface.href}>{surface.label}</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel turicum-review-panel turicum-review-rule-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">DigitalOcean readiness</p>
                <h2>What is already prepared</h2>
              </div>
            </div>
            <ul className="list turicum-review-list">
              {deploymentNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="two-up">
          <div className="panel turicum-review-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Featured matters</p>
                <h2>Current casework</h2>
              </div>
            </div>
            <div className="status-grid">
              {featuredCases.length === 0 ? (
                <article className="status-card turicum-review-card">
                  <strong>No seeded matters yet.</strong>
                  <p className="helper">Create a case to start intake, promotion, legal review, funding, servicing, and exit.</p>
                </article>
              ) : (
                featuredCases.map((caseItem) => (
                  <article key={caseItem.id} className="status-card turicum-review-card">
                    <p className="eyebrow">{caseItem.code}</p>
                    <strong>{caseItem.title}</strong>
                    <p className="helper">
                      {caseItem.state} · {caseItem.structureType} · {caseItem.status.replaceAll("_", " ")}
                    </p>
                    <div className="form-actions">
                      <Link className="secondary-button" href={withBasePath(`/cases/${caseItem.id}`)}>
                        Open case
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="panel turicum-review-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">State coverage</p>
                <h2>Jurisdiction readiness</h2>
              </div>
            </div>
            <div className="status-grid">
              {summary.map((statePack) => (
                <article key={statePack.state} className="status-card turicum-review-card">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">{statePack.state}</p>
                      <h3>{statePack.supported_structures.join(", ")}</h3>
                    </div>
                    <span className={`badge ${statePack.support_level}`}>{statePack.support_level}</span>
                  </div>
                  <div className="kicker-row">
                    <span className="tag">{statePack.counts.required} required docs</span>
                    <span className="tag">{statePack.counts.optional} optional docs</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead turicum-review-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Operating lanes</p>
                <h2>Core workflow cards</h2>
              </div>
            </div>
            <div className="three-up">
              {pipelineCards.map((card) => (
                <div key={card.title} className="metric turicum-review-metric">
                  <h3>{card.title}</h3>
                  <p>{card.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="callout turicum-review-callout">
            <p className="eyebrow">Team standard</p>
            <h2>Keep the public promise clean and the team workflow disciplined.</h2>
            <p>
              If borrowers and investors only see what they should see, and the team can run the full file from here,
              the DigitalOcean move becomes an infrastructure step rather than a product rewrite.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
