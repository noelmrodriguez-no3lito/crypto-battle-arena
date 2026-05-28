/**
 * Curated question pool for Round 2 (Moderator Q&A).
 *
 * The moderator can filter by category (general / per-token) and pick a
 * question to display. They can also type a custom one. Tokens are matched
 * case-insensitively against the user-typed token name on /select.
 */

export type Question = {
  id: string;
  text: string;
  /** Empty for general; otherwise the upper-case tickers this question is for. */
  tokens: string[];
};

const G = (id: string, text: string): Question => ({ id, text, tokens: [] });
const T = (id: string, tokens: string[], text: string): Question => ({ id, text, tokens });

export const QUESTION_POOL: Question[] = [
  // ─────────────── General crypto (~30) ───────────────
  G("g01", "What's the single biggest risk to crypto adoption in the next two years?"),
  G("g02", "Should retail investors hold any crypto at all? Why or why not?"),
  G("g03", "How do you balance privacy and regulation in 2026?"),
  G("g04", "What's overhyped in crypto right now?"),
  G("g05", "What's underrated in crypto right now?"),
  G("g06", "Pick one to sacrifice: scalability, security, or decentralization. Which goes?"),
  G("g07", "How do you respond to the 'crypto has no real use case' criticism?"),
  G("g08", "Should CBDCs be allowed to coexist with private crypto, or is one going to win?"),
  G("g09", "How important is decentralization actually to the average user?"),
  G("g10", "What does the 'crypto wins' future look like in 2035?"),
  G("g11", "Has DeFi delivered on its promises? Defend or critique."),
  G("g12", "What's your take on memecoins as a category — feature or bug?"),
  G("g13", "Is 'Web3' a meaningful concept or just marketing?"),
  G("g14", "Should governments hold crypto in their reserves? Yes or no, and why?"),
  G("g15", "What did the last cycle (2024-2025) teach us about crypto?"),
  G("g16", "Should crypto exchanges become regulated banks?"),
  G("g17", "How would you protect a first-time buyer from getting rugged?"),
  G("g18", "Is mining acceptable in 2026 given the energy debate?"),
  G("g19", "Is Proof of Stake actually decentralized enough? Defend."),
  G("g20", "What happens to crypto when interest rates change direction?"),
  G("g21", "Are NFTs coming back, or is that chapter closed?"),
  G("g22", "Explain crypto to your grandmother in one sentence — go."),
  G("g23", "Stablecoins: useful infrastructure or systemic risk?"),
  G("g24", "What's your view on KYC and self-custody coexisting?"),
  G("g25", "Layer 1, Layer 2, or appchains — where does activity end up?"),
  G("g26", "What's the strongest argument *against* your own coin?"),
  G("g27", "Which legacy institution do you most want crypto to disrupt?"),
  G("g28", "What's the most underappreciated technical achievement in crypto history?"),
  G("g29", "If your coin disappeared tomorrow, what would users actually lose?"),
  G("g30", "Pitch your coin to a skeptical hedge-fund manager. One minute."),

  // ─────────────── BTC ───────────────
  T("btc01", ["BTC"], "Is Bitcoin really 'digital gold' or just a high-volatility speculative asset?"),
  T("btc02", ["BTC"], "Defend Bitcoin's fixed 21M supply against the deflation criticism."),
  T("btc03", ["BTC"], "What does Lightning actually solve, and where does it still fail?"),
  T("btc04", ["BTC"], "Spot ETFs have changed who owns BTC. Is that good for the network?"),
  T("btc05", ["BTC"], "How do you defend BTC mining's energy cost in 2026?"),
  T("btc06", ["BTC"], "Is Bitcoin a payment network anymore, or only a store of value?"),
  T("btc07", ["BTC"], "What's BTC's answer to programmable money (Runes, BRC-20, Taproot Assets)?"),
  T("btc08", ["BTC"], "Should sovereign nations hold BTC in their treasuries? Make the case."),
  T("btc09", ["BTC"], "Defend Bitcoin against the 'last 15 years and no real product market fit' jab."),
  T("btc10", ["BTC"], "What's BTC's biggest existential risk — government, mining centralization, or apathy?"),

  // ─────────────── ETH ───────────────
  T("eth01", ["ETH"], "Defend Ethereum's gas-fee model to a normal user."),
  T("eth02", ["ETH"], "Has rollup-centric scaling delivered, or is the L2 ecosystem too fragmented?"),
  T("eth03", ["ETH"], "What's the strongest argument for ETH being 'ultrasound money'?"),
  T("eth04", ["ETH"], "What does Ethereum lose if validators centralize around a few staking pools?"),
  T("eth05", ["ETH"], "Is MEV a feature, a tax, or a security risk?"),
  T("eth06", ["ETH"], "Restaking: smart capital efficiency or a systemic risk vector?"),
  T("eth07", ["ETH"], "Account abstraction is supposed to fix UX. Has it?"),
  T("eth08", ["ETH"], "Compare Ethereum's roadmap pace to Solana's. Who's winning the next two years?"),
  T("eth09", ["ETH"], "Why is ETH the right base layer for tokenized real-world assets?"),
  T("eth10", ["ETH"], "What's the case for ETH if a competitor delivers parity on every technical dimension?"),

  // ─────────────── SOL ───────────────
  T("sol01", ["SOL"], "Defend Solana's history of network outages to a skeptical institutional buyer."),
  T("sol02", ["SOL"], "Is Solana's high TPS actually being used by anything other than memecoin trading?"),
  T("sol03", ["SOL"], "How decentralized is Solana really, given hardware requirements for validators?"),
  T("sol04", ["SOL"], "Firedancer is coming. What does it actually change for users?"),
  T("sol05", ["SOL"], "Is the Solana memecoin culture an asset or a liability for the ecosystem?"),
  T("sol06", ["SOL"], "Mobile (Saga, Seeker) — is on-chain mobile actually a real category?"),
  T("sol07", ["SOL"], "What does Solana have that Ethereum doesn't, beyond throughput?"),
  T("sol08", ["SOL"], "Are Solana fees still the killer feature, or has L2 caught up?"),
  T("sol09", ["SOL"], "Defend Anatoly's monolithic-chain bet against the modular thesis."),
  T("sol10", ["SOL"], "What kills Solana — a competitor, regulation, or another major outage?"),

  // ─────────────── DOGE ───────────────
  T("doge01", ["DOGE"], "Make the serious case for Dogecoin as a real payment network."),
  T("doge02", ["DOGE"], "Is DOGE's inflation schedule a bug or a feature for usage?"),
  T("doge03", ["DOGE"], "How dependent is DOGE on Elon Musk and is that healthy?"),
  T("doge04", ["DOGE"], "Why has DOGE survived every memecoin wave when others died?"),
  T("doge05", ["DOGE"], "Defend DOGE against the 'it has no roadmap or team' criticism."),
  T("doge06", ["DOGE"], "Dogecoin or X-payments — which gets crypto into mainstream first?"),
  T("doge07", ["DOGE"], "Is the Dogecoin community a moat or a meme that will fade?"),
  T("doge08", ["DOGE"], "Why does DOGE still belong in a serious portfolio in 2026?"),
  T("doge09", ["DOGE"], "What would DOGE need to ship for you to call it a real platform?"),
  T("doge10", ["DOGE"], "If DOGE became the official tip token of X, does that change the thesis?"),

  // ─────────────── XRP ───────────────
  T("xrp01", ["XRP"], "How has the SEC outcome actually changed XRP's adoption trajectory?"),
  T("xrp02", ["XRP"], "Defend XRP's centralization to a decentralization maximalist."),
  T("xrp03", ["XRP"], "What banks are actually using XRP for settlement today? Be specific."),
  T("xrp04", ["XRP"], "Is XRP positioned to win CBDC integration, or is it being passed over?"),
  T("xrp05", ["XRP"], "How does ODL actually compete with SWIFT and stablecoins?"),
  T("xrp06", ["XRP"], "What's the strongest argument that XRP is more than a 2017 relic?"),
  T("xrp07", ["XRP"], "What does Ripple do that XRP doesn't, and does that distinction matter?"),
  T("xrp08", ["XRP"], "Is XRP's escrow distribution a sword over the token's head?"),
  T("xrp09", ["XRP"], "Why should institutions hold XRP versus just using stablecoins?"),
  T("xrp10", ["XRP"], "What kills XRP — regulation, a competitor, or just irrelevance?"),

  // ─────────────── ADA ───────────────
  T("ada01", ["ADA"], "Defend Cardano's peer-review-first approach against the 'ship faster' criticism."),
  T("ada02", ["ADA"], "What's actually built on Cardano that uses Plutus in a meaningful way?"),
  T("ada03", ["ADA"], "Hydra is supposed to be Cardano's scaling answer. Is it real yet?"),
  T("ada04", ["ADA"], "Is Cardano's Africa adoption story marketing or material?"),
  T("ada05", ["ADA"], "Defend Cardano against the 'too slow, too academic' critique."),
  T("ada06", ["ADA"], "Is Charles Hoskinson an asset or a liability for the ADA brand?"),
  T("ada07", ["ADA"], "Why pick Cardano over Ethereum if you're a developer in 2026?"),
  T("ada08", ["ADA"], "Cardano's governance model: well-designed or overcomplicated?"),
  T("ada09", ["ADA"], "What does the next 12 months need to deliver for ADA to stay relevant?"),
  T("ada10", ["ADA"], "Is ADA's native asset model actually better than ERC-20?"),

  // ─────────────── BNB ───────────────
  T("bnb01", ["BNB"], "How does BNB exist meaningfully without Binance?"),
  T("bnb02", ["BNB"], "Defend BNB Chain's centralization to a Bitcoin maximalist."),
  T("bnb03", ["BNB"], "What's BNB's strongest non-exchange use case?"),
  T("bnb04", ["BNB"], "CZ stepped back. Has BNB's risk profile actually improved?"),
  T("bnb05", ["BNB"], "Is the quarterly burn mechanism real value accrual or a marketing program?"),
  T("bnb06", ["BNB"], "BNB Chain vs Solana on memecoins — who wins the next cycle?"),
  T("bnb07", ["BNB"], "Defend holding BNB given Binance's regulatory history."),
  T("bnb08", ["BNB"], "What does BNB do that BSC doesn't, and does the distinction matter?"),
  T("bnb09", ["BNB"], "Is Launchpad still a meaningful BNB use case, or did that era end?"),
  T("bnb10", ["BNB"], "What's the bull case for BNB if Binance loses US market access entirely?"),

  // ─────────────── LINK ───────────────
  T("link01", ["LINK"], "How is LINK actually accruing value from Chainlink's network usage?"),
  T("link02", ["LINK"], "What does CCIP do that bridges don't, and is that a moat?"),
  T("link03", ["LINK"], "Has Chainlink staking changed LINK's economic model in a meaningful way?"),
  T("link04", ["LINK"], "Are oracles still a winner-take-most market, or is competition real now?"),
  T("link05", ["LINK"], "How big is the actual oracle attack risk in DeFi today?"),
  T("link06", ["LINK"], "What does Chainlink's traditional-finance integration story look like in 2026?"),
  T("link07", ["LINK"], "Defend LINK's tokenomics against the 'team dilution' criticism."),
  T("link08", ["LINK"], "Is Chainlink's product breadth a moat or a focus problem?"),
  T("link09", ["LINK"], "What kills LINK — Pyth, a competitor, or oracle commoditization?"),
  T("link10", ["LINK"], "What single milestone in the next 12 months would re-rate LINK?"),

  // ─────────────── Memecoin tier (PEPE, TRUMP, etc.) ───────────────
  T("pepe01", ["PEPE"], "Defend PEPE as more than a meme. Is there a real thesis?"),
  T("pepe02", ["PEPE"], "Does PEPE's holder concentration scare you, or do you ignore it?"),
  T("pepe03", ["PEPE"], "Why has PEPE outlasted other memes that came after it?"),
  T("pepe04", ["PEPE"], "What's the realistic best-case outcome for PEPE in 24 months?"),
  T("pepe05", ["PEPE"], "Is PEPE's community-only ethos a feature or a fragility?"),

  T("trump01", ["TRUMP"], "Is TRUMP a meme, a political asset, or a financial instrument? Pick one."),
  T("trump02", ["TRUMP"], "How does TRUMP perform when the political cycle quiets down?"),
  T("trump03", ["TRUMP"], "Is there any case for holding TRUMP outside of political alignment?"),
  T("trump04", ["TRUMP"], "What's the regulatory risk profile on a politically-branded coin?"),
  T("trump05", ["TRUMP"], "What would have to happen for TRUMP to lose 90% from here?"),
];

export function filterQuestions(tokens: string[]): Question[] {
  if (tokens.length === 0) return QUESTION_POOL;
  const upper = tokens.map((t) => t.toUpperCase());
  return QUESTION_POOL.filter(
    (q) => q.tokens.length === 0 || q.tokens.some((t) => upper.includes(t))
  );
}
