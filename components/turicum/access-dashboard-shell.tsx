"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  staffRoleOptions: Array<{ value: StaffRole; label: string }>;
}

type CreateUserMode = "staff" | "investor";

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
  staffRoleOptions
}: AccessDashboardShellProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateUserMode>("staff");

  const activeStaffCount = useMemo(
    () => snapshot.staffUsers.filter((user) => user.isActive).length,
    [snapshot.staffUsers]
  );
  const activeInvestorCount = useMemo(
    () => snapshot.investorUsers.filter((user) => user.isActive).length,
    [snapshot.investorUsers]
  );

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

      <div className="turicum-access-workspace-grid">
        <div className="turicum-access-main-column">
          <section className="panel turicum-access-card turicum-access-card-active">
            <div className="section-head">
              <div>
                <p className="eyebrow">Investor grants</p>
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

          <section className="two-up turicum-access-table-grid">
            <AccessUserTable
              eyebrow="Current staff"
              title="Named internal access"
              variant="staff"
              users={snapshot.staffUsers}
              toggleUserStatus={toggleUserStatus}
              deleteUser={deleteUser}
              loadAuditHistory={loadAuditHistory}
            />

            <div className="panel turicum-access-card">
              <AccessUserTable
                eyebrow="Current investors"
                title="Investor identities and grants"
                variant="investor"
                users={snapshot.investorUsers}
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

        <aside className="panel turicum-access-card turicum-access-sidebar">
          <div className="section-head">
            <div>
              <p className="eyebrow">Quick links</p>
              <h2>Borrower links and case shortcuts</h2>
            </div>
          </div>

          <div className="turicum-access-sidebar-actions">
            <Link className="secondary-button" href={caseWorkspaceHref}>
              Back to Case
            </Link>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setCreateMode("staff");
                setIsCreateModalOpen(true);
              }}
            >
              New Staff User
            </button>
          </div>

          <details className="turicum-quicklink-group" open>
            <summary>Borrower Ledger</summary>
            <BorrowerInviteLedger
              invites={snapshot.borrowerInvites}
              refreshInvite={refreshInvite}
              revokeInvite={revokeInvite}
            />
          </details>

          <details className="turicum-quicklink-group">
            <summary>Create Borrower Invite</summary>
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
          </details>
        </aside>
      </div>

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
