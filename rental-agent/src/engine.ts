import { channelsEnabled, type Preferences } from "./config.ts";
import { sendEmail } from "./channels/email.ts";
import { sendWhatsAppTemplate, sendWhatsAppText, within24h } from "./channels/whatsapp.ts";
import { nextTurn } from "./negotiator.ts";
import { buildIcs, notify } from "./notify.ts";
import { checkOutgoing, isWithinWindows, legalCheck, normalizeSgPhone, scoreListing } from "./rules.ts";
import type { ExtractedListing, NegotiatorTurn } from "./schemas.ts";
import { scrapeUrls, facebookUrls } from "./sources/browser.ts";
import { searchWeb } from "./sources/webSearch.ts";
import {
  now,
  shortId,
  withState,
  type ChannelName,
  type Conversation,
  type Listing,
  type State,
} from "./store.ts";

// ---------------- search ----------------

function listingKey(l: ExtractedListing): string {
  if (l.url) return l.url.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
  return `${normalizeSgPhone(l.contact_phone) ?? l.contact_email ?? ""}|${l.title.toLowerCase()}|${l.price_sgd_month}`;
}

export async function runSearch(prefs: Preferences): Promise<Listing[]> {
  const batches: { listing: ExtractedListing; via: string }[] = [];
  if (prefs.sources.web_search) {
    console.log("Searching the web...");
    try {
      batches.push(...(await searchWeb(prefs)).map((listing) => ({ listing, via: "web_search" })));
    } catch (e) {
      console.warn("web search failed:", (e as Error).message);
    }
  }
  if (prefs.sources.urls.length) {
    console.log("Reading your saved search pages...");
    batches.push(...(await scrapeUrls(prefs.sources.urls, prefs, "url")));
  }
  const fb = facebookUrls(prefs);
  if (fb.length) {
    console.log("Reading Facebook groups / Marketplace...");
    batches.push(...(await scrapeUrls(fb, prefs, "facebook", 6)));
  }

  return withState((s) => {
    const added: Listing[] = [];
    for (const { listing, via } of batches) {
      const id = shortId(listingKey(listing));
      if (s.listings[id]) continue;
      const { score, flags } = scoreListing(listing, prefs);
      const legal = legalCheck(listing, prefs.search.duration_months);
      if (!legal.ok) flags.push(`not allowed: ${legal.reason}`);
      const l: Listing = {
        ...listing,
        id,
        firstSeenAt: now(),
        foundVia: via,
        score: legal.ok ? score : 0,
        flags,
        legal,
        status: "new",
      };
      s.listings[id] = l;
      added.push(l);
    }
    s.lastSearchAt = now();
    return added.sort((a, b) => b.score - a.score);
  });
}

// ---------------- sending ----------------

function pickChannel(l: Listing): { channel: ChannelName; address: string } {
  const phone = normalizeSgPhone(l.contact_phone);
  if (phone && channelsEnabled.whatsapp()) return { channel: "whatsapp", address: phone };
  if (l.contact_email && channelsEnabled.email()) return { channel: "email", address: l.contact_email.toLowerCase() };
  return { channel: "relay", address: l.url ?? l.contact_phone ?? l.contact_email ?? l.contact_name ?? "unknown" };
}

function needsApproval(prefs: Preferences, c: Conversation): boolean {
  const mode = prefs.negotiation.approval;
  return mode === "approve_all" || (mode === "approve_first" && !c.messages.some((m) => m.dir === "out"));
}

async function deliver(s: State, prefs: Preferences, c: Conversation, text: string): Promise<string> {
  const l = s.listings[c.listingId];
  const firstMessage = !c.messages.some((m) => m.dir === "out");
  if (c.channel === "whatsapp") {
    if (within24h(c.lastInboundAt)) {
      await sendWhatsAppText(c.address, text);
      return text;
    }
    if (!firstMessage) throw new Error("outside WhatsApp's 24h window; wait for them to reply");
    const params = [prefs.you.name, l.title.slice(0, 60), String(prefs.search.duration_months), prefs.search.move_in];
    await sendWhatsAppTemplate(c.address, params);
    return `[template] AI assistant for ${params[0]}, asking if "${params[1]}" is available for ${params[2]} months from ${params[3]}.`;
  }
  if (c.channel === "email") {
    const id = await sendEmail({ to: c.address, subject: `Re: ${l.title}`.slice(0, 120), text, inReplyTo: c.emailThreadId });
    c.emailThreadId ??= id;
    return text;
  }
  await notify({
    title: `Please send this for ${l.title.slice(0, 50)}`,
    body: `No API for this contact (${c.address}). Paste this into Messenger/chat:\n\n${text}\n\nWhen they reply, run:\nnpm run agent -- relay ${c.id} "<their reply>"`,
  });
  return text;
}

async function sendOrDraft(s: State, prefs: Preferences, c: Conversation, text: string) {
  const blocked = checkOutgoing(text, prefs);
  if (blocked || needsApproval(prefs, c)) {
    const id = shortId(`${c.id}${now()}${text}`);
    s.drafts[id] = { id, conversationId: c.id, text, reason: blocked ?? "approval required", createdAt: now() };
    c.stage = "waiting_on_you";
    await notify({
      title: `Approve message to ${s.listings[c.listingId].title.slice(0, 50)}?`,
      body: `${blocked ? `Held: ${blocked}.\n` : ""}Draft:\n\n${text}\n\nSend: npm run agent -- approve ${id}\nEdit:  npm run agent -- approve ${id} "new text"\nDrop:  npm run agent -- reject ${id}`,
      urgent: Boolean(blocked),
    });
    return;
  }
  const sent = await deliver(s, prefs, c, text);
  c.messages.push({ dir: "out", text: sent, at: now(), note: c.channel === "relay" ? "relayed by you" : undefined });
  c.lastOutboundAt = now();
}

export async function sendApprovedDraft(prefs: Preferences, draftId: string, override?: string) {
  await withState(async (s) => {
    const d = s.drafts[draftId];
    if (!d) throw new Error(`No draft ${draftId}`);
    const c = s.conversations[d.conversationId];
    const sent = await deliver(s, prefs, c, override ?? d.text);
    c.messages.push({ dir: "out", text: sent, at: now(), note: "approved by you" });
    c.lastOutboundAt = now();
    if (c.stage === "waiting_on_you") c.stage = c.messages.some((m) => m.dir === "in") ? "negotiating" : "contacted";
    delete s.drafts[draftId];
  });
}

// ---------------- applying a negotiator turn ----------------

function bookings(s: State, exceptId: string): string[] {
  return Object.values(s.conversations)
    .filter((c) => c.id !== exceptId)
    .flatMap((c) => c.scheduled.map((e) => `${e.startIso} (${e.durationMinutes} min, ${e.kind})`));
}

async function applyTurn(s: State, prefs: Preferences, c: Conversation, turn: NegotiatorTurn) {
  const l = s.listings[c.listingId];
  c.stage = turn.stage;
  c.askingSgd = turn.asking_sgd ?? c.askingSgd;
  c.bestOfferSgd = turn.best_offer_sgd ?? c.bestOfferSgd;
  c.summary = turn.summary;
  c.redFlags = [...new Set([...c.redFlags, ...turn.red_flags])];

  if (turn.reply) await sendOrDraft(s, prefs, c, turn.reply);

  if (turn.scheduled) {
    const ev = {
      kind: turn.scheduled.kind,
      startIso: turn.scheduled.start_iso,
      durationMinutes: turn.scheduled.duration_minutes,
      where: turn.scheduled.where,
      withWhom: turn.scheduled.with_whom,
      notes: turn.scheduled.notes,
      outsideYourWindows: !isWithinWindows(turn.scheduled.start_iso, turn.scheduled.duration_minutes, prefs),
    };
    const dup = c.scheduled.some((e) => e.startIso === ev.startIso && e.kind === ev.kind);
    if (!dup) {
      c.scheduled.push(ev);
      const label = { phone_call: "Call", video_call: "Video call", in_person: "Viewing" }[ev.kind];
      const when = new Date(ev.startIso).toLocaleString("en-SG", { timeZone: "Asia/Singapore", dateStyle: "full", timeStyle: "short" });
      const title = `${label} booked: ${when}`;
      const body = [
        `${label} with ${ev.withWhom} about "${l.title}"`,
        `When: ${when} (${ev.durationMinutes} min)`,
        `Where / number: ${ev.where}`,
        `Rent: asking ${c.askingSgd ?? "?"}, best offer ${c.bestOfferSgd ?? "-"} (S$/month)`,
        ev.notes && `Notes: ${ev.notes}`,
        c.redFlags.length ? `Red flags: ${c.redFlags.join("; ")}` : "",
        ev.outsideYourWindows ? "⚠️ This is OUTSIDE your availability windows - check it." : "",
        l.url ? `Listing: ${l.url}` : "",
        `Chat: npm run agent -- show ${c.id}`,
      ]
        .filter(Boolean)
        .join("\n");
      const ics = buildIcs(ev, `${label}: ${l.title}`, body, `${c.id}-${shortId(ev.startIso)}`);
      await notify({ title, body, urgent: true, ics: { filename: "booking.ics", content: ics } });
    }
  }

  if (turn.escalate) {
    await notify({
      title: `Needs you: ${l.title.slice(0, 60)}`,
      body: `${turn.escalate.reason}\n\nStatus: ${turn.summary}\nChat: npm run agent -- show ${c.id}\nTell the agent what to do: npm run agent -- instruct ${c.id} "..."`,
      urgent: turn.escalate.urgent,
    });
  }
}

// ---------------- outreach / inbound / follow-ups ----------------

export async function outreach(prefs: Preferences, limit?: number, ids?: string[]) {
  await withState(async (s) => {
    const dayAgo = Date.now() - 86400_000;
    s.contactLog = s.contactLog.filter((t) => new Date(t).getTime() > dayAgo);
    const room = Math.min(limit ?? Infinity, prefs.negotiation.max_new_contacts_per_day - s.contactLog.length);
    const candidates = ids?.length
      ? ids.map((id) => s.listings[id]).filter(Boolean)
      : Object.values(s.listings)
          .filter((l) => l.status === "new" && l.legal.ok && l.score >= 45)
          .sort((a, b) => b.score - a.score);
    const busy = new Set(Object.values(s.conversations).map((c) => `${c.channel}:${c.address}`));

    let contacted = 0;
    for (const l of candidates) {
      if (contacted >= room) break;
      const { channel, address } = pickChannel(l);
      // One chat per contact: agents often post many listings.
      if (channel !== "relay" && busy.has(`${channel}:${address}`)) {
        l.status = "skipped";
        continue;
      }
      const c: Conversation = {
        id: shortId(`${l.id}:${channel}:${address}`),
        listingId: l.id,
        channel,
        address,
        messages: [],
        stage: "contacted",
        askingSgd: l.price_sgd_month,
        bestOfferSgd: null,
        scheduled: [],
        redFlags: [],
        summary: "",
        followUps: 0,
        lastInboundAt: null,
        lastOutboundAt: null,
      };
      try {
        const turn = await nextTurn(prefs, l, c, bookings(s, c.id));
        s.conversations[c.id] = c;
        await applyTurn(s, prefs, c, turn);
        l.status = "contacted";
        s.contactLog.push(now());
        busy.add(`${channel}:${address}`);
        contacted++;
        console.log(`Contacted via ${channel}: ${l.title} (${c.id})`);
      } catch (e) {
        console.warn(`Could not contact ${l.title}: ${(e as Error).message}`);
      }
    }
    if (!contacted) console.log("Nobody new to contact (or daily limit reached).");
  });
}

export async function handleInbound(
  prefs: Preferences,
  channel: ChannelName,
  address: string,
  text: string,
  at: string,
  conversationId?: string,
  emailMessageId?: string,
) {
  await withState(async (s) => {
    const c = conversationId
      ? s.conversations[conversationId]
      : Object.values(s.conversations).find((x) => x.channel === channel && x.address === address.toLowerCase());
    if (!c) {
      console.log(`Ignoring message from unknown ${channel} contact ${address}`);
      return;
    }
    c.messages.push({ dir: "in", text, at });
    c.lastInboundAt = at;
    if (emailMessageId) c.emailThreadId = emailMessageId;
    if (c.stage === "contacted") c.stage = "negotiating";
    const turn = await nextTurn(prefs, s.listings[c.listingId], c, bookings(s, c.id));
    await applyTurn(s, prefs, c, turn);
  });
}

// Your own instruction to the agent for one chat, e.g. "offer 1100 max, I can do Sat viewing".
export async function instruct(prefs: Preferences, conversationId: string, instruction: string) {
  await withState(async (s) => {
    const c = s.conversations[conversationId];
    if (!c) throw new Error(`No conversation ${conversationId}`);
    const turn = await nextTurn(
      prefs,
      s.listings[c.listingId],
      c,
      bookings(s, c.id),
      `Instruction from ${prefs.you.name} (follow it, within the hard limits): ${instruction}\nWrite the next message accordingly.`,
    );
    await applyTurn(s, prefs, c, turn);
  });
}

export async function followUps(prefs: Preferences) {
  await withState(async (s) => {
    const cutoff = Date.now() - prefs.negotiation.follow_up_after_hours * 3600_000;
    for (const c of Object.values(s.conversations)) {
      const last = c.messages.at(-1);
      if (!last || last.dir !== "out" || new Date(last.at).getTime() > cutoff) continue;
      if (!["contacted", "negotiating"].includes(c.stage)) continue;
      if (c.followUps >= prefs.negotiation.max_follow_ups) {
        c.stage = "dead";
        continue;
      }
      // WhatsApp only allows templates outside 24h; a follow-up would re-send the opener.
      if (c.channel === "whatsapp" && !within24h(c.lastInboundAt)) {
        c.followUps++;
        continue;
      }
      try {
        const turn = await nextTurn(prefs, s.listings[c.listingId], c, bookings(s, c.id),
          "They have not replied. Write one short, friendly follow-up (no pressure). If a follow-up was already sent, set reply to null and stage to dead.");
        c.followUps++;
        await applyTurn(s, prefs, c, turn);
      } catch (e) {
        console.warn(`follow-up failed for ${c.id}: ${(e as Error).message}`);
      }
    }
  });
}
