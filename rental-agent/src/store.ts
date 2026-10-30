import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_DIR } from "./config.ts";
import type { ExtractedListing } from "./schemas.ts";

export type ChannelName = "whatsapp" | "email" | "relay";

export type Stage =
  | "new"
  | "contacted"
  | "negotiating"
  | "call_scheduled"
  | "viewing_scheduled"
  | "waiting_on_you"
  | "agreed_pending_you"
  | "declined"
  | "dead";

export interface Listing extends ExtractedListing {
  id: string;
  firstSeenAt: string;
  foundVia: string;
  score: number;
  flags: string[];
  legal: { ok: boolean; reason: string | null };
  status: "new" | "skipped" | "contacted";
}

export interface ChatMessage {
  dir: "in" | "out";
  text: string;
  at: string;
  note?: string;
}

export interface ScheduledEvent {
  kind: "phone_call" | "video_call" | "in_person";
  startIso: string;
  durationMinutes: number;
  where: string;
  withWhom: string;
  notes: string;
  outsideYourWindows: boolean;
}

export interface Conversation {
  id: string;
  listingId: string;
  channel: ChannelName;
  address: string; // phone (E.164 without +), email, or a free-form handle for relay
  messages: ChatMessage[];
  stage: Stage;
  askingSgd: number | null;
  bestOfferSgd: number | null;
  scheduled: ScheduledEvent[];
  redFlags: string[];
  summary: string;
  followUps: number;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  emailThreadId?: string;
}

export interface Draft {
  id: string;
  conversationId: string;
  text: string;
  reason: string;
  createdAt: string;
}

export interface State {
  listings: Record<string, Listing>;
  conversations: Record<string, Conversation>;
  drafts: Record<string, Draft>;
  lastSearchAt: string | null;
  contactLog: string[]; // ISO timestamps of first contacts, for the daily cap
}

const STATE_FILE = path.join(DATA_DIR, "state.json");

function empty(): State {
  return { listings: {}, conversations: {}, drafts: {}, lastSearchAt: null, contactLog: [] };
}

function read(): State {
  if (!fs.existsSync(STATE_FILE)) return empty();
  return { ...empty(), ...JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) };
}

function write(state: State) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

// The webhook server and the polling loop run in one process; serialise state access.
let queue: Promise<unknown> = Promise.resolve();
export function withState<T>(fn: (s: State) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const s = read();
    const out = await fn(s);
    write(s);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function peekState(): State {
  return read();
}

export function shortId(seed: string): string {
  return crypto.createHash("sha1").update(seed).digest("hex").slice(0, 8);
}

export function now(): string {
  return new Date().toISOString();
}
