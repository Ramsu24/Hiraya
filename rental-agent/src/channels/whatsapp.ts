import crypto from "node:crypto";
import http from "node:http";
import { env } from "../config.ts";

// WhatsApp Business Cloud API. Business-initiated chats must start with an
// approved template; free-form text is allowed within 24h of the contact's last message.
const GRAPH = "https://graph.facebook.com/v21.0";

async function post(body: unknown) {
  const res = await fetch(`${GRAPH}/${env.whatsapp.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.whatsapp.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...(body as object) }),
  });
  if (!res.ok) throw new Error(`WhatsApp send failed (${res.status}): ${await res.text()}`);
}

export function sendWhatsAppText(to: string, text: string) {
  return post({ to, type: "text", text: { body: text, preview_url: false } });
}

// Template body (create it in WhatsApp Manager, category "Utility" or "Marketing"):
//   Hi! I'm an AI assistant helping {{1}} find a short-term rental. I saw your listing
//   "{{2}}". Is it still available for about {{3}} months from {{4}}? Just reply here.
export function sendWhatsAppTemplate(to: string, params: string[]) {
  return post({
    to,
    type: "template",
    template: {
      name: env.whatsapp.templateName,
      language: { code: env.whatsapp.templateLang },
      components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
    },
  });
}

export function within24h(lastInboundAt: string | null): boolean {
  return lastInboundAt !== null && Date.now() - new Date(lastInboundAt).getTime() < 23.5 * 3600_000;
}

export interface Inbound {
  from: string;
  text: string;
  at: string;
}

function validSignature(raw: Buffer, header: string | undefined): boolean {
  if (!env.whatsapp.appSecret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", env.whatsapp.appSecret).update(raw).digest("hex");
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

// Webhook receiver. Expose it publicly (e.g. `cloudflared tunnel --url http://localhost:8787`)
// and register https://<host>/webhook in the Meta app dashboard.
export function startWebhookServer(onMessage: (m: Inbound) => Promise<void>) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/webhook") {
      res.writeHead(404).end();
      return;
    }
    if (req.method === "GET") {
      const ok =
        url.searchParams.get("hub.mode") === "subscribe" &&
        url.searchParams.get("hub.verify_token") === env.whatsapp.verifyToken;
      res.writeHead(ok ? 200 : 403).end(ok ? url.searchParams.get("hub.challenge") ?? "" : "");
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks);
      if (!validSignature(raw, req.headers["x-hub-signature-256"] as string | undefined)) {
        res.writeHead(401).end();
        return;
      }
      res.writeHead(200).end();
      let body: any;
      try {
        body = JSON.parse(raw.toString("utf8"));
      } catch {
        return;
      }
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          for (const m of change.value?.messages ?? []) {
            const text =
              m.text?.body ??
              m.button?.text ??
              m.interactive?.button_reply?.title ??
              (m.type ? `[${m.type} message - open WhatsApp to view]` : "");
            const at = new Date(Number(m.timestamp) * 1000).toISOString();
            onMessage({ from: String(m.from), text, at }).catch((e) => console.error("inbound handler failed:", e));
          }
        }
      }
    });
  });
  server.listen(env.whatsapp.port, () => console.log(`WhatsApp webhook listening on :${env.whatsapp.port}/webhook`));
  return server;
}
