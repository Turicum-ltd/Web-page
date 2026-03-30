"use server";

import { getAdminAuditLogsForTargetEmail } from "@/lib/turicum/access-admin";

export async function getAuditLogs(targetUserEmail: string) {
  return getAdminAuditLogsForTargetEmail(targetUserEmail);
}
