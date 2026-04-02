import Link from "next/link";
import { LiveOpportunitiesGallery } from "@/components/turicum/live-opportunities-gallery";
import { InvestorAccessGate } from "@/components/turicum/investor-access-gate";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { withBasePath } from "@/lib/turicum/runtime";

const investmentPrinciples = [
  {
    title: "Selection",
    description: "Only promoted opportunities reach the investor lane, keeping the experience measured and intentional."
  },
  {
    title: "Security",
    description: "First-lien structure and asset coverage remain central to how Turicum frames risk."
  },
  {
    title: "Reporting",
    description: "Servicing cadence and resolution posture stay visible so passive capital does not lose context."
  },
  {
    title: "Tone",
    description: "The public site should feel institutional, quiet, and disciplined rather than broad or transactional."
  }
];

const publicSequence = [
  {
    label: "1",
    title: "First-Lien Only",
    description: "We never sit in a second position. Your capital is always secured by the primary deed."
  },
  {
    label: "2",
    title: "Rigid Underwriting",
    description: "We focus on the asset basis, not just the sponsor. We lend at a significant discount to market value."
  },
  {
    label: "3",
    title: "Passive Simplicity",
    description: "You select the asset; we handle the servicing, legal, and monthly distributions."
  }
];

const landingHeroArt = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80";

export function TuricumPortalOverview() {
  return (
    <main>
      <div className="shell turicum-root-shell turicum-public-shell">
        <section className="turicum-landing-hero">
          <div className="turicum-page-rail">
            <div className="turicum-classic-nav">
              <div className="turicum-classic-brand">
                <TuricumWordmark />
              </div>
              <div className="turicum-classic-nav-links">
                <div className="turicum-classic-links">
                  <a href="#current-opportunities">Opportunities</a>
                  <Link href={withBasePath("/investor-handoff")}>Investor Materials</Link>
                  <a href="#investment-approach">Security Standard</a>
                </div>
              </div>
            </div>

            <div className="turicum-landing-hero-grid">
              <div className="turicum-landing-copy">
                <p className="eyebrow">Turicum Private Credit</p>
                <h1>Boutique Private Credit: High-Yield Capital Preservation.</h1>
                <p className="turicum-marketing-lede">First-lien, asset-based opportunities for risk-averse partners.</p>
                <div className="form-actions turicum-inline-actions">
                  <InvestorAccessGate
                    label="View Current Opportunities"
                    className="secondary-button turicum-primary-button"
                    triggerId="view-current-opportunities"
                  />
                  <Link className="secondary-button" href={withBasePath("/investor-handoff")}>
                    Inquire for Access
                  </Link>
                </div>
                <div className="turicum-hero-facts" aria-label="Turicum highlights">
                  <span>First-lien priority</span>
                  <span>Asset-backed discipline</span>
                  <span>Passive income orientation</span>
                </div>
              </div>

              <div className="turicum-landing-visual">
                <div
                  className="turicum-landing-image"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(8, 12, 18, 0.18), rgba(8, 12, 18, 0.62)), url(${landingHeroArt})`,
                    backgroundPosition: "56% center"
                  }}
                  aria-hidden="true"
                />
                <div className="turicum-landing-caption">
                  <span className="eyebrow">Institutional posture</span>
                  <p>Curated private-credit visibility for capital partners who value selectivity, collateral, and measured reporting.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="turicum-page-rail turicum-page-flow">
          <section className="turicum-section-intro">
            <p className="eyebrow">Capital Allocation</p>
            <h2>Active Asset Selection</h2>
            <p>
              Unlike blind funds, Turicum partners select individual assets. Choose your property, define your contribution level, and track performance.
            </p>
          </section>

          <LiveOpportunitiesGallery />

          <section id="investment-approach" className="turicum-process-section">
            <div className="turicum-section-intro compact">
              <p className="eyebrow">The Turicum Security Standard</p>
              <h2>The Turicum Security Standard</h2>
            </div>
            <div className="turicum-process-steps">
              {publicSequence.map((step) => (
                <article key={step.label} className="turicum-landing-process-step">
                  <span className="turicum-landing-step-number">{step.label}</span>
                  <div className="turicum-process-step-copy">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="turicum-process-note">{investmentPrinciples[2]?.description}</p>
          </section>

          <section className="turicum-landing-cta">
            <p className="eyebrow">Investor access</p>
            <h2>Start with the investor materials or open the portal.</h2>
            <p>
              Review the mandate, the reporting posture, and the investor-facing materials before
              entering the secure lane.
            </p>
            <div className="form-actions turicum-inline-actions">
              <Link className="secondary-button turicum-primary-button" href={withBasePath("/investor-handoff")}>
                Investor materials
              </Link>
              <Link className="secondary-button" href={withBasePath("/investors")}>
                Investor portal
              </Link>
            </div>
          </section>

          <footer className="turicum-home-footer">
            <p className="helper turicum-footer-note">
              Looking for a loan?{" "}
              <a href="https://borrow.turicum.us" target="_blank" rel="noreferrer">
                Visit the Borrower Intake
              </a>
            </p>
            <p className="helper turicum-footer-note">
              Team admin?{" "}
              <Link href={withBasePath("/team-login?next=%2Faccess")}>
                Open Access Admin
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
