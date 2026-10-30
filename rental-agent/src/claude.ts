import Anthropic from "@anthropic-ai/sdk";
import "./config.ts"; // loads .env before the client reads ANTHROPIC_API_KEY

export const client = new Anthropic();
export const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5-5";

// If a safety classifier declines a request, the API re-runs it on Anthropic's
// recommended fallback model instead of returning a refusal. Set
// CLAUDE_FALLBACKS=off to disable (e.g. on a model that does not support it).
export const base =
  process.env.CLAUDE_FALLBACKS === "off"
    ? { model: MODEL }
    : { model: MODEL, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export function assertNotRefused(msg: { stop_reason: string | null; stop_details?: unknown }, what: string) {
  if (msg.stop_reason === "refusal") {
    throw new Error(`Claude declined the ${what} request: ${JSON.stringify(msg.stop_details ?? {})}`);
  }
}
