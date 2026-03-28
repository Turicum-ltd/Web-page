import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { NextResponse, type NextRequest } from "next/server";

const STAFF_ROLES = ["staff_admin", "staff_ops", "staff_counsel"] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

interface SupabaseStaffAuthConfig {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
}

interface StaffProfileRow {
  user_id: string;
  role: StaffRole;
  full_name: string | null;
  organization: string | null;
  is_active: boolean;
}

export interface StaffProfile {
  userId: string;
  role: StaffRole;
  fullName: string | null;
  organization: string | null;
  isActive: boolean;
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

function getSupabaseStaffAuthConfig(): SupabaseStaffAuthConfig | null {
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

export function isSupabaseStaffAuthConfigured() {
  return Boolean(getSupabaseStaffAuthConfig());
}

function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

function getSupabaseAdminClient() {
  const config = getSupabaseStaffAuthConfig();

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

function mapStaffProfile(row: StaffProfileRow | null): StaffProfile | null {
  if (!row || !isStaffRole(row.role)) {
    return null;
  }

  return {
    userId: row.user_id,
    role: row.role,
    fullName: row.full_name,
    organization: row.organization,
    isActive: row.is_active
  };
}

export async function getStaffProfileByUserId(userId: string) {
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
    throw new Error(`Failed to load Turicum staff profile: ${error.message}`);
  }

  return mapStaffProfile(data as StaffProfileRow | null);
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

function createSupabaseStaffReadClient(cookieStore: ReadonlyRequestCookies) {
  const config = getSupabaseStaffAuthConfig();

  if (!config) {
    return null;
  }

  return createServerClient(config.url, config.publishableKey, {
    cookies: createCookieAdapter(
      () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      () => {
        // Cookie writes happen in route handlers and middleware.
      }
    )
  });
}

export function createSupabaseStaffRouteClient(request: NextRequest, response: NextResponse) {
  const config = getSupabaseStaffAuthConfig();

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

export async function resolveSupabaseStaffSession(request: NextRequest) {
  const config = getSupabaseStaffAuthConfig();
  let response = NextResponse.next({
    request
  });

  if (!config) {
    return { response, profile: null as StaffProfile | null };
  }

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: createCookieAdapter(
      () => request.cookies.getAll(),
      (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    )
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { response, profile: null as StaffProfile | null };
  }

  const profile = await getStaffProfileByUserId(data.user.id);
  if (!profile || !profile.isActive) {
    return { response, profile: null as StaffProfile | null };
  }

  return { response, profile };
}

export async function resolveSupabaseStaffSessionFromCookies(cookieStore: ReadonlyRequestCookies) {
  const supabase = createSupabaseStaffReadClient(cookieStore);

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  const profile = await getStaffProfileByUserId(data.user.id);
  if (!profile || !profile.isActive) {
    return null;
  }

  return profile;
}
