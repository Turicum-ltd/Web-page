import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const REQUESTS_PATH = path.join(ROOT, "data", "borrower-intro-call-requests.json");

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

  const items = await readRequests();
  items.unshift(item);
  await writeRequests(items);
  return item;
}

export async function listBorrowerIntroCallRequests() {
  const items = await readRequests();
  return items;
}
