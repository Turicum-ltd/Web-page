import Link from "next/link";
import { TuricumWordmark } from "@turicum/ui";
import { BorrowerPortalEntry } from "@/components/turicum/borrower-portal-entry";
import { withBasePath, withConfiguredBasePath } from "@/lib/turicum/runtime";

const BORROWER_CALL_PHONE = "+1 561 927 9294";
const BORROWER_CALL_HREF = "tel:+15619279294";

const borrowerReasons = [
  {
    title: "Close in one week on the right file",
    description:
      "Turicum is built for speed on the right asset-based deal instead of a conventional bank committee timeline."
  },
  {
    title: "No credit check at the public-entry stage",
    description:
      "The first borrower conversation is about the property, the need, and the structure before the secure packet opens."
  },
  {
    title: "Direct decision path",
    description:
      "Borrowers deal with a private counterparty, not a layered institutional approval chain."
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

const borrowerDocumentCommandCenter = [
  {
    title: "Core Legal",
    description: "Entity and authority documents that let us confirm the borrowing structure.",
    items: [
      { label: "Articles", status: "verified" as const },
      { label: "Operating Agreement", status: "in_review" as const },
      { label: "EIN", status: "action_required" as const }
    ]
  },
  {
    title: "Title & Collateral",
    description: "Collateral position, site definition, and current title posture.",
    items: [
      { label: "Deed", status: "verified" as const },
      { label: "Title Commitment", status: "in_review" as const },
      { label: "Survey", status: "action_required" as const }
    ]
  },
  {
    title: "Funding",
    description: "Settlement and disbursement controls before money can move.",
    items: [
      { label: "Settlement Statement", status: "in_review" as const },
      { label: "Wiring Instructions", status: "action_required" as const }
    ]
  },
  {
    title: "Support",
    description: "Supporting diligence that rounds out the property file.",
    items: [
      { label: "Insurance Binder", status: "verified" as const },
      { label: "Appraisal", status: "in_review" as const },
      { label: "Photos", status: "verified" as const }
    ]
  }
];

interface TuricumBorrowerOverviewProps {
  applicationSubmitted?: boolean;
  applicationSubmittedEmail?: string;
  introRequested?: boolean;
  introRequestedEmail?: string;
  preIntakeState: "locked" | "prompt" | "scheduled" | "skip";
  error?: string;
}

export function TuricumBorrowerOverview({
  applicationSubmitted,
  applicationSubmittedEmail,
  introRequested,
  introRequestedEmail,
  preIntakeState,
  error
}: TuricumBorrowerOverviewProps) {
  const heroArt =
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80";

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
                Turicum is built for property owners and borrowers who need speed, a direct lending
                conversation, and a cleaner route from first call to secure intake on purchase,
                bridge, and refinance loans.
              </p>
              <div className="kicker-row">
                <span className="tag">close in one week</span>
                <span className="tag">no credit check</span>
                <span className="tag">asset-based lending</span>
              </div>
              <div className="form-actions turicum-inline-actions">
                <Link
                  className="secondary-button turicum-primary-button"
                  href={withBasePath("/?preintake=skip#application-profile-details")}
                >
                  Skip to Full Application
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
                <p className="helper">
                  Purchase, bridge, and refinance requests for property owners who want a direct
                  answer before the secure packet opens.
                </p>
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
            <p className="helper">
              If you are ready for the next step, Turicum borrower intake is available at{" "}
              <a href={BORROWER_CALL_HREF}>{BORROWER_CALL_PHONE}</a>.
            </p>
          </div>

          <div className="panel lead">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Commercial loan application</p>
                <h2>Start with a quick intro call or move directly into the full borrower file.</h2>
              </div>
            </div>
            <BorrowerPortalEntry
              applicationAction={withConfiguredBasePath("/api/commercial-loan-applications")}
              introRequestAction={withConfiguredBasePath("/api/intro-call-requests")}
              applicationSubmitted={applicationSubmitted}
              applicationSubmittedEmail={applicationSubmittedEmail}
              introRequested={introRequested}
              introRequestedEmail={introRequestedEmail}
              preIntakeState={preIntakeState}
              error={error}
            />
          </div>
        </section>

        <section className="panel turicum-document-command-center">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Document Command Center</p>
              <h2>See exactly what the borrower packet will organize once secure intake opens.</h2>
            </div>
          </div>
          <p className="helper turicum-document-command-center-note">
            Turicum groups the file into four clear lanes so borrowers know what is still needed,
            what is under review, and what is already cleared.
          </p>
          <div className="turicum-document-command-grid">
            {borrowerDocumentCommandCenter.map((category) => {
              const verifiedCount = category.items.filter((item) => item.status === "verified").length;
              const reviewCount = category.items.filter((item) => item.status === "in_review").length;
              const progress = Math.round(
                ((verifiedCount + reviewCount * 0.5) / category.items.length) * 100
              );

              return (
                <article key={category.title} className="turicum-document-command-card">
                  <div className="turicum-document-command-head">
                    <div>
                      <p className="eyebrow">{category.title}</p>
                      <p className="helper">{category.description}</p>
                    </div>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="turicum-document-command-progress" aria-hidden="true">
                    <span
                      className="turicum-document-command-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <ul className="turicum-document-command-list">
                    {category.items.map((item) => (
                      <li key={`${category.title}-${item.label}`} className="turicum-document-command-item">
                        <span>{item.label}</span>
                        <span className={`turicum-command-status turicum-command-status-${item.status}`}>
                          {item.status === "action_required"
                            ? "Action Required"
                            : item.status === "in_review"
                              ? "In Review"
                              : "Verified"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
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
