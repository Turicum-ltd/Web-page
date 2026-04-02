import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function readFirstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

function getDeployMetadata() {
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.COMMIT_SHA ??
    process.env.SOURCE_COMMIT ??
    process.env.GITHUB_SHA ??
    null;

  const branch =
    process.env.VERCEL_GIT_COMMIT_REF ??
    process.env.BRANCH ??
    process.env.SOURCE_BRANCH ??
    process.env.GITHUB_REF_NAME ??
    null;

  const deployId =
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.DEPLOY_ID ??
    process.env.APP_PLATFORM_DEPLOYMENT_ID ??
    null;

  return {
    commitSha,
    shortCommitSha: commitSha ? commitSha.slice(0, 7) : null,
    branch,
    deployId
  };
}

function extractProjectRefFromUrl(url: string | null) {
  if (!url) {
    return null;
  }

  const match = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i);
  return match?.[1] ?? null;
}

function extractProjectRefFromJwt(token: string | null) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      ref?: string;
      role?: string;
    };

    return payload.ref ?? null;
  } catch {
    return null;
  }
}

async function checkTableAccess(table: string, url: string, key: string) {
  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    const { error, count } = await supabase.from(table).select("*", { head: true, count: "exact" });

    return {
      table,
      ok: !error,
      count: error ? null : count,
      error: error?.message ?? null
    };
  } catch (error) {
    return {
      table,
      ok: false,
      count: null,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function GET() {
  const supabaseUrl = readFirstEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const publicSupabaseUrl = readFirstEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readFirstEnv("SUPABASE_SERVICE_ROLE_KEY");
  const publishableKey = readFirstEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        app: "turicum-borrower-portal",
        timestamp: new Date().toISOString(),
        deploy: getDeployMetadata(),
        supabase: {
          configured: false,
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasPublicSupabaseUrl: Boolean(publicSupabaseUrl),
          hasServiceRoleKey: Boolean(serviceRoleKey),
          hasPublishableKey: Boolean(publishableKey)
        }
      },
      { status: 503 }
    );
  }

  const tables = await Promise.all([
    checkTableAccess("pre_intake_leads", supabaseUrl, serviceRoleKey),
    checkTableAccess("commercial_loan_applications", supabaseUrl, serviceRoleKey),
    checkTableAccess("turicum_user_profiles", supabaseUrl, serviceRoleKey)
  ]);

  const urlProjectRef = extractProjectRefFromUrl(supabaseUrl);
  const publicUrlProjectRef = extractProjectRefFromUrl(publicSupabaseUrl);
  const keyProjectRef = extractProjectRefFromJwt(serviceRoleKey);
  const ok = tables.every((table) => table.ok) && urlProjectRef !== null && urlProjectRef === keyProjectRef;

  return NextResponse.json(
    {
      ok,
      app: "turicum-borrower-portal",
      timestamp: new Date().toISOString(),
      deploy: getDeployMetadata(),
      supabase: {
        configured: true,
        urlProjectRef,
        publicUrlProjectRef,
        keyProjectRef,
        hasPublishableKey: Boolean(publishableKey),
        projectRefMatch: urlProjectRef !== null && urlProjectRef === keyProjectRef,
        tables
      }
    },
    { status: ok ? 200 : 503 }
  );
}
