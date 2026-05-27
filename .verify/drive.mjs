import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3010";
const CHROME = process.env.CHROME || "/home/no3lito/crypto-battle-arena/.verify/chrome-wrap.sh";
const OUT = ".verify/shots";
mkdirSync(OUT, { recursive: true });

const log = (label, obj) => console.log(`\n--- ${label} ---\n${JSON.stringify(obj, null, 2)}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const now = Date.now();
// Seed v2 state: fighters + tokens.
const seed = {
  matchId: "VRFY02",
  hostRole: "p1",
  phase: "battle",
  p1: { fighterId: "veteran", tokenName: "BTC", ready: true },
  p2: { fighterId: "architect", tokenName: "ETH", ready: true },
  wager: { p1: { amount: 10, locked: true }, p2: { amount: 10, locked: true } },
  battle: {
    startedAt: now,
    durationMs: 10 * 60 * 1000,
    turnOwner: "p1",
    turnEndsAt: now + 60_000,
    turnDurationMs: 60_000,
    rounds: { current: 1, max: 5 },
    posts: [],
  },
  votes: { p1: 0, p2: 0 },
  audienceCount: 0,
  winner: null,
  updatedAt: now,
};

await page.goto(BASE + "/", { waitUntil: "networkidle2" });
await page.evaluate((s) => {
  localStorage.setItem("cba:match:v2", JSON.stringify(s));
  sessionStorage.setItem("cba:role", "p1");
}, seed);

const ROUTES = [
  { path: "/select", role: "p1", phase: "select" },
  { path: "/vs", role: "p1", phase: "vs" },
  { path: "/battle", role: "p1", phase: "battle" },
  { path: "/results", role: "p1", phase: "results", winner: "p1" },
  { path: "/spectate", role: "audience", phase: "select" },
];

for (const r of ROUTES) {
  await page.evaluate(
    ({ seed, phase, winner, role }) => {
      const m = { ...seed };
      if (phase) m.phase = phase;
      if (winner) m.winner = winner;
      m.updatedAt = Date.now();
      // For VS reveal we want phase: vs (not auto-skip)
      if (phase === "vs") {
        m.battle.turnEndsAt = null;
        m.battle.startedAt = null;
      }
      localStorage.setItem("cba:match:v2", JSON.stringify(m));
      sessionStorage.setItem("cba:role", role);
    },
    { seed, phase: r.phase, winner: r.winner, role: r.role }
  );
  await page.goto(BASE + r.path, { waitUntil: "networkidle2" });
  await new Promise((rs) => setTimeout(rs, 1200));
  const shot = `${OUT}/v2${r.path.replace(/\//g, "_")}.png`;
  await page.screenshot({ path: shot, fullPage: true });

  const probe = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].map((i) => ({
      src: i.src,
      complete: i.complete,
      naturalWidth: i.naturalWidth,
    }));
    return {
      title: document.title,
      fighterImgs: imgs.filter((i) => i.src.includes("/fighters/")),
      bodyTextSlice: document.body.innerText.slice(0, 300),
    };
  });
  log(`route ${r.path}`, { shot, ...probe });
}

await browser.close();
writeFileSync(`${OUT}/v2-report.json`, JSON.stringify({ done: true, when: new Date().toISOString() }));
console.log("\nDONE.");
