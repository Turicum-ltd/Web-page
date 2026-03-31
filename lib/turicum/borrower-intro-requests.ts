import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const REQUESTS_PATH = path.join(ROOT, "data", "borrower-intro-call-requests.json");
const INTRO_REQUESTS_TABLE = "borrower_intro_call_requests";

export interface BorrowerIntroCallRequestRecord {
  id: string;
  createdAt: string;
  status: "new" | "reviewed" | "scheduled";
  fullName: string;
  email: string;
  phone: string;
  requestedAmount: string;
  assetLocation: string;
  propertyType: string;
  preferredDate: string;
  preferredTimeWindow: string;
  preferredTimeline: string;
  notes: string;
}

export interface BorrowerIntroCallRequestInput {
  fullName: string;
  email: string;
  phone?: string;
  requestedAmount?: string;
  assetLocation?: string;
  propertyType?: string;
  preferredDate?: string;
  preferredTimeWindow?: string;
  preferredTimeline?: string;
  notes?: string;
}

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

function isMissingSupabaseTableError(message: string, tableName: string) {
  const normalized = message.toLowerCase();
  return (
    (normalized.includes("could not find the table") && normalized.includes(tableName)) ||
    (normalized.includes("relation") && normalized.includes(tableName) && normalized.includes("does not exist"))
  );
}

async function ensureFile() {
  try {
    await readFile(REQUESTS_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await mkdir(path.dirname(REQUESTS_PATH), { recursive: true });
    await writeFile(REQUESTS_PATH, "[]\n", "utf8");
  }
}

async function readRequests() {
  await ensureFile();
  const raw = await readFile(REQUESTS_PATH, "utf8");
  return JSON.parse(raw) as BorrowerIntroCallRequestRecord[];
}

async function writeRequests(items: BorrowerIntroCallRequestRecord[]) {
  await writeFile(REQUESTS_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function requireValue(label: string, value: string | undefined) {
  const next = value?.trim() ?? "";
  if (!next) {
    throw new Error(`${label} is required.`);
  }
  return next;
}

export async function createBorrowerIntroCallRequest(
  input: BorrowerIntroCallRequestInput
): Promise<BorrowerIntroCallRequestRecord> {
  const item: BorrowerIntroCallRequestRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
    fullName: requireValue("Full name", input.fullName),
    email: requireValue("Email", input.email).toLowerCase(),
    phone: input.phone?.trim() ?? "",
    requestedAmount: input.requestedAmount?.trim() ?? "",
    assetLocation: input.assetLocation?.trim() ?? "",
    propertyType: input.propertyType?.trim() ?? "",
    preferredDate: input.preferredDate?.trim() ?? "",
    preferredTimeWindow: input.preferredTimeWindow?.trim() ?? "",
    preferredTimeline: input.preferredTimeline?.trim() ?? "",
    notes: input.notes?.trim() ?? ""
  };

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const items = await readRequests();
    items.unshift(item);
    await writeRequests(items);
    return item;
  }

  try {
    const { data, error } = await supabase
      .from(INTRO_REQUESTS_TABLE)
      .insert({
        status: item.status,
        full_name: item.fullName,
        email: item.email,
        phone: item.phone || null,
        requested_amount: item.requestedAmount || null,
        asset_location: item.assetLocation || null,
        property_type: item.propertyType || null,
        preferred_date: item.preferredDate || null,
        preferred_time_window: item.preferredTimeWindow || null,
        preferred_timeline: item.preferredTimeline || null,
        notes: item.notes
      })
      .select("id, created_at")
      .single();

    if (error) {
      if (!isMissingSupabaseTableError(error.message, INTRO_REQUESTS_TABLE)) {
        throw new Error(`Failed to save borrower intro call request: ${error.message}`);
      }
    } else {
      return {
        ...item,
        id: String(data.id),
        createdAt: String(data.created_at)
      };
    }
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }
  }

  const items = await readRequests();
  items.unshift(item);
  await writeRequests(items);
  return item;
}

export async function listBorrowerIntroCallRequests() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return readRequests();
  }

  try {
    const { data, error } = await supabase
      .from(INTRO_REQUESTS_TABLE)
      .select(
        "id, created_at, status, full_name, email, phone, requested_amount, asset_location, property_type, preferred_date, preferred_time_window, preferred_timeline, notes"
      )
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingSupabaseTableError(error.message, INTRO_REQUESTS_TABLE)) {
        return readRequests();
      }
      throw new Error(`Failed to load borrower intro call requests: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      createdAt: String(row.created_at),
      status: String(row.status) as BorrowerIntroCallRequestRecord["status"],
      fullName: String(row.full_name),
      email: String(row.email),
      phone: String(row.phone ?? ""),
      requestedAmount: String(row.requested_amount ?? ""),
      assetLocation: String(row.asset_location ?? ""),
      propertyType: String(row.property_type ?? ""),
      preferredDate: String(row.preferred_date ?? ""),
      preferredTimeWindow: String(row.preferred_time_window ?? ""),
      preferredTimeline: String(row.preferred_timeline ?? ""),
      notes: String(row.notes ?? "")
    }));
  } catch (error) {
    if (!isRecoverableSupabaseError(error)) {
      throw error;
    }

    return readRequests();
  }
}
