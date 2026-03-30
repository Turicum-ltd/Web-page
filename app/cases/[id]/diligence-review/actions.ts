"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { updateCaseDocumentStatus } from "@/lib/turicum/case-documents";
import { resolveSupabaseStaffSessionFromCookies } from "@/lib/turicum/staff-supabase-auth";

export async function verifyCaseDocumentAction(formData: FormData) {
  const caseId = String(formData.get("caseId") ?? "").trim();
  const documentId = String(formData.get("documentId") ?? "").trim();

  if (!caseId || !documentId) {
    throw new Error("Case and document context are required.");
  }

  const cookieStore = await cookies();
  const staffProfile = await resolveSupabaseStaffSessionFromCookies(cookieStore);

  if (!staffProfile) {
    throw new Error("Your staff session expired. Sign in again before verifying documents.");
  }

  await updateCaseDocumentStatus(caseId, documentId, "approved");

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/diligence-review`);
}
