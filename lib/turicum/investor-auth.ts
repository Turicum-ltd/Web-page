import "server-only";

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const USERS_PATH = path.join(ROOT, "data", "investor-users.json");
const SESSIONS_PATH = path.join(ROOT, "data", "investor-sessions.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export const INVESTOR_SESSION_COOKIE = "turicum_investor_session";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readSeededInvestorReviewCredentials() {
  return {
    email: requireEnv("TURICUM_INVESTOR_REVIEW_EMAIL").toLowerCase(),
    password: requireEnv("TURICUM_INVESTOR_REVIEW_PASSWORD")
  };
}

export function isInvestorAuthConfigured() {
  try {
    readSeededInvestorReviewCredentials();
    return true;
  } catch {
    return false;
  }
}

interface InvestorUserRecord {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  passwordHash: string;
  status: "active" | "disabled";
}

interface InvestorSessionRecord {
  id: string;
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface InvestorSessionUser {
  id: string;
  email: string;
  fullName: string;
  organization: string;
}

async function ensureJsonFile<T>(filePath: string, fallback: T) {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(fallback, null, 2) + "\n", "utf8");
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureJsonFile(filePath, fallback);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");

  if (stored.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(stored, derived);
}

function toSessionUser(user: InvestorUserRecord): InvestorSessionUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    organization: user.organization
  };
}

async function readUsers() {
  const seededCredentials = readSeededInvestorReviewCredentials();
  const users = await readJsonFile<InvestorUserRecord[]>(USERS_PATH, []);

  const seededIndex = users.findIndex((item) => item.organization === "Turicum Investor Review");
  const seededUser: InvestorUserRecord = {
    id: seededIndex >= 0 ? users[seededIndex].id : randomUUID(),
    email: seededCredentials.email,
    fullName: "Turicum Review Investor",
    organization: "Turicum Investor Review",
    passwordHash: hashPassword(seededCredentials.password),
    status: "active"
  };

  if (seededIndex >= 0) {
    const existing = users[seededIndex];
    const needsUpdate = existing.email !== seededUser.email
      || !verifyPassword(seededCredentials.password, existing.passwordHash)
      || existing.status !== "active";

    if (needsUpdate) {
      users[seededIndex] = seededUser;
      await writeJsonFile(USERS_PATH, users);
    }

    return users;
  }

  const next = [seededUser, ...users];
  await writeJsonFile(USERS_PATH, next);
  return next;
}

async function readSessions() {
  const sessions = await readJsonFile<InvestorSessionRecord[]>(SESSIONS_PATH, []);
  const now = Date.now();
  const active = sessions.filter((item) => Date.parse(item.expiresAt) > now);

  if (active.length !== sessions.length) {
    await writeJsonFile(SESSIONS_PATH, active);
  }

  return active;
}

async function writeSessions(items: InvestorSessionRecord[]) {
  await writeJsonFile(SESSIONS_PATH, items);
}

export async function authenticateInvestorUser(email: string, password: string) {
  if (!isInvestorAuthConfigured()) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await readUsers();
  const user = users.find((item) => item.email === normalizedEmail && item.status === "active");

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return toSessionUser(user);
}

export async function createInvestorSession(userId: string) {
  const sessions = await readSessions();
  const session: InvestorSessionRecord = {
    id: randomUUID(),
    token: randomBytes(32).toString("hex"),
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
  };

  sessions.unshift(session);
  await writeSessions(sessions);
  return session;
}

export async function getInvestorUserForSessionToken(token: string) {
  if (!isInvestorAuthConfigured()) {
    return null;
  }

  const [sessions, users] = await Promise.all([readSessions(), readUsers()]);
  const session = sessions.find((item) => item.token === token);

  if (!session) {
    return null;
  }

  const user = users.find((item) => item.id === session.userId && item.status === "active");
  return user ? toSessionUser(user) : null;
}

export async function invalidateInvestorSession(token: string) {
  const sessions = await readSessions();
  const next = sessions.filter((item) => item.token !== token);
  await writeSessions(next);
}
