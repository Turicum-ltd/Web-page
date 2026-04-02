import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_OUTBOUND_EMAIL_QUEUE_PATH = path.join(ROOT, "data", "outbound-email-queue.json");
const FALLBACK_OUTBOUND_EMAIL_QUEUE_PATH = path.join("/tmp", "turicum-outbound-email-queue.json");

export interface OutboundEmailQueueRecord {
  id: string;
  createdAt: string;
  status: "pending";
  templateKey: string;
  to: string;
  subject: string;
  text: string;
  metadata: Record<string, string>;
}

function resolveConfiguredQueuePath() {
  const configuredPath = process.env.TURICUM_OUTBOUND_EMAIL_QUEUE_PATH?.trim();
  return configuredPath || DEFAULT_OUTBOUND_EMAIL_QUEUE_PATH;
}

function isRecoverableQueueWriteError(error: unknown) {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return code === "EACCES" || code === "EPERM" || code === "EROFS";
}

async function ensureFile(queuePath: string) {
  try {
    await readFile(queuePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await mkdir(path.dirname(queuePath), { recursive: true });
    await writeFile(queuePath, "[]\n", "utf8");
  }
}

async function resolveQueuePath() {
  const primaryPath = resolveConfiguredQueuePath();

  try {
    await ensureFile(primaryPath);
    return primaryPath;
  } catch (error) {
    if (!isRecoverableQueueWriteError(error) || primaryPath === FALLBACK_OUTBOUND_EMAIL_QUEUE_PATH) {
      throw error;
    }

    await ensureFile(FALLBACK_OUTBOUND_EMAIL_QUEUE_PATH);
    return FALLBACK_OUTBOUND_EMAIL_QUEUE_PATH;
  }
}

async function readQueue(queuePath: string) {
  const raw = await readFile(queuePath, "utf8");
  return JSON.parse(raw) as OutboundEmailQueueRecord[];
}

async function writeQueue(queuePath: string, items: OutboundEmailQueueRecord[]) {
  await writeFile(queuePath, JSON.stringify(items, null, 2) + "\n", "utf8");
}

export async function enqueueOutboundEmail(input: {
  templateKey: string;
  to: string;
  subject: string;
  text: string;
  metadata?: Record<string, string>;
}) {
  const item: OutboundEmailQueueRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    templateKey: input.templateKey,
    to: input.to.trim().toLowerCase(),
    subject: input.subject,
    text: input.text,
    metadata: input.metadata ?? {}
  };

  const queuePath = await resolveQueuePath();
  const queue = await readQueue(queuePath);
  queue.unshift(item);
  await writeQueue(queuePath, queue);
  return item;
}
