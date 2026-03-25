import Link from "next/link";
import { TuricumWordmark } from "@/components/atlas/turicum-wordmark";
import { withBasePath } from "@/lib/atlas/runtime";

const audienceLanes = [
  {
    eyebrow: "For borrowers",
    title: "Move faster on purchase, bridge, and refinance loans.",
    description:
      "A direct borrower path for property owners who want a quick fit decision and a cleaner route from first call to closing.",
    bullets: [
      "Close in one week on the right file",
      "No credit check before the first call",
      "Direct lender conversation"
    ],
    primaryLabel: "Review borrower process",
    primaryHref: "/portal"
  },
  {
    eyebrow: "For investors",
    title: "Access promoted first-lien asset-based real estate debt.",
    description:
      "A dedicated capital-partner lane with promoted opportunities, first-lien visibility, and disciplined servicing updates after promotion.",
    bullets: [
      "10% return structure",
      "First-lien collateral focus",
      "Monthly servicing visibility"
    ],
    primaryLabel: "Review investor path",
    primaryHref: "/investors",
    secondaryLabel: "Investor materials",
    secondaryHref: "/investor-handoff"
  }
];

const whyTuricum = [
  {
    title: "Speed",
    description: "The public borrower path is designed to give the right file a fast answer before the secure packet opens."
  },
  {
    title: "Clarity",
    description: "Borrowers get a direct path, and investors see a curated lane instead of a cluttered deal marketplace."
  },
  {
    title: "Structure",
    description: "The investor story stays grounded in first-lien collateral, defined structure, and disciplined downside protection."
  },
  {
    title: "Visibility",
    description: "Promoted matters, servicing updates, and resolution visibility stay clear for capital partners after funding."
  }
];

const publicSequence = [
  {
    label: "1",
    title: "Borrowers review fit and request a call",
    description: "The public path explains the fit, the process, and the facts Turicum needs before secure intake opens."
  },
  {
    label: "2",
    title: "Turicum structures, underwrites, and closes",
    description: "Selected files move through validation, paper, diligence, execution, and funding behind the scenes."
  },
  {
    label: "3",
    title: "Investors access the promoted lane",
    description: "Capital partners receive the promoted matter, servicing visibility, and resolution updates through the investor-facing path."
  }
];

const landingHeroArt = "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80";

export function TuricumPortalOverview() {
  return (
    <main>
      <div className="shell turicum-root-shell turicum-public-shell">
        <section className="hero turicum-classic-hero turicum-marketing-shell">
          <div className="turicum-classic-nav">
            <div className="turicum-classic-brand">
              <TuricumWordmark />
              <span className="turicum-brand-descriptor">Asset-Based Lending</span>
            </div>
            <div className="turicum-classic-links">
              <Link href={withBasePath("/portal")}>Borrowers</Link>
              <Link href={withBasePath("/investors")}>Investors</Link>
              <a href="#how-it-works">How it works</a>
              <Link href={withBasePath("/team-login")}>Team sign-in</Link>
            </div>
          </div>

          <div className="hero-grid turicum-public-hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Turicum Asset-Based Lending</p>
              <div className="hero-brand-lockup">
                <TuricumWordmark />
              </div>
              <h1>Asset-based real estate lending for borrowers who need speed and capital partners who want first-lien clarity.</h1>
              <p className="turicum-marketing-lede">
                Purchase, bridge, and refinance loans on a direct borrower path, with a separate investor lane built around first-lien security and disciplined visibility after promotion.
              </p>
              <div className="form-actions turicum-inline-actions">
                <Link className="secondary-button turicum-primary-button" href={withBasePath("/portal")}>
                  For Borrowers
                </Link>
                <Link className="secondary-button" href={withBasePath("/investors")}>
                  For Investors
                </Link>
              </div>
              <div className="kicker-row">
                <span className="tag">asset-based real estate</span>
                <span className="tag">borrower path in one read</span>
                <span className="tag">first-lien investor lane</span>
              </div>
            </div>

            <div className="turicum-public-aside">
              <div
                className="turicum-aside-art"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(10, 14, 22, 0.08), rgba(10, 14, 22, 0.58)), url(${landingHeroArt})`
                }}
                aria-hidden="true"
              />
              <div className="panel subtle turicum-aside-panel">
                <p className="eyebrow">Quick read</p>
                <p className="helper">Two lanes, one disciplined structure.</p>
                <div className="dashboard-band">
                  <div className="band-card">
                    <span className="eyebrow">Borrowers</span>
                    <strong>Fast fit decision</strong>
                  </div>
                  <div className="band-card">
                    <span className="eyebrow">Investors</span>
                    <strong>Promoted opportunities</strong>
                  </div>
                  <div className="band-card">
                    <span className="eyebrow">Security</span>
                    <strong>First-lien focus</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="two-up turicum-role-grid">
          {audienceLanes.map((lane) => (
            <article key={lane.title} className="panel turicum-role-card">
              <div className="stack-sm">
                <p className="eyebrow">{lane.eyebrow}</p>
                <h2>{lane.title}</h2>
                <p className="helper">{lane.description}</p>
              </div>
              <div className="kicker-row turicum-lane-tags">
                {lane.bullets.map((bullet) => (
                  <span key={bullet} className="tag">{bullet}</span>
                ))}
              </div>
              <div className="form-actions turicum-inline-actions">
                <Link className="secondary-button turicum-primary-button" href={withBasePath(lane.primaryHref)}>
                  {lane.primaryLabel}
                </Link>
                {lane.secondaryLabel && lane.secondaryHref ? (
                  <Link className="secondary-button" href={withBasePath(lane.secondaryHref)}>
                    {lane.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="two-up turicum-support-grid">
          <section className="panel turicum-proof-panel turicum-why-panel">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Why Turicum</p>
                <h2>Built for fast borrower closings and disciplined investor security.</h2>
              </div>
            </div>
            <div className="status-grid turicum-compact-status-grid turicum-four-up-grid">
              {whyTuricum.map((item) => (
                <article key={item.title} className="status-card turicum-public-card turicum-nested-card">
                  <strong>{item.title}</strong>
                  <p className="helper">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="how-it-works" className="panel turicum-sequence-panel turicum-process-strip">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">How it works</p>
                <h2>A simple path from first call to closing for borrowers and a curated lane for investors.</h2>
              </div>
            </div>
            <div className="turicum-steps-grid turicum-steps-grid-stack">
              {publicSequence.map((step) => (
                <div key={step.label} className="metric turicum-step-card">
                  <div className="turicum-step-number">{step.label}</div>
                  <h3>{step.title}</h3>
                  <p className="helper">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <div className="turicum-home-footer">
          <p className="helper">Borrowers can review the fit and request a first call. Investors can review the lane and then enter the secure portal.</p>
          <p className="helper turicum-team-note">Team sign-in for the protected staff layer is available <Link href={withBasePath("/team-login")}>here</Link>.</p>
        </div>
      </div>
    </main>
  );
}
