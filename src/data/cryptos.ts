export type CryptoCharacter = {
  id: string;
  ticker: string;
  name: string;
  tagline: string;
  archetype: string;
  color: string;
  glowClass: "glow-red" | "glow-blue" | "glow-green" | "glow-yellow" | "glow-magenta";
  stats: {
    hodl: number;
    hype: number;
    utility: number;
  };
  signatureMoves: string[];
};

export const CRYPTO_ROSTER: CryptoCharacter[] = [
  {
    id: "btc",
    ticker: "BTC",
    name: "Bitcoin",
    tagline: "The Original Heavyweight",
    archetype: "Stoic Veteran",
    color: "#F7931A",
    glowClass: "glow-yellow",
    stats: { hodl: 99, hype: 70, utility: 65 },
    signatureMoves: [
      "Digital Gold Slam",
      "Halving Haymaker",
      "21 Million Punch",
      "Diamond Hand Block",
    ],
  },
  {
    id: "eth",
    ticker: "ETH",
    name: "Ethereum",
    tagline: "World Computer",
    archetype: "Technical Mastermind",
    color: "#627EEA",
    glowClass: "glow-blue",
    stats: { hodl: 80, hype: 75, utility: 98 },
    signatureMoves: [
      "Smart Contract Counter",
      "L2 Scaling Kick",
      "EIP-1559 Burn",
      "Proof-of-Stake Throw",
    ],
  },
  {
    id: "sol",
    ticker: "SOL",
    name: "Solana",
    tagline: "Speed Demon",
    archetype: "Glass Cannon",
    color: "#14F195",
    glowClass: "glow-green",
    stats: { hodl: 60, hype: 92, utility: 88 },
    signatureMoves: [
      "65k TPS Rush",
      "Validator Volley",
      "Memecoin Mosh",
      "Outage Recovery",
    ],
  },
  {
    id: "doge",
    ticker: "DOGE",
    name: "Dogecoin",
    tagline: "Much Wow",
    archetype: "Meme Brawler",
    color: "#C2A633",
    glowClass: "glow-yellow",
    stats: { hodl: 55, hype: 99, utility: 35 },
    signatureMoves: [
      "Shibe Smash",
      "Elon Tweet Storm",
      "To-The-Moon Uppercut",
      "Tip Jar Throw",
    ],
  },
  {
    id: "xrp",
    ticker: "XRP",
    name: "XRP",
    tagline: "Banker's Bullet",
    archetype: "Tactical Operator",
    color: "#23292F",
    glowClass: "glow-blue",
    stats: { hodl: 70, hype: 60, utility: 80 },
    signatureMoves: [
      "Cross-Border Combo",
      "SEC Counter-Suit",
      "Settlement Slam",
      "Liquidity Lock",
    ],
  },
  {
    id: "ada",
    ticker: "ADA",
    name: "Cardano",
    tagline: "Peer-Reviewed Power",
    archetype: "Methodical Scholar",
    color: "#0033AD",
    glowClass: "glow-blue",
    stats: { hodl: 75, hype: 55, utility: 78 },
    signatureMoves: [
      "Ouroboros Bind",
      "Plutus Trap",
      "Hoskinson Hook",
      "Roadmap Roundhouse",
    ],
  },
  {
    id: "bnb",
    ticker: "BNB",
    name: "BNB",
    tagline: "Exchange Champion",
    archetype: "House Fighter",
    color: "#F3BA2F",
    glowClass: "glow-yellow",
    stats: { hodl: 72, hype: 78, utility: 82 },
    signatureMoves: [
      "Launchpad Liftoff",
      "Burn Quarterly",
      "BSC Bombardment",
      "CZ Cross",
    ],
  },
  {
    id: "link",
    ticker: "LINK",
    name: "Chainlink",
    tagline: "Oracle Of Truth",
    archetype: "Support Specialist",
    color: "#2A5ADA",
    glowClass: "glow-blue",
    stats: { hodl: 68, hype: 62, utility: 90 },
    signatureMoves: [
      "Oracle Feed",
      "VRF Random",
      "CCIP Tunnel",
      "Sergey Sweater Slam",
    ],
  },
];

export function getCrypto(id: string): CryptoCharacter | undefined {
  return CRYPTO_ROSTER.find((c) => c.id === id);
}
