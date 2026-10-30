import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { env } from "../config.ts";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function smtp() {
  transport ??= nodemailer.createTransport(env.email.smtpUrl!);
  return transport;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string;
  attachments?: { filename: string; content: string; contentType: string }[];
}): Promise<string | undefined> {
  const info = await smtp().sendMail({
    from: env.email.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    inReplyTo: opts.inReplyTo,
    references: opts.inReplyTo,
    attachments: opts.attachments,
  });
  return info.messageId;
}

export interface InboundEmail {
  from: string;
  text: string;
  at: string;
  messageId?: string;
}

// Unread mail from the given addresses, marked as read once fetched.
export async function pollInbox(fromAddresses: string[]): Promise<InboundEmail[]> {
  if (!fromAddresses.length) return [];
  const wanted = new Set(fromAddresses.map((a) => a.toLowerCase()));
  const imap = new ImapFlow({
    host: env.email.imapHost!,
    port: 993,
    secure: true,
    auth: { user: env.email.imapUser!, pass: env.email.imapPass! },
    logger: false,
  });
  await imap.connect();
  const out: InboundEmail[] = [];
  const lock = await imap.getMailboxLock("INBOX");
  try {
    const uids = (await imap.search({ seen: false }, { uid: true })) || [];
    for (const uid of uids) {
      const msg = await imap.fetchOne(String(uid), { source: true, envelope: true }, { uid: true });
      if (!msg) continue;
      const from = msg.envelope?.from?.[0]?.address?.toLowerCase();
      if (!from || !wanted.has(from) || !msg.source) continue;
      const parsed = await simpleParser(msg.source);
      // Drop quoted history so the agent only sees the new reply.
      const text = (parsed.text ?? "").split(/\nOn .+wrote:\n|\n-----Original Message-----/)[0].trim();
      out.push({ from, text, at: (parsed.date ?? new Date()).toISOString(), messageId: parsed.messageId });
      await imap.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
    }
  } finally {
    lock.release();
    await imap.logout();
  }
  return out;
}
