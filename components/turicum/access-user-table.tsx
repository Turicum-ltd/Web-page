"use client";

import { useMemo, useState } from "react";
import { ConfirmActionForm } from "@/components/turicum/confirm-action-form";
import type { AccessAdminUser } from "@/lib/turicum/access-admin";

interface AccessUserTableProps {
  title: string;
  eyebrow: string;
  variant: "staff" | "investor";
  users: AccessAdminUser[];
  toggleUserStatus: (formData: FormData) => Promise<void>;
}

function matchesUserQuery(user: AccessAdminUser, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [user.email, user.fullName ?? ""].join(" ").toLowerCase();
  return haystack.includes(normalizedQuery);
}

export function AccessUserTable({
  title,
  eyebrow,
  variant,
  users,
  toggleUserStatus
}: AccessUserTableProps) {
  const [query, setQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showNeverSignedInOnly, setShowNeverSignedInOnly] = useState(false);

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

  return (
    <>
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
      <div className="table-wrap">
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
              </tr>
            ) : (
              <tr>
                <th>Email</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Last sign-in</th>
                <th>Action</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={variant === "staff" ? 6 : 5} className="helper">
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
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleString("en-US")
                      : "never"}
                  </td>
                  <td>
                    {user.isActive ? (
                      <ConfirmActionForm
                        action={toggleUserStatus}
                        confirmMessage={`Are you sure you want to change access for ${user.email}? This action can be undone later by an admin.`}
                      >
                        <input type="hidden" name="userId" value={user.userId} />
                        <input type="hidden" name="nextIsActive" value="false" />
                        <button type="submit">Deactivate</button>
                      </ConfirmActionForm>
                    ) : (
                      <form action={toggleUserStatus}>
                        <input type="hidden" name="userId" value={user.userId} />
                        <input type="hidden" name="nextIsActive" value="true" />
                        <button type="submit">Reactivate</button>
                      </form>
                    )}
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
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleString("en-US")
                      : "never"}
                  </td>
                  <td>
                    {user.isActive ? (
                      <ConfirmActionForm
                        action={toggleUserStatus}
                        confirmMessage={`Are you sure you want to change access for ${user.email}? This action can be undone later by an admin.`}
                      >
                        <input type="hidden" name="userId" value={user.userId} />
                        <input type="hidden" name="nextIsActive" value="false" />
                        <button type="submit">Deactivate</button>
                      </ConfirmActionForm>
                    ) : (
                      <form action={toggleUserStatus}>
                        <input type="hidden" name="userId" value={user.userId} />
                        <input type="hidden" name="nextIsActive" value="true" />
                        <button type="submit">Reactivate</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
