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

for (const p of ["/", "/spectate"]) {
  await page.goto(URL + p, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1200));
  const shot = `${OUT}/prod${p.replace(/\//g, "_") || "_root"}.png`;
  await page.screenshot({ path: shot, fullPage: false });
  console.log("captured", shot);
}

await browser.close();
