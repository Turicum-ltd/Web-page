import Link from "next/link";
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
    <main className="turicum-quick-page">
      <section id="request-form" className="turicum-quick-intake">
        <p className="turicum-quick-title">TURICUM | QUICK ASSET INTAKE</p>
        <p className="turicum-quick-copy">
          Money on assets within 1 week. No credit check needed. Fill this out first and we will
          call back within 1 hour during business hours if it looks like a fit.
        </p>

        {introRequested ? (
          <div className="turicum-quick-success" role="status" aria-live="polite">
            <strong>Request received.</strong>
            <p>
              {introRequestedEmail
                ? `We have your request for ${introRequestedEmail}.`
                : "We have your request."} We will call back within 1 hour during business hours.
            </p>
          </div>
        ) : (
          <>
            {error ? (
              <div className="turicum-quick-error" role="alert">
                {error}
              </div>
            ) : null}

            <form
              className="turicum-quick-form"
              method="post"
              action={withConfiguredBasePath("/api/intro-call-requests")}
            >
              <div className="turicum-quick-grid turicum-quick-contact-grid">
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

              <div className="turicum-quick-grid">
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
                <label className="turicum-quick-wide">
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

              <div className="turicum-quick-block">
                <p className="turicum-quick-question">
                  3. How much equity or ownership do you currently have in it?
                </p>
                <div className="turicum-quick-grid">
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
                    <input
                      type="text"
                      name="purchasePrice"
                      placeholder="$350,000"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <label>
                    <span>How much did you put into it?</span>
                    <input
                      type="text"
                      name="capitalInvested"
                      placeholder="$75,000"
                      inputMode="numeric"
                      required
                    />
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

              <div className="turicum-quick-grid">
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
                  <input
                    type="text"
                    name="estimatedValue"
                    placeholder="$700,000"
                    inputMode="numeric"
                    required
                  />
                </label>
                <label className="turicum-quick-wide">
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

              <div className="turicum-quick-actions">
                <button type="submit">Request call back</button>
              </div>
            </form>
          </>
        )}
      </section>

      <footer className="turicum-quick-footer">
        <Link href="https://turicum.us">Back to turicum.us</Link>
      </footer>
    </main>
  );
}
