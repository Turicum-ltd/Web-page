"use client";

import { useMemo, useRef, useState } from "react";
import { ConfirmActionForm } from "@/components/turicum/confirm-action-form";
import type { AccessAdminUser, AdminAuditLogEntry } from "@/lib/turicum/access-admin";

interface AccessUserTableProps {
  title: string;
  eyebrow: string;
  variant: "staff" | "investor";
  users: AccessAdminUser[];
  toggleUserStatus: (formData: FormData) => Promise<void>;
  loadAuditHistory: (targetUserEmail: string) => Promise<AdminAuditLogEntry[]>;
}

function matchesUserQuery(user: AccessAdminUser, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [user.email, user.fullName ?? ""].join(" ").toLowerCase();
  return haystack.includes(normalizedQuery);
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatAuditActionLabel(actionType: string) {
  return actionType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAuditValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  if (typeof value === "string") {
    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate) && value.includes("T")) {
      return formatTimestamp(value);
    }

    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return "n/a";
}

function prettifyMetadataKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function getAuditDetails(entry: AdminAuditLogEntry) {
  const metadata = entry.metadata ?? {};
  const details = [`By ${entry.actorEmail}`];

  if (entry.actionType === "GRANT_ACCESS") {
    const caseIds = Array.isArray(metadata.caseIds)
      ? metadata.caseIds.map((value) => String(value))
      : [];

    if (caseIds.length) {
      details.push(`Cases: ${caseIds.join(", ")}`);
    }

    if (metadata.grantCount !== undefined) {
      details.push(`Count: ${formatAuditValue(metadata.grantCount)}`);
    }

    if (metadata.accessRole) {
      details.push(`Role: ${formatAuditValue(metadata.accessRole)}`);
    }

    return details;
  }

  if (entry.actionType === "REFRESH_INVITE") {
    if (metadata.caseId) {
      details.push(`Case: ${formatAuditValue(metadata.caseId)}`);
    }

    if (metadata.previousExpiresAt) {
      details.push(`Previous expiry: ${formatAuditValue(metadata.previousExpiresAt)}`);
    }

    if (metadata.refreshedExpiresAt) {
      details.push(`New expiry: ${formatAuditValue(metadata.refreshedExpiresAt)}`);
    }

    return details;
  }

  for (const [key, value] of Object.entries(metadata)) {
    details.push(`${prettifyMetadataKey(key)}: ${formatAuditValue(value)}`);
  }

  return details;
}

export function AccessUserTable({
  title,
  eyebrow,
  variant,
  users,
  toggleUserStatus,
  loadAuditHistory
}: AccessUserTableProps) {
  const [query, setQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showNeverSignedInOnly, setShowNeverSignedInOnly] = useState(false);
  const [historyUser, setHistoryUser] = useState<AccessAdminUser | null>(null);
  const [historyEntries, setHistoryEntries] = useState<AdminAuditLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        if (showActiveOnly && !user.isActive) {
          return false;
        }

        if (showNeverSignedInOnly && user.lastSignInAt) {
          return false;
        }

        return matchesUserQuery(user, query);
      }),
    [query, showActiveOnly, showNeverSignedInOnly, users]
  );

  async function openHistory(user: AccessAdminUser) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setHistoryUser(user);
    setHistoryEntries([]);
    setHistoryError(null);
    setHistoryLoading(true);

    try {
      const entries = await loadAuditHistory(user.email);
      if (requestIdRef.current !== requestId) {
        return;
      }

      setHistoryEntries(entries);
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setHistoryError(
        error instanceof Error ? error.message : "Audit history could not be loaded."
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setHistoryLoading(false);
      }
    }
  }

  function closeHistory() {
    requestIdRef.current += 1;
    setHistoryUser(null);
    setHistoryEntries([]);
    setHistoryError(null);
    setHistoryLoading(false);
  }

  return (
    <section className="panel turicum-access-card turicum-access-card-active">
      <div className="section-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="turicum-table-toolbar">
          <label className="field">
            <span>Search users</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name/email..."
            />
          </label>
          <label className="turicum-table-toggle">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(event) => setShowActiveOnly(event.target.checked)}
            />
            <span>Show Active Only</span>
          </label>
          <label className="turicum-table-toggle">
            <input
              type="checkbox"
              checked={showNeverSignedInOnly}
              onChange={(event) => setShowNeverSignedInOnly(event.target.checked)}
            />
            <span>Never Signed In</span>
          </label>
        </div>
      </div>
      <div className="table-wrap turicum-access-table-wrap">
        <table>
          <thead>
            {variant === "staff" ? (
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Name</th>
                <th>Last sign-in</th>
                <th>Action</th>
                <th>History</th>
              </tr>
            ) : (
              <tr>
                <th>Email</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Last sign-in</th>
                <th>Action</th>
                <th>History</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={variant === "staff" ? 7 : 6} className="helper">
                  No users found
                </td>
              </tr>
            ) : variant === "staff" ? (
              filteredUsers.map((user) => (
                <tr
                  key={user.userId}
                  className={user.lastSignInAt ? undefined : "turicum-row-never-signed-in"}
                >
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`turicum-status-pill ${user.isActive ? "is-active" : "is-inactive"}`}>
                      <span className="turicum-status-dot" aria-hidden="true" />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{user.fullName ?? "not set"}</td>
                  <td>
                    {user.lastSignInAt ? (
                      new Date(user.lastSignInAt).toLocaleString("en-US")
                    ) : (
                      <span className="turicum-status-pill is-pending">
                        <span className="turicum-status-dot" aria-hidden="true" />
                        Never Signed In
                      </span>
                    )}
                  </td>
                  <td>
                    {user.isActive ? (
                      <ConfirmActionForm
                        action={toggleUserStatus}
                        confirmMessage={`Are you sure you want to change access for ${user.email}? This action can be undone later by an admin.`}
                      >
                        <input type="hidden" name="userId" value={user.userId} />
                        <input type="hidden" name="nextIsActive" value="false" />
                        <button type="submit" className="turicum-destructive-button">Deactivate</button>
                      </ConfirmActionForm>
                    ) : (
                      <form action={toggleUserStatus}>
                        <input type="hidden" name="userId" value={user.userId} />
                        <input type="hidden" name="nextIsActive" value="true" />
                        <button type="submit">Reactivate</button>
                      </form>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="secondary-button turicum-history-trigger"
                      onClick={() => openHistory(user)}
                      aria-label={`Open audit history for ${user.email}`}
                    >
                      <span className="turicum-history-trigger-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="2.75"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                        </svg>
                      </span>
                      <span>History</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.userId}
                  className={user.lastSignInAt ? undefined : "turicum-row-never-signed-in"}
                >
                  <td>{user.email}</td>
                  <td>{user.organization ?? "not set"}</td>
                  <td>
                    <span className={`turicum-status-pill ${user.isActive ? "is-active" : "is-inactive"}`}>
                      <span className="turicum-status-dot" aria-hidden="true" />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {user.lastSignInAt ? (
                      new Date(user.lastSignInAt).toLocaleString("en-US")
                    ) : (
                      <span className="turicum-status-pill is-pending">
                        <span className="turicum-status-dot" aria-hidden="true" />
                        Never Signed In
                      </span>
                    )}
                  </td>
                  <td>
                    {user.isActive ? (
                      <ConfirmActionForm
                        action={toggleUserStatus}
                        confirmMessage={`Are you sure you want to change access for ${user.email}? This action can be undone later by an admin.`}
                      >
                        <input type="hidden" name="userId" value={user.userId} />
                        <input type="hidden" name="nextIsActive" value="false" />
                        <button type="submit" className="turicum-destructive-button">Deactivate</button>
                      </ConfirmActionForm>
                    ) : (
                      <form action={toggleUserStatus}>
                        <input type="hidden" name="userId" value={user.userId} />
                        <input type="hidden" name="nextIsActive" value="true" />
                        <button type="submit">Reactivate</button>
                      </form>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="secondary-button turicum-history-trigger"
                      onClick={() => openHistory(user)}
                      aria-label={`Open audit history for ${user.email}`}
                    >
                      <span className="turicum-history-trigger-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="2.75"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                        </svg>
                      </span>
                      <span>History</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {historyUser ? (
        <div
          className="turicum-audit-drawer-backdrop"
          onClick={closeHistory}
          role="presentation"
        >
          <aside
            className="turicum-audit-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`audit-history-title-${historyUser.userId}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="turicum-audit-drawer-head">
              <div>
                <p className="eyebrow">Audit history</p>
                <h3 id={`audit-history-title-${historyUser.userId}`}>
                  Audit History: {historyUser.email}
                </h3>
              </div>
              <button
                type="button"
                className="secondary-button turicum-audit-close"
                onClick={closeHistory}
              >
                Close
              </button>
            </div>
            <div className="turicum-audit-drawer-body">
              <div className="subpanel">
                <p className="eyebrow">Current account</p>
                <strong>{historyUser.email}</strong>
                <p className="helper">
                  {historyUser.fullName ?? "No full name"} · {historyUser.role ?? "No role"}
                </p>
              </div>
              <div className="turicum-audit-timeline-shell">
                {historyLoading ? (
                  <p className="helper">Loading audit history…</p>
                ) : historyError ? (
                  <p className="helper">{historyError}</p>
                ) : historyEntries.length === 0 ? (
                  <p className="helper">No audit history found for this user yet.</p>
                ) : (
                  <ol className="turicum-audit-timeline">
                    {historyEntries.map((entry) => (
                      <li key={entry.id} className="turicum-audit-timeline-item">
                        <span className="turicum-audit-dot" aria-hidden="true" />
                        <div className="turicum-audit-entry-card">
                          <div className="turicum-audit-entry-head">
                            <span className="turicum-audit-entry-time">
                              {formatTimestamp(entry.performedAt)}
                            </span>
                            <span className="turicum-status-pill is-active turicum-audit-action-pill">
                              <span className="turicum-status-dot" aria-hidden="true" />
                              {formatAuditActionLabel(entry.actionType)}
                            </span>
                          </div>
                          <ul className="turicum-audit-details">
                            {getAuditDetails(entry).map((detail) => (
                              <li key={`${entry.id}-${detail}`}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
