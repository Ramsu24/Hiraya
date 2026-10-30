import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, env, channelsEnabled } from "./config.ts";
import { sendEmail } from "./channels/email.ts";
import type { ScheduledEvent } from "./store.ts";

export interface Notice {
  title: string;
  body: string;
  urgent?: boolean;
  ics?: { filename: string; content: string };
}

// Sends to every channel you configured: ntfy push (phone), Telegram, and email.
// Always also prints to the console and appends to data/notifications.log.
export async function notify(n: Notice) {
  const line = `[${new Date().toISOString()}] ${n.urgent ? "!! " : ""}${n.title}\n${n.body}\n`;
  console.log(`\n🔔 ${line}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.appendFileSync(path.join(DATA_DIR, "notifications.log"), `${line}\n`);

  const jobs: Promise<unknown>[] = [];
  const { ntfyTopic, ntfyServer, telegramToken, telegramChatId, emailTo } = env.notify;
  if (ntfyTopic) {
    jobs.push(
      fetch(`${ntfyServer}/${ntfyTopic}`, {
        method: "POST",
        headers: {
          Title: n.title.replace(/[^\x20-\x7E]/g, ""),
          Priority: n.urgent ? "high" : "default",
          Tags: n.urgent ? "house,rotating_light" : "house",
        },
        body: n.body,
      }),
    );
  }
  if (telegramToken && telegramChatId) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegramChatId, text: `${n.title}\n\n${n.body}` }),
      }),
    );
  }
  if (emailTo && channelsEnabled.email()) {
    jobs.push(
      sendEmail({
        to: emailTo,
        subject: `[Rental agent] ${n.title}`,
        text: n.body,
        attachments: n.ics ? [{ filename: n.ics.filename, content: n.ics.content, contentType: "text/calendar" }] : undefined,
      }),
    );
  }
  for (const r of await Promise.allSettled(jobs)) {
    if (r.status === "rejected") console.warn("notification channel failed:", r.reason);
  }
}

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildIcs(ev: ScheduledEvent, title: string, description: string, uid: string): string {
  const start = new Date(ev.startIso);
  const end = new Date(start.getTime() + ev.durationMinutes * 60_000);
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//hiraya//rental-agent//EN",
    "BEGIN:VEVENT",
    `UID:${uid}@rental-agent`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(ev.where)}`,
    `DESCRIPTION:${esc(description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const dir = path.join(DATA_DIR, "events");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${uid}.ics`), ics);
  return ics;
}
