import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { base, client, assertNotRefused } from "../claude.ts";
import type { Preferences } from "../config.ts";
import { ExtractedListings, type ExtractedListing } from "../schemas.ts";
import { criteriaText } from "./extract.ts";

// Lets Claude search the open web (PropertyGuru, 99.co, Carousell, SRX, Roomies,
// coliving operators, public Facebook posts, forums...) and hand back listings.
export async function searchWeb(prefs: Preferences): Promise<ExtractedListing[]> {
  const found: ExtractedListing[] = [];
  const save = betaZodTool({
    name: "save_listings",
    description: "Save rental listings you found. Call as often as you like; each call appends.",
    inputSchema: ExtractedListings,
    run: async ({ listings }) => {
      found.push(...listings);
      return `Saved ${listings.length} (total ${found.length}).`;
    },
  });

  const final = await client.beta.messages.toolRunner({
    ...base,
    max_tokens: 32000,
    max_iterations: 30,
    output_config: { effort: "medium" },
    tools: [
      { type: "web_search_20260209", name: "web_search", max_uses: 15, user_location: { type: "approximate", country: "SG", city: "Singapore" } },
      { type: "web_fetch_20260209", name: "web_fetch", max_uses: 25 },
      save,
    ],
    system:
      "You find current rental listings in Singapore for a specific person. Search broadly across listing sites " +
      "(propertyguru.com.sg, 99.co, carousell.sg, srx.com.sg, roomies.sg, ohmyhome, coliving and serviced-apartment operators, " +
      "and public Facebook posts or groups that are indexed), open the most promising results, and call save_listings with " +
      "structured details. Prefer listings posted in the last 30 days that accept short leases. Singapore rules: HDB flats and " +
      "HDB rooms need a 6-month minimum lease, private condos/landed 3 months; for stays under 3 months only serviced apartments " +
      "qualify. Copy phone numbers and emails exactly as shown; never invent them. Stop after roughly 25 good listings.",
    messages: [{ role: "user", content: `Find rentals for:\n${criteriaText(prefs)}` }],
  });
  assertNotRefused(final, "web search");
  return found;
}
