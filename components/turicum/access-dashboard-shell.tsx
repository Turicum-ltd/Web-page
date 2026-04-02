"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccessUserTable } from "@/components/turicum/access-user-table";
import { BorrowerInviteLedger } from "@/components/turicum/borrower-invite-ledger";
import { ConfirmActionForm } from "@/components/turicum/confirm-action-form";
import { GeneratedPasswordField } from "@/components/turicum/generated-password-field";
import { InvestorGrantForm } from "@/components/turicum/investor-grant-form";
import type {
  AccessAdminSnapshot,
  AdminAuditLogEntry,
  StaffRole
} from "@/lib/turicum/access-admin";

interface AccessDashboardShellProps {
  snapshot: AccessAdminSnapshot;
  activeCases: Array<{
    id: string;
    code: string;
    title: string;
    stage: string;
  }>;
  currentCaseId?: string;
  caseWorkspaceHref: string;
  saveStaffUser: (formData: FormData) => Promise<void>;
  saveInvestorUser: (formData: FormData) => Promise<void>;
  saveInvestorGrant: (formData: FormData) => Promise<{
    ok: boolean;
    count?: number;
    email?: string;
    message?: string;
  }>;
  saveBorrowerInvite: (formData: FormData) => Promise<void>;
  toggleUserStatus: (formData: FormData) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  loadAuditHistory: (targetUserEmail: string) => Promise<AdminAuditLogEntry[]>;
  refreshInvite: (formData: FormData) => Promise<{
    ok: boolean;
    expiresAt?: string;
    message?: string;
  }>;
  revokeInvite: (formData: FormData) => Promise<void>;
  revokeGrant: (formData: FormData) => Promise<void>;
  generateApplicationLink: (leadId: string) => Promise<{
    ok: boolean;
    url?: string;
    message?: string;
  }>;
  saveBorrowerLeadReview: (formData: FormData) => Promise<{
    ok: boolean;
    lead?: AccessAdminSnapshot["preIntakeLeads"][number];
    message?: string;
  }>;
  sendBorrowerApplicationAccess: (formData: FormData) => Promise<{
    ok: boolean;
    lead?: AccessAdminSnapshot["preIntakeLeads"][number];
    url?: string;
    message?: string;
  }>;
  staffRoleOptions: Array<{ value: StaffRole; label: string }>;
}

type CreateUserMode = "staff" | "investor";
type AccessTab = "team" | "investor" | "borrower";
type BorrowerLead = AccessAdminSnapshot["preIntakeLeads"][number];
type BorrowerLeadDraft = {
  fullName: string;
  email: string;
  phone: string;
  requestedAmount: string;
  assetLocation: string;
  propertyType: string;
  assetDescription: string;
  ownershipStatus: string;
  purchaseDate: string;
  purchasePrice: string;
  capitalInvested: string;
  existingLiens: string;
  titleHeld: string;
  estimatedValue: string;
  valueBasis: string;
  preferredTimeline: string;
};

const BORROWER_REVIEW_FIELDS: Array<{
  name: keyof BorrowerLeadDraft;
  label: string;
  type?: "text" | "email" | "tel";
  multiline?: boolean;
}> = [
  { name: "fullName", label: "Borrower name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "requestedAmount", label: "Requested amount" },
  { name: "assetLocation", label: "Asset location" },
  { name: "propertyType", label: "Property type" },
  { name: "preferredTimeline", label: "Timeline" },
  { name: "ownershipStatus", label: "Ownership status" },
  { name: "purchaseDate", label: "Purchase date" },
  { name: "purchasePrice", label: "Purchase price" },
  { name: "capitalInvested", label: "Capital invested" },
  { name: "estimatedValue", label: "Estimated value" },
  { name: "valueBasis", label: "Value basis" },
  { name: "titleHeld", label: "Title held" },
  { name: "existingLiens", label: "Existing liens", multiline: true },
  { name: "assetDescription", label: "Asset description", multiline: true }
];

function buildBorrowerLeadDraft(lead: BorrowerLead): BorrowerLeadDraft {
  return {
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    requestedAmount: lead.requestedAmount,
    assetLocation: lead.assetLocation,
    propertyType: lead.propertyType,
    assetDescription: lead.assetDescription,
    ownershipStatus: lead.ownershipStatus,
    purchaseDate: lead.purchaseDate,
    purchasePrice: lead.purchasePrice,
    capitalInvested: lead.capitalInvested,
    existingLiens: lead.existingLiens,
    titleHeld: lead.titleHeld,
    estimatedValue: lead.estimatedValue,
    valueBasis: lead.valueBasis,
    preferredTimeline: lead.preferredTimeline
  };
}

function buildLeadDraftMap(leads: BorrowerLead[]) {
  return Object.fromEntries(leads.map((lead) => [lead.id, buildBorrowerLeadDraft(lead)])) as Record<
    string,
    BorrowerLeadDraft
  >;
}

function buildBorrowerLeadFormData(leadId: string, draft: BorrowerLeadDraft) {
  const formData = new FormData();
  formData.set("leadId", leadId);

  for (const [key, value] of Object.entries(draft)) {
    formData.set(key, value);
  }

  return formData;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AccessDashboardShell({
  snapshot,
  activeCases,
  currentCaseId,
  caseWorkspaceHref,
  saveStaffUser,
  saveInvestorUser,
  saveInvestorGrant,
  saveBorrowerInvite,
  toggleUserStatus,
  deleteUser,
  loadAuditHistory,
  refreshInvite,
  revokeInvite,
  revokeGrant,
  generateApplicationLink,
  saveBorrowerLeadReview,
  sendBorrowerApplicationAccess,
  staffRoleOptions
}: AccessDashboardShellProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateUserMode>("staff");
  const [activeTab, setActiveTab] = useState<AccessTab>("team");
  const [leadRecords, setLeadRecords] = useState<BorrowerLead[]>(snapshot.preIntakeLeads);
  const [leadDrafts, setLeadDrafts] = useState<Record<string, BorrowerLeadDraft>>(
    buildLeadDraftMap(snapshot.preIntakeLeads)
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(snapshot.preIntakeLeads[0]?.id ?? null);
  const [leadActionState, setLeadActionState] = useState<
    Record<string, { url?: string; success?: string; message?: string }>
  >({});
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const activeStaffCount = useMemo(
    () => snapshot.staffUsers.filter((user) => user.isActive).length,
    [snapshot.staffUsers]
  );
  const activeInvestorCount = useMemo(
    () => snapshot.investorUsers.filter((user) => user.isActive).length,
    [snapshot.investorUsers]
  );
  const selectedLead = useMemo(
    () => leadRecords.find((lead) => lead.id === selectedLeadId) ?? leadRecords[0] ?? null,
    [leadRecords, selectedLeadId]
  );
  const selectedLeadDraft = selectedLead ? leadDrafts[selectedLead.id] ?? buildBorrowerLeadDraft(selectedLead) : null;

  useEffect(() => {
    setLeadRecords(snapshot.preIntakeLeads);
    setLeadDrafts(buildLeadDraftMap(snapshot.preIntakeLeads));
    setSelectedLeadId((current) =>
      current && snapshot.preIntakeLeads.some((lead) => lead.id === current)
        ? current
        : snapshot.preIntakeLeads[0]?.id ?? null
    );
  }, [snapshot.preIntakeLeads]);

  function syncLeadRecord(updatedLead: BorrowerLead) {
    setLeadRecords((current) =>
      current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
    );
    setLeadDrafts((current) => ({
      ...current,
      [updatedLead.id]: buildBorrowerLeadDraft(updatedLead)
    }));
  }

  async function handleLeadSave(leadId: string) {
    const draft = leadDrafts[leadId];

    if (!draft) {
      return;
    }

    setActiveLeadId(leadId);
    const result = await saveBorrowerLeadReview(buildBorrowerLeadFormData(leadId, draft));

    if (result.ok && result.lead) {
      syncLeadRecord(result.lead);
      setLeadActionState((current) => ({
        ...current,
        [leadId]: {
          ...current[leadId],
          success: "Answers updated after the call.",
          message: undefined
        }
      }));
      router.refresh();
    } else {
      setLeadActionState((current) => ({
        ...current,
        [leadId]: {
          ...current[leadId],
          success: undefined,
          message: result.message ?? "Borrower lead could not be updated."
        }
      }));
    }

    setActiveLeadId(null);
  }

  async function handleLeadSend(leadId: string) {
    const draft = leadDrafts[leadId];

    if (!draft) {
      return;
    }

    setActiveLeadId(leadId);
    const result = await sendBorrowerApplicationAccess(buildBorrowerLeadFormData(leadId, draft));

    if (result.ok && result.lead) {
      syncLeadRecord(result.lead);
      setLeadActionState((current) => ({
        ...current,
        [leadId]: {
          ...current[leadId],
          url: result.url,
          success: "Application login email queued for the borrower.",
          message: undefined
        }
      }));
      router.refresh();
    } else {
      setLeadActionState((current) => ({
        ...current,
        [leadId]: {
          ...current[leadId],
          success: undefined,
          message: result.message ?? "Borrower application access email could not be queued."
        }
      }));
    }

    setActiveLeadId(null);
  }

  async function handleGenerateLink(leadId: string) {
    setActiveLeadId(leadId);
    const result = await generateApplicationLink(leadId);

    setLeadActionState((current) => ({
      ...current,
      [leadId]: result.ok
        ? {
            ...current[leadId],
            url: result.url,
            success: "Application link refreshed.",
            message: undefined
          }
        : {
            ...current[leadId],
            success: undefined,
            message: result.message ?? "Application link could not be generated."
          }
    }));

    if (result.ok && navigator.clipboard?.writeText && result.url) {
      void navigator.clipboard.writeText(result.url);
      router.refresh();
    }

    setActiveLeadId(null);
  }

  return (
    <div className="turicum-access-dashboard-shell">
      <section className="panel turicum-access-card turicum-access-card-active turicum-access-header-panel">
        <div className="turicum-access-header-row">
          <div className="turicum-access-summary-grid">
            <article className="band-card turicum-access-summary-card">
              <p className="eyebrow">Active Staff</p>
              <strong>{activeStaffCount}</strong>
              <p className="helper">internal operators with live access</p>
            </article>
            <article className="band-card turicum-access-summary-card">
              <p className="eyebrow">Active Investors</p>
              <strong>{activeInvestorCount}</strong>
              <p className="helper">investor identities ready for portal use</p>
            </article>
            <article className="band-card turicum-access-summary-card">
              <p className="eyebrow">Pending Inquiries</p>
              <strong>{snapshot.pendingInquiriesCount}</strong>
              <p className="helper">investor package requests awaiting follow-up</p>
            </article>
            <article className="band-card turicum-access-summary-card">
              <p className="eyebrow">Incoming Calls</p>
              <strong>{snapshot.incomingCallsCount}</strong>
              <p className="helper">borrower leads waiting for follow-up or an application link</p>
            </article>
          </div>
          <button
            type="button"
            className="turicum-access-create-button"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className="turicum-access-create-button-icon" aria-hidden="true">
              <PlusIcon />
            </span>
            <span>+ Create New User</span>
          </button>
        </div>
      </section>

      <section className="panel turicum-access-card turicum-access-tab-panel">
        <div className="turicum-access-tab-switcher" role="tablist" aria-label="Access workspace sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "team"}
            className={`turicum-access-tab${activeTab === "team" ? " is-active" : ""}`}
            onClick={() => setActiveTab("team")}
          >
            <span>Team Management</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "investor"}
            className={`turicum-access-tab${activeTab === "investor" ? " is-active" : ""}`}
            onClick={() => setActiveTab("investor")}
          >
            <span>Investor Relations</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "borrower"}
            className={`turicum-access-tab${activeTab === "borrower" ? " is-active" : ""}`}
            onClick={() => setActiveTab("borrower")}
          >
            <span>Borrower Intake</span>
          </button>
        </div>
      </section>

      {activeTab === "team" ? (
        <div className="turicum-access-main-column">
          <section className="panel turicum-access-card turicum-access-card-active turicum-access-launch-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Staff accounts</p>
                <h2>Create internal operators, then review their access history.</h2>
              </div>
              <button
                type="button"
                className="turicum-access-inline-launch"
                onClick={() => {
                  setCreateMode("staff");
                  setIsCreateModalOpen(true);
                }}
              >
                Create Staff User
              </button>
            </div>
            <p className="helper">
              Team Management keeps staff creation, the current staff table, and the audit history drawer in one lane.
            </p>
          </section>

          <AccessUserTable
            eyebrow="Current staff"
            title="Named internal access"
            variant="staff"
            users={snapshot.staffUsers}
            accessibleCases={activeCases.map((item) => ({
              id: item.id,
              code: item.code,
              title: item.title
            }))}
            toggleUserStatus={toggleUserStatus}
            deleteUser={deleteUser}
            loadAuditHistory={loadAuditHistory}
          />
        </div>
      ) : null}

      {activeTab === "investor" ? (
        <div className="turicum-access-main-column">
          <section className="panel turicum-access-card turicum-access-card-active turicum-access-launch-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Investor accounts</p>
                <h2>Create investor identities and control case visibility from one lane.</h2>
              </div>
              <button
                type="button"
                className="turicum-access-inline-launch"
                onClick={() => {
                  setCreateMode("investor");
                  setIsCreateModalOpen(true);
                }}
              >
                Create Investor User
              </button>
            </div>
            <p className="helper">
              Investor Relations combines investor account creation, the current investor table, and case visibility grants.
            </p>
          </section>

          <section className="two-up turicum-access-table-grid">
            <section className="panel turicum-access-card turicum-access-card-active">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Case access grants</p>
                  <h2>Give an investor access to active cases</h2>
                </div>
              </div>
              <InvestorGrantForm
                cases={activeCases}
                defaultCaseId={currentCaseId}
                saveInvestorGrant={saveInvestorGrant}
              />
              <p className="helper">
                Investor accounts only see cases that have explicit `turicum_case_access_grants` rows.
              </p>
            </section>

            <div className="panel turicum-access-card">
              <AccessUserTable
                eyebrow="Current investors"
                title="Investor identities and grants"
                variant="investor"
                users={snapshot.investorUsers}
                accessibleCases={snapshot.investorGrants.map((grant) => ({
                  id: grant.id,
                  userId: grant.userId,
                  code: grant.caseCode,
                  title: grant.caseTitle,
                  accessRole: grant.accessRole,
                  expiresAt: grant.expiresAt
                }))}
                toggleUserStatus={toggleUserStatus}
                deleteUser={deleteUser}
                loadAuditHistory={loadAuditHistory}
              />

              <div className="section-head" style={{ marginTop: 24 }}>
                <div>
                  <p className="eyebrow">Case access</p>
                  <h2>Current investor visibility grants</h2>
                </div>
              </div>
              <ul className="list compact-list">
                {snapshot.investorGrants.map((grant) => (
                  <li key={grant.id}>
                    <strong>{grant.userEmail}</strong> {"->"} {grant.caseCode}
                    <br />
                    <span className="helper">
                      {grant.caseTitle}
                      {grant.expiresAt
                        ? ` · expires ${new Date(grant.expiresAt).toLocaleString("en-US")}`
                        : " · no expiry"}
                    </span>
                    <ConfirmActionForm
                      action={revokeGrant}
                      className="form-actions"
                      style={{ marginTop: 8 }}
                      confirmMessage={`Are you sure you want to change access for ${grant.userEmail}? This action can be undone later by an admin.`}
                    >
                      <input type="hidden" name="grantId" value={grant.id} />
                      <button type="submit" className="turicum-destructive-button">
                        Revoke grant
                      </button>
                    </ConfirmActionForm>
                  </li>
                ))}
                {snapshot.investorGrants.length === 0 ? <li>No investor case grants yet.</li> : null}
              </ul>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "borrower" ? (
        <div className="two-up turicum-access-table-grid">
          <section className="panel turicum-access-card turicum-access-card-active">
            <div className="section-head">
              <div>
                <p className="eyebrow">Incoming calls</p>
                <h2>Open the supplied answers, then move each borrower into the full application</h2>
              </div>
              <Link className="secondary-button" href={caseWorkspaceHref}>
                Back to Case
              </Link>
            </div>
            <div className="turicum-access-incoming-calls">
              {leadRecords.length ? (
                <ul className="turicum-access-lead-list">
                  {leadRecords.map((lead) => (
                    <li key={lead.id} className="turicum-access-lead-card">
                      <div className="turicum-access-lead-head">
                        <div>
                          <strong>{lead.fullName}</strong>
                          <p className="helper">
                            {lead.email} · {lead.phone}
                          </p>
                        </div>
                        <span className="status-chip">{lead.status.replace(/_/g, " ")}</span>
                      </div>
                      <div className="turicum-access-lead-meta">
                        <p><strong>Amount:</strong> {lead.requestedAmount}</p>
                        <p><strong>Property:</strong> {lead.propertyType}</p>
                        <p><strong>Location:</strong> {lead.assetLocation}</p>
                        <p><strong>Timeline:</strong> {lead.preferredTimeline}</p>
                      </div>
                      <p className="helper">{lead.assetDescription}</p>
                      <div className="turicum-access-lead-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setSelectedLeadId(lead.id)}
                        >
                          {selectedLeadId === lead.id ? "Reviewing answers" : "Open supplied answers"}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleGenerateLink(lead.id)}
                          disabled={activeLeadId === lead.id}
                        >
                          {activeLeadId === lead.id ? "Working..." : "Copy application link"}
                        </button>
                      </div>
                      {leadActionState[lead.id]?.url ? (
                        <p className="helper turicum-access-link-output">{leadActionState[lead.id]?.url}</p>
                      ) : null}
                      {leadActionState[lead.id]?.success ? (
                        <p className="helper turicum-form-callout-success">
                          {leadActionState[lead.id]?.success}
                        </p>
                      ) : null}
                      {leadActionState[lead.id]?.message ? (
                        <p className="helper turicum-form-callout-error">{leadActionState[lead.id]?.message}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="helper">No incoming borrower call requests yet.</p>
              )}
            </div>
          </section>

          <section className="panel turicum-access-card turicum-access-card-active">
            <div className="section-head">
              <div>
                <p className="eyebrow">Post-call review</p>
                <h2>Update the supplied answers, then email secure application access</h2>
              </div>
            </div>
            {selectedLead && selectedLeadDraft ? (
              <div className="turicum-access-review-shell">
                <div className="turicum-access-review-header">
                  <div>
                    <strong>{selectedLead.fullName}</strong>
                    <p className="helper">
                      {selectedLead.email} · {selectedLead.phone}
                    </p>
                  </div>
                  <span className="status-chip">{selectedLead.status.replace(/_/g, " ")}</span>
                </div>
                <p className="helper">
                  Review the borrower’s supplied answers, correct them after the call, and then send the secure
                  application login email from here.
                </p>
                <div className="form-grid turicum-access-review-grid">
                  {BORROWER_REVIEW_FIELDS.map((field) => (
                    <label
                      key={field.name}
                      className={`field${field.multiline ? " turicum-access-review-field-full" : ""}`}
                    >
                      <span>{field.label}</span>
                      {field.multiline ? (
                        <textarea
                          rows={4}
                          value={selectedLeadDraft[field.name]}
                          onChange={(event) =>
                            setLeadDrafts((current) => ({
                              ...current,
                              [selectedLead.id]: {
                                ...current[selectedLead.id],
                                [field.name]: event.target.value
                              }
                            }))
                          }
                        />
                      ) : (
                        <input
                          type={field.type ?? "text"}
                          value={selectedLeadDraft[field.name]}
                          onChange={(event) =>
                            setLeadDrafts((current) => ({
                              ...current,
                              [selectedLead.id]: {
                                ...current[selectedLead.id],
                                [field.name]: event.target.value
                              }
                            }))
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
                <div className="form-actions turicum-access-review-actions">
                  <button
                    type="button"
                    onClick={() => void handleLeadSave(selectedLead.id)}
                    disabled={activeLeadId === selectedLead.id}
                  >
                    {activeLeadId === selectedLead.id ? "Saving..." : "Save updates"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void handleLeadSend(selectedLead.id)}
                    disabled={activeLeadId === selectedLead.id}
                  >
                    {activeLeadId === selectedLead.id ? "Sending..." : "Send application login"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void handleGenerateLink(selectedLead.id)}
                    disabled={activeLeadId === selectedLead.id}
                  >
                    {activeLeadId === selectedLead.id ? "Working..." : "Copy application link"}
                  </button>
                </div>
                {leadActionState[selectedLead.id]?.url ? (
                  <p className="helper turicum-access-link-output">
                    {leadActionState[selectedLead.id]?.url}
                  </p>
                ) : null}
                {leadActionState[selectedLead.id]?.success ? (
                  <p className="helper turicum-form-callout-success">
                    {leadActionState[selectedLead.id]?.success}
                  </p>
                ) : null}
                {leadActionState[selectedLead.id]?.message ? (
                  <p className="helper turicum-form-callout-error">
                    {leadActionState[selectedLead.id]?.message}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="helper">Select a borrower lead to review the supplied answers.</p>
            )}

            <div className="turicum-access-inline-divider" />

            <div className="section-head">
              <div>
                <p className="eyebrow">Borrower portal ledger</p>
                <h2>Direct borrower invite management</h2>
              </div>
            </div>
            <BorrowerInviteLedger
              invites={snapshot.borrowerInvites}
              refreshInvite={refreshInvite}
              revokeInvite={revokeInvite}
            />
            <div className="turicum-access-inline-divider" />
            <form action={saveBorrowerInvite} className="form-grid">
              <label className="field">
                <span>Case</span>
                <select name="caseId" required defaultValue={currentCaseId ?? ""}>
                  <option value="" disabled>
                    Select a case
                  </option>
                  {snapshot.cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Borrower name</span>
                <input name="borrowerName" type="text" required />
              </label>
              <label className="field">
                <span>Borrower email</span>
                <input name="borrowerEmail" type="email" required />
              </label>
              <label className="field">
                <span>Portal title</span>
                <input name="portalTitle" type="text" placeholder="Optional custom title" />
              </label>
              <div className="form-actions">
                <button type="submit">Create borrower invite</button>
              </div>
            </form>
            <p className="helper">
              Initializes the borrower portal if needed and syncs the invite into the ledger.
            </p>
          </section>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div
          className="turicum-access-modal-backdrop"
          onClick={() => setIsCreateModalOpen(false)}
          role="presentation"
        >
          <div
            className="turicum-access-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-create-user-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="turicum-access-modal-head">
              <div>
                <p className="eyebrow">Access admin</p>
                <h2 id="access-create-user-title">Create a new user</h2>
                <p className="helper">Create staff or investor identities without leaving the access workspace.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="turicum-access-modal-tabs" role="tablist" aria-label="Create user type">
              <button
                type="button"
                className={`turicum-access-modal-tab${createMode === "staff" ? " is-active" : ""}`}
                onClick={() => setCreateMode("staff")}
              >
                Staff User
              </button>
              <button
                type="button"
                className={`turicum-access-modal-tab${createMode === "investor" ? " is-active" : ""}`}
                onClick={() => setCreateMode("investor")}
              >
                Investor User
              </button>
            </div>

            {createMode === "staff" ? (
              <form action={saveStaffUser} className="form-grid">
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" required />
                </label>
                <label className="field">
                  <span>Full name</span>
                  <input name="fullName" type="text" required />
                </label>
                <GeneratedPasswordField name="password" label="Temporary password" required />
                <label className="field">
                  <span className="turicum-field-label">
                    <span>Role</span>
                    <span className="turicum-info-tooltip" tabIndex={0}>
                      <span className="turicum-info-tooltip-trigger" aria-label="Role permissions help">
                        i
                      </span>
                      <span className="turicum-info-tooltip-panel" role="tooltip">
                        <strong>Staff ops</strong>: Can manage documents and lead intake.
                        <br />
                        <strong>Staff admin</strong>: Can manage users, roles, and case visibility.
                        <br />
                        <strong>Staff counsel</strong>: View-only access to legal documents and AI reviews.
                      </span>
                    </span>
                  </span>
                  <select name="role" defaultValue="staff_ops">
                    {staffRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Organization</span>
                  <input name="organization" type="text" defaultValue="Turicum" />
                </label>
                <div className="form-actions">
                  <button type="submit">Save staff account</button>
                </div>
              </form>
            ) : (
              <form action={saveInvestorUser} className="form-grid">
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" required />
                </label>
                <label className="field">
                  <span>Full name</span>
                  <input name="fullName" type="text" required />
                </label>
                <GeneratedPasswordField name="password" label="Temporary password" required />
                <label className="field">
                  <span>Organization</span>
                  <input name="organization" type="text" defaultValue="Turicum Investor" />
                </label>
                <div className="form-actions">
                  <button type="submit">Save investor account</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
