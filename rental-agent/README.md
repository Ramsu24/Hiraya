# Rental agent: short-term rentals near Jurong West

A command-line agent that:

1. **Finds listings** on the open web (PropertyGuru, 99.co, Carousell, SRX, Roomies, co-living and serviced-apartment sites, public Facebook posts), on any search page you give it, and in Facebook groups and Marketplace through your own logged-in browser.
2. **Scores them** against your brief and drops the ones Singapore law won't allow for your stay length.
3. **Messages landlords and agents** on WhatsApp or email, introducing itself as an AI assistant working for you. It checks the details, negotiates the rent within your budget and books a call or viewing in your free time slots.
4. **Notifies you** on your phone (ntfy, Telegram or email) when a call or viewing is booked. The notification comes with a calendar invite (`.ics`). It also notifies you when it needs a decision from you.

It never agrees to rent a place, pays anything, signs anything or shares your ID or contact details. When a chat reaches that point, it hands over to you.

## Singapore lease rules (check before you search)

| Property | Minimum lease |
| --- | --- |
| HDB flat or HDB room | 6 months |
| Private condo / landed (most co-living too) | 3 months |
| Licensed serviced apartment | shorter stays allowed |

So for **3 months**, the agent targets condos, co-living and serviced apartments. For **2 months**, only serviced apartments are legal, and they cost more. The agent won't ask a landlord to break these rules. Check [HDB](https://www.hdb.gov.sg) and [URA](https://www.ura.gov.sg) in case the rules change.

## Setup

Requires Node 20.12+.

```bash
cd rental-agent
npm install
npx playwright install chromium   # only needed for saved URLs / Facebook
npm run agent -- init              # creates preferences.yaml and .env
```

1. **Edit `preferences.yaml`** with your brief: dates, budget (target and max), must-haves, deal-breakers, the times you're free for calls and viewings, and what the agent may offer as leverage (for example "pay 3 months upfront").
2. **Edit `.env`**:
   - `ANTHROPIC_API_KEY` (required).
   - **Notifications.** The easiest option is to install the [ntfy](https://ntfy.sh) app, subscribe to a hard-to-guess topic and put it in `NTFY_TOPIC`. Telegram (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`) and email (`NOTIFY_EMAIL` + SMTP) also work.
   - **WhatsApp** (recommended, since most SG landlords and agents use it): see below.
   - **Email**: `SMTP_URL`, `EMAIL_FROM`, and IMAP settings so the agent can read replies. For Gmail, use an App Password.
3. Check everything:
   ```bash
   npm run agent -- doctor
   npm run agent -- test-notify
   ```

### WhatsApp Business Cloud API

1. Create a Meta developer app with the WhatsApp product and add a phone number. It must be a number that is **not** registered in the normal WhatsApp app (a cheap prepaid SIM works).
2. Put the permanent access token, phone number ID and app secret in `.env`.
3. In WhatsApp Manager, create a message template named `rental_enquiry` (language `en`) with this body:
   ```
   Hi! I'm an AI assistant helping {{1}} find a short-term rental. I saw your listing "{{2}}". Is it still available for about {{3}} months from {{4}}? Just reply here.
   ```
   WhatsApp only lets businesses start a chat with an approved template. After the landlord replies, the agent can chat freely for 24 hours after each of their messages.
4. Expose the webhook and register `https://<public-host>/webhook` with your `WHATSAPP_VERIFY_TOKEN`:
   ```bash
   cloudflared tunnel --url http://localhost:8787
   ```

Without WhatsApp, listings that only show a phone number go through **manual relay** (see below).

### Facebook

Set `sources.facebook.enabled: true`, add group URLs and Marketplace queries, then log in once in the browser window this command opens:

```bash
npm run agent -- login https://www.facebook.com
```

Facebook support is **read-only**: it reads posts with your session, slowly. It does not send Messenger messages, because automating a personal account breaks Meta's terms and gets accounts banned. When a post includes a WhatsApp number (most SG posts do), the agent chats there. Otherwise it uses manual relay: it sends you the exact text to paste into Messenger, and you paste the reply back:

```bash
npm run agent -- relay <chatId> "their reply"
```

Saved search pages on other sites work the same way. Paste the results-page URL into `sources.urls`. Some sites block automated browsers or forbid scraping in their terms. Use their pages at your own discretion, and run `login <url>` first if the site needs you to be signed in.

## Using it

```bash
npm run agent -- search          # find and score listings
npm run agent -- list            # best first, with flags
npm run agent -- contact 5       # message the top 5 (or: contact <id> <id>)
npm run agent -- run             # leave it running: searches, replies, follows up, notifies
```

Day to day:

```bash
npm run agent -- chats                                   # every conversation and its stage
npm run agent -- show <chatId>                           # full transcript
npm run agent -- instruct <chatId> "go up to 1250 if aircon is included; I can view Sat morning"
npm run agent -- drafts                                  # messages held for your approval
npm run agent -- approve <draftId> ["edited text"]
npm run agent -- reject <draftId>
```

`negotiation.approval` in `preferences.yaml` sets how much the agent sends on its own:

- `auto`: it sends every message itself.
- `approve_first` (default in the example): you approve the first message to each landlord, and it handles the rest.
- `approve_all`: you approve every message.

## Safety rails

The prompt tells the agent the rules below, and code checks every outgoing message before it is sent (`src/rules.ts`):

- Any message that would commit you to paying, PayNow, a deposit or booking fee, "taking" the unit, or signing a TA/LOI is **held for your approval**.
- Any message that agrees to a rent above your `max` is held.
- Any message that mentions NRIC, FIN or passport numbers, or a phone number you haven't allowed it to share, is held.
- Scam signs are flagged and sent to you. These include a deposit asked before a viewing, a landlord who is "overseas", refusing a viewing, prices far below market, and pressure to move to another app.
- Bookings outside your availability windows are marked with a ⚠️ in the notification.
- At most `max_new_contacts_per_day` new landlords are contacted each day, with one polite follow-up each.

The agent can't make voice calls. It books the call or viewing, and you attend.

## Files

- `src/sources/`: web search (Claude with web search/fetch), browser scraping (your URLs and Facebook), and listing extraction.
- `src/negotiator.ts`: the negotiation prompt and the structured decision for each turn.
- `src/engine.ts`: search, outreach, inbound handling, follow-ups, guardrails and bookings.
- `src/channels/`: WhatsApp Cloud API (send and webhook) and email (SMTP/IMAP).
- `src/notify.ts`: ntfy, Telegram and email notifications, plus `.ics` invites.
- `data/`: state, the notification log, calendar files and the browser profile. It is git-ignored and contains personal data.

```bash
npm test          # rules, guardrails, and an offline end-to-end run against a fake Claude API
npm run typecheck
```
