// Deterministic checks that do not depend on the model: Singapore lease rules,
// scoring, availability windows, and guardrails on what the agent may send.
import type { Preferences } from "./config.ts";
import type { ExtractedListing } from "./schemas.ts";

// Minimum lease periods (HDB: 6 months for whole flats and rooms; URA: 3 consecutive
// months for private homes). Serviced apartments are licensed for shorter stays.
// Check hdb.gov.sg and ura.gov.sg if these change.
export const MIN_LEASE_MONTHS: Record<ExtractedListing["property_type"], number | null> = {
  hdb: 6,
  condo: 3,
  landed: 3,
  coliving: 3,
  serviced_apartment: 0,
  unknown: null,
};

export function legalCheck(
  l: Pick<ExtractedListing, "property_type" | "min_lease_months">,
  months: number,
): { ok: boolean; reason: string | null } {
  const legalMin = MIN_LEASE_MONTHS[l.property_type];
  if (legalMin !== null && months < legalMin) {
    return {
      ok: false,
      reason: `${l.property_type.toUpperCase()} rentals must be at least ${legalMin} months; you want ${months}.`,
    };
  }
  if (l.min_lease_months !== null && l.min_lease_months > months) {
    return { ok: false, reason: `Listing asks for at least ${l.min_lease_months} months.` };
  }
  if (legalMin === null) return { ok: true, reason: "Property type unknown: agent will confirm it is not HDB." };
  return { ok: true, reason: null };
}

// Singapore numbers: 8 digits, mobiles start with 8 or 9. Returns "65XXXXXXXX" or null.
export function normalizeSgPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d]/g, "");
  if (d.length === 10 && d.startsWith("65")) d = d.slice(2);
  if (d.length === 8 && /^[89]/.test(d)) return `65${d}`;
  return null;
}

const DEFAULT_NEAR = ["jurong west", "boon lay", "pioneer", "lakeside", "jurong", "ntu", "nanyang", "tengah", "joo koon"];

export function scoreListing(l: ExtractedListing, prefs: Preferences): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 50;
  const { target, max } = prefs.search.budget_sgd_month;

  if (l.price_sgd_month === null) {
    flags.push("price not stated");
  } else if (l.price_sgd_month <= target) {
    score += 20;
  } else if (l.price_sgd_month <= max) {
    score += 10;
  } else if (l.price_sgd_month <= max * 1.15) {
    flags.push("above max; needs negotiating");
    score -= 5;
  } else {
    flags.push("well above budget");
    score -= 40;
  }
  if (l.price_sgd_month !== null && l.price_sgd_month < 450) {
    flags.push("suspiciously cheap for Singapore");
    score -= 20;
  }

  const where = `${l.location} ${l.nearest_mrt ?? ""} ${l.title}`.toLowerCase();
  const near = [...prefs.search.near, ...prefs.search.acceptable_areas].map((s) => s.toLowerCase());
  const terms = near.length ? near.flatMap((n) => [n, n.replace(/ mrt$/, "")]) : DEFAULT_NEAR;
  if (terms.concat(DEFAULT_NEAR).some((t) => t && where.includes(t))) score += 15;
  else flags.push("location may be far from Jurong West");

  const text = [...l.features, ...l.restrictions, l.summary].join(" ").toLowerCase();
  for (const m of prefs.search.must_have) {
    if (!text.includes(m.toLowerCase())) flags.push(`unconfirmed: ${m}`);
  }
  for (const n of prefs.search.nice_to_have) if (text.includes(n.toLowerCase())) score += 3;
  for (const b of prefs.search.deal_breakers) {
    if (text.includes(b.toLowerCase())) {
      flags.push(`deal breaker: ${b}`);
      score -= 50;
    }
  }

  if (normalizeSgPhone(l.contact_phone) || l.contact_email) score += 5;
  else flags.push("no direct contact; manual relay");

  return { score: Math.max(0, Math.min(100, score)), flags };
}

// ---------- availability windows ----------

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const SG_OFFSET_MS = 8 * 3600_000; // Singapore has no DST

interface Window {
  days: Set<number>;
  startMin: number;
  endMin: number;
}

export function parseWindow(spec: string): Window {
  const m = spec.trim().match(/^([a-z]{3})(?:\s*-\s*([a-z]{3}))?\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/i);
  if (!m) throw new Error(`Bad availability window "${spec}". Use e.g. "Mon-Fri 19:00-21:30".`);
  const a = DAYS.indexOf(m[1].toLowerCase());
  const b = m[2] ? DAYS.indexOf(m[2].toLowerCase()) : a;
  if (a < 0 || b < 0) throw new Error(`Bad day in "${spec}"`);
  const days = new Set<number>();
  for (let d = a; ; d = (d + 1) % 7) {
    days.add(d);
    if (d === b) break;
  }
  return { days, startMin: +m[3] * 60 + +m[4], endMin: +m[5] * 60 + +m[6] };
}

function sgParts(date: Date) {
  const sg = new Date(date.getTime() + SG_OFFSET_MS);
  return { day: sg.getUTCDay(), minutes: sg.getUTCHours() * 60 + sg.getUTCMinutes(), ymd: sg.toISOString().slice(0, 10) };
}

export function isWithinWindows(startIso: string, durationMin: number, prefs: Preferences): boolean {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  const p = sgParts(start);
  if (prefs.availability.blackout_dates.includes(p.ymd)) return false;
  return prefs.availability.windows
    .map(parseWindow)
    .some((w) => w.days.has(p.day) && p.minutes >= w.startMin && p.minutes + durationMin <= w.endMin);
}

// Human-readable list of the next free windows, for the model to propose concrete slots.
export function upcomingWindows(prefs: Preferences, from = new Date(), days = 8): string[] {
  const windows = prefs.availability.windows.map(parseWindow);
  const out: string[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(from.getTime() + i * 86400_000);
    const p = sgParts(d);
    if (prefs.availability.blackout_dates.includes(p.ymd)) continue;
    for (const w of windows) {
      if (!w.days.has(p.day)) continue;
      const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      out.push(`${DAYS[p.day].toUpperCase()} ${p.ymd} ${fmt(w.startMin)}-${fmt(w.endMin)}`);
    }
  }
  return out;
}

export function sgNow(date = new Date()): string {
  const sg = new Date(date.getTime() + SG_OFFSET_MS);
  return `${DAYS[sg.getUTCDay()].toUpperCase()} ${sg.toISOString().slice(0, 16).replace("T", " ")} (Singapore time)`;
}

// ---------- outgoing-message guardrails ----------

// Phrases that would commit the user to money or a contract. Any match holds the
// message for the user's approval instead of sending it.
const COMMITMENT = [
  /\b(i|we|he|she|they)('ll| will| can)? (transfer|pay(nowe?)?|send (the |a )?(deposit|money|payment))\b/i,
  /\bpaynow\b/i,
  /\b(bank|account) (number|details|transfer)\b/i,
  /\b(we|i)('ll| will)? (take|confirm|accept) (it|the (room|unit|place))\b/i,
  /\bsign(ing)? (the )?(ta|tenancy|lease|loi|letter of intent|agreement)\b/i,
  /\bbooking fee\b/i,
];
const PERSONAL_ID = [/\b[STFGM]\d{7}[A-Z]\b/i, /\bpassport (no|number)\b/i, /\bnric\b/i, /\bfin (no|number)\b/i];

export function checkOutgoing(text: string, prefs: Preferences): string | null {
  for (const re of COMMITMENT) if (re.test(text)) return "message would commit you to paying or signing";
  for (const re of PERSONAL_ID) if (re.test(text)) return "message mentions identity documents";
  const { max } = prefs.search.budget_sgd_month;
  // A dollar figure above your max inside an agreement phrase.
  const agree = text.match(/(?:agree|ok(?:ay)?|deal|accept)[^.?!]{0,40}\$\s?(\d[\d,]*)/i);
  if (agree && Number(agree[1].replace(/,/g, "")) > max) return `message agrees to a rent above your max ($${max})`;
  if (prefs.you.phone_for_landlords === null && /\+?65[\s-]?[89]\d{3}[\s-]?\d{4}/.test(text)) {
    return "message contains a phone number you have not allowed the agent to share";
  }
  return null;
}
