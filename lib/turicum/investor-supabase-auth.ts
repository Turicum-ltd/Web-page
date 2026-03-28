import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { NextResponse, type NextRequest } from "next/server";

interface SupabaseInvestorAuthConfig {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
}

interface InvestorProfileRow {
  user_id: string;
  role: string;
  full_name: string | null;
  organization: string | null;
  is_active: boolean;
}

export interface InvestorProfile {
  userId: string;
  role: "investor";
  fullName: string | null;
  organization: string | null;
  isActive: boolean;
  email: string;
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

function getSupabaseInvestorAuthConfig(): SupabaseInvestorAuthConfig | null {
  const url = readFirstEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const publishableKey = readFirstEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY"
  );
  const serviceRoleKey = readFirstEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !publishableKey || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    publishableKey,
    serviceRoleKey
  };
}

function createCookieAdapter(
  getAll: () => { name: string; value: string }[],
  setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => void
) {
  return {
    getAll,
    setAll
  };
}

function getSupabaseAdminClient() {
  const config = getSupabaseInvestorAuthConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function isSupabaseInvestorAuthConfigured() {
  return Boolean(getSupabaseInvestorAuthConfig());
}

function mapInvestorProfile(
  row: InvestorProfileRow | null,
  email: string | undefined
): InvestorProfile | null {
  if (!row || row.role !== "investor" || !email) {
    return null;
  }

  return {
    userId: row.user_id,
    role: "investor",
    fullName: row.full_name,
    organization: row.organization,
    isActive: row.is_active,
    email
  };
}

export async function getInvestorProfileByUserId(userId: string, email: string | undefined) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("turicum_user_profiles")
    .select("user_id, role, full_name, organization, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Turicum investor profile: ${error.message}`);
  }

  return mapInvestorProfile(data as InvestorProfileRow | null, email);
}

export async function listInvestorGrantedCaseIds(userId: string) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from("turicum_case_access_grants")
    .select("case_id")
    .eq("user_id", userId)
    .eq("access_role", "investor")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    throw new Error(`Failed to load investor case grants: ${error.message}`);
  }

  return (data ?? []).map((row) => String(row.case_id));
}

export function createSupabaseInvestorRouteClient(request: NextRequest, response: NextResponse) {
  const config = getSupabaseInvestorAuthConfig();

  if (!config) {
    return null;
  }

  return createServerClient(config.url, config.publishableKey, {
    cookies: createCookieAdapter(
      () => request.cookies.getAll(),
      (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    )
  });
}

function createSupabaseInvestorReadClient(cookieStore: ReadonlyRequestCookies) {
  const config = getSupabaseInvestorAuthConfig();

  if (!config) {
    return null;
  }

  return createServerClient(config.url, config.publishableKey, {
    cookies: createCookieAdapter(
      () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      () => {
        // Server components can read cookies here; refresh writes happen in route handlers.
      }
    )
  });
}

export async function resolveSupabaseInvestorSessionFromCookies(cookieStore: ReadonlyRequestCookies) {
  const supabase = createSupabaseInvestorReadClient(cookieStore);

  if (!supabase) {
    return {
      investor: null as InvestorProfile | null,
      grantedCaseIds: [] as string[]
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      investor: null as InvestorProfile | null,
      grantedCaseIds: [] as string[]
    };
  }

  const investor = await getInvestorProfileByUserId(data.user.id, data.user.email);
  if (!investor || !investor.isActive) {
    return {
      investor: null as InvestorProfile | null,
      grantedCaseIds: [] as string[]
    };
  }

  const grantedCaseIds = await listInvestorGrantedCaseIds(investor.userId);
  return {
    investor,
    grantedCaseIds
  };
}
