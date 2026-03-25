import { redirect } from "next/navigation";
import { AtlasNav } from "@/components/atlas/nav";
import { createCase, isSupabaseConfigured } from "@/lib/atlas/cases";
import {
  dealShapeOptions,
  entityTypeOptions,
  notaryOptions,
  propertyTypeOptions,
  screeningPlanOptions,
  screeningStatusOptions,
  saveCaseDealProfile
} from "@/lib/atlas/deal-intake";
import { withBasePath } from "@/lib/atlas/runtime";
import { getStatePacks } from "@/lib/atlas/state-packs";
import type { StructureType } from "@/lib/atlas/types";

const sourceTypes = ["direct", "referral_partner", "mca", "investor", "other"] as const;
const structures: StructureType[] = ["loan", "purchase"];

export default function NewCasePage() {
  const statePacks = getStatePacks().filter((pack) => pack.enabled);

  async function submitCase(formData: FormData) {
    "use server";

    const structureType =
      formData.get("structureType") === "loan" ? ("loan" as const) : ("purchase" as const);

    const createdCase = await createCase({
      title: String(formData.get("title") ?? ""),
      state: String(formData.get("state") ?? ""),
      structureType,
      sourceType: String(formData.get("sourceType") ?? "direct"),
      requestedAmount: String(formData.get("requestedAmount") ?? "0"),
      propertySummary: [
        String(formData.get("assetAddress") ?? "").trim(),
        String(formData.get("assetDescription") ?? "").trim()
      ].filter(Boolean).join(" — ")
    });

    await saveCaseDealProfile({
      caseId: createdCase.id,
      state: createdCase.state,
      structureType,
      dealShape: formData.get("dealShape") === "loan"
        ? "loan"
        : formData.get("dealShape") === "purchase_leaseback"
          ? "purchase_leaseback"
          : "purchase",
      lenderCount: Number(formData.get("lenderCount") ?? 1),
      propertyType: String(formData.get("propertyType") ?? "other") as (typeof propertyTypeOptions)[number],
      borrowerEntityType: String(formData.get("borrowerEntityType") ?? "llc") as (typeof entityTypeOptions)[number],
      titleHolderType: String(formData.get("titleHolderType") ?? "llc") as (typeof entityTypeOptions)[number],
      guarantorCount: Number(formData.get("guarantorCount") ?? 0),
      notaryRequirement: String(formData.get("notaryRequirement") ?? "depends") as (typeof notaryOptions)[number],
      assetAddress: String(formData.get("assetAddress") ?? ""),
      assetDescription: String(formData.get("assetDescription") ?? ""),
      ownershipStatus: String(formData.get("ownershipStatus") ?? ""),
      acquisitionDate: String(formData.get("acquisitionDate") ?? ""),
      acquisitionPrice: String(formData.get("acquisitionPrice") ?? ""),
      improvementSpend: String(formData.get("improvementSpend") ?? ""),
      titleHoldingDetail: String(formData.get("titleHoldingDetail") ?? ""),
      estimatedValue: String(formData.get("estimatedValue") ?? ""),
      valueEstimateBasis: String(formData.get("valueEstimateBasis") ?? ""),
      fundingNeededBy: String(formData.get("fundingNeededBy") ?? ""),
      screeningPlan: String(formData.get("screeningPlan") ?? "borrower_to_provide") as (typeof screeningPlanOptions)[number],
      screeningProvider: String(formData.get("screeningProvider") ?? ""),
      screeningNotes: String(formData.get("screeningNotes") ?? ""),
      creditCheckStatus: String(formData.get("creditCheckStatus") ?? "pending") as (typeof screeningStatusOptions)[number],
      backgroundCheckStatus: String(formData.get("backgroundCheckStatus") ?? "pending") as (typeof screeningStatusOptions)[number],
      criminalCheckStatus: String(formData.get("criminalCheckStatus") ?? "pending") as (typeof screeningStatusOptions)[number],
      validationStatus: "pending",
      occupancySummary: String(formData.get("occupancySummary") ?? ""),
      complexityNotes: String(formData.get("complexityNotes") ?? "")
    });

    redirect(withBasePath(`/cases/${createdCase.id}`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">New Matter</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Open a new matter and define the underwriting, investor, and legal path up front.</h1>
              <p>
                Turicum LLC starts with deal shape, target investor count, collateral facts, entity structure, validation needs,
                and the likely signature lane. The first-call borrower answers drive validation, investor promotion, and final paper selection.
              </p>
            </div>
            <div className="hero-aside">
              <AtlasNav />
              <div className="dashboard-band">
                <div className="pill">
                  <strong>Mode:</strong> {isSupabaseConfigured() ? "Supabase" : "Local fallback"}
                </div>
                <div className="pill">
                  <strong>States:</strong> {statePacks.map((pack) => pack.state).join(", ")}
                </div>
              </div>
              <p className="helper">
                Turicum LLC will use these answers to recommend borrower and property validation, investor promotion strategy, the contract stack,
                review gates, and the signature path.
              </p>
            </div>
          </div>
        </section>

        <section className="panel lead">
          <form action={submitCase} className="form-grid">
            <label className="field">
              <span>Case title</span>
              <input name="title" type="text" placeholder="Palm Beach option closing" required />
            </label>

            <div className="kicker-row">
              <p className="eyebrow">Core matter setup</p>
            </div>

            <div className="two-up">
              <label className="field">
                <span>State</span>
                <select name="state" defaultValue="FL">
                  {statePacks.map((pack) => (
                    <option key={pack.state} value={pack.state}>
                      {pack.state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Structure</span>
                <select name="structureType" defaultValue="purchase">
                  {structures.map((structure) => (
                    <option key={structure} value={structure}>
                      {structure}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="two-up">
              <label className="field">
                <span>Deal shape</span>
                <select name="dealShape" defaultValue="purchase">
                  {dealShapeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Property type</span>
                <select name="propertyType" defaultValue="mixed_use">
                  {propertyTypeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="kicker-row">
              <p className="eyebrow">First borrower call</p>
            </div>

            <div className="two-up">
              <label className="field">
                <span>Lead source</span>
                <select name="sourceType" defaultValue="direct">
                  {sourceTypes.map((sourceType) => (
                    <option key={sourceType} value={sourceType}>
                      {sourceType}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>1. How much money are you looking to borrow or receive?</span>
                <input name="requestedAmount" type="text" placeholder="$450,000" />
              </label>
            </div>

            <div className="two-up">
              <label className="field">
                <span>2. Asset or property address / location</span>
                <textarea
                  name="assetAddress"
                  rows={3}
                  placeholder="Full address or location of the property or asset."
                />
              </label>

              <label className="field">
                <span>2. Describe the property or asset</span>
                <textarea
                  name="assetDescription"
                  rows={3}
                  placeholder="Property type, condition, use, and what the asset actually is."
                />
              </label>
            </div>

            <div className="two-up">
              <label className="field">
                <span>Target investors / lenders</span>
                <input name="lenderCount" type="number" min="1" defaultValue="1" />
                <p className="helper">Turicum LLC will confirm the final investor count after borrower validation and investor promotion.</p>
              </label>

              <label className="field">
                <span>Guarantor count</span>
                <input name="guarantorCount" type="number" min="0" defaultValue="0" />
              </label>
            </div>

            <div className="two-up">
              <label className="field">
                <span>Borrower entity type</span>
                <select name="borrowerEntityType" defaultValue="llc">
                  {entityTypeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Title holder type</span>
                <select name="titleHolderType" defaultValue="llc">
                  {entityTypeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>3. How much equity / ownership does the borrower currently have?</span>
              <textarea
                name="ownershipStatus"
                rows={4}
                placeholder="Free and clear, existing loans or liens, current payoff position, and any ownership constraints."
              />
            </label>

            <div className="three-up">
              <label className="field">
                <span>3. When was it bought?</span>
                <input name="acquisitionDate" type="date" />
              </label>

              <label className="field">
                <span>3. What did they pay?</span>
                <input name="acquisitionPrice" type="text" placeholder="$0" />
              </label>

              <label className="field">
                <span>3. How much was put into it?</span>
                <input name="improvementSpend" type="text" placeholder="$0" />
              </label>
            </div>

            <label className="field">
              <span>4. How is title held?</span>
              <textarea
                name="titleHoldingDetail"
                rows={3}
                placeholder="Exact vesting / title-holding description from the first call."
              />
            </label>

            <div className="two-up">
              <label className="field">
                <span>5. Rough current value estimate</span>
                <input name="estimatedValue" type="text" placeholder="$0" />
              </label>

              <label className="field">
                <span>5. How did they come up with that number?</span>
                <textarea
                  name="valueEstimateBasis"
                  rows={3}
                  placeholder="Broker opinion, appraisal, comps, borrower estimate, tax value, etc."
                />
              </label>
            </div>

            <label className="field">
              <span>6. When do they need the money?</span>
              <input name="fundingNeededBy" type="text" placeholder="Example: within 7 days" />
            </label>

            <label className="field">
              <span>Occupancy / collateral summary</span>
              <input
                name="occupancySummary"
                type="text"
                placeholder="Example: borrower will lease back retail space post-close; rents are part of collateral."
              />
            </label>

            <label className="field">
              <span>Notary path</span>
              <select name="notaryRequirement" defaultValue="depends">
                {notaryOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <div className="kicker-row">
              <p className="eyebrow">Borrower validation placeholders</p>
            </div>

            <div className="two-up">
              <label className="field">
                <span>Credit/background path</span>
                <select name="screeningPlan" defaultValue="borrower_to_provide">
                  {screeningPlanOptions.map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <p className="helper">Placeholder only for now. Turicum LLC can ask the borrower to provide reports or flag that a vendor must be chosen case by case.</p>
              </label>

              <label className="field">
                <span>Vendor / provider (if known)</span>
                <input name="screeningProvider" type="text" placeholder="Leave blank if not selected yet" />
              </label>
            </div>

            <div className="three-up">
              <label className="field">
                <span>Credit check</span>
                <select name="creditCheckStatus" defaultValue="pending">
                  {screeningStatusOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Background check</span>
                <select name="backgroundCheckStatus" defaultValue="pending">
                  {screeningStatusOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Criminal check</span>
                <select name="criminalCheckStatus" defaultValue="pending">
                  {screeningStatusOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Screening notes</span>
              <textarea
                name="screeningNotes"
                rows={3}
                placeholder="Note whether the borrower will provide reports or Turicum LLC needs to find someone to run them."
              />
            </label>

            <div className="kicker-row">
              <p className="eyebrow">Deal context</p>
            </div>

            <label className="field">
              <span>Complexity notes for AI / legal review</span>
              <textarea
                name="complexityNotes"
                rows={4}
                placeholder="Example: trust borrower with two lenders and a purchase-leaseback structure; confirm notary path and multi-lender enforcement."
              />
            </label>

            <div className="form-actions">
              <button type="submit">Create case and generate workflow plan</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
