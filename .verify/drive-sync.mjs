/**
 * End-to-end proof of the Pusher client-event mechanism that H1 sync rides on.
 *
 * Two browser pages, same app origin (so /api/pusher/auth is same-origin), each
 * subscribes to the SAME private-match-* channel. Page A triggers a client event;
 * Page B must receive it. This exercises exactly what use-match.ts does:
 *   - private-channel auth signing  (via /api/pusher/auth)
 *   - client-triggered events       (requires "Enable client events" in the app)
 *
 * Pass  = sync will work in the real app.
 * Fail at subscribe   = auth/creds problem.
 * Fail at event relay = "Enable client events" is OFF in the Pusher dashboard.
 */
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE || "http://localhost:3002";
const CHROME = process.env.CHROME || "/home/no3lito/crypto-battle-arena/.verify/chrome-wrap.sh";
const KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "d1e90d44d74b7f557c6d";
const CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";
const CHANNEL = "private-match-SYNCT1";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});

// Inject pusher-js and return a page handle that has window.__pusher wired up.
async function makeClient(label) {
  const page = await browser.newPage();
  page.on("console", (m) => console.log(`[${label}] ${m.text()}`));
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.addScriptTag({ url: "https://js.pusher.com/8.4.0/pusher.min.js" });
  const subscribed = await page.evaluate(
    ({ key, cluster, channel }) =>
      new Promise((resolve) => {
        // eslint-disable-next-line no-undef
        const p = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth", forceTLS: true });
        window.__received = [];
        const ch = p.subscribe(channel);
        window.__ch = ch;
        ch.bind("client-ping", (data) => window.__received.push(data));
        ch.bind("pusher:subscription_succeeded", () => resolve({ ok: true }));
        ch.bind("pusher:subscription_error", (err) =>
          resolve({ ok: false, err: JSON.stringify(err) })
        );
        setTimeout(() => resolve({ ok: false, err: "timeout(8s) — no subscription_succeeded" }), 8000);
      }),
    { key: KEY, cluster: CLUSTER, channel: CHANNEL }
  );
  return { page, subscribed };
}

const a = await makeClient("A");
const b = await makeClient("B");
console.log("A subscribed:", JSON.stringify(a.subscribed));
console.log("B subscribed:", JSON.stringify(b.subscribed));

if (!a.subscribed.ok || !b.subscribed.ok) {
  console.log("\nRESULT: FAIL — subscription did not succeed (auth/creds problem).");
  await browser.close();
  process.exit(1);
}

// A triggers a client event; B should receive it.
const triggered = await a.page.evaluate(
  () => window.__ch.trigger("client-ping", { msg: "hello-from-A", t: 1 })
);
console.log("A trigger() returned:", triggered);

// Poll B for the event for up to 6s.
let received = [];
for (let i = 0; i < 30; i++) {
  received = await b.page.evaluate(() => window.__received);
  if (received.length > 0) break;
  await new Promise((r) => setTimeout(r, 200));
}

console.log("B received:", JSON.stringify(received));
await browser.close();

if (received.length > 0 && received[0].msg === "hello-from-A") {
  console.log("\nRESULT: PASS — client event relayed A → B. Cross-device sync will work.");
  process.exit(0);
} else {
  console.log(
    "\nRESULT: FAIL — subscribed OK but event was NOT relayed.\n" +
      'Almost certainly: "Enable client events" is OFF in the Pusher app (App Settings → Channels).'
  );
  process.exit(2);
}
