"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseStaffSessionFromCookies } from "@/lib/turicum/staff-supabase-auth";
import { withBasePath } from "@/lib/turicum/runtime";

function readFirstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

function getSupabaseAdminClient() {
  const url = readFirstEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readFirstEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin delete is not configured on this deployment.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function isMissingRelationError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the table") ||
    normalized.includes("relation") ||
    normalized.includes("schema cache")
  );
}

export async function deleteUser(userId: string) {
  const nextUserId = userId.trim();

  if (!nextUserId) {
    throw new Error("A user id is required.");
  }

  const cookieStore = await cookies();
  const staffSession = await resolveSupabaseStaffSessionFromCookies(cookieStore);

  if (!staffSession || staffSession.role !== "staff_admin") {
    throw new Error("Only staff admins can permanently delete accounts.");
  }

  if (staffSession.userId === nextUserId) {
    throw new Error("You cannot delete the admin account currently in use.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: userData, error: userLookupError } = await supabase.auth.admin.getUserById(nextUserId);

  if (userLookupError) {
    throw new Error(`Failed to load Supabase user before deletion: ${userLookupError.message}`);
  }

  const targetEmail = userData.user?.email?.trim().toLowerCase() ?? null;

  const auditDelete = targetEmail
    ? await supabase
        .from("admin_audit_logs")
        .delete()
        .or(`user_id.eq.${nextUserId},target_user_email.eq.${targetEmail},actor_email.eq.${targetEmail}`)
    : await supabase.from("admin_audit_logs").delete().eq("user_id", nextUserId);

  if (auditDelete.error) {
    throw new Error(`Failed to delete admin audit logs: ${auditDelete.error.message}`);
  }

  const { error: inquiryDeleteError } = await supabase
    .from("case_inquiries")
    .delete()
    .eq("investor_id", nextUserId);

  if (inquiryDeleteError && !isMissingRelationError(inquiryDeleteError.message)) {
    throw new Error(`Failed to delete case inquiries: ${inquiryDeleteError.message}`);
  }

  const { error: profilesDeleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", nextUserId);

  if (profilesDeleteError && !isMissingRelationError(profilesDeleteError.message)) {
    throw new Error(`Failed to delete public.profiles row: ${profilesDeleteError.message}`);
  }

  const { error: turicumProfileDeleteError } = await supabase
    .from("turicum_user_profiles")
    .delete()
    .eq("user_id", nextUserId);

  if (turicumProfileDeleteError && !isMissingRelationError(turicumProfileDeleteError.message)) {
    throw new Error(`Failed to delete Turicum user profile: ${turicumProfileDeleteError.message}`);
  }

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(nextUserId);

  if (authDeleteError) {
    throw new Error(`Failed to delete Supabase auth user: ${authDeleteError.message}`);
  }

  revalidatePath(withBasePath("/access"));
}
