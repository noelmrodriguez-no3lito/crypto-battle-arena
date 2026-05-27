"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMatch } from "@/lib/use-match";
import { getWallet, resetWallets } from "@/lib/match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LobbyPage() {
  const router = useRouter();
  const { state, role, hydrated, claimRole, send } = useMatch();
  const [wallets, setWallets] = useState<{ p1: number; p2: number } | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    setWallets({ p1: getWallet("p1"), p2: getWallet("p2") });
  }, [hydrated, state.matchId, state.phase]);

  const joinAs = (r: "p1" | "p2" | "audience") => {
    claimRole(r);
    if (r === "audience") {
      router.push(state.phase === "battle" ? "/battle" : "/spectate");
    } else {
      router.push("/select");
    }
  };

  const startFresh = () => {
    send({ type: "RESET" });
    claimRole("p1");
    router.push("/select");
  };

  const onResetWallets = () => {
    resetWallets();
    setWallets({ p1: 100, p2: 100 });
  };

  return (
    <main className="arena-grid flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 overflow-hidden">
      {/* Top marquee ticker */}
      <div className="absolute top-0 inset-x-0 border-y border-neon-yellow/40 bg-background/80 backdrop-blur-sm overflow-hidden">
        <div className="marquee-track py-1 font-arcade text-[10px] text-neon-yellow/90 tracking-widest">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-12">
              <span>◆ BTC vs ETH ◆ SOL vs DOGE ◆ XRP vs ADA ◆ BNB vs LINK ◆</span>
              <span>● INSERT COIN ● PICK YOUR COIN ● WIN THE CROWD ●</span>
              <span>★ PXL WAGERS LIVE ★ WINNER TAKES ALL ★</span>
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-12 pt-10">
        {/* HERO */}
        <header className="text-center space-y-5">
          <p className="font-arcade text-[11px] text-neon-yellow animate-flicker tracking-[0.4em]">
            ▷  INSERT COIN  ◁
          </p>
          <h1 className="font-arcade text-4xl sm:text-6xl md:text-7xl leading-[0.95] text-chromatic-lg">
            CRYPTO<br />BATTLE<br />ARENA
          </h1>
          <p className="font-terminal text-xl sm:text-2xl text-muted-foreground max-w-md mx-auto">
            Pick your coin. State your point. <span className="text-neon-yellow">Win the crowd.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Badge variant="outline" className="font-arcade text-[10px] border-foreground/30">
              MATCH {state.matchId}
            </Badge>
            {role && (
              <Badge className="font-arcade text-[10px]">
                YOU: {role.toUpperCase()}
              </Badge>
            )}
            {state.phase !== "lobby" && (
              <Badge variant="secondary" className="font-arcade text-[10px]">
                PHASE: {state.phase.toUpperCase()}
              </Badge>
            )}
          </div>
        </header>

        {/* PRIMARY CTA */}
        <div className="mx-auto max-w-md">
          <div className="relative rounded-md border border-neon-red/50 bg-card/80 backdrop-blur-sm p-5 ring-glow-red">
            <div className="flex items-center justify-between">
              <p className="font-arcade text-[10px] text-neon-yellow tracking-widest">
                ▶ QUICK START
              </p>
              <span className="font-arcade text-[9px] text-muted-foreground">P1 SEAT</span>
            </div>
            <p className="font-terminal text-lg text-muted-foreground mt-2 mb-4">
              Open this page in <span className="text-foreground font-bold">three tabs</span>.
              Pick P1, P2, and Audience. Fight starts when both are ready.
            </p>
            <Button
              onClick={startFresh}
              className="w-full font-arcade text-sm h-14 bg-neon-red/90 hover:bg-neon-red text-white shadow-[0_0_24px_rgba(255,45,85,0.55)]"
            >
              ▶ NEW MATCH
            </Button>
          </div>
        </div>

        {/* CHARACTER SELECT PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CornerPanel
            corner="red"
            label="PLAYER 1"
            tagline="Red corner. Pick a coin to represent."
            wallet={wallets?.p1}
            cta="JOIN AS P1"
            onJoin={() => joinAs("p1")}
            symbol="◤"
          />
          <CornerPanel
            corner="blue"
            label="PLAYER 2"
            tagline="Blue corner. Pick a coin to represent."
            wallet={wallets?.p2}
            cta="JOIN AS P2"
            onJoin={() => joinAs("p2")}
            symbol="◥"
          />
          <CornerPanel
            corner="green"
            label="AUDIENCE"
            tagline="Watch the fight. Vote each round."
            cta="JOIN AS CROWD"
            onJoin={() => joinAs("audience")}
            symbol="◆"
          />
        </div>

        <footer className="text-center space-y-3 font-terminal text-base text-muted-foreground/70 pb-2">
          <Link href="/spectate" className="hover:text-foreground underline-offset-4 hover:underline block">
            Just want to spectate? →
          </Link>
          <button
            onClick={onResetWallets}
            className="font-arcade text-[10px] text-muted-foreground/60 hover:text-foreground/80 tracking-widest"
          >
            ⟲ RESET WALLETS TO 100 PXL
          </button>
        </footer>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------------- */

type Corner = "red" | "blue" | "green";

const CORNER_STYLES: Record<
  Corner,
  {
    border: string;
    hover: string;
    glow: string;
    ring: string;
    bg: string;
    chip: string;
    portrait: string;
  }
> = {
  red: {
    border: "border-neon-red/50",
    hover: "hover:border-neon-red hover:ring-glow-red",
    glow: "glow-red",
    ring: "ring-glow-red",
    bg: "bg-gradient-to-b from-neon-red/[0.07] to-transparent",
    chip: "border-neon-red/60 text-neon-red",
    portrait: "from-neon-red/30 to-transparent",
  },
  blue: {
    border: "border-neon-blue/50",
    hover: "hover:border-neon-blue hover:ring-glow-blue",
    glow: "glow-blue",
    ring: "ring-glow-blue",
    bg: "bg-gradient-to-b from-neon-blue/[0.07] to-transparent",
    chip: "border-neon-blue/60 text-neon-blue",
    portrait: "from-neon-blue/30 to-transparent",
  },
  green: {
    border: "border-neon-green/50",
    hover: "hover:border-neon-green hover:ring-glow-green",
    glow: "glow-green",
    ring: "ring-glow-green",
    bg: "bg-gradient-to-b from-neon-green/[0.07] to-transparent",
    chip: "border-neon-green/60 text-neon-green",
    portrait: "from-neon-green/30 to-transparent",
  },
};

function CornerPanel({
  corner,
  label,
  tagline,
  wallet,
  cta,
  onJoin,
  symbol,
}: {
  corner: Corner;
  label: string;
  tagline: string;
  wallet?: number;
  cta: string;
  onJoin: () => void;
  symbol: string;
}) {
  const s = CORNER_STYLES[corner];
  return (
    <button
      onClick={onJoin}
      className={`group relative text-left rounded-md border-2 ${s.border} ${s.bg} ${s.hover} transition-all overflow-hidden`}
    >
      {/* Corner-flag stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${corner === "red" ? "bg-neon-red" : corner === "blue" ? "bg-neon-blue" : "bg-neon-green"} opacity-80`} />

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className={`font-arcade text-xs ${s.glow}`}>{label}</p>
          <span className={`font-arcade text-2xl ${s.glow} opacity-80`}>{symbol}</span>
        </div>

        {/* Portrait placeholder — silhouette block */}
        <div className={`relative aspect-[5/3] rounded-sm border border-border bg-gradient-to-b ${s.portrait} flex items-center justify-center overflow-hidden`}>
          <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(90deg,transparent_0,transparent_6px,rgba(255,255,255,0.05)_6px,rgba(255,255,255,0.05)_7px)]" />
          <p className={`font-arcade text-4xl sm:text-5xl ${s.glow} opacity-70`}>{symbol}</p>
        </div>

        <p className="font-terminal text-base text-muted-foreground leading-snug">
          {tagline}
        </p>

        {typeof wallet === "number" && (
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${s.chip} font-arcade text-[10px]`}>
            💰 {wallet} PXL
          </div>
        )}

        <div
          className={`w-full text-center font-arcade text-xs h-11 leading-[2.75rem] rounded border ${s.border} group-hover:bg-foreground/5 transition-colors`}
        >
          {cta} →
        </div>
      </div>
    </button>
  );
}
