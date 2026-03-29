import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TuricumNav } from "@/components/turicum/nav";
import { createCase, isSupabaseConfigured } from "@/lib/turicum/cases";
import {
  dealShapeOptions,
  entityTypeOptions,
  notaryOptions,
  propertyTypeOptions,
  screeningPlanOptions,
  screeningStatusOptions,
  saveCaseDealProfile
} from "@/lib/turicum/deal-intake";
import { withBasePath } from "@/lib/turicum/runtime";
import { getStatePacks } from "@/lib/turicum/state-packs";
import type { StructureType } from "@/lib/turicum/types";

const sourceTypes = ["direct", "referral_partner", "mca", "investor", "other"] as const;
const structures: StructureType[] = ["loan", "purchase"];
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function rethrowRedirectError(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }
}

export default async function NewCasePage({ searchParams }: { searchParams?: SearchParams }) {
  const statePacks = getStatePacks().filter((pack) => pack.enabled);
  const params = (await searchParams) ?? {};
  const status = readString(params.status);
  const message = readString(params.message);

  async function submitCase(formData: FormData) {
    "use server";
    try {
      const title = String(formData.get("title") ?? "").trim();
      const state = String(formData.get("state") ?? "").trim();
      const assetAddress = String(formData.get("assetAddress") ?? "").trim();
      const assetDescription = String(formData.get("assetDescription") ?? "").trim();

      if (!title) {
        redirect(withBasePath("/cases/new?status=error&message=Case%20title%20is%20required."));
      }

      if (!state) {
        redirect(withBasePath("/cases/new?status=error&message=Select%20a%20state%20before%20opening%20the%20matter."));
      }

      if (!assetAddress && !assetDescription) {
        redirect(withBasePath("/cases/new?status=error&message=Add%20either%20a%20property%20address%20or%20a%20short%20asset%20summary%20so%20the%20operator%20has%20context."));
      }

      const structureType =
        formData.get("structureType") === "loan" ? ("loan" as const) : ("purchase" as const);

      const createdCase = await createCase({
        title,
        state,
        structureType,
        sourceType: String(formData.get("sourceType") ?? "direct"),
        requestedAmount: String(formData.get("requestedAmount") ?? "0"),
        propertySummary: [assetAddress, assetDescription].filter(Boolean).join(" — ")
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
        assetAddress,
        assetDescription,
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

      redirect(withBasePath(`/cases/${createdCase.id}?status=case-opened`));
    } catch (error) {
      rethrowRedirectError(error);
      const errorMessage = error instanceof Error ? error.message : "Case could not be opened.";
      redirect(withBasePath(`/cases/new?status=error&message=${encodeURIComponent(errorMessage)}`));
    }
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">New Matter</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Open the matter fast, then add diligence where it belongs.</h1>
              <p>
                Start with the core case facts on this page. Borrower intake, Drive setup, validation detail, and investor workflow can all be added after the case exists.
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="pill">
                  <strong>Mode:</strong> {isSupabaseConfigured() ? "Supabase" : "Local fallback"}
                </div>
                <div className="pill">
                  <strong>States:</strong> {statePacks.map((pack) => pack.state).join(", ")}
                </div>
              </div>
              <p className="helper">
                The quick-open path should take one pass. Optional underwriting and screening fields stay available below when you need them.
              </p>
            </div>
          </div>
        </section>

        <section className="panel lead">
          <form action={submitCase} className="form-grid">
            {status ? (
              <div className={status === "error" ? "callout turicum-form-callout-error" : "callout turicum-form-callout-success"}>
                <p className="eyebrow">{status === "error" ? "Matter setup needs attention" : "Matter saved"}</p>
                <p>{message ?? (status === "error" ? "Check the core matter fields and try again." : "The matter has been opened.")}</p>
              </div>
            ) : null}

            <div className="callout">
              <p className="eyebrow">Quick Open</p>
              <p><strong>These are the only fields you really need to start.</strong></p>
              <p className="helper">
                Open the case with the core facts, then fill in validation placeholders and review notes after the operator lands in the live case workspace.
              </p>
            </div>

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
                <span>Requested amount</span>
                <input name="requestedAmount" type="text" placeholder="$450,000" />
              </label>
            </div>

            <div className="two-up">
              <label className="field">
                <span>Asset or property address</span>
                <textarea
                  name="assetAddress"
                  rows={3}
                  placeholder="Full address or location of the property or asset."
                />
              </label>

              <label className="field">
                <span>Property or asset summary</span>
                <textarea
                  name="assetDescription"
                  rows={3}
                  placeholder="Property type, condition, use, and what the asset actually is."
                />
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

            <div className="form-actions">
              <button type="submit">Create case and open workspace</button>
              <Link className="secondary-button" href={withBasePath("/cases")}>Back to case board</Link>
            </div>

            <details className="turicum-disclosure">
              <summary>
                <span>Optional borrower and structure detail</span>
                <span className="helper">Use this if the first call already covered the deeper facts.</span>
              </summary>

              <div className="kicker-row">
                <p className="eyebrow">Borrower and structure</p>
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
                <span>Ownership and equity position</span>
                <textarea
                  name="ownershipStatus"
                  rows={4}
                  placeholder="Free and clear, existing liens, current payoff position, and any ownership constraints."
                />
              </label>

              <div className="three-up">
                <label className="field">
                  <span>Acquisition date</span>
                  <input name="acquisitionDate" type="date" />
                </label>

                <label className="field">
                  <span>Acquisition price</span>
                  <input name="acquisitionPrice" type="text" placeholder="$0" />
                </label>

                <label className="field">
                  <span>Improvement spend</span>
                  <input name="improvementSpend" type="text" placeholder="$0" />
                </label>
              </div>

              <label className="field">
                <span>How title is held</span>
                <textarea
                  name="titleHoldingDetail"
                  rows={3}
                  placeholder="Exact vesting or title-holding description from the first call."
                />
              </label>

              <div className="two-up">
                <label className="field">
                  <span>Current value estimate</span>
                  <input name="estimatedValue" type="text" placeholder="$0" />
                </label>

                <label className="field">
                  <span>Value basis</span>
                  <textarea
                    name="valueEstimateBasis"
                    rows={3}
                    placeholder="Broker opinion, appraisal, comps, borrower estimate, tax value, and so on."
                  />
                </label>
              </div>

              <label className="field">
                <span>Funding needed by</span>
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
            </details>

            <details className="turicum-disclosure">
              <summary>
                <span>Optional validation placeholders</span>
                <span className="helper">Capture screening assumptions now if the operator already knows them.</span>
              </summary>

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
            </details>

            <details className="turicum-disclosure">
              <summary>
                <span>Optional review context</span>
                <span className="helper">Use this when AI and legal review need extra framing from day one.</span>
              </summary>

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
            </details>
          </form>
        </section>
      </div>
    </main>
  );
}
