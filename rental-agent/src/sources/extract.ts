import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { base, client, assertNotRefused } from "../claude.ts";
import type { Preferences } from "../config.ts";
import { ExtractedListings, type ExtractedListing } from "../schemas.ts";

export function criteriaText(prefs: Preferences): string {
  const s = prefs.search;
  return [
    `Area: ${s.area}${s.near.length ? ` (near ${s.near.join(", ")})` : ""}`,
    s.acceptable_areas.length ? `Also acceptable: ${s.acceptable_areas.join(", ")}` : "",
    `Move-in: ${s.move_in} (±${s.move_in_flex_days} days), stay ${s.duration_months} months`,
    `Type: ${s.unit_types.join(", ")} for ${s.occupants} person(s)`,
    `Budget: target S$${s.budget_sgd_month.target}/month, max S$${s.budget_sgd_month.max}/month`,
    s.must_have.length ? `Must have: ${s.must_have.join(", ")}` : "",
    s.nice_to_have.length ? `Nice to have: ${s.nice_to_have.join(", ")}` : "",
    s.deal_breakers.length ? `Deal breakers: ${s.deal_breakers.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Turns raw page text (any site, including Facebook posts) into structured listings.
export async function extractListings(pageText: string, pageUrl: string, prefs: Preferences): Promise<ExtractedListing[]> {
  const text = pageText.slice(0, 120_000);
  if (!text.trim()) return [];
  const res = await client.beta.messages.parse({
    ...base,
    max_tokens: 16000,
    output_config: { effort: "low", format: zodOutputFormat(ExtractedListings) },
    system:
      "You extract rental listings in Singapore from scraped web page text. Only include real offers of a room or unit for rent " +
      "(skip 'looking for room' posts from tenants, ads, and navigation text). Copy contact details exactly as written. " +
      "Use null when a field is not stated; never guess prices or phone numbers. Resolve relative links against the page URL.",
    messages: [
      {
        role: "user",
        content: `Page URL: ${pageUrl}\n\nThe user is looking for:\n${criteriaText(prefs)}\n\nInclude every rental offer on the page, even ones that don't match well; scoring happens later.\n\n<page>\n${text}\n</page>`,
      },
    ],
  });
  assertNotRefused(res, "listing extraction");
  return res.parsed_output?.listings ?? [];
}
