import { test } from "node:test";
import assert from "node:assert/strict";
import { checkOutgoing, isWithinWindows, legalCheck, normalizeSgPhone, parseWindow, scoreListing } from "../src/rules.ts";
import type { Preferences } from "../src/config.ts";
import type { ExtractedListing } from "../src/schemas.ts";

const prefs = {
  you: { name: "J", about: "", phone_for_landlords: null, email_for_landlords: null },
  search: {
    area: "Jurong West", near: ["Boon Lay MRT"], acceptable_areas: [], move_in: "2026-12-01", move_in_flex_days: 7,
    duration_months: 3, unit_types: ["room"], occupants: 1, budget_sgd_month: { target: 1100, max: 1400 },
    must_have: ["aircon"], nice_to_have: [], deal_breakers: ["partition"],
  },
  negotiation: { opening_offer_ratio: 0.88, leverage: [], approval: "auto", max_new_contacts_per_day: 8, follow_up_after_hours: 24, max_follow_ups: 1 },
  availability: { windows: ["Mon-Fri 19:00-21:30", "Sat-Sun 10:00-18:00"], viewing_modes: ["video_call"], blackout_dates: ["2026-11-14"] },
  sources: { web_search: true, urls: [], facebook: { enabled: false, group_urls: [], marketplace_queries: [] }, search_every_hours: 6 },
} as Preferences;

const listing: ExtractedListing = {
  title: "Common room near Boon Lay MRT", url: null, source_site: "x", unit_type: "common_room", property_type: "condo",
  price_sgd_month: 1000, min_lease_months: null, available_from: null, location: "Jurong West St 64", nearest_mrt: "Boon Lay",
  features: ["aircon"], restrictions: [], contact_name: null, contact_phone: "9123 4567", contact_email: null,
  contact_is_agent: null, posted: null, summary: "",
};

test("lease rules", () => {
  assert.equal(legalCheck({ property_type: "hdb", min_lease_months: null }, 3).ok, false);
  assert.equal(legalCheck({ property_type: "condo", min_lease_months: null }, 3).ok, true);
  assert.equal(legalCheck({ property_type: "condo", min_lease_months: null }, 2).ok, false);
  assert.equal(legalCheck({ property_type: "serviced_apartment", min_lease_months: null }, 2).ok, true);
  assert.equal(legalCheck({ property_type: "condo", min_lease_months: 6 }, 3).ok, false);
});

test("phone numbers", () => {
  assert.equal(normalizeSgPhone("+65 9123 4567"), "6591234567");
  assert.equal(normalizeSgPhone("8123-4567"), "6581234567");
  assert.equal(normalizeSgPhone("6123 4567"), null); // landline
  assert.equal(normalizeSgPhone(null), null);
});

test("availability windows (Singapore time)", () => {
  assert.equal(parseWindow("Sat-Sun 10:00-18:00").days.size, 2);
  assert.equal(isWithinWindows("2026-11-03T19:30:00+08:00", 30, prefs), true); // Tue evening
  assert.equal(isWithinWindows("2026-11-03T21:15:00+08:00", 30, prefs), false); // runs past 21:30
  assert.equal(isWithinWindows("2026-11-03T12:00:00+08:00", 30, prefs), false); // Tue noon
  assert.equal(isWithinWindows("2026-11-07T02:00:00Z", 60, prefs), true); // Sat 10:00 SGT
  assert.equal(isWithinWindows("2026-11-14T11:00:00+08:00", 30, prefs), false); // blackout
});

test("outgoing guardrails", () => {
  assert.equal(checkOutgoing("Great, could we do S$1,050?", prefs), null);
  assert.match(checkOutgoing("Ok I'll transfer the deposit tonight", prefs)!, /commit/);
  assert.match(checkOutgoing("Sure, can PayNow you", prefs)!, /commit/);
  assert.match(checkOutgoing("Deal at $1500 then", prefs)!, /above your max/);
  assert.match(checkOutgoing("His NRIC is S1234567D", prefs)!, /identity/);
  assert.match(checkOutgoing("You can reach him at +65 9123 4567", prefs)!, /phone number/);
});

test("scoring", () => {
  const good = scoreListing(listing, prefs);
  const bad = scoreListing({ ...listing, price_sgd_month: 2500, features: ["partition"] }, prefs);
  assert.ok(good.score > 70);
  assert.ok(bad.score < 20);
  assert.ok(bad.flags.some((f) => f.includes("deal breaker")));
});
