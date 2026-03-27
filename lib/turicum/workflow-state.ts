import "server-only";

import { createClient } from "@supabase/supabase-js";

const WORKFLOW_STATE_TABLE = "atlas_case_workflow_state";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

function getSupabaseAdmin() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.key, {
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

interface WorkflowStateRow {
  case_id: string;
  workflow_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function isMissingWorkflowStateTableError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("could not find the table") && normalized.includes(WORKFLOW_STATE_TABLE);
}

function mapWorkflowRow<T extends { caseId: string; createdAt: string; updatedAt: string }>(
  row: WorkflowStateRow
) {
  return {
    ...(row.payload ?? {}),
    caseId: String(row.case_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  } as T;
}

export function isWorkflowStateSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export async function getSupabaseWorkflowRecord<
  T extends { caseId: string; createdAt: string; updatedAt: string }
>(workflowType: string, caseId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(WORKFLOW_STATE_TABLE)
      .select("case_id, workflow_type, payload, created_at, updated_at")
      .eq("case_id", caseId)
      .eq("workflow_type", workflowType)
      .maybeSingle();

    if (error) {
      if (isMissingWorkflowStateTableError(error.message)) {
        return null;
      }
      throw new Error(`Failed to load ${workflowType} workflow state from Supabase: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapWorkflowRow<T>(data as WorkflowStateRow);
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }
    return null;
  }
}

export async function saveSupabaseWorkflowRecord<
  T extends { caseId: string; createdAt: string; updatedAt: string }
>(workflowType: string, input: Omit<T, "createdAt" | "updatedAt">) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const now = new Date().toISOString();
  const payload = { ...input } as Record<string, unknown>;

  try {
    const { data, error } = await supabase
      .from(WORKFLOW_STATE_TABLE)
      .upsert(
        {
          case_id: input.caseId,
          workflow_type: workflowType,
          payload,
          updated_at: now
        },
        {
          onConflict: "case_id,workflow_type"
        }
      )
      .select("case_id, workflow_type, payload, created_at, updated_at")
      .single();

    if (error) {
      if (isMissingWorkflowStateTableError(error.message)) {
        return null;
      }
      throw new Error(`Failed to save ${workflowType} workflow state to Supabase: ${error.message}`);
    }

    return mapWorkflowRow<T>(data as WorkflowStateRow);
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }
    return null;
  }
}
