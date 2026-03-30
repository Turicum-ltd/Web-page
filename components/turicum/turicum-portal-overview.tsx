import Link from "next/link";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { withBasePath } from "@/lib/turicum/runtime";

function BorrowerLaneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20V9.5L12 4l8 5.5V20M8 20v-5.5h8V20M7.5 10.5h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InvestorLaneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 18.5h14M7.5 16V11.5M12 16V8.5M16.5 16V6.5M6.5 9.5l4-3 3 2 4-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const audienceLanes = [
  {
    eyebrow: "For borrowers",
    icon: BorrowerLaneIcon,
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
    icon: InvestorLaneIcon,
    title: "Review promoted first-lien real estate opportunities.",
    description:
      "A dedicated capital-partner lane for promoted opportunities, first-lien structure, and disciplined servicing updates after promotion.",
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
                <h1>Asset-based real estate lending for decisive borrowers and first-lien-focused investors.</h1>
                <p className="turicum-marketing-lede">
                  Purchase, bridge, and refinance loans move through a direct borrower path. Investors enter a separate lane built around promoted opportunities, first-lien structure, and disciplined servicing visibility.
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
                    backgroundImage: `linear-gradient(180deg, rgba(8, 12, 18, 0.08), rgba(8, 12, 18, 0.46)), url(${landingHeroArt})`,
                    backgroundPosition: "58% center"
                  }}
                  aria-hidden="true"
                />
                <div className="turicum-landing-caption">
                  <span className="eyebrow">Private-credit discipline</span>
                  <p>Fast borrower intake outside. Structured underwriting and protected investor visibility inside.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="turicum-page-rail turicum-page-flow">
          <section className="turicum-section-intro">
            <p className="eyebrow">Two clear lanes</p>
            <h2>One public borrower path. One investor lane. No marketplace clutter.</h2>
            <p>
              The public site should feel concise and high-trust: explain the fit, show the structure,
              and move the right person into the right lane.
            </p>
          </section>

          <section className="turicum-lanes-split">
            {audienceLanes.map((lane) => (
              <article key={lane.title} className="turicum-lane">
                <div className="turicum-lane-icon" aria-hidden="true">
                  <lane.icon />
                </div>
                <p className="eyebrow">{lane.eyebrow}</p>
                <h3>{lane.title}</h3>
                <p className="turicum-lane-copy">{lane.description}</p>
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

          <section id="how-it-works" className="turicum-process-section">
            <div className="turicum-section-intro compact">
              <p className="eyebrow">How it works</p>
              <h2>A simple path from first call to closing, with a separate promoted lane for investors.</h2>
            </div>
            <div className="turicum-process-steps">
              {publicSequence.map((step) => (
                <article key={step.label} className="turicum-process-step">
                  <span className="turicum-step-number">{step.label}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
            <p className="turicum-process-note">
              {whyTuricum[2]?.description}
            </p>
          </section>

          <section className="turicum-landing-cta">
            <p className="eyebrow">Start in the right lane</p>
            <h2>Choose the right lane from the start.</h2>
            <p>
              Borrowers start with fit and speed. Investors enter the promoted lane once a matter is
              ready for capital.
            </p>
            <div className="form-actions turicum-inline-actions">
              <Link className="secondary-button turicum-primary-button" href={withBasePath("/portal")}>
                Borrower path
              </Link>
              <Link className="secondary-button" href={withBasePath("/investors")}>
                Investor portal
              </Link>
            </div>
            <p className="helper turicum-team-note">
              Team sign-in for the protected staff layer is available <Link href={withBasePath("/team-login")}>here</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
