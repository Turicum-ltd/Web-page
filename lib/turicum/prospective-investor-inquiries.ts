import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INQUIRIES_PATH = path.join(ROOT, "data", "prospective-investor-inquiries.json");

export interface ProspectiveInvestorInquiryRecord {
  id: string;
  createdAt: string;
  status: "new" | "reviewed" | "approved" | "declined";
  fullName: string;
  email: string;
  linkedInProfile: string;
  typicalInvestmentSize: string;
  accreditedInvestor?: string;
  primaryInvestmentObjective?: string;
  source?: "legacy_form" | "gatekeeper_questionnaire";
}

export interface ProspectiveInvestorInquiryInput {
  fullName?: string;
  email: string;
  linkedInProfile?: string;
  typicalInvestmentSize: string;
  accreditedInvestor?: string;
  primaryInvestmentObjective?: string;
  source?: "legacy_form" | "gatekeeper_questionnaire";
}

async function ensureFile() {
  try {
    await readFile(INQUIRIES_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await mkdir(path.dirname(INQUIRIES_PATH), { recursive: true });
    await writeFile(INQUIRIES_PATH, "[]\n", "utf8");
  }
}

async function readInquiries() {
  await ensureFile();
  const raw = await readFile(INQUIRIES_PATH, "utf8");
  return JSON.parse(raw) as ProspectiveInvestorInquiryRecord[];
}

async function writeInquiries(items: ProspectiveInvestorInquiryRecord[]) {
  await writeFile(INQUIRIES_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function requireValue(label: string, value: string | undefined) {
  const next = value?.trim() ?? "";
  if (!next) {
    throw new Error(`${label} is required.`);
  }
  return next;
}

export async function createProspectiveInvestorInquiry(
  input: ProspectiveInvestorInquiryInput
): Promise<ProspectiveInvestorInquiryRecord> {
  const item: ProspectiveInvestorInquiryRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
    fullName: input.fullName?.trim() ?? "",
    email: requireValue("Email", input.email).toLowerCase(),
    linkedInProfile: input.linkedInProfile?.trim() ?? "",
    typicalInvestmentSize: requireValue("Typical investment size", input.typicalInvestmentSize),
    accreditedInvestor: input.accreditedInvestor?.trim() ?? "",
    primaryInvestmentObjective: input.primaryInvestmentObjective?.trim() ?? "",
    source: input.source ?? "legacy_form"
  };

  const items = await readInquiries();
  items.unshift(item);
  await writeInquiries(items);
  return item;
}

export async function listProspectiveInvestorInquiries() {
  return readInquiries();
}
