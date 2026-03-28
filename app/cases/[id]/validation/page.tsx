import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TuricumNav } from "@/components/turicum/nav";
import {
  getCaseDealProfile,
  saveCaseDealProfile,
  screeningPlanOptions,
  screeningStatusOptions,
  validationStatusOptions
} from "@/lib/turicum/deal-intake";
import { listCaseDocuments, isGoogleDriveUrl } from "@/lib/turicum/case-documents";
import { getCaseById } from "@/lib/turicum/cases";
import { buildGoogleDriveFileHref, buildGoogleDriveFolderHref } from "@/lib/turicum/google-drive";
import { getCaseLegalSelection } from "@/lib/turicum/case-legal-selection";
import { withBasePath } from "@/lib/turicum/runtime";

export const dynamic = "force-dynamic";

export default async function ValidationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseItem = await getCaseById(id);
  const dealProfile = await getCaseDealProfile(id);
  const legalSelection = await getCaseLegalSelection(id);
  const driveDocuments = (await listCaseDocuments(id)).filter((document) => isGoogleDriveUrl(document.storagePath));

  if (!caseItem || !dealProfile) {
    notFound();
  }

  const currentDealProfile = dealProfile;
  const caseDriveFolderHref = buildGoogleDriveFolderHref(caseItem.googleDriveFolderId || legalSelection?.googleDriveFolderId);

  async function saveValidation(formData: FormData) {
    "use server";

    await saveCaseDealProfile({
      caseId: id,
      state: currentDealProfile.state,
      structureType: currentDealProfile.structureType,
      dealShape: currentDealProfile.dealShape,
      lenderCount: currentDealProfile.lenderCount,
      propertyType: currentDealProfile.propertyType,
      borrowerEntityType: currentDealProfile.borrowerEntityType,
      titleHolderType: currentDealProfile.titleHolderType,
      guarantorCount: currentDealProfile.guarantorCount,
      notaryRequirement: currentDealProfile.notaryRequirement,
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
      validationStatus: String(formData.get("validationStatus") ?? "pending") as (typeof validationStatusOptions)[number],
      occupancySummary: currentDealProfile.occupancySummary,
      complexityNotes: currentDealProfile.complexityNotes
    });

    redirect(withBasePath(`/cases/${id}/validation`));
  }

  const validationReady = currentDealProfile.validationStatus === "approved";

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Borrower + Property Validation</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{caseItem.title}</h1>
              <p>
                This is the internal borrower and property checkpoint before Turicum LLC treats investor promotion
                as fully cleared. Capture the first-call answers, value basis, and the placeholder path for credit,
                background, and criminal screening here.
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Validation</p>
                  <strong>{(currentDealProfile.validationStatus ?? "pending").replaceAll("_", " ")}</strong>
                  <p className="helper">borrower + property gate</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Screening path</p>
                  <strong>{(currentDealProfile.screeningPlan ?? "borrower_to_provide").replaceAll("_", " ")}</strong>
                  <p className="helper">credit / background / criminal</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Promotion</p>
                  <strong>{validationReady ? "can finalize" : "still blocked"}</strong>
                  <p className="helper">until validation is approved</p>
                </div>
              </div>
              <div className="form-actions">
                <Link className="secondary-button" href={withBasePath(`/cases/${id}`)}>Back to case</Link>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}/investor-promotion`)}>Open investor promotion</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel">
            <p className="eyebrow">Google Drive</p>
            <h2>Drive references Turicum LLC can work from during validation</h2>
            <ul className="list">
              {buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) ? (
                <li>
                  <strong>Saved legal template file:</strong>{" "}
                  <a href={buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) ?? "#"} target="_blank" rel="noreferrer">
                    open Drive file
                  </a>
                </li>
              ) : null}
              {caseDriveFolderHref ? (
                <li>
                  <strong>Case folder:</strong>{" "}
                  <a href={caseDriveFolderHref} target="_blank" rel="noreferrer">
                    open Drive folder
                  </a>
                </li>
              ) : null}
              {driveDocuments.slice(0, 4).map((document) => (
                <li key={document.id}>
                  <strong>{document.title}:</strong>{" "}
                  <a href={withBasePath(`/api/cases/${id}/documents/${document.id}`)} target="_blank" rel="noreferrer">
                    open linked Drive document
                  </a>
                </li>
              ))}
              {!buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) &&
              !caseDriveFolderHref &&
              driveDocuments.length === 0 ? (
                <li>No Drive references are linked to this case yet.</li>
              ) : null}
            </ul>
            <p className="helper">
              Keep borrower-provided reports and collateral backup in Drive. Turicum LLC should track status and links here,
              not become the document source of truth.
            </p>
          </div>

          <div className="panel">
            <p className="eyebrow">Validation rule</p>
            <h2>What must be true before promotion can finalize</h2>
            <ul className="list">
              <li><strong>Borrower packet:</strong> forms and supporting documents need to be in place.</li>
              <li><strong>First-call facts:</strong> the six borrower intake answers need to be captured cleanly.</li>
              <li><strong>Screening path:</strong> borrower-provided or outside-vendor placeholder must be recorded.</li>
              <li><strong>Value basis:</strong> Turicum LLC needs a reasoned value basis before investors see the deal.</li>
            </ul>
          </div>
        </section>

        <section className="panel lead">
          <form action={saveValidation} className="form-grid">
            <div className="section-head">
              <div>
                <p className="eyebrow">First-call borrower intake</p>
                <h2>Keep the six intake answers visible and editable</h2>
              </div>
            </div>

            <label className="field">
              <span>Borrower request amount</span>
              <input name="requestedAmountDisplay" type="text" value={caseItem.requestedAmount} disabled />
            </label>

            <div className="two-up">
              <label className="field">
                <span>Asset or property address / location</span>
                <textarea name="assetAddress" rows={3} defaultValue={currentDealProfile.assetAddress ?? ""} />
              </label>
              <label className="field">
                <span>Property or asset description</span>
                <textarea name="assetDescription" rows={3} defaultValue={currentDealProfile.assetDescription ?? ""} />
              </label>
            </div>

            <label className="field">
              <span>Current ownership / equity / liens</span>
              <textarea name="ownershipStatus" rows={4} defaultValue={currentDealProfile.ownershipStatus ?? ""} />
            </label>

            <div className="three-up">
              <label className="field">
                <span>Acquisition date</span>
                <input name="acquisitionDate" type="date" defaultValue={currentDealProfile.acquisitionDate ?? ""} />
              </label>
              <label className="field">
                <span>Acquisition price</span>
                <input name="acquisitionPrice" type="text" defaultValue={currentDealProfile.acquisitionPrice ?? ""} />
              </label>
              <label className="field">
                <span>Capital put into property</span>
                <input name="improvementSpend" type="text" defaultValue={currentDealProfile.improvementSpend ?? ""} />
              </label>
            </div>

            <label className="field">
              <span>How title is held</span>
              <textarea name="titleHoldingDetail" rows={3} defaultValue={currentDealProfile.titleHoldingDetail ?? ""} />
            </label>

            <div className="two-up">
              <label className="field">
                <span>Estimated current value</span>
                <input name="estimatedValue" type="text" defaultValue={currentDealProfile.estimatedValue ?? ""} />
              </label>
              <label className="field">
                <span>Value basis</span>
                <textarea name="valueEstimateBasis" rows={3} defaultValue={currentDealProfile.valueEstimateBasis ?? ""} />
              </label>
            </div>

            <label className="field">
              <span>When the money is needed</span>
              <input name="fundingNeededBy" type="text" defaultValue={currentDealProfile.fundingNeededBy ?? ""} />
            </label>

            <div className="section-head">
              <div>
                <p className="eyebrow">Screening placeholders</p>
                <h2>Track whether the borrower provides reports or Turicum LLC needs a vendor</h2>
              </div>
            </div>

            <div className="two-up">
              <label className="field">
                <span>Screening plan</span>
                <select name="screeningPlan" defaultValue={currentDealProfile.screeningPlan ?? "borrower_to_provide"}>
                  {screeningPlanOptions.map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Provider or vendor</span>
                <input name="screeningProvider" type="text" defaultValue={currentDealProfile.screeningProvider ?? ""} placeholder="Selected case by case" />
              </label>
            </div>

            <div className="three-up">
              <label className="field">
                <span>Credit check</span>
                <select name="creditCheckStatus" defaultValue={currentDealProfile.creditCheckStatus ?? "pending"}>
                  {screeningStatusOptions.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Background check</span>
                <select name="backgroundCheckStatus" defaultValue={currentDealProfile.backgroundCheckStatus ?? "pending"}>
                  {screeningStatusOptions.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Criminal check</span>
                <select name="criminalCheckStatus" defaultValue={currentDealProfile.criminalCheckStatus ?? "pending"}>
                  {screeningStatusOptions.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Validation status</span>
              <select name="validationStatus" defaultValue={currentDealProfile.validationStatus ?? "pending"}>
                {validationStatusOptions.map((value) => (
                  <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Validation notes</span>
              <textarea
                name="screeningNotes"
                rows={4}
                defaultValue={currentDealProfile.screeningNotes ?? ""}
                placeholder="Capture what the borrower will provide, who the outside vendor is, and what remains outstanding."
              />
            </label>

            <div className="form-actions">
              <button type="submit">Save validation</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
