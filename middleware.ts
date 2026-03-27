import { NextResponse, type NextRequest } from "next/server";
import { TEAM_SESSION_COOKIE, verifyTeamSessionToken } from "@/lib/turicum/team-auth";

function normalizeBasePath(input: string | undefined) {
  if (!input) {
    return "";
  }

  const trimmed = input.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  return (trimmed.startsWith("/") ? trimmed : `/${trimmed}`).replace(/\/+$/, "");
}

function stripBasePath(pathname: string, basePath: string) {
  if (!basePath) {
    return pathname;
  }

  if (pathname === basePath) {
    return "/";
  }

  return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
}

function isPublicTuricumPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/investors") ||
    pathname.startsWith("/investor-handoff") ||
    pathname.startsWith("/team-login") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/borrower") ||
    pathname.startsWith("/_next") ||
    pathname === "/api/health" ||
    pathname === "/api/intro-call-requests" ||
    pathname.startsWith("/api/investor-auth/") ||
    pathname.startsWith("/api/team-auth/") ||
    pathname.startsWith("/api/borrower/")
  );
}

function buildNextParam(pathname: string, search: string) {
  return `${pathname || "/"}${search}`;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const normalizedPathname = stripBasePath(pathname, normalizeBasePath(request.nextUrl.basePath));

  if (isPublicTuricumPath(normalizedPathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(TEAM_SESSION_COOKIE)?.value;
  const session = await verifyTeamSessionToken(sessionToken);

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL(`${request.nextUrl.basePath || ""}/team-login`, request.url);
  loginUrl.searchParams.set("next", buildNextParam(normalizedPathname, search));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"]
};
