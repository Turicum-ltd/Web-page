export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { TEAM_SESSION_COOKIE } from "@/lib/turicum/team-auth";
import { buildAppUrl } from "@/lib/turicum/runtime";

function shouldUseSecureCookie(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const response = NextResponse.redirect(buildAppUrl(request, "/team-login?logged_out=1"), {
    status: 303
  });
  response.cookies.set(TEAM_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    expires: new Date(0)
  });
  return response;
}
