"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMatch } from "@/lib/use-match";
import { getWallet, resetWallets } from "@/lib/match";
import { FIGHTER_ROSTER } from "@/data/fighters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArenaBackdrop, BroadcastTicker, FighterReel } from "@/components/broadcast";

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

  const tickerItems = [
    "TONIGHT 21:00 EST",
    "MAIN EVENT · 5 ROUNDS · 60s TURNS",
    "WINNER TAKES THE POT",
    "NEW FIGHTER: THE ORACLE · SEE ROSTER",
    `${FIGHTER_ROSTER.length} FIGHTERS ON THE CARD`,
    "INSERT COIN TO JOIN",
  ];

  return (
    <main className="relative flex-1 flex flex-col overflow-hidden">
      <ArenaBackdrop />

      <div className="flex-1 grid grid-rows-[auto_1fr_auto] min-h-0">
        {/* TOP: Event tag + roster reel */}
        <div className="pt-6 sm:pt-8 px-4 sm:px-8">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="font-arcade text-[10px] tracking-widest text-neon-yellow animate-flicker">
                ● ON THE CARD
              </span>
              <Badge variant="outline" className="font-arcade text-[10px] border-foreground/30">
                MATCH {state.matchId}
              </Badge>
              {role && (
                <Badge className="font-arcade text-[10px]">
                  YOU: {role.toUpperCase()}
                </Badge>
              )}
            </div>
            <Link
              href="/spectate"
              className="font-arcade text-[10px] text-muted-foreground hover:text-foreground tracking-widest"
            >
              SPECTATOR MODE →
            </Link>
          </div>
          <FighterReel fighters={FIGHTER_ROSTER} />
        </div>

        {/* CENTER: Hero + CTA, asymmetric */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 sm:gap-10 px-4 sm:px-8 py-8 sm:py-12 items-center">
          {/* LEFT: Title block */}
          <div className="space-y-4 sm:space-y-6">
            <p className="font-arcade text-[11px] text-neon-red tracking-[0.4em] animate-flicker">
              ▷ TONIGHT&apos;S MAIN EVENT ◁
            </p>
            <h1 className="font-arcade text-5xl sm:text-7xl md:text-8xl text-chromatic-lg leading-[0.92]">
              CRYPTO<br />BATTLE<br />ARENA
            </h1>
            <p className="font-terminal text-xl sm:text-2xl text-muted-foreground max-w-md">
              Pick a fighter. Defend your coin.{" "}
              <span className="text-neon-yellow font-bold">Win the crowd.</span>
            </p>
            <p className="font-arcade text-[10px] text-muted-foreground tracking-widest max-w-md">
              FIVE ROUNDS · TWO FIGHTERS · ONE POT · CROWD DECIDES
            </p>
          </div>

          {/* RIGHT: Role roster (asymmetric, no card-grid) */}
          <div className="space-y-3">
            <Button
              onClick={startFresh}
              className="w-full font-arcade text-sm h-16 bg-neon-red hover:bg-neon-red text-white shadow-[0_0_28px_rgba(255,45,85,0.65)]"
            >
              ▶ ENTER AS RED CORNER (P1)
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => joinAs("p2")}
                className="font-arcade text-xs h-12 rounded-md border-2 border-neon-blue/60 bg-neon-blue/[0.06] hover:bg-neon-blue/15 hover:border-neon-blue transition-all text-left px-3"
              >
                <span className="block text-neon-blue glow-blue">BLUE CORNER</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">JOIN AS P2</span>
              </button>
              <button
                onClick={() => joinAs("audience")}
                className="font-arcade text-xs h-12 rounded-md border-2 border-neon-green/60 bg-neon-green/[0.06] hover:bg-neon-green/15 hover:border-neon-green transition-all text-left px-3"
              >
                <span className="block text-neon-green glow-green">THE CROWD</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">VOTE LIVE</span>
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/60 text-[10px] font-arcade tracking-widest text-muted-foreground">
              <span>💰 P1 {wallets?.p1 ?? "—"} PXL</span>
              <span>·</span>
              <span>💰 P2 {wallets?.p2 ?? "—"} PXL</span>
              <button
                onClick={onResetWallets}
                className="text-muted-foreground/70 hover:text-foreground/90"
                title="Reset both wallets to 100 PXL"
              >
                ⟲
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM: live ticker */}
        <BroadcastTicker items={tickerItems} accent="yellow" className="mt-auto" />
      </div>
    </main>
  );
}
