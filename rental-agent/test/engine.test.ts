// End-to-end through the engine with a fake Claude API: outreach -> landlord reply ->
// viewing booked -> notification + .ics. No network, no real API key.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "rental-agent-"));
const replies: object[] = [];
const requests: any[] = [];
const fake = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    requests.push(JSON.parse(body));
    const turn = replies.shift();
    res.writeHead(200, { "content-type": "application/json" }).end(
      JSON.stringify({
        id: "msg_test", type: "message", role: "assistant", model: "test",
        content: [{ type: "text", text: JSON.stringify(turn) }],
        stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
      }),
    );
  });
});
await new Promise<void>((r) => fake.listen(0, r));
Object.assign(process.env, {
  ANTHROPIC_API_KEY: "test", ANTHROPIC_BASE_URL: `http://127.0.0.1:${(fake.address() as any).port}`,
  RENTAL_DATA_DIR: dataDir, NTFY_TOPIC: "", TELEGRAM_BOT_TOKEN: "", NOTIFY_EMAIL: "", WHATSAPP_TOKEN: "", SMTP_URL: "",
});
after(() => fake.close());

const { outreach, handleInbound } = await import("../src/engine.ts");
const { withState, peekState } = await import("../src/store.ts");

const prefs: any = {
  you: { name: "Jopeth", about: "", phone_for_landlords: null, email_for_landlords: null },
  search: { area: "Jurong West", near: [], acceptable_areas: [], move_in: "2026-12-01", move_in_flex_days: 7, duration_months: 3,
    unit_types: ["room"], occupants: 1, budget_sgd_month: { target: 1100, max: 1400 }, must_have: [], nice_to_have: [], deal_breakers: [] },
  negotiation: { opening_offer_ratio: 0.88, leverage: [], approval: "auto", max_new_contacts_per_day: 8, follow_up_after_hours: 24, max_follow_ups: 1 },
  availability: { windows: ["Sat-Sun 10:00-18:00"], viewing_modes: ["in_person"], blackout_dates: [] },
  sources: { web_search: false, urls: [], facebook: { enabled: false, group_urls: [], marketplace_queries: [] }, search_every_hours: 6 },
};

const base = { asking_sgd: 1200, best_offer_sgd: null, scheduled: null, escalate: null, red_flags: [], summary: "" };

test("outreach, reply, booking", async () => {
  await withState((s) => {
    s.listings.l1 = {
      id: "l1", title: "Master room Boon Lay condo", url: "https://facebook.com/groups/x/posts/1", source_site: "facebook.com",
      unit_type: "master_room", property_type: "condo", price_sgd_month: 1200, min_lease_months: null, available_from: null,
      location: "Boon Lay", nearest_mrt: "Boon Lay", features: [], restrictions: [], contact_name: "Ann", contact_phone: null,
      contact_email: null, contact_is_agent: false, posted: null, summary: "", firstSeenAt: "", foundVia: "test", score: 80,
      flags: [], legal: { ok: true, reason: null }, status: "new",
    };
  });

  replies.push({ ...base, reply: "Hi Ann, I'm an AI assistant helping Jopeth...", stage: "contacted" });
  await outreach(prefs);
  let s = peekState();
  const chat = Object.values(s.conversations)[0];
  assert.equal(chat.channel, "relay"); // no WhatsApp/email configured
  assert.equal(chat.messages.length, 1);
  assert.equal(s.listings.l1.status, "contacted");
  assert.match(requests[0].system, /AI assistant/);
  assert.equal(requests[0].fallbacks, "default");

  replies.push({
    ...base, best_offer_sgd: 1100, stage: "viewing_scheduled",
    reply: "Great, see you Sat 7 Nov 11am at Blk 1 Boon Lay, #05-01. Jopeth will be there.",
    scheduled: { kind: "in_person", start_iso: "2026-11-07T11:00:00+08:00", duration_minutes: 30, where: "Boon Lay #05-01", with_whom: "Ann", notes: "" },
  });
  await handleInbound(prefs, "relay", "", "Ok 1100 can. Sat 11am come view", new Date().toISOString(), chat.id);

  s = peekState();
  const c = s.conversations[chat.id];
  assert.equal(c.stage, "viewing_scheduled");
  assert.equal(c.bestOfferSgd, 1100);
  assert.equal(c.scheduled.length, 1);
  assert.equal(c.scheduled[0].outsideYourWindows, false);
  assert.equal(c.messages.length, 3);
  const log = fs.readFileSync(path.join(dataDir, "notifications.log"), "utf8");
  assert.match(log, /Viewing booked/);
  const ics = fs.readdirSync(path.join(dataDir, "events"));
  assert.equal(ics.length, 1);
  assert.match(fs.readFileSync(path.join(dataDir, "events", ics[0]), "utf8"), /DTSTART:20261107T030000Z/);
});

test("held when the agent tries to commit to paying", async () => {
  const chat = Object.values(peekState().conversations)[0];
  replies.push({ ...base, reply: "Sure, I'll transfer the deposit tonight.", stage: "negotiating" });
  await handleInbound(prefs, "relay", "", "Can pay deposit first?", new Date().toISOString(), chat.id);
  const s = peekState();
  assert.equal(Object.keys(s.drafts).length, 1);
  assert.equal(s.conversations[chat.id].stage, "waiting_on_you");
  assert.ok(!s.conversations[chat.id].messages.some((m) => m.text.includes("transfer")));
});
