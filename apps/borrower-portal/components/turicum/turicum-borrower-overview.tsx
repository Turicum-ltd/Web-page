import Link from "next/link";
import { withConfiguredBasePath } from "@/lib/turicum/runtime";

interface TuricumBorrowerOverviewProps {
  introRequested?: boolean;
  introRequestedEmail?: string;
  error?: string;
  preIntakeState?: "locked" | "prompt" | "scheduled" | "skip";
}

const propertyTypeOptions = [
  "Single Family Home",
  "Industrial Real Estate",
  "Multifamily (5+ units)",
  "Commercial Land",
  "Heavy Equipment / Yellow Iron",
  "Truck / Fleet",
  "Marine / Vessel",
  "Other"
];

const ownershipOptions = [
  "Clean Title in Hand",
  "Bank has Lien",
  "Tax/Mechanic Lien",
  "In Collections",
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
  "Blue Book / NADA Value",
  "Auction Comps",
  "Manufacturer Invoice",
  "Recent Appraisal",
  "Internal estimate",
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
        <h1 className="turicum-quick-title">Turicum quick asset intake</h1>

        {introRequested ? (
          <div className="turicum-quick-success" role="status" aria-live="polite">
            <strong>Information received.</strong>
            <p>
              A Turicum director will call you within 1 hour.{" "}
              {introRequestedEmail
                ? `Check ${introRequestedEmail} for a summary.`
                : "Check your email for a summary."}
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
              <div className="turicum-quick-section turicum-quick-contact-group">
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

              <section className="turicum-quick-section">
                <p className="turicum-quick-section-title">1. How much money are you looking to borrow or receive?</p>
                <label>
                  <span>Amount requested</span>
                  <input
                    type="text"
                    name="requestedAmount"
                    placeholder="$500,000"
                    inputMode="numeric"
                    required
                  />
                </label>
              </section>

              <section className="turicum-quick-section">
                <p className="turicum-quick-section-title">
                  2. What exactly is the asset or property?
                </p>
                <div className="turicum-quick-section-fields">
                  <label>
                    <span>Property type</span>
                    <select name="propertyType" defaultValue="" required>
                      <option value="" disabled>
                        Select asset type
                      </option>
                      {propertyTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Full address or location</span>
                    <input
                      type="text"
                      name="assetLocation"
                      placeholder="123 Main St, Miami, FL"
                      required
                    />
                  </label>
                  <label>
                    <span>Describe the property</span>
                    <textarea
                      name="assetDescription"
                      rows={4}
                      placeholder="Type of asset, condition, tenants or use, square footage, lot size, or anything else that matters."
                      required
                    />
                  </label>
                </div>
              </section>

              <section className="turicum-quick-section">
                <p className="turicum-quick-section-title">
                  3. How much equity or ownership do you currently have in it?
                </p>
                <div className="turicum-quick-section-fields">
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
              </section>

              <section className="turicum-quick-section">
                <label>
                  <span className="turicum-quick-section-title">4. How is title held?</span>
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
                  <span className="turicum-quick-section-title">5. Rough estimate of current value</span>
                  <input
                    type="text"
                    name="estimatedValue"
                    placeholder="$700,000"
                    inputMode="numeric"
                    required
                  />
                </label>
                <label>
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
              </section>

              <section className="turicum-quick-section">
                <label>
                  <span className="turicum-quick-section-title">6. When do you need the money?</span>
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
              </section>

              <div className="turicum-quick-actions">
                <button type="submit">Request call back</button>
              </div>
            </form>
          </>
        )}
      </section>

      <footer className="turicum-quick-footer">
        <Link href="https://turicum.us">turicum.us</Link>
      </footer>
    </main>
  );
}
