import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getBasePath } from "@/lib/turicum/runtime";

function checkRequiredFiles(root: string) {
  const checks = [
    path.join(root, "public", "brand", "turicum-wordmark.svg"),
    path.join(root, "app", "icon.svg"),
    path.join(root, "data", "cases.json")
  ];

  return checks.map((file) => ({
    file: path.relative(root, file),
    ok: existsSync(file)
  }));
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

async function checkSupabaseAccess() {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      configured: false,
      ok: false,
      status: "unconfigured" as const
    };
  }

  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    const { error } = await supabase.from("state_packs").select("id").limit(1);

    if (error) {
      const normalized = error.message.toLowerCase();
      const status =
        normalized.includes("invalid api key") || normalized.includes("jwt")
          ? ("auth_failed" as const)
          : ("query_failed" as const);

      return {
        configured: true,
        ok: false,
        status
      };
    }

    return {
      configured: true,
      ok: true,
      status: "ok" as const
    };
  } catch {
    return {
      configured: true,
      ok: false,
      status: "unreachable" as const
    };
  }
}

export async function GET() {
  const root = process.cwd();
  const fileChecks = checkRequiredFiles(root);
  const supabase = await checkSupabaseAccess();
  const ok = fileChecks.every((check) => check.ok) && (supabase.ok || !supabase.configured);

  return NextResponse.json(
    {
      ok,
      app: "turicum-platform",
      basePath: getBasePath(),
      timestamp: new Date().toISOString(),
      checks: {
        files: fileChecks,
        supabase
      }
    },
    {
      status: ok ? 200 : 503
    }
  );
}
