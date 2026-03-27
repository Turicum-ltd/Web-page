function normalizeBasePath(input: string | undefined) {
  if (!input) {
    return '';
  }

  const trimmed = input.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

function getConfiguredBasePath() {
  return normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.TURICUM_BASE_PATH ?? '/turicum');
}

export function getBasePath() {
  return getConfiguredBasePath();
}

// Use this for Next.js router-aware navigation (Link, redirect).
// Next will prepend the configured basePath automatically.
export function withBasePath(pathname: string) {
  if (!pathname.startsWith('/')) {
    throw new Error(`Expected an absolute app path, received: ${pathname}`);
  }

  return pathname;
}

// Use this for raw browser URLs and assets (form actions, fetch, image src, window.location).
export function withConfiguredBasePath(pathname: string) {
  if (!pathname.startsWith('/')) {
    throw new Error(`Expected an absolute app path, received: ${pathname}`);
  }

  const basePath = getConfiguredBasePath();
  return pathname === '/' ? (basePath || '/') : `${basePath}${pathname}`;
}

export function buildAppUrl(source: Headers | Request, pathname: string) {
  const explicitOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? process.env.APP_ORIGIN;
  const fullPath = `${getConfiguredBasePath()}${pathname}` || '/';
  const headers = source instanceof Headers ? source : source.headers;
  const requestUrl = source instanceof Request ? new URL(source.url) : null;
  const forwardedHost = headers.get('x-forwarded-host') ?? headers.get('host') ?? requestUrl?.host ?? 'localhost:3000';
  const forwardedProto = headers.get('x-forwarded-proto') ?? requestUrl?.protocol.replace(/:$/, '') ?? 'http';
  const normalizedHost = forwardedHost.split(',')[0]?.trim().toLowerCase() || 'localhost:3000';
  const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?$/.test(normalizedHost);

  if (explicitOrigin && !isLocalHost) {
    return `${explicitOrigin.replace(/\/$/, '')}${fullPath}`;
  }

  return `${forwardedProto}://${forwardedHost}${fullPath}`;
}
