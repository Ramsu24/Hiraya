import { z } from "zod";

export const ExtractedListing = z.object({
  title: z.string(),
  url: z.string().nullable(),
  source_site: z.string().describe("e.g. propertyguru.com.sg, 99.co, carousell.sg, facebook.com, srx.com.sg"),
  unit_type: z.enum(["master_room", "common_room", "room", "studio", "whole_unit", "unknown"]),
  property_type: z.enum(["hdb", "condo", "landed", "serviced_apartment", "coliving", "unknown"]),
  price_sgd_month: z.number().nullable(),
  min_lease_months: z.number().nullable(),
  available_from: z.string().nullable().describe("ISO date if stated"),
  location: z.string().describe("Address, estate or area as written"),
  nearest_mrt: z.string().nullable(),
  features: z.array(z.string()).describe("aircon, private bathroom, cooking allowed, wifi, utilities included, etc."),
  restrictions: z.array(z.string()).describe("no cooking, female only, no visitors, etc."),
  contact_name: z.string().nullable(),
  contact_phone: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_is_agent: z.boolean().nullable(),
  posted: z.string().nullable(),
  summary: z.string().describe("Two-sentence neutral summary of the listing"),
});
export type ExtractedListing = z.infer<typeof ExtractedListing>;

export const ExtractedListings = z.object({ listings: z.array(ExtractedListing) });

export const NegotiatorTurn = z.object({
  reply: z
    .string()
    .nullable()
    .describe("Exact text of the next message to send. Null when no message should be sent now."),
  stage: z.enum([
    "contacted",
    "negotiating",
    "call_scheduled",
    "viewing_scheduled",
    "waiting_on_you",
    "agreed_pending_you",
    "declined",
    "dead",
  ]),
  asking_sgd: z.number().nullable().describe("Landlord's current asking monthly rent, if known"),
  best_offer_sgd: z
    .number()
    .nullable()
    .describe("Lowest monthly rent the landlord has agreed to or offered so far, if any"),
  scheduled: z
    .object({
      kind: z.enum(["phone_call", "video_call", "in_person"]),
      start_iso: z.string().describe("ISO 8601 with +08:00 offset"),
      duration_minutes: z.number(),
      where: z.string().describe("Address, video link, or the number to call"),
      with_whom: z.string(),
      notes: z.string(),
    })
    .nullable()
    .describe("Fill only when BOTH sides have confirmed a specific date and time in this conversation"),
  escalate: z
    .object({ reason: z.string(), urgent: z.boolean() })
    .nullable()
    .describe("Set when the user must decide or act personally"),
  red_flags: z.array(z.string()),
  summary: z.string().describe("One or two lines: where this negotiation stands"),
});
export type NegotiatorTurn = z.infer<typeof NegotiatorTurn>;
