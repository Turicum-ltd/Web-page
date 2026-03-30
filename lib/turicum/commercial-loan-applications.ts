import "server-only";

import { createClient } from "@supabase/supabase-js";

export interface CommercialLoanApplicationInput {
  primaryBorrowerName: string;
  primaryBorrowerEmail: string;
  primaryBorrowerPhone?: string;
  coBorrowerName?: string;
  coBorrowerEmail?: string;
  currentAddress?: string;
  formerAddress?: string;
  annualIncome?: string;
  cashOnHand?: string;
  realEstateAssets?: string;
  retirementAssets?: string;
  mortgageDebt?: string;
  creditorDebt?: string;
  otherLiabilities?: string;
  requestedAmount?: string;
  propertyAddress: string;
  propertyType: string;
  borrowingEntityName: string;
  bankruptcyHistory?: string;
  lawsuitHistory?: string;
  judgmentHistory?: string;
  declarationNotes?: string;
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

function getSupabaseConfig() {
  const url = readFirstEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readFirstEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured for commercial loan applications on this deployment.");
  }

  return { url, serviceRoleKey };
}

function getSupabaseAdmin() {
  const config = getSupabaseConfig();

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

interface CommercialLoanApplicationRow {
  id: string;
  created_at: string;
  primary_borrower_name: string;
  primary_borrower_email: string;
  primary_borrower_phone: string | null;
  co_borrower_name: string | null;
  co_borrower_email: string | null;
  annual_income: number | null;
  requested_amount: number | null;
  property_address: string;
  property_type: string;
  borrowing_entity_name: string;
  profile: Record<string, unknown> | null;
  financials: Record<string, unknown> | null;
  subject_property: Record<string, unknown> | null;
  declarations: Record<string, unknown> | null;
}

export interface CommercialLoanApplicationRecord {
  id: string;
  createdAt: string;
  primaryBorrowerName: string;
  primaryBorrowerEmail: string;
  primaryBorrowerPhone: string | null;
  coBorrowerName: string | null;
  coBorrowerEmail: string | null;
  annualIncome: number | null;
  requestedAmount: number | null;
  propertyAddress: string;
  propertyType: string;
  borrowingEntityName: string;
  profile: Record<string, unknown>;
  financials: Record<string, unknown>;
  subjectProperty: Record<string, unknown>;
  declarations: Record<string, unknown>;
}

function requireValue(label: string, value: string | undefined) {
  const next = value?.trim() ?? "";
  if (!next) {
    throw new Error(`${label} is required.`);
  }

  return next;
}

function normalizeEmail(value: string | undefined) {
  return requireValue("Borrower email", value).toLowerCase();
}

function parseCurrency(value: string | undefined) {
  const raw = value?.replace(/[^0-9.-]/g, "").trim() ?? "";

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error("Currency fields must be numeric.");
  }

  return parsed;
}

function parseYesNo(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return null;
  }

  return normalized === "yes";
}

function mapRow(row: CommercialLoanApplicationRow): CommercialLoanApplicationRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    primaryBorrowerName: row.primary_borrower_name,
    primaryBorrowerEmail: row.primary_borrower_email,
    primaryBorrowerPhone: row.primary_borrower_phone,
    coBorrowerName: row.co_borrower_name,
    coBorrowerEmail: row.co_borrower_email,
    annualIncome: row.annual_income,
    requestedAmount: row.requested_amount,
    propertyAddress: row.property_address,
    propertyType: row.property_type,
    borrowingEntityName: row.borrowing_entity_name,
    profile: row.profile ?? {},
    financials: row.financials ?? {},
    subjectProperty: row.subject_property ?? {},
    declarations: row.declarations ?? {}
  };
}

export async function createCommercialLoanApplication(
  input: CommercialLoanApplicationInput
) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("commercial_loan_applications")
    .insert({
      created_at: now,
      updated_at: now,
      status: "submitted",
      primary_borrower_name: requireValue("Borrower name", input.primaryBorrowerName),
      primary_borrower_email: normalizeEmail(input.primaryBorrowerEmail),
      primary_borrower_phone: input.primaryBorrowerPhone?.trim() ?? null,
      co_borrower_name: input.coBorrowerName?.trim() ?? null,
      co_borrower_email: input.coBorrowerEmail?.trim()?.toLowerCase() ?? null,
      annual_income: parseCurrency(input.annualIncome),
      requested_amount: parseCurrency(input.requestedAmount),
      property_address: requireValue("Property address", input.propertyAddress),
      property_type: requireValue("Property type", input.propertyType),
      borrowing_entity_name: requireValue("Borrowing entity name", input.borrowingEntityName),
      profile: {
        currentAddress: input.currentAddress?.trim() ?? "",
        formerAddress: input.formerAddress?.trim() ?? "",
        annualIncome: input.annualIncome?.trim() ?? ""
      },
      financials: {
        cashOnHand: input.cashOnHand?.trim() ?? "",
        realEstateAssets: input.realEstateAssets?.trim() ?? "",
        retirementAssets: input.retirementAssets?.trim() ?? "",
        mortgageDebt: input.mortgageDebt?.trim() ?? "",
        creditorDebt: input.creditorDebt?.trim() ?? "",
        otherLiabilities: input.otherLiabilities?.trim() ?? ""
      },
      subject_property: {
        requestedAmount: input.requestedAmount?.trim() ?? "",
        propertyAddress: input.propertyAddress.trim(),
        propertyType: input.propertyType.trim(),
        borrowingEntityName: input.borrowingEntityName.trim()
      },
      declarations: {
        bankruptcyHistory: parseYesNo(input.bankruptcyHistory),
        lawsuitHistory: parseYesNo(input.lawsuitHistory),
        judgmentHistory: parseYesNo(input.judgmentHistory),
        notes: input.declarationNotes?.trim() ?? ""
      }
    })
    .select("id, primary_borrower_email")
    .single();

  if (error) {
    throw new Error(`Failed to save commercial loan application: ${error.message}`);
  }

  return {
    id: String(data.id),
    email: String(data.primary_borrower_email)
  };
}

export async function getLatestCommercialLoanApplicationByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("commercial_loan_applications")
    .select(
      "id, created_at, primary_borrower_name, primary_borrower_email, primary_borrower_phone, co_borrower_name, co_borrower_email, annual_income, requested_amount, property_address, property_type, borrowing_entity_name, profile, financials, subject_property, declarations"
    )
    .eq("primary_borrower_email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("does not exist") || message.includes("relation")) {
      return null;
    }

    throw new Error(`Failed to load commercial loan applications: ${error.message}`);
  }

  return data ? mapRow(data as CommercialLoanApplicationRow) : null;
}
