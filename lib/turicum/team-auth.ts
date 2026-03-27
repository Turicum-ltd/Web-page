const TEAM_SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const TEAM_SESSION_COOKIE = "turicum_team_session";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

interface TeamAccount {
  email: string;
  password: string;
}

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function readTeamSessionSecret() {
  return requireEnv("TURICUM_TEAM_SESSION_SECRET");
}

function buildTeamAccounts() {
  const accounts: TeamAccount[] = [
    {
      email: requireEnv("TURICUM_TEAM_EMAIL").toLowerCase(),
      password: requireEnv("TURICUM_TEAM_PASSWORD")
    }
  ];

  for (let index = 2; index <= 5; index += 1) {
    const email = readOptionalEnv(`TURICUM_TEAM_EMAIL_${index}`)?.toLowerCase();
    const password = readOptionalEnv(`TURICUM_TEAM_PASSWORD_${index}`);

    if (!email && !password) {
      continue;
    }

    if (!email || !password) {
      throw new Error(`Both TURICUM_TEAM_EMAIL_${index} and TURICUM_TEAM_PASSWORD_${index} are required when defining an extra team account.`);
    }

    accounts.push({ email, password });
  }

  return accounts;
}

export function isTeamAuthConfigured() {
  try {
    readTeamSessionSecret();
    buildTeamAccounts();
    return true;
  } catch {
    return false;
  }
}

interface TeamSessionPayload {
  email: string;
  expiresAt: number;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toBase64Url(input: string) {
  return bytesToBase64Url(new TextEncoder().encode(input));
}

function fromBase64Url(input: string) {
  return new TextDecoder().decode(base64UrlToBytes(input));
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(readTeamSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function authenticateTeamUser(email: string, password: string) {
  if (!isTeamAuthConfigured()) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return buildTeamAccounts().some((account) => account.email === normalizedEmail && account.password === password);
}

export async function createTeamSessionToken(email: string) {
  const payload: TeamSessionPayload = {
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + TEAM_SESSION_TTL_MS
  };
  const serialized = JSON.stringify(payload);
  const encodedPayload = toBase64Url(serialized);
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyTeamSessionToken(token: string | undefined) {
  if (!token || !isTeamAuthConfigured()) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = await signValue(encodedPayload);
  if (expectedSignature !== providedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as TeamSessionPayload;
    if (!payload.email || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export {
  TEAM_SESSION_COOKIE
};
