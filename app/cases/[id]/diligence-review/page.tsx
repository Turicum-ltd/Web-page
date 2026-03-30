import Link from "next/link";
import { notFound } from "next/navigation";
import { TuricumNav } from "@/components/turicum/nav";
import { CaseWorkspaceTabs } from "@/components/turicum/case-workspace-tabs";
import { verifyCaseDocumentAction } from "@/app/cases/[id]/diligence-review/actions";
import { getCaseById } from "@/lib/turicum/cases";
import {
  listCaseDocuments,
  resolveExternalDocumentHref
} from "@/lib/turicum/case-documents";
import { getLatestCommercialLoanApplicationByEmail } from "@/lib/turicum/commercial-loan-applications";
import { getBorrowerPortalByCaseId } from "@/lib/turicum/intake";
import { getCategoryLabel, getDocumentTypeLabel } from "@/lib/turicum/state-packs";
import { withBasePath } from "@/lib/turicum/runtime";
import type { CaseDocumentRecord } from "@/lib/turicum/types";

export const dynamic = "force-dynamic";

function isVerifiedStatus(status: CaseDocumentRecord["status"]) {
  return status === "approved" || status === "signed" || status === "recorded" || status === "final";
}

function getDiligenceStatus(status: CaseDocumentRecord["status"]) {
  if (isVerifiedStatus(status)) {
    return {
      label: "Verified",
      className: "turicum-status-pill is-active"
    };
  }

  if (status === "under_review") {
    return {
      label: "In Review",
      className: "turicum-status-pill is-pending"
    };
  }

  return {
    label: "Action Required",
    className: "turicum-status-pill is-inactive"
  };
}

function formatTimestamp(value: string | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatCurrency(value: number | string | null | undefined | unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(parsed);
}

function normalizeText(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined) {
    return "Not provided";
  }

  const text = String(value).trim();
  return text || "Not provided";
}

function buildApplicationSections(
  caseTitle: string,
  portal: Awaited<ReturnType<typeof getBorrowerPortalByCaseId>>,
  application: Awaited<ReturnType<typeof getLatestCommercialLoanApplicationByEmail>>
) {
  if (application) {
    return [
      {
        title: "Profile",
        rows: [
          ["Borrower", normalizeText(application.primaryBorrowerName)],
          ["Email", normalizeText(application.primaryBorrowerEmail)],
          ["Phone", normalizeText(application.primaryBorrowerPhone)],
          ["Co-Borrower", normalizeText(application.coBorrowerName)],
          ["Co-Borrower Email", normalizeText(application.coBorrowerEmail)],
          ["Current Address", normalizeText(application.profile.currentAddress)],
          ["Former Address", normalizeText(application.profile.formerAddress)],
          ["Annual Income", formatCurrency(application.annualIncome)]
        ]
      },
      {
        title: "Financials",
        rows: [
          ["Cash", formatCurrency(application.financials.cashOnHand)],
          ["Real Estate", formatCurrency(application.financials.realEstateAssets)],
          ["Retirement", formatCurrency(application.financials.retirementAssets)],
          ["Mortgages", formatCurrency(application.financials.mortgageDebt)],
          ["Creditors", formatCurrency(application.financials.creditorDebt)],
          ["Other Liabilities", formatCurrency(application.financials.otherLiabilities)]
        ]
      },
      {
        title: "Subject Property",
        rows: [
          ["Requested Amount", formatCurrency(application.requestedAmount)],
          ["Property Address", normalizeText(application.propertyAddress)],
          ["Property Type", normalizeText(application.propertyType)],
          ["Borrowing Entity", normalizeText(application.borrowingEntityName)]
        ]
      },
      {
        title: "Declarations",
        rows: [
          ["Bankruptcies", normalizeText(application.declarations.bankruptcyHistory)],
          ["Foreclosures / Deeds in Lieu", normalizeText(application.declarations.foreclosureHistory)],
          ["Lawsuits", normalizeText(application.declarations.lawsuitHistory)],
          ["Judgments", normalizeText(application.declarations.judgmentHistory)],
          ["Delinquent Debt", normalizeText(application.declarations.delinquentDebtHistory)],
          ["Tax Liens", normalizeText(application.declarations.taxLienHistory)],
          ["Electronic Consent Name", normalizeText(application.declarations.consentFullLegalName)],
          ["Signed At", normalizeText(application.declarations.signedAt)],
          ["Signed IP", normalizeText(application.declarations.signedIpAddress)],
          ["Notes", normalizeText(application.declarations.notes)]
        ]
      }
    ];
  }

  const fallback = portal?.formResponses.commercial_loan_application;

  if (!fallback) {
    return [
      {
        title: "Digital Application",
        rows: [["Status", "No borrower application has been submitted for this case yet."]]
      }
    ];
  }

  return [
    {
      title: "Digital Application",
      rows: [
        ["Borrower", normalizeText(portal?.borrowerName || caseTitle)],
        ["Email", normalizeText(portal?.borrowerEmail)],
        ["Requested Amount", normalizeText(fallback.requestedAmount)],
        ["Property Address", normalizeText(fallback.propertyAddress)],
        ["Loan Purpose", normalizeText(fallback.loanPurpose)],
        ["Portal Status", normalizeText(portal?.portalStatus)]
      ]
    }
  ];
}

export default async function CaseDiligenceReviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseRecord = await getCaseById(id);

  if (!caseRecord) {
    notFound();
  }

  const portal = await getBorrowerPortalByCaseId(id);
  const borrowerEmail = portal?.borrowerEmail?.trim().toLowerCase() ?? "";
  const application = borrowerEmail ? await getLatestCommercialLoanApplicationByEmail(borrowerEmail) : null;
  const documents = await listCaseDocuments(id);
  const allVerified = documents.length > 0 && documents.every((document) => isVerifiedStatus(document.status));
  const canGenerateStatePack = allVerified && Boolean(application || portal?.formResponses.commercial_loan_application);
  const applicationSections = buildApplicationSections(caseRecord.title, portal, application);

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Case Diligence Review</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{caseRecord.title}</h1>
              <p>
                {caseRecord.code} · {caseRecord.state} · {caseRecord.structureType}
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="pill">
                  <strong>Application:</strong> {application ? "Linked" : portal?.formResponses.commercial_loan_application ? "Portal draft" : "Missing"}
                </div>
                <div className="pill">
                  <strong>Documents:</strong> {documents.length}
                </div>
                <div className="pill">
                  <strong>Verified:</strong> {documents.filter((document) => isVerifiedStatus(document.status)).length}/{documents.length}
                </div>
              </div>
              <p className="helper">Review the borrower file, verify each document, then generate a counsel-ready pack.</p>
              <div className="form-actions">
                <Link className="secondary-button" href={withBasePath(`/cases/${id}`)}>
                  Back to case
                </Link>
              </div>
            </div>
          </div>
        </section>

        <CaseWorkspaceTabs caseId={id} activeTab="diligence" />

        <section className="panel subtle turicum-diligence-callout">
          <div>
            <p className="eyebrow">Readiness</p>
            <h2>Diligence handoff status</h2>
            <p>
              {canGenerateStatePack
                ? "Everything required for staff counsel is verified. Generate the state pack when you are ready."
                : "Keep moving down the file set. The state pack unlocks automatically when every current document is verified."}
            </p>
          </div>
          {canGenerateStatePack ? (
            <div className="form-actions">
              <a
                className="turicum-primary-button"
                href={withBasePath(`/api/cases/${id}/state-pack`)}
              >
                Generate State Pack
              </a>
            </div>
          ) : null}
        </section>

        <section className="turicum-diligence-grid">
          <div className="panel turicum-diligence-panel">
            <div className="turicum-diligence-panel-head">
              <div>
                <p className="eyebrow">Borrower Intake</p>
                <h2>Digital application</h2>
              </div>
              <p className="helper">
                {application
                  ? `Latest synced application · ${formatTimestamp(application.createdAt)}`
                  : portal?.updatedAt
                    ? `Borrower portal snapshot · ${formatTimestamp(portal.updatedAt)}`
                    : "Waiting on borrower submission"}
              </p>
            </div>
            <div className="turicum-diligence-sections">
              {applicationSections.map((section) => (
                <div key={section.title} className="turicum-diligence-section">
                  <h3>{section.title}</h3>
                  <dl className="turicum-diligence-definition-list">
                    {section.rows.map(([label, value]) => (
                      <div key={`${section.title}-${label}`}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>

          <div className="panel turicum-diligence-panel">
            <div className="turicum-diligence-panel-head">
              <div>
                <p className="eyebrow">File Review</p>
                <h2>Uploaded documents</h2>
              </div>
              <p className="helper">
                Verify each item as it clears diligence so counsel receives a clean pack.
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="panel subtle">
                <p className="helper">No documents are attached to this case yet. Add them from the main case workspace first.</p>
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath(`/cases/${id}`)}>
                    Open case workspace
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="turicum-diligence-document-list">
                {documents.map((document) => {
                  const status = getDiligenceStatus(document.status);
                  const href = resolveExternalDocumentHref(document.storagePath);

                  return (
                    <li key={document.id}>
                      <div className="turicum-diligence-document-copy">
                        <div className="turicum-diligence-document-row">
                          <strong>{document.title}</strong>
                          <span className={status.className}>
                            <span className="turicum-status-dot" />
                            {status.label}
                          </span>
                        </div>
                        <p className="helper">
                          {getDocumentTypeLabel(document.documentTypeCode)} · {getCategoryLabel(document.category)} · Uploaded {formatTimestamp(document.uploadedAt)}
                        </p>
                        <p className="helper">
                          Source: {href ? "Google Drive" : "Turicum upload"}
                          {href ? (
                            <>
                              {" · "}
                              <a href={href} target="_blank" rel="noreferrer">
                                Open source file
                              </a>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="turicum-diligence-document-actions">
                        <form action={verifyCaseDocumentAction}>
                          <input type="hidden" name="caseId" value={id} />
                          <input type="hidden" name="documentId" value={document.id} />
                          <button
                            type="submit"
                            className={isVerifiedStatus(document.status) ? "secondary-button is-active" : "secondary-button"}
                            disabled={isVerifiedStatus(document.status)}
                          >
                            {isVerifiedStatus(document.status) ? "Verified" : "Verify"}
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
