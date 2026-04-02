import "server-only";

import { createClient } from "@supabase/supabase-js";

export interface PreIntakeLeadInput {
  fullName: string;
  email: string;
  phone: string;
  requestedAmount: string;
  assetLocation: string;
  propertyType: string;
  assetDescription: string;
  ownershipStatus: string;
  purchaseDate: string;
  purchasePrice: string;
  capitalInvested: string;
  existingLiens: string;
  titleHeld: string;
  estimatedValue: string;
  valueBasis: string;
  preferredTimeline: string;
}

interface PreIntakeLeadRow {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  full_name: string;
  email: string;
  phone: string;
  requested_amount: string;
  asset_location: string;
  property_type: string;
  asset_description: string;
  ownership_status: string;
  purchase_date: string;
  purchase_price: string;
  capital_invested: string;
  existing_liens: string;
  title_held: string;
  estimated_value: string;
  value_basis: string;
  preferred_timeline: string;
  application_token: string;
  application_link_generated_at: string | null;
  application_started_at: string | null;
  application_submitted_at: string | null;
  application_id: string | null;
  summary_email_queued_at: string | null;
}

export interface PreIntakeLeadRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  requestedAmount: string;
  assetLocation: string;
  propertyType: string;
  assetDescription: string;
  ownershipStatus: string;
  purchaseDate: string;
  purchasePrice: string;
  capitalInvested: string;
  existingLiens: string;
  titleHeld: string;
  estimatedValue: string;
  valueBasis: string;
  preferredTimeline: string;
  applicationToken: string;
  applicationLinkGeneratedAt: string | null;
  applicationStartedAt: string | null;
  applicationSubmittedAt: string | null;
  applicationId: string | null;
  summaryEmailQueuedAt: string | null;
}

const PRE_INTAKE_LEADS_TABLE = "pre_intake_leads";
const PRE_INTAKE_LEAD_SELECT =
  "id, created_at, updated_at, status, full_name, email, phone, requested_amount, asset_location, property_type, asset_description, ownership_status, purchase_date, purchase_price, capital_invested, existing_liens, title_held, estimated_value, value_basis, preferred_timeline, application_token, application_link_generated_at, application_started_at, application_submitted_at, application_id, summary_email_queued_at";

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
    throw new Error("Supabase is not configured for pre-intake leads on this deployment.");
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

function requireValue(label: string, value: string | undefined) {
  const next = value?.trim() ?? "";
  if (!next) {
    throw new Error(`${label} is required.`);
  }

  return next;
}

function normalizeEmail(value: string | undefined) {
  return requireValue("Email", value).toLowerCase();
}

function mapLeadRow(row: PreIntakeLeadRow): PreIntakeLeadRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    requestedAmount: row.requested_amount,
    assetLocation: row.asset_location,
    propertyType: row.property_type,
    assetDescription: row.asset_description,
    ownershipStatus: row.ownership_status,
    purchaseDate: row.purchase_date,
    purchasePrice: row.purchase_price,
    capitalInvested: row.capital_invested,
    existingLiens: row.existing_liens,
    titleHeld: row.title_held,
    estimatedValue: row.estimated_value,
    valueBasis: row.value_basis,
    preferredTimeline: row.preferred_timeline,
    applicationToken: row.application_token,
    applicationLinkGeneratedAt: row.application_link_generated_at,
    applicationStartedAt: row.application_started_at,
    applicationSubmittedAt: row.application_submitted_at,
    applicationId: row.application_id,
    summaryEmailQueuedAt: row.summary_email_queued_at
  };
}

function buildLeadPayload(input: PreIntakeLeadInput) {
  return {
    full_name: requireValue("Name", input.fullName),
    email: normalizeEmail(input.email),
    phone: requireValue("Phone", input.phone),
    requested_amount: requireValue("Requested amount", input.requestedAmount),
    asset_location: requireValue("Asset location", input.assetLocation),
    property_type: requireValue("Property type", input.propertyType),
    asset_description: requireValue("Asset description", input.assetDescription),
    ownership_status: requireValue("Ownership status", input.ownershipStatus),
    purchase_date: requireValue("Purchase date", input.purchaseDate),
    purchase_price: requireValue("Purchase price", input.purchasePrice),
    capital_invested: requireValue("Capital invested", input.capitalInvested),
    existing_liens: requireValue("Existing liens", input.existingLiens),
    title_held: requireValue("Title held", input.titleHeld),
    estimated_value: requireValue("Estimated value", input.estimatedValue),
    value_basis: requireValue("Value basis", input.valueBasis),
    preferred_timeline: requireValue("Preferred timeline", input.preferredTimeline)
  };
}

export async function createPreIntakeLead(input: PreIntakeLeadInput) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(PRE_INTAKE_LEADS_TABLE)
    .insert({
      created_at: now,
      updated_at: now,
      ...buildLeadPayload(input)
    })
    .select(PRE_INTAKE_LEAD_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to save pre-intake lead: ${error.message}`);
  }

  return mapLeadRow(data as PreIntakeLeadRow);
}

export async function listPreIntakeLeads() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PRE_INTAKE_LEADS_TABLE)
    .select(PRE_INTAKE_LEAD_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("does not exist") || message.includes("relation")) {
      return [];
    }

    throw new Error(`Failed to load pre-intake leads: ${error.message}`);
  }

  return ((data ?? []) as PreIntakeLeadRow[]).map(mapLeadRow);
}

export async function updatePreIntakeLead(input: {
  leadId: string;
  lead: PreIntakeLeadInput;
  status?: string;
}) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(PRE_INTAKE_LEADS_TABLE)
    .update({
      updated_at: now,
      ...buildLeadPayload(input.lead),
      ...(input.status ? { status: input.status } : {})
    })
    .eq("id", input.leadId)
    .select(PRE_INTAKE_LEAD_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update pre-intake lead: ${error.message}`);
  }

  return mapLeadRow(data as PreIntakeLeadRow);
}

export async function generatePreIntakeLeadApplicationLink(leadId: string) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(PRE_INTAKE_LEADS_TABLE)
    .update({
      updated_at: now,
      status: "application_link_generated",
      application_link_generated_at: now
    })
    .eq("id", leadId)
    .select(PRE_INTAKE_LEAD_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to generate application link: ${error.message}`);
  }

  return mapLeadRow(data as PreIntakeLeadRow);
}

export async function getPreIntakeLeadByApplicationToken(token: string) {
  const nextToken = token.trim();
  if (!nextToken) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(PRE_INTAKE_LEADS_TABLE)
    .select(PRE_INTAKE_LEAD_SELECT)
    .eq("application_token", nextToken)
    .maybeSingle();

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("does not exist") || message.includes("relation")) {
      return null;
    }

    throw new Error(`Failed to load pre-intake lead: ${error.message}`);
  }

  return data ? mapLeadRow(data as PreIntakeLeadRow) : null;
}

export async function markPreIntakeLeadApplicationStarted(token: string) {
  const lead = await getPreIntakeLeadByApplicationToken(token);

  if (!lead || lead.applicationStartedAt) {
    return lead;
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(PRE_INTAKE_LEADS_TABLE)
    .update({
      updated_at: now,
      status: "application_started",
      application_started_at: now
    })
    .eq("id", lead.id)
    .select(PRE_INTAKE_LEAD_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update pre-intake lead start status: ${error.message}`);
  }

  return mapLeadRow(data as PreIntakeLeadRow);
}

export async function markPreIntakeLeadSummaryEmailQueued(leadId: string) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(PRE_INTAKE_LEADS_TABLE)
    .update({
      updated_at: now,
      summary_email_queued_at: now
    })
    .eq("id", leadId);

  if (error) {
    throw new Error(`Failed to update pre-intake email status: ${error.message}`);
  }
}

export async function markPreIntakeLeadApplicationSubmitted(input: {
  leadId: string;
  applicationId: string;
}) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(PRE_INTAKE_LEADS_TABLE)
    .update({
      updated_at: now,
      status: "application_submitted",
      application_submitted_at: now,
      application_id: input.applicationId
    })
    .eq("id", input.leadId);

  if (error) {
    throw new Error(`Failed to update pre-intake lead submission status: ${error.message}`);
  }
}
