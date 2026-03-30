"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ConfirmActionForm } from "@/components/turicum/confirm-action-form";
import { StatusToast } from "@/components/turicum/status-toast";

interface BorrowerInviteLedgerItem {
  id: string;
  caseCode: string;
  caseTitle: string;
  email: string;
  expiresAt: string;
  revokedAt: string | null;
  claimedAt: string | null;
}

interface RefreshBorrowerInviteResult {
  ok: boolean;
  expiresAt?: string;
  message?: string;
}

interface BorrowerInviteLedgerProps {
  invites: BorrowerInviteLedgerItem[];
  refreshInvite: (formData: FormData) => Promise<RefreshBorrowerInviteResult>;
  revokeInvite: (formData: FormData) => Promise<void>;
}

const REFRESH_WINDOW_MS = 48 * 60 * 60 * 1000;

function formatInviteExpiry(value: string) {
  return new Date(value).toLocaleString("en-US");
}

export function BorrowerInviteLedger({
  invites,
  refreshInvite,
  revokeInvite
}: BorrowerInviteLedgerProps) {
  const [items, setItems] = useState(invites);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const [refreshedInviteId, setRefreshedInviteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    key: number;
    tone: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const refreshFeedbackTimeout = useRef<number | null>(null);

  useEffect(() => {
    setItems(invites);
  }, [invites]);

  useEffect(() => {
    return () => {
      if (refreshFeedbackTimeout.current) {
        window.clearTimeout(refreshFeedbackTimeout.current);
      }
    };
  }, []);

  const toastView = useMemo(() => {
    if (!toast) {
      return null;
    }

    return (
      <StatusToast
        key={toast.key}
        show
        tone={toast.tone}
        title={toast.title}
        message={toast.message}
      />
    );
  }, [toast]);

  function showToast(tone: "success" | "error", title: string, message: string) {
    setToast({
      key: Date.now(),
      tone,
      title,
      message
    });
  }

  function handleRefresh(inviteId: string) {
    const previousItem = items.find((item) => item.id === inviteId);

    if (!previousItem) {
      return;
    }

    const optimisticExpiresAt = new Date(Date.now() + REFRESH_WINDOW_MS).toISOString();
    setPendingInviteId(inviteId);
    setItems((current) =>
      current.map((item) =>
        item.id === inviteId
          ? {
              ...item,
              expiresAt: optimisticExpiresAt
            }
          : item
      )
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set("inviteId", inviteId);

      try {
        const result = await refreshInvite(formData);

        if (!result.ok || !result.expiresAt) {
          throw new Error(result.message ?? "Borrower invite link could not be refreshed.");
        }

        setItems((current) =>
          current.map((item) =>
            item.id === inviteId
              ? {
                  ...item,
                  expiresAt: result.expiresAt as string
                }
              : item
          )
        );
        setRefreshedInviteId(inviteId);
        if (refreshFeedbackTimeout.current) {
          window.clearTimeout(refreshFeedbackTimeout.current);
        }
        refreshFeedbackTimeout.current = window.setTimeout(() => {
          setRefreshedInviteId((current) => (current === inviteId ? null : current));
          refreshFeedbackTimeout.current = null;
        }, 2200);
        showToast("success", "Success", "Borrower link extended by 48 hours.");
      } catch (error) {
        setItems((current) =>
          current.map((item) =>
            item.id === inviteId
              ? {
                  ...item,
                  expiresAt: previousItem.expiresAt
                }
              : item
          )
        );
        showToast(
          "error",
          "Refresh failed",
          error instanceof Error ? error.message : "Borrower invite link could not be refreshed."
        );
      } finally {
        setPendingInviteId((current) => (current === inviteId ? null : current));
      }
    });
  }

  return (
    <>
      {toastView}
      <ul className="list compact-list">
        {items.slice(0, 8).map((invite) => {
          const isRefreshing = isPending && pendingInviteId === invite.id;
          const isRefreshed = refreshedInviteId === invite.id;

          return (
            <li key={invite.id}>
              <strong>{invite.caseCode}</strong> · {invite.email}
              <br />
              <span className="helper">
                {invite.caseTitle} · expires {formatInviteExpiry(invite.expiresAt)}
                {invite.revokedAt ? " · revoked" : ""}
                {invite.claimedAt ? " · claimed" : ""}
              </span>
              {!invite.revokedAt ? (
                <div className="form-actions" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleRefresh(invite.id)}
                    disabled={isRefreshing}
                    className={`secondary-button turicum-ledger-refresh${isRefreshed ? " is-active" : ""}`}
                  >
                    {isRefreshing ? "Refreshing..." : isRefreshed ? "Refreshed!" : "Refresh"}
                  </button>
                  <ConfirmActionForm
                    action={revokeInvite}
                    confirmMessage={`Are you sure you want to change access for ${invite.email}? This action can be undone later by an admin.`}
                  >
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button type="submit" className="turicum-destructive-button">Revoke invite</button>
                  </ConfirmActionForm>
                </div>
              ) : null}
            </li>
          );
        })}
        {items.length === 0 ? <li>No borrower invites have been synced yet.</li> : null}
      </ul>
    </>
  );
}
