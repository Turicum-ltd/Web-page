const DEFAULT_BORROWER_PORTAL_ORIGIN = "https://borrow.turicum.us";

function normalizeOrigin(input: string | undefined) {
  const trimmed = input?.trim();
  if (!trimmed) {
    return DEFAULT_BORROWER_PORTAL_ORIGIN;
  }

  return trimmed.replace(/\/+$/, "");
}

function getConfiguredOrigin() {
  if (typeof window === "undefined") {
    return normalizeOrigin(
      process.env.BORROWER_PORTAL_ORIGIN ?? process.env.NEXT_PUBLIC_BORROWER_PORTAL_ORIGIN
    );
  }

  return normalizeOrigin(process.env.NEXT_PUBLIC_BORROWER_PORTAL_ORIGIN);
}

export function withBasePath(pathname: string) {
  if (!pathname.startsWith("/")) {
    throw new Error(`Expected an absolute app path, received: ${pathname}`);
  }

  return pathname;
}

export function withConfiguredBasePath(pathname: string) {
  if (!pathname.startsWith("/")) {
    throw new Error(`Expected an absolute app path, received: ${pathname}`);
  }

  return pathname;
}

export function buildAppUrl(source: Headers | Request, pathname: string) {
  const explicitOrigin = getConfiguredOrigin();
  const headers = source instanceof Headers ? source : source.headers;
  const requestUrl = source instanceof Request ? new URL(source.url) : null;
  const forwardedHost =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? requestUrl?.host ?? "localhost:3000";
  const forwardedProto =
    headers.get("x-forwarded-proto") ?? requestUrl?.protocol.replace(/:$/, "") ?? "http";
  const normalizedHost = forwardedHost.split(",")[0]?.trim().toLowerCase() || "localhost:3000";
  const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?$/.test(normalizedHost);

  if (explicitOrigin && !isLocalHost) {
    return `${explicitOrigin}${pathname}`;
  }

  return `${forwardedProto}://${forwardedHost}${pathname}`;
}
