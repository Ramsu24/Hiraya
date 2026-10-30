#!/usr/bin/env -S npx tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { channelsEnabled, env, loadPreferences, type Preferences } from "./config.ts";
import { pollInbox } from "./channels/email.ts";
import { startWebhookServer } from "./channels/whatsapp.ts";
import { followUps, handleInbound, instruct, outreach, runSearch, sendApprovedDraft } from "./engine.ts";
import { notify } from "./notify.ts";
import { upcomingWindows } from "./rules.ts";
import { interactiveLogin } from "./sources/browser.ts";
import { peekState, withState } from "./store.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const [cmd = "help", ...args] = process.argv.slice(2);

const HELP = `Rental agent - finds a short-term rental near Jurong West, negotiates, and pings you when a call/viewing is booked.

  init                         create preferences.yaml and .env from the examples
  doctor                       check your configuration and which channels are live
  login <url>                  open a browser to log in once (Facebook, PropertyGuru...)
  search                       find new listings (web + your URLs + Facebook)
  list [all]                   show listings, best first
  contact [n | id...]          start chats with the top n listings (or specific ids)
  run                          keep going: search, contact, answer replies, follow up, notify
  chats                        list conversations and their status
  show <chatId>                print a conversation
  relay <chatId> "<text>"      paste a reply you received on Facebook/elsewhere; the agent answers
  instruct <chatId> "<text>"   tell the agent what to do in one chat ("offer 1150, can view Sat")
  drafts                       messages waiting for your approval
  approve <draftId> ["text"]   send a held draft (optionally edited)
  reject <draftId>             drop a held draft
  test-notify                  send a test notification to your phone
`;

function prefs(): Preferences {
  return loadPreferences();
}

function printListings(all: boolean) {
  const s = peekState();
  const rows = Object.values(s.listings)
    .filter((l) => all || (l.legal.ok && l.status === "new"))
    .sort((a, b) => b.score - a.score);
  for (const l of rows) {
    console.log(
      `${l.id}  ${String(l.score).padStart(3)}  S$${l.price_sgd_month ?? "?"}  ${l.unit_type}/${l.property_type}  ${l.title.slice(0, 60)}`,
    );
    console.log(`          ${l.location}${l.nearest_mrt ? ` · ${l.nearest_mrt}` : ""} · ${l.status}${l.url ? ` · ${l.url}` : ""}`);
    if (l.flags.length) console.log(`          ⚑ ${l.flags.join("; ")}`);
  }
  if (!rows.length) console.log("No listings yet. Run: npm run agent -- search");
}

async function pollEmailOnce(p: Preferences) {
  if (!channelsEnabled.emailInbox()) return;
  const s = peekState();
  const addrs = Object.values(s.conversations).filter((c) => c.channel === "email").map((c) => c.address);
  for (const m of await pollInbox(addrs)) {
    await handleInbound(p, "email", m.from, m.text, m.at, undefined, m.messageId);
  }
}

async function main() {
  switch (cmd) {
    case "init": {
      for (const [src, dst] of [
        ["preferences.example.yaml", "preferences.yaml"],
        [".env.example", ".env"],
      ]) {
        if (fs.existsSync(dst)) console.log(`${dst} already exists, leaving it.`);
        else {
          fs.copyFileSync(path.join(here, "..", src), dst);
          console.log(`Created ${dst} - edit it.`);
        }
      }
      break;
    }
    case "doctor": {
      const p = prefs();
      console.log(`Preferences OK for ${p.you.name}: ${p.search.duration_months} months from ${p.search.move_in}, S$${p.search.budget_sgd_month.target}-${p.search.budget_sgd_month.max}`);
      console.log(`Claude API key:   ${process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? "set" : "not in env (an `ant auth login` profile also works)"}`);
      console.log(`WhatsApp:         ${channelsEnabled.whatsapp() ? "on" : "off (contacts with phone numbers go to manual relay)"}`);
      console.log(`Email send/read:  ${channelsEnabled.email() ? "on" : "off"} / ${channelsEnabled.emailInbox() ? "on" : "off"}`);
      console.log(`Notifications:    ${[env.notify.ntfyTopic && "ntfy", env.notify.telegramToken && "telegram", env.notify.emailTo && "email"].filter(Boolean).join(", ") || "console only - set NTFY_TOPIC to get phone pushes"}`);
      console.log(`Facebook:         ${p.sources.facebook.enabled ? "on (run `login https://facebook.com` once)" : "off"}`);
      console.log(`Next free slots:\n  ${upcomingWindows(p).slice(0, 5).join("\n  ")}`);
      if (p.search.duration_months < 3) {
        console.log("\n⚠️  Under 3 months: in Singapore only serviced apartments can legally rent that short. HDB needs 6 months, private homes 3.");
      } else if (p.search.duration_months < 6) {
        console.log("\nℹ️  HDB rooms/flats need a 6-month minimum lease, so the agent will skip HDB and look at condos, co-living and serviced apartments.");
      }
      break;
    }
    case "login":
      await interactiveLogin(args[0] ?? "https://www.facebook.com/");
      break;
    case "search": {
      const added = await runSearch(prefs());
      console.log(`\n${added.length} new listing(s).`);
      printListings(false);
      break;
    }
    case "list":
      printListings(args[0] === "all");
      break;
    case "contact": {
      const n = Number(args[0]);
      await outreach(prefs(), Number.isFinite(n) ? n : undefined, Number.isFinite(n) ? undefined : args);
      break;
    }
    case "chats": {
      for (const c of Object.values(peekState().conversations)) {
        const l = peekState().listings[c.listingId];
        console.log(`${c.id}  ${c.stage.padEnd(18)} ${c.channel.padEnd(8)} asking ${c.askingSgd ?? "?"} best ${c.bestOfferSgd ?? "-"}  ${l.title.slice(0, 50)}`);
        if (c.summary) console.log(`          ${c.summary}`);
        for (const e of c.scheduled) console.log(`          📅 ${e.kind} ${e.startIso} @ ${e.where}`);
      }
      break;
    }
    case "show": {
      const s = peekState();
      const c = s.conversations[args[0]];
      if (!c) throw new Error(`No chat ${args[0]}`);
      console.log(`${s.listings[c.listingId].title}\n${c.channel} ${c.address} · ${c.stage}\n`);
      for (const m of c.messages) console.log(`${m.dir === "out" ? "→ agent" : "← them "} ${m.at.slice(0, 16)}${m.note ? ` (${m.note})` : ""}\n  ${m.text.replace(/\n/g, "\n  ")}\n`);
      if (c.redFlags.length) console.log(`Red flags: ${c.redFlags.join("; ")}`);
      break;
    }
    case "relay": {
      const [id, ...text] = args;
      await handleInbound(prefs(), "relay", "", text.join(" "), new Date().toISOString(), id);
      break;
    }
    case "instruct": {
      const [id, ...text] = args;
      await instruct(prefs(), id, text.join(" "));
      break;
    }
    case "drafts":
      for (const d of Object.values(peekState().drafts)) console.log(`${d.id} (${d.reason}) chat ${d.conversationId}\n  ${d.text}\n`);
      break;
    case "approve":
      await sendApprovedDraft(prefs(), args[0], args.slice(1).join(" ") || undefined);
      console.log("Sent.");
      break;
    case "reject":
      await withState((s) => {
        delete s.drafts[args[0]];
      });
      console.log("Dropped.");
      break;
    case "test-notify":
      await notify({ title: "Rental agent test", body: "If you see this on your phone, notifications work.", urgent: true });
      break;
    case "run": {
      const p = prefs();
      if (channelsEnabled.whatsapp()) {
        startWebhookServer((m) => handleInbound(p, "whatsapp", m.from, m.text, m.at));
      }
      let busy = false;
      const tick = async () => {
        if (busy) return; // a search can outlast the 2-minute interval
        busy = true;
        try {
          const last = peekState().lastSearchAt;
          if (!last || Date.now() - new Date(last).getTime() > p.sources.search_every_hours * 3600_000) {
            const added = await runSearch(p);
            if (added.length) {
              await notify({
                title: `${added.length} new listing(s)`,
                body: added.slice(0, 5).map((l) => `${l.score} · S$${l.price_sgd_month ?? "?"} · ${l.title}`).join("\n"),
              });
            }
          }
          await outreach(p);
          await pollEmailOnce(p);
          await followUps(p);
        } catch (e) {
          console.error("tick failed:", e);
        } finally {
          busy = false;
        }
      };
      await tick();
      setInterval(tick, 2 * 60_000);
      console.log("Agent running. Ctrl+C to stop.");
      break;
    }
    default:
      console.log(HELP);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
