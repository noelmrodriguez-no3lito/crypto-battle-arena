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
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const now = Date.now();
const seed = {
  matchId: "VRFY01",
  hostRole: "p1",
  phase: "battle",
  p1: { cryptoId: "btc", ready: true },
  p2: { cryptoId: "eth", ready: true },
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

// ────── CLAIM 1+2: timer + END TURN as P1 ────────────────────────────────
await page.goto(BASE + "/", { waitUntil: "networkidle2" });
await page.evaluate((s) => {
  localStorage.setItem("cba:match", JSON.stringify(s));
  sessionStorage.setItem("cba:role", "p1");
}, seed);
await page.goto(BASE + "/battle", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 1000));
await page.screenshot({ path: `${OUT}/01-battle-as-p1.png` });

const battleProbe = await page.evaluate(() => {
  const text = document.body.innerText;
  const round = text.match(/ROUND\s+(\d+)\/(\d+)/);
  const timer = text.match(/\b(\d{2}):(\d{2})\b/);
  const endTurnBtn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("END TURN")
  );
  const tickersInDom = ["BTC", "ETH"].filter((t) => text.includes(t));
  return {
    roundCurrent: round?.[1] ?? null,
    roundMax: round?.[2] ?? null,
    timerSample: timer?.[0] ?? null,
    timerMins: timer ? parseInt(timer[1], 10) : null,
    timerSecs: timer ? parseInt(timer[2], 10) : null,
    endTurnPresent: !!endTurnBtn,
    endTurnDisabled: endTurnBtn ? endTurnBtn.disabled : null,
    tickersInDom,
    yourTurnLabel: text.includes("YOUR TURN"),
  };
});
log("battle-as-p1", battleProbe);

// ── click END TURN, verify ROTATE_TURN dispatched
const before = await page.evaluate(() => JSON.parse(localStorage.getItem("cba:match")).battle);
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent?.includes("END TURN"))
    ?.click();
});
await new Promise((r) => setTimeout(r, 500));
const after = await page.evaluate(() => JSON.parse(localStorage.getItem("cba:match")).battle);
log("rotate-turn", {
  before: { turnOwner: before.turnOwner, turnEndsAt: before.turnEndsAt },
  after: { turnOwner: after.turnOwner, turnEndsAt: after.turnEndsAt },
  flipped: before.turnOwner !== after.turnOwner,
});
await page.screenshot({ path: `${OUT}/02-after-end-turn.png` });

// ────── CLAIM 3: portraits on every page ─────────────────────────────────
const BRAND_COLORS = ["F7931A", "627EEA", "181E33", "C2A633", "23292F", "0033AD", "F3BA2F", "2A5ADA"];

const ROUTES = [
  { path: "/select", role: "p1" },
  { path: "/vs", role: "p1" },
  { path: "/battle", role: "p1" },
  { path: "/results", role: "p1", phase: "results", winner: "p1" },
  { path: "/spectate", role: "audience" },
];

const portraitFindings = [];
for (const r of ROUTES) {
  await page.evaluate(
    ({ seed, phase, winner, role }) => {
      const m = { ...seed };
      if (phase) m.phase = phase;
      if (winner) m.winner = winner;
      m.updatedAt = Date.now();
      localStorage.setItem("cba:match", JSON.stringify(m));
      sessionStorage.setItem("cba:role", role);
    },
    { seed, phase: r.phase, winner: r.winner, role: r.role }
  );
  await page.goto(BASE + r.path, { waitUntil: "networkidle2" });
  await new Promise((rs) => setTimeout(rs, 700));
  const shot = `${OUT}/route${r.path.replace(/\//g, "_")}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  const probe = await page.evaluate((colors) => {
    const html = document.documentElement.outerHTML;
    const hits = colors.filter((c) => html.toUpperCase().includes(c));
    const svgs = document.querySelectorAll("svg").length;
    const inlineSvgPaths = document.querySelectorAll("svg path, svg circle").length;
    return { brandColorHits: hits, svgCount: svgs, svgChildren: inlineSvgPaths };
  }, BRAND_COLORS);
  portraitFindings.push({ route: r.path, ...probe, shot });
  log(`portraits ${r.path}`, probe);
}

// ────── PROBE: audience cannot END TURN ─────────────────────────────────
await page.evaluate(() => {
  sessionStorage.setItem("cba:role", "audience");
});
await page.goto(BASE + "/battle", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 500));
const audienceProbe = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")].map((b) => b.textContent?.trim());
  return {
    btnCount: btns.length,
    audienceSeesEndTurn: btns.some((t) => t?.includes("END TURN")),
    audienceSeesVoteButtons: btns.some((t) => t?.startsWith("▲")),
    btns,
  };
});
log("audience-probe", audienceProbe);
await page.screenshot({ path: `${OUT}/03-audience-view.png` });

await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify({ battleProbe, portraitFindings, audienceProbe }, null, 2));
console.log("\nDONE. Captures in", OUT);
