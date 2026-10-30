import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

// Load .env from the working directory if present (Node 20.12+).
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

// A YAML key with only commented-out items parses as null; treat it as an empty list.
const list = <T extends z.ZodType>(item: T, fallback: z.infer<T>[] = []) =>
  z.preprocess((v) => v ?? fallback, z.array(item));

const Preferences = z.object({
  you: z.object({
    name: z.string(),
    about: z.string().default(""),
    // Shared with landlords only when set. Leave null to keep your number private.
    phone_for_landlords: z.string().nullable().default(null),
    email_for_landlords: z.string().nullable().default(null),
  }),
  search: z.object({
    area: z.string().default("Jurong West, Singapore"),
    near: list(z.string()),
    acceptable_areas: list(z.string()),
    move_in: z.string(),
    move_in_flex_days: z.number().default(7),
    duration_months: z.number(),
    unit_types: list(z.enum(["room", "master_room", "common_room", "studio", "whole_unit"]), ["room"]),
    budget_sgd_month: z.object({ target: z.number(), max: z.number() }),
    occupants: z.number().default(1),
    must_have: list(z.string()),
    nice_to_have: list(z.string()),
    deal_breakers: list(z.string()),
  }),
  negotiation: z.object({
    // First counter-offer as a fraction of the asking rent.
    opening_offer_ratio: z.number().min(0.5).max(1).default(0.88),
    leverage: list(z.string()),
    // auto: agent sends on its own. approve_first: you approve each first message. approve_all: you approve every message.
    approval: z.enum(["auto", "approve_first", "approve_all"]).default("auto"),
    max_new_contacts_per_day: z.number().default(8),
    follow_up_after_hours: z.number().default(24),
    max_follow_ups: z.number().default(1),
  }),
  availability: z.object({
    // e.g. "Mon-Fri 19:00-21:30", "Sat-Sun 10:00-18:00". Singapore time.
    windows: z.array(z.string()).min(1),
    viewing_modes: list(z.enum(["phone_call", "video_call", "in_person"]), ["video_call", "in_person"]),
    blackout_dates: list(z.string()),
  }),
  sources: z.object({
    web_search: z.boolean().default(true),
    urls: list(z.string()),
    facebook: z
      .object({
        enabled: z.boolean().default(false),
        group_urls: list(z.string()),
        marketplace_queries: list(z.string()),
      })
      .default({ enabled: false, group_urls: [], marketplace_queries: [] }),
    search_every_hours: z.number().default(6),
  }),
});
export type Preferences = z.infer<typeof Preferences>;

export const DATA_DIR = path.resolve(process.env.RENTAL_DATA_DIR ?? "data");

export function loadPreferences(file = process.env.RENTAL_PREFS ?? "preferences.yaml"): Preferences {
  if (!fs.existsSync(file)) {
    throw new Error(`No ${file} found. Run "npm run agent -- init" and edit the file it creates.`);
  }
  const prefs = Preferences.parse(YAML.parse(fs.readFileSync(file, "utf8")));
  if (prefs.search.budget_sgd_month.max < prefs.search.budget_sgd_month.target) {
    throw new Error("search.budget_sgd_month.max must be >= target");
  }
  return prefs;
}

export const env = {
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME ?? "rental_enquiry",
    templateLang: process.env.WHATSAPP_TEMPLATE_LANG ?? "en",
    port: Number(process.env.PORT ?? 8787),
  },
  email: {
    smtpUrl: process.env.SMTP_URL,
    imapHost: process.env.IMAP_HOST,
    imapUser: process.env.IMAP_USER,
    imapPass: process.env.IMAP_PASS,
    from: process.env.EMAIL_FROM,
  },
  notify: {
    ntfyTopic: process.env.NTFY_TOPIC,
    ntfyServer: process.env.NTFY_SERVER ?? "https://ntfy.sh",
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    emailTo: process.env.NOTIFY_EMAIL,
  },
};

export const channelsEnabled = {
  whatsapp: () => Boolean(env.whatsapp.token && env.whatsapp.phoneNumberId),
  email: () => Boolean(env.email.smtpUrl && env.email.from),
  emailInbox: () => Boolean(env.email.imapHost && env.email.imapUser && env.email.imapPass),
};
