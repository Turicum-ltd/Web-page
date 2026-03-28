export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { TEAM_SESSION_COOKIE } from "@/lib/turicum/team-auth";
import { createSupabaseStaffRouteClient, isSupabaseStaffAuthConfigured } from "@/lib/turicum/staff-supabase-auth";
import { buildAppUrl } from "@/lib/turicum/runtime";

function shouldUseSecureCookie(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(buildAppUrl(request, "/team-login?logged_out=1"), {
    status: 303
  });

  if (isSupabaseStaffAuthConfigured()) {
    try {
      const supabase = createSupabaseStaffRouteClient(request, response);
      await supabase?.auth.signOut();
    } catch (error) {
      console.error("Turicum Supabase sign-out failed", error);
    }
  }

  response.cookies.set(TEAM_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    expires: new Date(0)
  });
  return response;
}
