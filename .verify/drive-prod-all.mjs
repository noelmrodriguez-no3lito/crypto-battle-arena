import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const URL = process.env.URL || "https://crypto-battle-arena.vercel.app";
const CHROME = process.env.CHROME || "/home/no3lito/crypto-battle-arena/.verify/chrome-wrap.sh";
const OUT = ".verify/shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});

async function shoot(route, label, snapshot, role = "p1") {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(URL + "/", { waitUntil: "domcontentloaded" });
  if (snapshot === null) {
    await page.evaluate(() => {
      localStorage.removeItem("cba:match:v2");
      sessionStorage.removeItem("cba:role");
    });
  } else {
    await page.evaluate(({ snap, r }) => {
      localStorage.setItem("cba:match:v2", JSON.stringify(snap));
      sessionStorage.setItem("cba:role", r);
    }, { snap: snapshot, r: role });
  }
  await page.goto(URL + route, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1800));
  const shot = `${OUT}/review-${label}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  console.log("captured", shot);
  await page.close();
}

const now = Date.now();
const base = (overrides) => ({
  matchId: "REV001",
  hostRole: "p1",
  phase: "select",
  p1: { fighterId: null, tokenName: "", ready: false },
  p2: { fighterId: null, tokenName: "", ready: false },
  wager: { p1: { amount: 10, locked: false }, p2: { amount: 10, locked: false } },
  battle: {
    startedAt: null, durationMs: 600_000, turnOwner: "p1",
    turnEndsAt: null, turnDurationMs: 60_000,
    rounds: { current: 1, max: 5 }, posts: [],
  },
  votes: { p1: 0, p2: 0 },
  audienceCount: 0, winner: null, updatedAt: now,
  ...overrides,
});

await shoot("/", "lobby", null);

await shoot("/select", "select-pick", base({
  phase: "select",
  p1: { fighterId: "veteran", tokenName: "BTC", ready: false },
}));

await shoot("/stakes", "stakes-active", base({
  phase: "stakes",
  p1: { fighterId: "veteran", tokenName: "BTC", ready: true },
  p2: { fighterId: "architect", tokenName: "ETH", ready: true },
}));

// Capture VS as AUDIENCE so the page's 3.8s auto-advance to /battle is skipped.
await shoot("/vs", "vs-reveal", base({
  phase: "vs",
  p1: { fighterId: "veteran", tokenName: "BTC", ready: true },
  p2: { fighterId: "architect", tokenName: "ETH", ready: true },
  wager: { p1: { amount: 25, locked: true }, p2: { amount: 25, locked: true } },
}), "audience");

await shoot("/battle", "battle-active", base({
  phase: "battle",
  p1: { fighterId: "veteran", tokenName: "BTC", ready: true },
  p2: { fighterId: "architect", tokenName: "ETH", ready: true },
  wager: { p1: { amount: 25, locked: true }, p2: { amount: 25, locked: true } },
  battle: {
    startedAt: now - 30000,
    durationMs: 600_000, turnOwner: "p2",
    turnEndsAt: now + 35000, turnDurationMs: 60_000,
    rounds: { current: 2, max: 5 },
    posts: [
      { id: "a1", role: "p1", text: "Bitcoin is the only crypto with a real fixed supply. 21 million. That's the entire pitch.", at: now - 28000, mode: "text", votes: { p1: 3, p2: 1, total: 4 } },
      { id: "a2", role: "p2", text: "Ethereum is a world computer. BTC is just digital pet rocks at this point.", at: now - 18000, mode: "text", votes: { p1: 0, p2: 5, total: 5 } },
      { id: "a3", role: "p1", text: "Pet rocks that 16-year-olds in Argentina use to escape currency collapse. Try that on Ethereum mainnet.", at: now - 8000, mode: "voice", votes: { p1: 4, p2: 0, total: 4 } },
    ],
  },
  votes: { p1: 7, p2: 6 },
}));

await shoot("/results", "results-win", base({
  phase: "results",
  p1: { fighterId: "veteran", tokenName: "BTC", ready: true },
  p2: { fighterId: "architect", tokenName: "ETH", ready: true },
  wager: { p1: { amount: 25, locked: true }, p2: { amount: 25, locked: true } },
  battle: {
    startedAt: now - 120000, durationMs: 600_000,
    turnOwner: "p2", turnEndsAt: null, turnDurationMs: 60_000,
    rounds: { current: 5, max: 5 },
    posts: [
      { id: "a1", role: "p1", text: "Fixed supply. Decentralized. Battle-tested for 15 years.", at: now - 100000, mode: "text", votes: { p1: 8, p2: 1, total: 9 } },
      { id: "a2", role: "p2", text: "But can it run a smart contract? No.", at: now - 90000, mode: "text", votes: { p1: 2, p2: 4, total: 6 } },
    ],
  },
  votes: { p1: 14, p2: 8 },
  winner: "p1",
}));

await shoot("/spectate", "spectate-select", base({
  phase: "select",
  p1: { fighterId: "tycoon", tokenName: "DOGE", ready: false },
  p2: { fighterId: null, tokenName: "", ready: false },
}), "audience");

await browser.close();
console.log("DONE");
