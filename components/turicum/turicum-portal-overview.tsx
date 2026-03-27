import Link from "next/link";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { withBasePath } from "@/lib/turicum/runtime";

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

const landingHeroArt = "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1800&q=80";

export function TuricumPortalOverview() {
  return (
    <main>
      <div className="shell turicum-root-shell turicum-public-shell">
        <section className="turicum-landing-hero">
          <div className="turicum-page-rail">
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

            <div className="turicum-landing-hero-grid">
              <div className="turicum-landing-copy">
                <p className="eyebrow">Turicum Asset-Based Lending</p>
                <h1>Asset-based real estate lending for fast-moving borrowers and first-lien-focused investors.</h1>
                <p className="turicum-marketing-lede">
                  Purchase, bridge, and refinance loans move through a direct borrower path. Investors enter a separate lane built around first-lien structure, promoted opportunities, and disciplined servicing visibility.
                </p>
                <div className="form-actions turicum-inline-actions">
                  <Link className="secondary-button turicum-primary-button" href={withBasePath("/portal")}>
                    For Borrowers
                  </Link>
                  <Link className="secondary-button" href={withBasePath("/investors")}>
                    For Investors
                  </Link>
                </div>
                <div className="turicum-hero-facts" aria-label="Turicum highlights">
                  <span>Purchase, bridge, refinance</span>
                  <span>Direct borrower review</span>
                  <span>First-lien investor lane</span>
                </div>
              </div>

              <div className="turicum-landing-visual">
              <div
                className="turicum-landing-image"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(8, 12, 18, 0.06), rgba(8, 12, 18, 0.44)), url(${landingHeroArt})`,
                  backgroundPosition: "58% center"
                }}
                aria-hidden="true"
              />
            </div>
          </div>
          </div>
        </section>

        <div className="turicum-page-rail turicum-page-flow">
          <section className="turicum-lane-intro">
            <p className="eyebrow">Two lanes</p>
            <p>
              Borrowers start with fit, speed, and a direct call. Investors review a cleaner promoted lane built around first-lien structure and servicing visibility.
            </p>
          </section>

          <section className="turicum-lanes">
            {audienceLanes.map((lane) => (
              <article key={lane.title} className="turicum-lane">
                <div className="stack-sm">
                  <p className="eyebrow">{lane.eyebrow}</p>
                  <h2>{lane.title}</h2>
                  <p className="helper">{lane.description}</p>
                </div>
                <ul className="turicum-lane-list">
                  {lane.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
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

          <section className="turicum-foundation-grid">
            <section className="turicum-foundation-block">
              <p className="eyebrow">Why Turicum</p>
              <h2>Built to keep the public story clean and the underwriting story disciplined.</h2>
              <div className="turicum-foundation-list">
                {whyTuricum.map((item) => (
                  <article key={item.title} className="turicum-foundation-item">
                    <strong>{item.title}</strong>
                    <p className="helper">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="how-it-works" className="turicum-foundation-block">
              <p className="eyebrow">How it works</p>
              <h2>A simple path from first call to closing, with a separate promoted lane for investors.</h2>
              <div className="turicum-sequence-list">
                {publicSequence.map((step) => (
                  <div key={step.label} className="turicum-sequence-item">
                    <div className="turicum-step-number">{step.label}</div>
                    <div>
                      <h3>{step.title}</h3>
                      <p className="helper">{step.description}</p>
                    </div>
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
      </div>
    </main>
  );
}
