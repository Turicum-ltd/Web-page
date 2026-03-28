export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import {
  TEAM_SESSION_COOKIE,
  authenticateTeamUser,
  createTeamSessionToken,
  isTeamAuthConfigured
} from "@/lib/turicum/team-auth";
import {
  createSupabaseStaffRouteClient,
  getStaffProfileByUserId,
  isSupabaseStaffAuthConfigured
} from "@/lib/turicum/staff-supabase-auth";
import { buildAppUrl } from "@/lib/turicum/runtime";

function shouldUseSecureCookie(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

function readNextPath(formData: FormData) {
  const nextPath = String(formData.get("next") ?? "/review").trim();
  if (!nextPath.startsWith("/")) {
    return "/review";
  }
  return nextPath;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = readNextPath(formData);
  const normalizedEmail = email.trim().toLowerCase();
  const supabaseConfigured = isSupabaseStaffAuthConfigured();
  const legacyConfigured = isTeamAuthConfigured();

  if (supabaseConfigured) {
    try {
      const response = NextResponse.redirect(buildAppUrl(request, nextPath), { status: 303 });
      const supabase = createSupabaseStaffRouteClient(request, response);

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (!error && data.user) {
          const profile = await getStaffProfileByUserId(data.user.id);

          if (profile?.isActive) {
            response.cookies.set(TEAM_SESSION_COOKIE, "", {
              httpOnly: true,
              sameSite: "lax",
              secure: shouldUseSecureCookie(request),
              path: "/",
              expires: new Date(0)
            });
            return response;
          }

          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error("Turicum Supabase team sign-in failed", error);
    }
  }

  if (legacyConfigured) {
    const authenticated = await authenticateTeamUser(normalizedEmail, password);
    if (authenticated) {
      const token = await createTeamSessionToken(normalizedEmail);
      const response = NextResponse.redirect(buildAppUrl(request, nextPath), { status: 303 });
      response.cookies.set(TEAM_SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureCookie(request),
        path: "/",
        maxAge: 60 * 60 * 12
      });
      return response;
    }
  }

  if (!supabaseConfigured && !legacyConfigured) {
    return NextResponse.redirect(
      `${buildAppUrl(request, `/team-login?error=unavailable&next=${encodeURIComponent(nextPath)}`)}`,
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    `${buildAppUrl(request, `/team-login?error=invalid&next=${encodeURIComponent(nextPath)}`)}`,
    { status: 303 }
  );
}
