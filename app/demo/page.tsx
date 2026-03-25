import Link from "next/link";
import { AtlasNav } from "@/components/atlas/nav";
import { getCaseLegalSelection } from "@/lib/atlas/case-legal-selection";
import { getBorrowerPortalByCaseId } from "@/lib/atlas/intake";
import { withBasePath } from "@/lib/atlas/runtime";
import {
  ATLAS_DEMO_BORROWER_TOKEN,
  ATLAS_DEMO_CASE_CODE,
  ATLAS_DEMO_CASE_ID,
  ATLAS_DEMO_CASE_TITLE
} from "@/lib/atlas/demo";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString();
}

export default async function DemoPage() {
  const lenderCaseHref = withBasePath(`/cases/${ATLAS_DEMO_CASE_ID}`);
  const intakeHref = withBasePath(`/cases/${ATLAS_DEMO_CASE_ID}/intake`);
  const borrowerHref = withBasePath(`/borrower/${ATLAS_DEMO_BORROWER_TOKEN}`);
  const overviewHref = withBasePath("/review");
  const legalSelection = await getCaseLegalSelection(ATLAS_DEMO_CASE_ID);
  const portal = await getBorrowerPortalByCaseId(ATLAS_DEMO_CASE_ID);
  const latestDraft = portal?.signatureRequests?.[0] ?? null;

  const lenderSteps = [
    "Open the case detail and review the packet, checklist, and any linked Google Drive documents.",
    "Move into the intake workspace and confirm borrower contact info plus the assigned forms.",
    "Queue or update the Google Workspace signature request and watch the request timeline change."
  ];

  const borrowerSteps = [
    "Open the borrower portal in another browser or a private window.",
    "Fill in the commercial loan application and the two signature-required packets.",
    "Return to the lender workspace and mark the signature request as sent, viewed, and signed to simulate the full handoff."
  ];

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Demo Flow</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Greenwood test flow.</h1>
              <p>
                {ATLAS_DEMO_CASE_TITLE} · {ATLAS_DEMO_CASE_CODE}
              </p>
            </div>
            <div className="hero-aside">
              <AtlasNav />
              <div className="dashboard-band">
                <div className="pill"><strong>Case:</strong> {ATLAS_DEMO_CASE_CODE}</div>
                <div className="pill"><strong>Roles:</strong> lender + borrower</div>
                <div className="pill"><strong>Security:</strong> /atlas protected</div>
              </div>
              <p className="helper">Run lender first. Then borrower.</p>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel">
            <p className="eyebrow">Lender Track</p>
            <h2>Run the lender-side workflow</h2>
            <p>Review the case, confirm the template, prepare the draft.</p>
            <div className="form-actions">
              <Link className="secondary-button" href={overviewHref}>Open secure overview</Link>
              <Link className="secondary-button" href={lenderCaseHref}>Open case detail</Link>
              <Link className="secondary-button" href={intakeHref}>Open intake workspace</Link>
            </div>
            <ul className="list">
              {lenderSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <p className="eyebrow">Borrower Track</p>
            <h2>Simulate the borrower handoff</h2>
            <p>Open the portal separately, complete the packet, return to Turicum LLC.</p>
            <div className="portal-link-box">{borrowerHref}</div>
            <div className="form-actions">
              <Link className="secondary-button" href={borrowerHref}>Open borrower portal</Link>
            </div>
            <ul className="list">
              {borrowerSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="two-up">
          <div className="panel">
            <p className="eyebrow">Saved Legal Template</p>
            <h2>Current legal starting point</h2>
            {legalSelection ? (
              <>
                <p>
                  <strong>{legalSelection.precedentTitle}</strong>
                </p>
                <p className="helper">
                  {legalSelection.state} {legalSelection.structureType} · {legalSelection.documentType}
                </p>
                {legalSelection.sourceRelativePath ? (
                  <p className="helper">Source file: {legalSelection.sourceRelativePath}</p>
                ) : null}
                <p className="helper">
                  Selected {formatTimestamp(legalSelection.selectedAt) ?? "recently"}
                </p>
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath(`/library/templates/${encodeURIComponent(legalSelection.groupKey)}`)}>
                    Review template detail
                  </Link>
                  <Link className="secondary-button" href={intakeHref}>
                    Open intake with saved template
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p>No template is saved on the Greenwood demo case yet.</p>
                <div className="form-actions">
                  <Link className="secondary-button" href={withBasePath("/library/templates")}>
                    Choose a template
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="panel">
            <p className="eyebrow">Latest Draft Status</p>
            <h2>Where execution currently stands</h2>
            {latestDraft ? (
              <>
                <p>
                  <strong>{latestDraft.title}</strong>
                </p>
                <p className="helper">
                  {latestDraft.status} · {latestDraft.provider.replaceAll("_", " ")}
                </p>
                {latestDraft.providerRequestId ? (
                  <p className="helper">Draft ID: {latestDraft.providerRequestId}</p>
                ) : null}
                {latestDraft.createdAt ? (
                  <p className="helper">Prepared {formatTimestamp(latestDraft.createdAt) ?? latestDraft.createdAt}</p>
                ) : null}
                <div className="form-actions">
                  <Link className="secondary-button" href={intakeHref}>
                    Open signature queue
                  </Link>
                  {latestDraft.providerUrl ? (
                    <a className="secondary-button" href={latestDraft.providerUrl} target="_blank" rel="noreferrer">
                      Open current draft link
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p>No draft has been prepared yet for the Greenwood walkthrough.</p>
                <div className="form-actions">
                  <Link className="secondary-button" href={intakeHref}>
                    Prepare a draft from intake
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
