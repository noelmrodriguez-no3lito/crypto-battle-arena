"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFighter, type Fighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArenaBackdrop, BroadcastTicker } from "@/components/broadcast";
import type { Phase } from "@/lib/match";

const PHASES: { key: Phase; label: string }[] = [
  { key: "lobby", label: "LOBBY" },
  { key: "select", label: "SELECT" },
  { key: "stakes", label: "STAKES" },
  { key: "vs", label: "VS" },
  { key: "battle", label: "BATTLE" },
  { key: "results", label: "RESULT" },
];

const STATUS_COPY: Record<Phase, string> = {
  lobby: "Stand by — fighters claiming corners…",
  select: "Fighters picking and naming their coins.",
  stakes: "Wagers being placed. Pot building.",
  vs: "Cold open running — fight starting.",
  battle: "Live fight in progress (auto-cut to feed).",
  results: "Match decided. Tallying the crowd.",
};

export default function SpectatePage() {
  const router = useRouter();
  const { state, role, claimRole } = useMatch();

  useEffect(() => {
    if (!role) claimRole("audience");
  }, [role, claimRole]);

  useEffect(() => {
    if (state.phase === "battle") router.push("/battle");
    if (state.phase === "results") router.push("/results");
  }, [state.phase, router]);

  const p1 = getFighter(state.p1.fighterId);
  const p2 = getFighter(state.p2.fighterId);
  const pot = state.wager.p1.amount + state.wager.p2.amount;
  const wagersLocked = state.wager.p1.locked && state.wager.p2.locked;
  const currentPhaseIdx = PHASES.findIndex((p) => p.key === state.phase);

  return (
    <main className="relative flex-1 flex flex-col overflow-hidden">
      <ArenaBackdrop variant="dim" />

      {/* TOP RIBBON: ON AIR + phase indicator */}
      <header className="flex items-center justify-between px-4 sm:px-6 pt-4 gap-3 flex-wrap">
        <div className="inline-flex items-center gap-2">
          <span className="px-2 py-0.5 bg-neon-red text-white font-arcade text-[10px] tracking-widest animate-pulse-glow">
            ● ON AIR
          </span>
          <span className="font-arcade text-[10px] text-muted-foreground tracking-widest">
            CROWD VIEW · MATCH {state.matchId}
          </span>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="font-arcade text-[10px] text-neon-green animate-flicker tracking-widest">
            ◉ {state.audienceCount > 0 ? `${state.audienceCount} VIEWERS` : "STANDBY"}
          </span>
        </div>
      </header>

      {/* HEADLINE */}
      <div className="text-center pt-4 sm:pt-6 px-4">
        <h1 className="font-arcade text-3xl sm:text-5xl glow-green text-chromatic">CROWD VIEW</h1>
        <p className="font-terminal text-base text-muted-foreground mt-2 italic max-w-md mx-auto">
          {STATUS_COPY[state.phase]}
        </p>
      </div>

      {/* PHASE PROGRESS */}
      <div className="px-4 sm:px-8 mt-6">
        <ol className="grid grid-cols-6 gap-1 sm:gap-2">
          {PHASES.map((p, i) => {
            const isPast = i < currentPhaseIdx;
            const isCurrent = i === currentPhaseIdx;
            return (
              <li key={p.key} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-full h-1.5 rounded ${
                    isCurrent ? "bg-neon-green animate-pulse-glow" : isPast ? "bg-neon-green/60" : "bg-muted/60"
                  }`}
                />
                <span
                  className={`font-arcade text-[9px] tracking-widest text-center ${
                    isCurrent ? "glow-green" : isPast ? "text-foreground/70" : "text-muted-foreground/50"
                  }`}
                >
                  {p.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* MATCHUP — broadcast nameplate style */}
      <section className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-5 items-center px-4 sm:px-8 py-6 sm:py-8 min-h-0">
        <FeedNameplate fighter={p1} token={state.p1.tokenName} ready={state.p1.ready} wager={state.wager.p1.amount} locked={state.wager.p1.locked} side="left" showWager={state.phase !== "lobby" && state.phase !== "select"} />

        <div className="flex flex-col items-center gap-3">
          <p className="font-arcade text-4xl sm:text-5xl text-muted-foreground">VS</p>
          {pot > 0 && (
            <div
              className={`px-3 py-1 rounded border font-arcade text-[10px] tracking-widest ${
                wagersLocked ? "border-neon-green/60 glow-green" : "border-neon-yellow/60 glow-yellow"
              }`}
            >
              POT · {pot}
            </div>
          )}
          <Badge variant="outline" className="font-arcade text-[10px] border-foreground/30">
            PHASE: {state.phase.toUpperCase()}
          </Badge>
        </div>

        <FeedNameplate fighter={p2} token={state.p2.tokenName} ready={state.p2.ready} wager={state.wager.p2.amount} locked={state.wager.p2.locked} side="right" showWager={state.phase !== "lobby" && state.phase !== "select"} />
      </section>

      <div className="flex gap-3 justify-center px-4 pb-3">
        <Button onClick={() => router.push("/")} variant="outline" className="font-arcade text-xs h-10 px-5">
          ← LOBBY
        </Button>
        {state.phase === "battle" && (
          <Button
            onClick={() => router.push("/battle")}
            className="font-arcade text-xs h-10 px-5 bg-neon-green/90 hover:bg-neon-green text-black shadow-[0_0_18px_rgba(57,255,122,0.5)]"
          >
            CUT TO FIGHT →
          </Button>
        )}
      </div>

      <BroadcastTicker
        items={[
          `LIVE · MATCH ${state.matchId}`,
          state.p1.fighterId && state.p1.tokenName ? `P1 · ${state.p1.tokenName}` : "P1 STILL CONFIGURING",
          state.p2.fighterId && state.p2.tokenName ? `P2 · ${state.p2.tokenName}` : "P2 STILL CONFIGURING",
          pot > 0 ? `POT · ${pot} PXL` : "NO POT YET",
          `PHASE · ${state.phase.toUpperCase()}`,
        ]}
        accent="green"
      />
    </main>
  );
}

function FeedNameplate({
  fighter,
  token,
  ready,
  wager,
  locked,
  side,
  showWager,
}: {
  fighter: Fighter | null | undefined;
  token: string;
  ready: boolean;
  wager: number;
  locked: boolean;
  side: "left" | "right";
  showWager: boolean;
}) {
  const accent = side === "left" ? "text-neon-red" : "text-neon-blue";
  const accentBg = side === "left" ? "bg-neon-red" : "bg-neon-blue";
  const borderCls = side === "left" ? "border-neon-red/60" : "border-neon-blue/60";
  const glow = side === "left" ? "glow-red" : "glow-blue";

  return (
    <div className={`relative rounded-md border-2 ${borderCls} bg-card/60 overflow-hidden`}>
      <div className={`${accentBg} text-black font-arcade text-[9px] tracking-widest px-2 py-1`}>
        {side === "left" ? "RED CORNER · P1" : "BLUE CORNER · P2"}
      </div>

      {fighter ? (
        <div className="grid grid-cols-[1fr_1.1fr] gap-0">
          <div
            className="relative aspect-square"
            style={{ background: `radial-gradient(circle, ${fighter.color}55, transparent 70%)` }}
          >
            <Image src={fighter.portrait} alt={fighter.name} fill sizes="240px" className="object-contain" />
          </div>
          <div className="p-3 flex flex-col justify-center gap-1">
            <p className={`font-arcade text-xl sm:text-2xl ${glow} leading-none`}>
              {token || fighter.name.toUpperCase()}
            </p>
            <p className="font-terminal text-sm text-muted-foreground truncate">{fighter.name}</p>
            <p className="font-terminal text-xs text-muted-foreground/80 italic truncate">
              {fighter.tagline}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {ready && (
                <Badge variant="outline" className={`font-arcade text-[9px] ${accent}`}>
                  READY
                </Badge>
              )}
              {showWager && (
                <Badge
                  variant="outline"
                  className={`font-arcade text-[9px] ${locked ? "border-neon-green/60 text-neon-green" : "text-muted-foreground"}`}
                >
                  {locked ? "✓" : "…"} {wager} PXL
                </Badge>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid place-items-center aspect-[2/1] p-4">
          <p className="font-arcade text-base text-muted-foreground/40 animate-flicker">
            FIGHTER PENDING
          </p>
        </div>
      )}
    </div>
  );
}
