import "server-only";

import { createClient } from "@supabase/supabase-js";
import { buildInvestorWelcomeEmail } from "@/lib/turicum/investor-welcome-email-template";
import { listCases } from "@/lib/turicum/cases";
import { getBorrowerPortalForCase, saveBorrowerPortalSetup } from "@/lib/turicum/intake";
import { enqueueOutboundEmail } from "@/lib/turicum/outbound-email-queue";
import type { CaseRecord } from "@/lib/turicum/types";

export type StaffRole = "staff_admin" | "staff_ops" | "staff_counsel";
export type InvestorGrantRole = "investor";

interface AccessAdminConfig {
  url: string;
  serviceRoleKey: string;
}

interface UserProfileRow {
  user_id: string;
  role: string;
  full_name: string | null;
  organization: string | null;
  is_active: boolean;
}

interface CaseGrantRow {
  id: string;
  case_id: string;
  user_id: string;
  access_role: string;
  expires_at: string | null;
  created_at: string;
}

interface BorrowerInviteRow {
  id: string;
  case_id: string;
  email: string;
  expires_at: string;
  revoked_at: string | null;
  claimed_at: string | null;
  created_at: string;
}

interface AdminAuditLogInsert {
  actorEmail: string;
  targetUserEmail: string;
  actionType: string;
  metadata?: Record<string, unknown>;
}

interface AdminAuditLogRow {
  id: string;
  performed_at: string;
  actor_email: string;
  target_user_email: string;
  action_type: string;
  metadata: Record<string, unknown> | null;
}

export interface AccessAdminUser {
  userId: string;
  email: string;
  role: string | null;
  fullName: string | null;
  organization: string | null;
  isActive: boolean;
  lastSignInAt: string | null;
}

export interface AccessGrantSummary {
  id: string;
  caseId: string;
  caseCode: string;
  caseTitle: string;
  userId: string;
  userEmail: string;
  accessRole: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface BorrowerInviteSummary {
  id: string;
  caseId: string;
  caseCode: string;
  caseTitle: string;
  email: string;
  expiresAt: string;
  revokedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
}

export interface AccessAdminSnapshot {
  staffUsers: AccessAdminUser[];
  investorUsers: AccessAdminUser[];
  cases: CaseRecord[];
  investorGrants: AccessGrantSummary[];
  borrowerInvites: BorrowerInviteSummary[];
}

export interface AdminAuditLogEntry {
  id: string;
  performedAt: string;
  actorEmail: string;
  targetUserEmail: string;
  actionType: string;
  metadata: Record<string, unknown>;
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

function getAccessAdminConfig(): AccessAdminConfig | null {
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
  const config = getAccessAdminConfig();

  if (!config) {
    throw new Error("Supabase access admin is not configured for this deployment.");
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function listAllAuthUsers() {
  const supabase = getSupabaseAdmin();
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200
    });

    if (error) {
      throw new Error(`Failed to load Supabase users: ${error.message}`);
    }

    users.push(...(data.users ?? []));

    if (!data.users || data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function listProfiles() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("turicum_user_profiles")
    .select("user_id, role, full_name, organization, is_active")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load Turicum user profiles: ${error.message}`);
  }

  return (data ?? []) as UserProfileRow[];
}

async function listInvestorGrants() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("turicum_case_access_grants")
    .select("id, case_id, user_id, access_role, expires_at, created_at")
    .eq("access_role", "investor")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load Turicum case access grants: ${error.message}`);
  }

  return (data ?? []) as CaseGrantRow[];
}

async function listBorrowerInvites() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("turicum_borrower_portal_invites")
    .select("id, case_id, email, expires_at, revoked_at, claimed_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load Turicum borrower invites: ${error.message}`);
  }

  return (data ?? []) as BorrowerInviteRow[];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function insertAdminAuditLog(input: AdminAuditLogInsert) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("admin_audit_logs").insert({
    actor_email: normalizeEmail(input.actorEmail),
    target_user_email: normalizeEmail(input.targetUserEmail),
    action_type: input.actionType,
    metadata: input.metadata ?? {}
  });

  if (error) {
    throw new Error(`Failed to write admin audit log: ${error.message}`);
  }
}

export async function getAdminAuditLogsForTargetEmail(
  targetUserEmail: string
): Promise<AdminAuditLogEntry[]> {
  const supabase = getSupabaseAdmin();
  const normalizedEmail = normalizeEmail(targetUserEmail);
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("id, performed_at, actor_email, target_user_email, action_type, metadata")
    .eq("target_user_email", normalizedEmail)
    .order("performed_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load admin audit logs: ${error.message}. Check that the admin_audit_logs migration is applied and that the table uses the target_user_email column.`
    );
  }

  return ((data ?? []) as AdminAuditLogRow[]).map((row) => ({
    id: row.id,
    performedAt: row.performed_at,
    actorEmail: row.actor_email,
    targetUserEmail: row.target_user_email,
    actionType: row.action_type,
    metadata: row.metadata ?? {}
  }));
}

export async function getAccessAdminSnapshot(): Promise<AccessAdminSnapshot> {
  const [authUsers, profiles, cases, grants, borrowerInvites] = await Promise.all([
    listAllAuthUsers(),
    listProfiles(),
    listCases(),
    listInvestorGrants(),
    listBorrowerInvites()
  ]);

  const profileByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const caseById = new Map(cases.map((item) => [item.id, item]));
  const userById = new Map(
    authUsers.map((user) => [
      user.id,
      {
        email: user.email ?? "",
        lastSignInAt: user.last_sign_in_at ?? null
      }
    ])
  );

  const mergedUsers: AccessAdminUser[] = authUsers
    .map((user) => {
      const profile = profileByUserId.get(user.id);

      return {
        userId: user.id,
        email: user.email ?? "",
        role: profile?.role ?? null,
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
        organization: profile?.organization ?? null,
        isActive: profile?.is_active ?? false,
        lastSignInAt: user.last_sign_in_at ?? null
      };
    })
    .filter((user) => user.role);

  const staffUsers = mergedUsers
    .filter((user) => user.role?.startsWith("staff_"))
    .sort((a, b) => a.email.localeCompare(b.email));
  const investorUsers = mergedUsers
    .filter((user) => user.role === "investor")
    .sort((a, b) => a.email.localeCompare(b.email));

  const investorGrants: AccessGrantSummary[] = grants.map((grant) => {
    const caseItem = caseById.get(grant.case_id);
    const user = userById.get(grant.user_id);

    return {
      id: grant.id,
      caseId: grant.case_id,
      caseCode: caseItem?.code ?? "unknown",
      caseTitle: caseItem?.title ?? "Unknown case",
      userId: grant.user_id,
      userEmail: user?.email ?? "unknown",
      accessRole: grant.access_role,
      expiresAt: grant.expires_at,
      createdAt: grant.created_at
    };
  });

  const borrowerInviteSummaries: BorrowerInviteSummary[] = borrowerInvites.map((invite) => {
    const caseItem = caseById.get(invite.case_id);

    return {
      id: invite.id,
      caseId: invite.case_id,
      caseCode: caseItem?.code ?? "unknown",
      caseTitle: caseItem?.title ?? "Unknown case",
      email: invite.email,
      expiresAt: invite.expires_at,
      revokedAt: invite.revoked_at,
      claimedAt: invite.claimed_at,
      createdAt: invite.created_at
    };
  });

  return {
    staffUsers,
    investorUsers,
    cases,
    investorGrants,
    borrowerInvites: borrowerInviteSummaries
  };
}

async function findAuthUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = await listAllAuthUsers();
  return users.find((user) => normalizeEmail(user.email ?? "") === normalizedEmail) ?? null;
}

async function upsertUserProfile(
  userId: string,
  role: string,
  fullName: string,
  organization: string,
  isActive = true
) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("turicum_user_profiles").upsert(
    {
      user_id: userId,
      role,
      full_name: fullName.trim() || null,
      organization: organization.trim() || null,
      is_active: isActive
    },
    {
      onConflict: "user_id"
    }
  );

  if (error) {
    throw new Error(`Failed to save Turicum user profile: ${error.message}`);
  }
}

export async function createOrUpdateStaffUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: StaffRole;
  organization?: string;
}) {
  const supabase = getSupabaseAdmin();
  const email = normalizeEmail(input.email);
  const organization = input.organization?.trim() || "Turicum";
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: input.password.trim(),
      user_metadata: {
        full_name: input.fullName.trim()
      }
    });

    if (error) {
      throw new Error(`Failed to update staff user: ${error.message}`);
    }

    await upsertUserProfile(existing.id, input.role, input.fullName, organization, true);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: input.password.trim(),
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName.trim()
    }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create staff user: ${error?.message ?? "unknown error"}`);
  }

  await upsertUserProfile(data.user.id, input.role, input.fullName, organization, true);
  return data.user.id;
}

export async function createOrUpdateInvestorUser(input: {
  email: string;
  password: string;
  fullName: string;
  organization?: string;
}) {
  const supabase = getSupabaseAdmin();
  const email = normalizeEmail(input.email);
  const organization = input.organization?.trim() || "Turicum Investor";
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: input.password.trim(),
      user_metadata: {
        full_name: input.fullName.trim()
      }
    });

    if (error) {
      throw new Error(`Failed to update investor user: ${error.message}`);
    }

    await upsertUserProfile(existing.id, "investor", input.fullName, organization, true);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: input.password.trim(),
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName.trim()
    }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create investor user: ${error?.message ?? "unknown error"}`);
  }

  await upsertUserProfile(data.user.id, "investor", input.fullName, organization, true);

  const welcomeEmail = buildInvestorWelcomeEmail({
    fullName: input.fullName
  });

  await enqueueOutboundEmail({
    templateKey: "investor_welcome",
    to: email,
    subject: welcomeEmail.subject,
    text: welcomeEmail.text,
    metadata: {
      investorEmail: email,
      fullName: input.fullName.trim(),
      portalUrl: "https://turicum.us/investors"
    }
  });

  return data.user.id;
}

export async function grantInvestorCaseAccess(input: {
  email: string;
  caseId: string;
}) {
  const supabase = getSupabaseAdmin();
  const email = normalizeEmail(input.email);
  const user = await findAuthUserByEmail(email);

  if (!user) {
    throw new Error(`No Supabase user found for ${email}. Create the investor account first.`);
  }

  const { error } = await supabase.from("turicum_case_access_grants").upsert(
    {
      case_id: input.caseId,
      user_id: user.id,
      access_role: "investor"
    },
    {
      onConflict: "case_id,user_id,access_role"
    }
  );

  if (error) {
    throw new Error(`Failed to grant investor access: ${error.message}`);
  }
}

export async function grantInvestorCaseAccessBulk(input: {
  actorEmail: string;
  email: string;
  caseIds: string[];
}) {
  const supabase = getSupabaseAdmin();
  const email = normalizeEmail(input.email);
  const caseIds = Array.from(new Set(input.caseIds.map((caseId) => caseId.trim()).filter(Boolean)));

  if (!caseIds.length) {
    throw new Error("Select at least one case to grant investor access.");
  }

  const user = await findAuthUserByEmail(email);

  if (!user) {
    throw new Error(`No Supabase user found for ${email}. Create the investor account first.`);
  }

  const { error } = await supabase.from("turicum_case_access_grants").upsert(
    caseIds.map((caseId) => ({
      case_id: caseId,
      user_id: user.id,
      access_role: "investor"
    })),
    {
      onConflict: "case_id,user_id,access_role"
    }
  );

  if (error) {
    throw new Error(`Failed to grant investor access: ${error.message}`);
  }

  await insertAdminAuditLog({
    actorEmail: input.actorEmail,
    targetUserEmail: email,
    actionType: "GRANT_ACCESS",
    metadata: {
      caseIds,
      grantCount: caseIds.length,
      accessRole: "investor"
    }
  });

  return {
    email,
    count: caseIds.length
  };
}

export async function setUserProfileActiveState(input: {
  userId: string;
  isActive: boolean;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("turicum_user_profiles")
    .update({ is_active: input.isActive })
    .eq("user_id", input.userId);

  if (error) {
    throw new Error(`Failed to update Turicum user status: ${error.message}`);
  }
}

export async function revokeInvestorCaseAccess(grantId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("turicum_case_access_grants")
    .delete()
    .eq("id", grantId);

  if (error) {
    throw new Error(`Failed to revoke investor access: ${error.message}`);
  }
}

export async function revokeBorrowerInvite(inviteId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("turicum_borrower_portal_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .is("revoked_at", null);

  if (error) {
    throw new Error(`Failed to revoke borrower invite: ${error.message}`);
  }
}

export async function refreshBorrowerInvite(input: { inviteId: string; actorEmail: string }) {
  const supabase = getSupabaseAdmin();
  const { data: invite, error: inviteError } = await supabase
    .from("turicum_borrower_portal_invites")
    .select("id, case_id, email, expires_at")
    .eq("id", input.inviteId)
    .maybeSingle();

  if (inviteError) {
    throw new Error(`Failed to load borrower invite for refresh: ${inviteError.message}`);
  }

  if (!invite) {
    throw new Error("Borrower invite not found.");
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("turicum_borrower_portal_invites")
    .update({ expires_at: expiresAt })
    .eq("id", input.inviteId);

  if (error) {
    throw new Error(`Failed to refresh borrower invite link: ${error.message}`);
  }

  await insertAdminAuditLog({
    actorEmail: input.actorEmail,
    targetUserEmail: invite.email,
    actionType: "REFRESH_INVITE",
    metadata: {
      inviteId: invite.id,
      caseId: invite.case_id,
      previousExpiresAt: invite.expires_at,
      refreshedExpiresAt: expiresAt
    }
  });

  return {
    expiresAt
  };
}

export async function createOrUpdateBorrowerInvite(input: {
  caseId: string;
  borrowerName: string;
  borrowerEmail: string;
  portalTitle?: string;
}) {
  const portal = await getBorrowerPortalForCase(input.caseId);

  if (!portal) {
    throw new Error("Borrower portal case not found.");
  }

  const updated = await saveBorrowerPortalSetup(input.caseId, {
    borrowerName: input.borrowerName.trim(),
    borrowerEmail: normalizeEmail(input.borrowerEmail),
    portalTitle: input.portalTitle?.trim() || portal.portalTitle,
    assignedForms: portal.assignedForms
  });

  return updated;
}
