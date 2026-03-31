import { TuricumWordmark } from "@turicum/ui";
import { withConfiguredBasePath } from "@/lib/turicum/runtime";

interface TuricumBorrowerOverviewProps {
  introRequested?: boolean;
  introRequestedEmail?: string;
  error?: string;
  preIntakeState?: "locked" | "prompt" | "scheduled" | "skip";
}

const propertyTypeOptions = [
  "Single-family rental",
  "Multifamily",
  "Mixed-use",
  "Retail",
  "Office",
  "Industrial",
  "Land",
  "Hospitality",
  "Other"
];

const ownershipOptions = [
  "Free and clear",
  "One existing loan or lien",
  "Multiple loans or liens",
  "Partial ownership / partnership",
  "Other"
];

const titleHeldOptions = [
  "Personally",
  "LLC",
  "Corporation",
  "Partnership",
  "Trust",
  "Other"
];

const valueBasisOptions = [
  "Broker opinion",
  "Recent appraisal",
  "Recent purchase contract",
  "Comparable sales",
  "Internal estimate",
  "Other"
];

const timingOptions = [
  "Immediately",
  "Within 7 days",
  "Within 2 weeks",
  "Within 30 days",
  "30+ days"
];

export function TuricumBorrowerOverview({
  introRequested,
  introRequestedEmail,
  error
}: TuricumBorrowerOverviewProps) {
  return (
    <main className="turicum-borrower-simple-page">
      <div className="turicum-simple-shell">
        <header className="turicum-simple-header">
          <TuricumWordmark />
          <p className="turicum-simple-kicker">asset-based lending</p>
          <h1>Money on assets within 1 week.</h1>
          <p className="turicum-simple-lede">
            No credit check needed. Tell us about the asset first, and we will call you back within
            1 hour during business hours if it looks like a fit.
          </p>
          <ul className="turicum-simple-value-list">
            <li>Direct review by a real person</li>
            <li>Designed for purchase, bridge, and refinance situations</li>
            <li>Simple first pass before any longer intake packet</li>
          </ul>
        </header>

        <section id="request-form" className="turicum-simple-card">
          {introRequested ? (
            <div className="turicum-simple-success" role="status" aria-live="polite">
              <h2>Request received.</h2>
              <p>
                {introRequestedEmail
                  ? `We have your request for ${introRequestedEmail}.`
                  : "We have your request."} We will call back within 1 hour during business hours.
              </p>
              <p className="turicum-simple-muted">
                If the deal is a fit, we will tell you what to send next. If not, we will keep it
                direct and quick.
              </p>
            </div>
          ) : (
            <>
              <div className="turicum-simple-card-head">
                <h2>Before we call, answer these questions.</h2>
                <p className="turicum-simple-muted">
                  Short answers are fine. We only need enough to decide whether this can move fast.
                </p>
              </div>

              {error ? (
                <div className="turicum-simple-error" role="alert">
                  {error}
                </div>
              ) : null}

              <form className="turicum-simple-form" method="post" action={withConfiguredBasePath("/api/intro-call-requests")}>
                <div className="turicum-simple-grid turicum-simple-contact-grid">
                  <label>
                    <span>Name</span>
                    <input type="text" name="fullName" autoComplete="name" required />
                  </label>
                  <label>
                    <span>Email</span>
                    <input type="email" name="email" autoComplete="email" required />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input type="tel" name="phone" autoComplete="tel" required />
                  </label>
                </div>

                <label>
                  <span>1. How much money are you looking to borrow or receive?</span>
                  <input
                    type="text"
                    name="requestedAmount"
                    placeholder="$500,000"
                    inputMode="numeric"
                    required
                  />
                </label>

                <div className="turicum-simple-grid">
                  <label>
                    <span>2. What exactly is the asset or property?</span>
                    <select name="propertyType" defaultValue="" required>
                      <option value="" disabled>
                        Select property type
                      </option>
                      {propertyTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="turicum-simple-wide">
                    <span>Full address or location</span>
                    <input
                      type="text"
                      name="assetLocation"
                      placeholder="123 Main St, Miami, FL"
                      required
                    />
                  </label>
                </div>

                <label>
                  <span>Describe the property.</span>
                  <textarea
                    name="assetDescription"
                    rows={4}
                    placeholder="Type of asset, condition, tenants or use, square footage, lot size, or anything else that matters."
                    required
                  />
                </label>

                <div className="turicum-simple-question-block">
                  <p className="turicum-simple-question">
                    3. How much equity or ownership do you currently have in it?
                  </p>
                  <div className="turicum-simple-grid">
                    <label>
                      <span>Ownership / lien status</span>
                      <select name="ownershipStatus" defaultValue="" required>
                        <option value="" disabled>
                          Select one
                        </option>
                        {ownershipOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>When did you buy it?</span>
                      <input type="text" name="purchaseDate" placeholder="Month / year or year" required />
                    </label>
                    <label>
                      <span>What did you pay?</span>
                      <input type="text" name="purchasePrice" placeholder="$350,000" inputMode="numeric" required />
                    </label>
                    <label>
                      <span>How much did you put into it?</span>
                      <input type="text" name="capitalInvested" placeholder="$75,000" inputMode="numeric" required />
                    </label>
                  </div>
                  <label>
                    <span>Existing loans or liens</span>
                    <textarea
                      name="existingLiens"
                      rows={3}
                      placeholder="List current mortgages, private loans, tax liens, judgments, or say none."
                      required
                    />
                  </label>
                </div>

                <div className="turicum-simple-grid">
                  <label>
                    <span>4. How is title held?</span>
                    <select name="titleHeld" defaultValue="" required>
                      <option value="" disabled>
                        Select one
                      </option>
                      {titleHeldOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>5. Rough estimate of current value</span>
                    <input type="text" name="estimatedValue" placeholder="$700,000" inputMode="numeric" required />
                  </label>
                  <label className="turicum-simple-wide">
                    <span>How did you come up with that number?</span>
                    <select name="valueBasis" defaultValue="" required>
                      <option value="" disabled>
                        Select one
                      </option>
                      {valueBasisOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span>6. When do you need the money?</span>
                  <select name="preferredTimeline" defaultValue="" required>
                    <option value="" disabled>
                      Select timing
                    </option>
                    {timingOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="turicum-simple-footer">
                  <button type="submit">Request call back</button>
                  <p className="turicum-simple-muted">
                    Business hours follow-up target: within 1 hour.
                  </p>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
