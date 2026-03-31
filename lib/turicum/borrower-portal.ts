const DEFAULT_BORROWER_PORTAL_ORIGIN = "https://borrow.turicum.us";

function normalizeOrigin(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DEFAULT_BORROWER_PORTAL_ORIGIN;
  }

  return trimmed.replace(/\/+$/, "");
}

export function getBorrowerPortalOrigin() {
  return normalizeOrigin(
    process.env.BORROWER_PORTAL_ORIGIN ?? process.env.NEXT_PUBLIC_BORROWER_PORTAL_ORIGIN
  );
}

export function withBorrowerPortalPath(pathname: string = "/") {
  if (!pathname.startsWith("/")) {
    throw new Error(`Expected borrower portal path to start with '/', received: ${pathname}`);
  }

  return `${getBorrowerPortalOrigin()}${pathname}`;
}
