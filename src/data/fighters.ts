/**
 * Neutral fighter roster — character art is fixed, but the coin
 * identity ("token") is assigned per-match by the player at select
 * time. This decouples character art from crypto branding so the
 * same Veteran can be Bitcoin in one match and Ethereum in the next.
 */

export type FighterId =
  | "veteran"
  | "architect"
  | "flash"
  | "trickster"
  | "operator"
  | "sage"
  | "tycoon"
  | "oracle";

export type Fighter = {
  id: FighterId;
  name: string;        // The fighter's character name (NOT the token)
  archetype: string;
  tagline: string;
  /** Path under /public — served as /fighters/<id>.png */
  portrait: string;
  /** Brand-style accent color for halos and frames */
  color: string;
  glowClass: "glow-red" | "glow-blue" | "glow-green" | "glow-yellow" | "glow-magenta";
  stats: {
    power: number;     // Replaces HODL — raw strength
    speed: number;     // Replaces HYPE — agility / reaction
    technique: number; // Replaces UTIL — skill / strategy
  };
  signatureMoves: string[];
};

export const FIGHTER_ROSTER: Fighter[] = [
  {
    id: "veteran",
    name: "The Veteran",
    archetype: "Stoic Heavyweight",
    tagline: "Older than the bull market.",
    portrait: "/fighters/veteran.png",
    color: "#D97706",
    glowClass: "glow-yellow",
    stats: { power: 95, speed: 55, technique: 78 },
    signatureMoves: [
      "Halving Haymaker",
      "Diamond Hand Block",
      "21 Million Punch",
      "Vintage Crossover",
    ],
  },
  {
    id: "architect",
    name: "The Architect",
    archetype: "Technical Mastermind",
    tagline: "Compiles arguments in real time.",
    portrait: "/fighters/architect.png",
    color: "#06B6D4",
    glowClass: "glow-blue",
    stats: { power: 70, speed: 75, technique: 98 },
    signatureMoves: [
      "Smart Contract Counter",
      "L2 Scaling Kick",
      "EIP Burn",
      "Recursive Suplex",
    ],
  },
  {
    id: "flash",
    name: "The Flash",
    archetype: "Speed Demon",
    tagline: "Sixty-five thousand thoughts per second.",
    portrait: "/fighters/flash.png",
    color: "#22D3EE",
    glowClass: "glow-green",
    stats: { power: 60, speed: 99, technique: 80 },
    signatureMoves: [
      "Validator Volley",
      "Outage Recovery",
      "Memecoin Mosh",
      "Lightning Combo",
    ],
  },
  {
    id: "trickster",
    name: "The Trickster",
    archetype: "Meme Brawler",
    tagline: "Much fight. Very brawl. Wow.",
    portrait: "/fighters/trickster.png",
    color: "#F59E0B",
    glowClass: "glow-yellow",
    stats: { power: 65, speed: 88, technique: 50 },
    signatureMoves: [
      "Shibe Smash",
      "Elon Tweet Storm",
      "To-the-Moon Uppercut",
      "Tip Jar Throw",
    ],
  },
  {
    id: "operator",
    name: "The Operator",
    archetype: "Tactical Agent",
    tagline: "Settles disputes in under three seconds.",
    portrait: "/fighters/operator.png",
    color: "#94A3B8",
    glowClass: "glow-blue",
    stats: { power: 75, speed: 80, technique: 90 },
    signatureMoves: [
      "Cross-Border Combo",
      "Briefcase Counter",
      "Settlement Slam",
      "Liquidity Lock",
    ],
  },
  {
    id: "sage",
    name: "The Sage",
    archetype: "Methodical Scholar",
    tagline: "Peer-reviewed every punch.",
    portrait: "/fighters/sage.png",
    color: "#8B5CF6",
    glowClass: "glow-magenta",
    stats: { power: 68, speed: 60, technique: 96 },
    signatureMoves: [
      "Ouroboros Bind",
      "Plutus Trap",
      "Hoskinson Hook",
      "Roadmap Roundhouse",
    ],
  },
  {
    id: "tycoon",
    name: "The Tycoon",
    archetype: "House Fighter",
    tagline: "Always takes a cut.",
    portrait: "/fighters/tycoon.png",
    color: "#EAB308",
    glowClass: "glow-yellow",
    stats: { power: 82, speed: 70, technique: 78 },
    signatureMoves: [
      "Launchpad Liftoff",
      "Burn Quarterly",
      "Bombardment Combo",
      "CZ Cross",
    ],
  },
  {
    id: "oracle",
    name: "The Oracle",
    archetype: "Support Mystic",
    tagline: "Feeds you truth, and pain.",
    portrait: "/fighters/oracle.png",
    color: "#14B8A6",
    glowClass: "glow-green",
    stats: { power: 70, speed: 65, technique: 92 },
    signatureMoves: [
      "Oracle Feed",
      "VRF Random Strike",
      "CCIP Tunnel",
      "Hex Pendant Slam",
    ],
  },
];

export function getFighter(id: string | null | undefined): Fighter | undefined {
  if (!id) return undefined;
  return FIGHTER_ROSTER.find((f) => f.id === id);
}
