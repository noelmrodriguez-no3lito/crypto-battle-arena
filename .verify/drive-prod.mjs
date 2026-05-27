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
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const now = Date.now();
const seed = {
  matchId: "PRDV01",
  hostRole: "p1",
  phase: "battle",
  p1: { fighterId: "veteran", tokenName: "BTC", ready: true },
  p2: { fighterId: "architect", tokenName: "ETH", ready: true },
  wager: { p1: { amount: 10, locked: true }, p2: { amount: 10, locked: true } },
  battle: {
    startedAt: now, durationMs: 600_000, turnOwner: "p1",
    turnEndsAt: now + 60_000, turnDurationMs: 60_000,
    rounds: { current: 1, max: 5 }, posts: [],
  },
  votes: { p1: 0, p2: 0 },
  audienceCount: 0,
  winner: null,
  updatedAt: now,
};

await page.goto(URL + "/", { waitUntil: "networkidle2" });
await page.evaluate((s) => {
  localStorage.setItem("cba:match:v2", JSON.stringify(s));
  sessionStorage.setItem("cba:role", "p1");
}, seed);

const ROUTES = [
  { path: "/select", phase: "select" },
  { path: "/battle", phase: "battle" },
  { path: "/results", phase: "results", winner: "p1" },
];

for (const r of ROUTES) {
  await page.evaluate(
    ({ seed, phase, winner }) => {
      const m = { ...seed };
      if (phase) m.phase = phase;
      if (winner) m.winner = winner;
      m.updatedAt = Date.now();
      localStorage.setItem("cba:match:v2", JSON.stringify(m));
    },
    { seed, phase: r.phase, winner: r.winner }
  );
  await page.goto(URL + r.path, { waitUntil: "networkidle2" });
  await new Promise((rs) => setTimeout(rs, 1500));
  const shot = `${OUT}/prod-v2${r.path.replace(/\//g, "_")}.png`;
  await page.screenshot({ path: shot });
  console.log("captured", shot);
}

await browser.close();
console.log("done");
