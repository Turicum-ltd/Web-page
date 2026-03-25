import Link from "next/link";
import { TuricumWordmark } from "@/components/atlas/turicum-wordmark";
import { withBasePath, withConfiguredBasePath } from "@/lib/atlas/runtime";

const BORROWER_CALL_PHONE = "+1 561 927 9294";
const BORROWER_CALL_HREF = "tel:+15619279294";

const borrowerReasons = [
  {
    title: "Close in one week on the right file",
    description: "Turicum is built for speed on the right asset-based deal instead of a conventional bank committee timeline."
  },
  {
    title: "No credit check at the public-entry stage",
    description: "The first borrower conversation is about the property, the need, and the structure before the secure packet opens."
  },
  {
    title: "Direct decision path",
    description: "Borrowers deal with a private counterparty, not a layered institutional approval chain."
  }
];

const preparationItems = [
  "Requested amount and timing",
  "Property type and full location",
  "Ownership, title, and existing debt",
  "Current value view and basis"
];

const nextSteps = [
  "First call to confirm fit, timeline, and property basics",
  "Secure borrower packet for forms and supporting documents",
  "Protected internal review across validation, paper, diligence, and funding"
];

interface TuricumBorrowerOverviewProps {
  requested?: boolean;
  error?: string;
}

export function TuricumBorrowerOverview({ requested, error }: TuricumBorrowerOverviewProps) {
  const heroArt = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80";

  return (
    <main>
      <div className="shell turicum-borrower-shell turicum-public-shell">
        <section className="hero turicum-public-hero">
          <div className="hero-grid turicum-public-hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Borrower Path</p>
              <div className="hero-brand-lockup">
                <TuricumWordmark />
              </div>
              <h1>A faster way into the right asset-based loan.</h1>
              <p>
                Turicum is built for property owners and borrowers who need speed, a direct lending conversation, and a cleaner route from first call to secure intake on purchase, bridge, and refinance loans.
              </p>
              <div className="kicker-row">
                <span className="tag">close in one week</span>
                <span className="tag">no credit check</span>
                <span className="tag">asset-based lending</span>
              </div>
              <div className="form-actions turicum-inline-actions">
                <a className="secondary-button turicum-primary-button" href="#request-call">
                  Schedule intro call
                </a>
                <Link className="secondary-button" href={withBasePath("/")}>
                  Back to overview
                </Link>
              </div>
            </div>
            <div className="turicum-public-aside">
              <div
                className="turicum-aside-art"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(10, 14, 22, 0.08), rgba(10, 14, 22, 0.58)), url(${heroArt})`
                }}
                aria-hidden="true"
              />
              <div className="panel subtle turicum-aside-panel">
                <p className="eyebrow">Right fit</p>
                <p className="helper">Purchase, bridge, and refinance requests for property owners who want a direct answer before the secure packet opens.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel turicum-proof-panel">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Why borrowers use Turicum</p>
              <h2>Speed, direct answers, and a cleaner path into the file.</h2>
            </div>
          </div>
          <div className="status-grid turicum-compact-status-grid">
            {borrowerReasons.map((reason) => (
              <article key={reason.title} className="status-card turicum-public-card turicum-nested-card">
                <strong>{reason.title}</strong>
                <p className="helper">{reason.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="two-up turicum-form-layout">
          <div className="panel turicum-public-card">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">What to prepare</p>
                <h2>Have the key asset facts ready before the first call.</h2>
              </div>
            </div>
            <ul className="list compact-list">
              {preparationItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="helper">If you are ready for the next step, Turicum borrower intake is available at <a href={BORROWER_CALL_HREF}>{BORROWER_CALL_PHONE}</a>.</p>
          </div>

          <div id="request-call" className="panel lead">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Request the first call</p>
                <h2>Send the borrower details Turicum needs to schedule the intro conversation.</h2>
              </div>
            </div>
            {requested ? (
              <div className="panel subtle">
                <strong>Intro call request received.</strong>
                <p className="helper">Turicum now has your request and can schedule the first borrower conversation from the internal side.</p>
              </div>
            ) : null}
            {error ? (
              <div className="panel subtle">
                <strong>We could not submit the request.</strong>
                <p className="helper">{error}</p>
              </div>
            ) : null}
            <form className="form-grid" method="post" action={withConfiguredBasePath("/api/intro-call-requests")}>
              <label className="field">
                <span>Full name</span>
                <input name="fullName" type="text" required />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" required />
              </label>
              <label className="field">
                <span>Phone</span>
                <input name="phone" type="tel" required />
              </label>
              <label className="field">
                <span>Requested amount</span>
                <input name="requestedAmount" type="text" placeholder="$2,500,000" />
              </label>
              <label className="field">
                <span>Asset or property location</span>
                <input name="assetLocation" type="text" placeholder="Miami, FL" />
              </label>
              <label className="field">
                <span>Property type</span>
                <input name="propertyType" type="text" placeholder="Multifamily, office, industrial, land" />
              </label>
              <label className="field">
                <span>Preferred call date</span>
                <input name="preferredDate" type="date" />
              </label>
              <label className="field">
                <span>Preferred time window</span>
                <select name="preferredTimeWindow" defaultValue="">
                  <option value="">Select a window</option>
                  <option value="morning">Morning</option>
                  <option value="midday">Midday</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </label>
              <label className="field">
                <span>When do you need the money?</span>
                <input name="preferredTimeline" type="text" placeholder="Within 30 days" />
              </label>
              <label className="field">
                <span>Notes</span>
                <textarea name="notes" rows={5} placeholder="Anything Turicum should know before the first call?" />
              </label>
              <div className="form-actions turicum-inline-actions">
                <button className="turicum-primary-button" type="submit">Request intro call</button>
              </div>
            </form>
          </div>
        </section>

        <section className="panel turicum-process-strip">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">What happens next</p>
              <h2>The underwriting and closing work starts only after the fit is confirmed.</h2>
            </div>
          </div>
          <div className="status-grid turicum-compact-status-grid">
            {nextSteps.map((step) => (
              <article key={step} className="status-card turicum-public-card">
                <p className="helper">{step}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
