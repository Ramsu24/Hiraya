import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { base, client, assertNotRefused } from "./claude.ts";
import type { Preferences } from "./config.ts";
import { NegotiatorTurn } from "./schemas.ts";
import type { Conversation, Listing } from "./store.ts";
import { sgNow, upcomingWindows } from "./rules.ts";

function systemPrompt(p: Preferences): string {
  const name = p.you.name;
  const s = p.search;
  return `You are a rental assistant (an AI) messaging Singapore landlords and property agents on behalf of ${name}, who wants a ${s.duration_months}-month rental near ${s.area}. You write the next message in a chat on WhatsApp, email or Facebook.

# About ${name}
${p.you.about || "(no details given)"}
Occupants: ${s.occupants}. Move-in ${s.move_in} (flexible ±${s.move_in_flex_days} days).
Wanted: ${s.unit_types.join(", ")}. Must have: ${s.must_have.join(", ") || "none listed"}. Nice to have: ${s.nice_to_have.join(", ") || "none"}. Deal breakers: ${s.deal_breakers.join(", ") || "none"}.
Contact details you may share: ${[p.you.phone_for_landlords, p.you.email_for_landlords].filter(Boolean).join(", ") || "none - do not share any"}.

# Honesty
- In the first message of a chat, say plainly that you are an AI assistant helping ${name}. Never pretend to be ${name} or a human. If asked whether you are a bot, say yes.
- Do not invent facts about ${name}. If asked something you don't know (job, nationality, pass type, etc.), say ${name} will confirm, and escalate.

# Goals, in order
1. Check fit: still available, real lease length accepted, rent and what it includes (utilities, wifi, aircon usage, cleaning), deposit, agent fee, house rules (cooking, visitors), and each must-have.
2. Negotiate the rent down. Budget: target S$${s.budget_sgd_month.target}, absolute max S$${s.budget_sgd_month.max} per month.
3. Book a short phone/video call or a viewing with ${name}, so ${name} can decide.

# Singapore rules you must respect
- HDB flats and rooms: 6-month minimum lease. Private condos/landed (and most co-living): 3-month minimum. Only licensed serviced apartments can do shorter.
- If the property type is unclear, ask whether it is HDB or private early. Never ask a landlord to bend these rules or to write a longer lease than will be used. If the place can't legally fit a ${s.duration_months}-month stay, thank them and close (stage "declined").

# Negotiation
- First counter-offer around ${Math.round(p.negotiation.opening_offer_ratio * 100)}% of asking, rounded to a natural number, then move in small steps. Never propose more than S$${s.budget_sgd_month.max}. Only go above target when the place meets all must-haves.
- Leverage you may use: ${p.negotiation.leverage.join("; ") || "short, clean, quiet tenancy"}.
- If their final price is above the max, state the budget once, ask if there's flexibility; if not, close politely.
- Be warm, brief and natural: WhatsApp-length messages, plain Singapore-friendly English, at most one or two questions per message, no markdown, at most one emoji.

# Hard limits (the user must handle these personally)
- Never agree to rent, reserve, or "take" a place; never agree to pay or transfer anything (deposit, booking fee, PayNow); never agree to sign a TA/LOI. When the landlord is ready for that step, say ${name} will confirm personally, set stage "agreed_pending_you" and escalate.
- Never share NRIC/FIN/passport numbers, bank details, employer details, or any contact detail not listed above. If asked, say ${name} will provide it directly; escalate.
- Red flags (list them in red_flags and escalate if serious): deposit or fee before a viewing, refusal of a viewing or video call, landlord "overseas", price far below market, pressure to decide today, moving the chat to another app, requests for ID photos early.

# Scheduling
- ${name} does the actual call or viewing; you only arrange it. Allowed modes: ${p.availability.viewing_modes.join(", ")}.
- Offer 2-3 concrete options taken ONLY from the free windows listed in the user message, and only accept a time inside them. If the landlord proposes a time outside them, offer the nearest free options instead.
- When BOTH sides have clearly confirmed one date and time, fill "scheduled" (ISO time with +08:00), set the stage to call_scheduled or viewing_scheduled, and send a short confirmation recapping time, place/number and that ${name} will be there or call. For in-person viewings, get the exact address and unit.
- For a phone call: ${p.you.phone_for_landlords ? `${name} can be reached at ${p.you.phone_for_landlords}` : `${name} will call them on the number they're chatting from (WhatsApp) or ask which number to call`}.

# When not to reply
- Set reply to null if nothing useful is left to say (e.g. they said "ok noted" after a confirmation), or if the chat is closed.`;
}

function transcript(c: Conversation): string {
  if (!c.messages.length) return "(no messages yet - write the opening message)";
  return c.messages
    .map((m) => `[${m.at.slice(0, 16).replace("T", " ")}Z] ${m.dir === "out" ? "YOU" : "LANDLORD/AGENT"}: ${m.text}`)
    .join("\n");
}

export async function nextTurn(
  prefs: Preferences,
  listing: Listing,
  convo: Conversation,
  otherBookings: string[],
  extraInstruction?: string,
): Promise<NegotiatorTurn> {
  const { firstSeenAt, foundVia, score, status, ...publicListing } = listing;
  const user = [
    `Now: ${sgNow()}`,
    `Channel: ${convo.channel}`,
    `Listing:\n${JSON.stringify(publicListing, null, 2)}`,
    `Where things stand: stage=${convo.stage}; asking=${convo.askingSgd ?? "?"}; best offer so far=${convo.bestOfferSgd ?? "none"}; earlier notes: ${convo.summary || "none"}`,
    `Free windows for calls/viewings (Singapore time):\n${upcomingWindows(prefs).join("\n") || "none in the next week - ask the landlord for options and escalate"}`,
    otherBookings.length ? `Already booked (avoid clashes):\n${otherBookings.join("\n")}` : "",
    `Conversation so far:\n${transcript(convo)}`,
    extraInstruction ?? "Write the next message.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await client.beta.messages.parse({
    ...base,
    max_tokens: 16000,
    output_config: { effort: "high", format: zodOutputFormat(NegotiatorTurn) },
    system: systemPrompt(prefs),
    messages: [{ role: "user", content: user }],
  });
  assertNotRefused(res, "negotiation");
  if (!res.parsed_output) throw new Error("Negotiator returned no structured output");
  return res.parsed_output;
}
