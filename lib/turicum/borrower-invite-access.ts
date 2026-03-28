import "server-only";

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { BorrowerPortalRecord } from "@/lib/turicum/types";

const DEFAULT_BORROWER_INVITE_TTL_DAYS = 30;

interface SupabaseBorrowerInviteConfig {
  url: string;
  serviceRoleKey: string;
}

interface BorrowerInviteRow {
  id: string;
  case_id: string;
  email: string;
  token_hash: string;
  expires_at: string;
  claimed_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

function readFirstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

function getBorrowerInviteConfig(): SupabaseBorrowerInviteConfig | null {
  const url = readFirstEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readFirstEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    serviceRoleKey
  };
}

function getSupabaseAdmin() {
  const config = getBorrowerInviteConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function isRecoverableSupabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("fetch failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("econnreset") ||
    normalized.includes("econnrefused") ||
    normalized.includes("etimedout") ||
    normalized.includes("enotfound")
  );
}

function isMissingBorrowerInviteTableError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("could not find the table") && normalized.includes("turicum_borrower_portal_invites");
}

function getBorrowerInviteTtlDays() {
  const raw = process.env.TURICUM_BORROWER_PORTAL_TTL_DAYS?.trim();
  const numeric = raw ? Number(raw) : NaN;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_BORROWER_INVITE_TTL_DAYS;
  }

  return Math.round(numeric);
}

export function hashBorrowerInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function computeBorrowerInviteExpiry(fromIso: string) {
  const base = Date.parse(fromIso);
  const expiresAt = new Date(base + getBorrowerInviteTtlDays() * 24 * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

export async function syncBorrowerPortalInvite(portal: BorrowerPortalRecord) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !portal.borrowerEmail.trim()) {
    return null;
  }

  const tokenHash = hashBorrowerInviteToken(portal.accessToken);
  const expiresAt = computeBorrowerInviteExpiry(portal.updatedAt || portal.createdAt);

  try {
    const { data, error } = await supabase
      .from("turicum_borrower_portal_invites")
      .upsert(
        {
          case_id: portal.caseId,
          email: portal.borrowerEmail.trim().toLowerCase(),
          token_hash: tokenHash,
          expires_at: expiresAt
        },
        {
          onConflict: "token_hash"
        }
      )
      .select("id, case_id, email, token_hash, expires_at, claimed_at, revoked_at, created_at")
      .single();

    if (error) {
      if (isMissingBorrowerInviteTableError(error.message)) {
        return null;
      }

      throw new Error(`Failed to sync borrower portal invite: ${error.message}`);
    }

    return data as BorrowerInviteRow;
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }

    return null;
  }
}

export async function getBorrowerPortalInviteByToken(token: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("turicum_borrower_portal_invites")
      .select("id, case_id, email, token_hash, expires_at, claimed_at, revoked_at, created_at")
      .eq("token_hash", hashBorrowerInviteToken(token))
      .maybeSingle();

    if (error) {
      if (isMissingBorrowerInviteTableError(error.message)) {
        return null;
      }

      throw new Error(`Failed to load borrower portal invite: ${error.message}`);
    }

    return (data as BorrowerInviteRow | null) ?? null;
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }

    return null;
  }
}

export function isBorrowerInviteActive(
  invite: { revoked_at: string | null; expires_at: string } | null
) {
  if (!invite) {
    return false;
  }

  if (invite.revoked_at) {
    return false;
  }

  return Date.parse(invite.expires_at) > Date.now();
}
