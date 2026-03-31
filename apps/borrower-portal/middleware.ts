import { NextResponse, type NextRequest } from "next/server";

function readCanonicalHost() {
  return (process.env.BORROWER_PORTAL_HOST ?? "borrow.turicum.us").trim().toLowerCase();
}

export function middleware(request: NextRequest) {
  const canonicalHost = readCanonicalHost();
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").trim().toLowerCase();
  const hostWithoutPort = host.replace(/:\d+$/, "");
  const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(hostWithoutPort);

  if (
    process.env.NODE_ENV !== "production" ||
    !canonicalHost ||
    !host ||
    isLocalHost ||
    hostWithoutPort === canonicalHost
  ) {
    return NextResponse.next();
  }

  const nextUrl = request.nextUrl.clone();
  nextUrl.protocol = "https";
  nextUrl.host = canonicalHost;
  return NextResponse.redirect(nextUrl, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"]
};
