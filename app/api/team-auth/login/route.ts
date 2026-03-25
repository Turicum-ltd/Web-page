export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  TEAM_SESSION_COOKIE,
  authenticateTeamUser,
  createTeamSessionToken
} from "@/lib/atlas/team-auth";
import { buildAppUrl } from "@/lib/atlas/runtime";

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

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = readNextPath(formData);

  const authenticated = await authenticateTeamUser(email, password);
  if (!authenticated) {
    return NextResponse.redirect(
      `${buildAppUrl(request, `/team-login?error=invalid&next=${encodeURIComponent(nextPath)}`)}`,
      { status: 303 }
    );
  }

  const token = await createTeamSessionToken(email);
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
