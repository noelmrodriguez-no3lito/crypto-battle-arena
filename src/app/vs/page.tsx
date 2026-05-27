"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFighter, type Fighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import { Button } from "@/components/ui/button";
import { ArenaBackdrop, LowerThird } from "@/components/broadcast";

export default function VsPage() {
  const router = useRouter();
  const { state, role, send } = useMatch();

  const p1 = getFighter(state.p1.fighterId);
  const p2 = getFighter(state.p2.fighterId);

  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);

  useEffect(() => {
    if (state.phase === "battle") router.push("/battle");
  }, [state.phase, router]);

  // Staggered cold-open entrances
  useEffect(() => {
    const t1 = setTimeout(() => setShowP1(true), 250);
    const t2 = setTimeout(() => setShowP2(true), 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Auto-START_BATTLE
  useEffect(() => {
    if (role === "audience") return;
    if (state.phase !== "vs") return;
    const t = setTimeout(() => send({ type: "START_BATTLE", at: Date.now() }), 3800);
    return () => clearTimeout(t);
  }, [role, state.phase, send]);

  const pot = state.wager.p1.amount + state.wager.p2.amount;

  return (
    <main className="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-8">
      <ArenaBackdrop />

      {/* Cinematic fighter portraits */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-10 w-full max-w-6xl">
        <FighterFrame fighter={p1} side="left" token={state.p1.tokenName} />

        <div className="flex flex-col items-center gap-2 animate-vs-zoom">
          <p className="font-arcade text-[10px] text-neon-yellow tracking-[0.5em] animate-flicker">
            MAIN EVENT
          </p>
          <p className="font-arcade text-7xl sm:text-9xl text-chromatic-lg animate-pulse-glow leading-none">
            VS
          </p>
          <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
            ROUND 1 OF {state.battle.rounds.max}
          </p>
          {pot > 0 && (
            <div className="mt-2 px-3 py-1 rounded border border-neon-green/60 bg-neon-green/[0.08] font-arcade text-[10px] glow-green">
              POT · {pot} PXL
            </div>
          )}
        </div>

        <FighterFrame fighter={p2} side="right" token={state.p2.tokenName} />
      </div>

      {/* Lower-thirds sliding in from edges, staggered */}
      <LowerThird fighter={p1} token={state.p1.tokenName} side="left" visible={showP1} variant="entering" />
      <LowerThird fighter={p2} token={state.p2.tokenName} side="right" visible={showP2} variant="entering" />

      {/* Skip intro */}
      {role !== "audience" && (
        <div className="absolute bottom-6 right-6">
          <Button
            onClick={() => send({ type: "START_BATTLE", at: Date.now() })}
            variant="outline"
            size="sm"
            className="font-arcade text-[10px] border-neon-green/60 hover:bg-neon-green/15 hover:text-neon-green tracking-widest"
          >
            SKIP INTRO →
          </Button>
        </div>
      )}

      <div className="absolute bottom-6 left-6 font-arcade text-[9px] text-muted-foreground tracking-widest">
        BROADCASTING LIVE · MATCH {state.matchId}
      </div>
    </main>
  );
}

function FighterFrame({
  fighter,
  side,
  token,
}: {
  fighter: Fighter | null | undefined;
  side: "left" | "right";
  token: string;
}) {
  if (!fighter) {
    return (
      <div className="aspect-square rounded-md bg-card border border-border flex items-center justify-center">
        <p className="font-arcade text-xs text-muted-foreground">…</p>
      </div>
    );
  }
  const borderCls = side === "left" ? "border-neon-red" : "border-neon-blue";
  const ring = side === "left" ? "ring-glow-red" : "ring-glow-blue";
  const glow = side === "left" ? "glow-red" : "glow-blue";

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto animate-vs-zoom">
      <div className={`absolute inset-0 rounded-md border-2 ${borderCls} ${ring} bg-card/40 overflow-hidden`}>
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${fighter.color}55 0%, transparent 75%)`,
          }}
        />
        <Image
          src={fighter.portrait}
          alt={fighter.name}
          fill
          sizes="(min-width: 768px) 380px, 60vw"
          className="object-contain"
          priority
        />
        {/* Corner brackets */}
        <span className={`absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 ${borderCls}`} />
        <span className={`absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 ${borderCls}`} />
        <span className={`absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 ${borderCls}`} />
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 ${borderCls}`} />
      </div>

      {/* Floating token badge */}
      <div
        className={`absolute -bottom-6 ${side === "left" ? "-right-6" : "-left-6"} px-3 py-1.5 rounded font-arcade text-2xl sm:text-3xl ${glow} bg-card/95 backdrop-blur-sm border-2 ${borderCls}`}
      >
        {token || fighter.name.toUpperCase()}
      </div>
    </div>
  );
}
