import path from "node:path";
import type { BrowserContext } from "playwright";
import { DATA_DIR, type Preferences } from "../config.ts";
import type { ExtractedListing } from "../schemas.ts";
import { extractListings } from "./extract.ts";

// One persistent browser profile, so logins (Facebook, PropertyGuru, ...) made with
// `npm run agent -- login <url>` are reused by later headless runs.
const PROFILE_DIR = path.join(DATA_DIR, "browser-profile");

async function openContext(headless: boolean): Promise<BrowserContext> {
  let pw: typeof import("playwright");
  try {
    pw = await import("playwright");
  } catch {
    throw new Error("Playwright is not installed. Run: npm install playwright && npx playwright install chromium");
  }
  return pw.chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1280, height: 900 },
    locale: "en-SG",
    timezoneId: "Asia/Singapore",
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
}

export async function interactiveLogin(url: string) {
  const ctx = await openContext(false);
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(url);
  console.log("Log in in the browser window, then close the window to save the session.");
  await new Promise<void>((resolve) => ctx.on("close", () => resolve()));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pageText(ctx: BrowserContext, url: string, scrolls: number): Promise<string> {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await sleep(3000);
    for (let i = 0; i < scrolls; i++) {
      await page.mouse.wheel(0, 2500);
      await sleep(1500 + Math.random() * 1500);
    }
    // Expand Facebook's "See more" so post text and phone numbers are complete.
    for (const el of await page.getByRole("button", { name: /^see more$/i }).all()) {
      await el.click({ timeout: 1000 }).catch(() => undefined);
    }
    return await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => `${(a as HTMLAnchorElement).innerText.trim().slice(0, 80)} -> ${(a as HTMLAnchorElement).href}`)
        .filter((s) => /room|rent|listing|marketplace\/item|posts|permalink|for-rent|\/l\//i.test(s))
        .slice(0, 300);
      return `${document.body.innerText}\n\nLINKS:\n${links.join("\n")}`;
    });
  } finally {
    await page.close();
  }
}

export async function scrapeUrls(urls: string[], prefs: Preferences, label: string, scrolls = 3) {
  const out: { listing: ExtractedListing; via: string }[] = [];
  if (!urls.length) return out;
  const ctx = await openContext(true);
  try {
    for (const url of urls) {
      try {
        const text = await pageText(ctx, url, scrolls);
        const listings = await extractListings(text, url, prefs);
        console.log(`  ${label}: ${listings.length} listing(s) from ${url}`);
        out.push(...listings.map((listing) => ({ listing, via: `${label}:${url}` })));
      } catch (e) {
        console.warn(`  ${label}: failed on ${url}: ${(e as Error).message}`);
      }
      await sleep(4000 + Math.random() * 4000);
    }
  } finally {
    await ctx.close();
  }
  return out;
}

// Read-only: reads group feeds and Marketplace search results with your logged-in
// session. It never posts, comments or sends Messenger messages.
export function facebookUrls(prefs: Preferences): string[] {
  const fb = prefs.sources.facebook;
  if (!fb.enabled) return [];
  return [
    ...fb.group_urls,
    ...fb.marketplace_queries.map(
      (q) => `https://www.facebook.com/marketplace/singapore/propertyrentals?query=${encodeURIComponent(q)}`,
    ),
  ];
}
