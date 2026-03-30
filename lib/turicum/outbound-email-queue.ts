import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTBOUND_EMAIL_QUEUE_PATH = path.join(ROOT, "data", "outbound-email-queue.json");

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

async function ensureFile() {
  try {
    await readFile(OUTBOUND_EMAIL_QUEUE_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await mkdir(path.dirname(OUTBOUND_EMAIL_QUEUE_PATH), { recursive: true });
    await writeFile(OUTBOUND_EMAIL_QUEUE_PATH, "[]\n", "utf8");
  }
}

async function readQueue() {
  await ensureFile();
  const raw = await readFile(OUTBOUND_EMAIL_QUEUE_PATH, "utf8");
  return JSON.parse(raw) as OutboundEmailQueueRecord[];
}

async function writeQueue(items: OutboundEmailQueueRecord[]) {
  await writeFile(OUTBOUND_EMAIL_QUEUE_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
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

  const queue = await readQueue();
  queue.unshift(item);
  await writeQueue(queue);
  return item;
}
