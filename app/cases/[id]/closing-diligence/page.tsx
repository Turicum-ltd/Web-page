import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TuricumNav } from "@/components/turicum/nav";
import { listCaseDocuments, isGoogleDriveUrl } from "@/lib/turicum/case-documents";
import { getCaseLegalSelection } from "@/lib/turicum/case-legal-selection";
import { assessDealProfile, getCaseDealProfile } from "@/lib/turicum/deal-intake";
import { getCaseById } from "@/lib/turicum/cases";
import { buildGoogleDriveFileHref, buildGoogleDriveFolderHref } from "@/lib/turicum/google-drive";
import {
  getCaseClosingDiligence,
  getCaseLegalReview,
  getClosingDiligenceDocumentBuckets,
  saveCaseClosingDiligence,
  type ClosingDiligenceStatus,
  type VendorReviewStatus
} from "@/lib/turicum/review-workflow";
import { withBasePath } from "@/lib/turicum/runtime";

export const dynamic = "force-dynamic";

const statusOptions: ClosingDiligenceStatus[] = ["pending", "in_review", "changes_requested", "cleared"];
const vendorStatusOptions: VendorReviewStatus[] = ["pending", "ordered", "received", "reviewed", "cleared"];

function normalizeStatus(value: FormDataEntryValue | null): ClosingDiligenceStatus {
  return value === "in_review" || value === "changes_requested" || value === "cleared" ? value : "pending";
}

function normalizeVendorStatus(value: FormDataEntryValue | null): VendorReviewStatus {
  return value === "ordered" || value === "received" || value === "reviewed" || value === "cleared" ? value : "pending";
}

export default async function ClosingDiligencePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseItem = await getCaseById(id);
  const dealProfile = await getCaseDealProfile(id);

  if (!caseItem || !dealProfile) {
    notFound();
  }

  const assessment = assessDealProfile(dealProfile);
  const legalReview = await getCaseLegalReview(id);
  const closingDiligence = await getCaseClosingDiligence(id);
  const legalSelection = await getCaseLegalSelection(id);
  const driveDocuments = (await listCaseDocuments(id)).filter((document) => isGoogleDriveUrl(document.storagePath));
  const buckets = getClosingDiligenceDocumentBuckets(assessment);

  async function saveDiligence(formData: FormData) {
    "use server";

    await saveCaseClosingDiligence({
      caseId: id,
      status: normalizeStatus(formData.get("status")),
      titleCompanyName: String(formData.get("titleCompanyName") ?? "").trim(),
      titleStatus: normalizeVendorStatus(formData.get("titleStatus")),
      insuranceStatus: normalizeVendorStatus(formData.get("insuranceStatus")),
      taxStatus: normalizeVendorStatus(formData.get("taxStatus")),
      summary: String(formData.get("summary") ?? "").trim(),
      comments: String(formData.get("comments") ?? "").trim(),
      approvedForExecution: formData.get("approvedForExecution") === "on"
    });

    redirect(withBasePath(`/cases/${id}/closing-diligence`));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Closing Diligence</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{caseItem.title}</h1>
              <p>
                This is the separate title, insurance, and tax gate. Document review can be approved by legal,
                but Turicum LLC should still hold execution until closing diligence is cleared.
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Document review</p>
                  <strong>{legalReview?.status?.replaceAll("_", " ") ?? "pending"}</strong>
                  <p className="helper">lawyer gate</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Closing diligence</p>
                  <strong>{(closingDiligence?.status ?? "pending").replaceAll("_", " ")}</strong>
                  <p className="helper">title / insurance / tax</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Execution</p>
                  <strong>{closingDiligence?.approvedForExecution ? "cleared" : "blocked"}</strong>
                  <p className="helper">this gate must clear too</p>
                </div>
              </div>
              <div className="form-actions">
                <Link className="secondary-button" href={withBasePath(`/cases/${id}`)}>Back to case</Link>
                <Link className="secondary-button" href={withBasePath(`/cases/${id}/legal-review`)}>Open document review</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead">
            <p className="eyebrow">Document ownership</p>
            <h2>Which items belong to the title agency and which stay with Turicum LLC</h2>

            <p className="eyebrow">Title agency / outside closing vendor</p>
            <ul className="list">
              {buckets.titleAgencyDocuments.length > 0 ? buckets.titleAgencyDocuments.map((item) => (
                <li key={item.code}>
                  <strong>{item.label}:</strong> {item.reason}
                </li>
              )) : (
                <li>Title commitment, marked-up title, title policy, and closing-settlement items belong here when they apply.</li>
              )}
            </ul>

            <p className="eyebrow" style={{ marginTop: 16 }}>Turicum LLC-owned paper and follow-up</p>
            <ul className="list">
              {buckets.turicumPreparedDocuments.length > 0 ? buckets.turicumPreparedDocuments.map((item) => (
                <li key={item.code}>
                  <strong>{item.label}:</strong> {item.reason}
                </li>
              )) : (
                <li>Turicum LLC continues to own the core legal paper stack, closing instructions, and execution prep.</li>
              )}
            </ul>
          </div>

          <div className="panel">
            <p className="eyebrow">Google Drive references</p>
            <h2>Keep title, insurance, and tax support one click away</h2>
            <ul className="list">
              {buildGoogleDriveFolderHref(legalSelection?.googleDriveFolderId) ? (
                <li>
                  <strong>Case folder:</strong>{" "}
                  <a href={buildGoogleDriveFolderHref(legalSelection?.googleDriveFolderId) ?? "#"} target="_blank" rel="noreferrer">
                    open Drive folder
                  </a>
                </li>
              ) : null}
              {buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) ? (
                <li>
                  <strong>Lead legal file:</strong>{" "}
                  <a href={buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) ?? "#"} target="_blank" rel="noreferrer">
                    open saved Drive file
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
              {!buildGoogleDriveFolderHref(legalSelection?.googleDriveFolderId) &&
              !buildGoogleDriveFileHref(legalSelection?.googleDriveFileId) &&
              driveDocuments.length === 0 ? (
                <li>No Google Drive references are attached to this case yet.</li>
              ) : null}
            </ul>
            <p className="helper">
              Title and outside vendors stay external. Turicum LLC should capture who owns the task and where the supporting Drive files live.
            </p>
          </div>

          <div className="panel">
            <p className="eyebrow">Closing diligence gate</p>
            <h2>Record title, insurance, and tax review separately</h2>
            <form action={saveDiligence} className="form-grid">
              <label className="field">
                <span>Title company</span>
                <input name="titleCompanyName" type="text" defaultValue={closingDiligence?.titleCompanyName ?? ""} placeholder="Selected case by case" />
              </label>

              <label className="field">
                <span>Overall diligence status</span>
                <select name="status" defaultValue={closingDiligence?.status ?? "pending"}>
                  {statusOptions.map((value) => (
                    <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>

              <div className="three-up">
                <label className="field">
                  <span>Title work</span>
                  <select name="titleStatus" defaultValue={closingDiligence?.titleStatus ?? "pending"}>
                    {vendorStatusOptions.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Insurance</span>
                  <select name="insuranceStatus" defaultValue={closingDiligence?.insuranceStatus ?? "pending"}>
                    {vendorStatusOptions.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Tax</span>
                  <select name="taxStatus" defaultValue={closingDiligence?.taxStatus ?? "pending"}>
                    {vendorStatusOptions.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Summary</span>
                <textarea
                  name="summary"
                  rows={4}
                  defaultValue={closingDiligence?.summary ?? "Title company, insurance, and tax diligence still need to be reviewed separately from legal document review."}
                />
              </label>

              <label className="field">
                <span>Comments</span>
                <textarea
                  name="comments"
                  rows={6}
                  defaultValue={closingDiligence?.comments ?? ""}
                  placeholder="Record who is handling title, what is still missing, and whether insurance or tax follow-up is holding execution."
                />
              </label>

              <label className="checkbox-item">
                <input type="checkbox" name="approvedForExecution" defaultChecked={closingDiligence?.approvedForExecution ?? false} />
                <span>
                  <strong>Closing diligence cleared for execution</strong>
                  <small>Only check this after title work, insurance, and tax review are all in a send-ready state.</small>
                </span>
              </label>

              <div className="form-actions">
                <button type="submit">Save closing diligence</button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
