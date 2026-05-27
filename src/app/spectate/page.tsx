"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFighter, type Fighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FighterPortrait } from "@/components/fighter-portrait";
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
  lobby: "Waiting for fighters to claim corners…",
  select: "Fighters are picking their coins.",
  stakes: "Wagers being placed. Pot building.",
  vs: "Get ready — battle starting!",
  battle: "Battle in progress (you'll be moved automatically).",
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
    <main className="arena-haze flex-1 flex items-center justify-center px-4 sm:px-6 py-10 overflow-hidden">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <p className="font-arcade text-[11px] text-neon-green animate-flicker tracking-[0.4em]">
            ● SPECTATOR MODE ●
          </p>
          <h1 className="font-arcade text-3xl sm:text-5xl glow-green text-chromatic">
            CROWD VIEW
          </h1>
          <p className="font-terminal text-base text-muted-foreground">
            Match {state.matchId} · auto-routes when the fight starts.
          </p>
        </header>

        {/* Phase progress */}
        <div className="rounded-md border border-border bg-card/60 backdrop-blur-sm p-3 sm:p-4">
          <p className="font-arcade text-[10px] text-muted-foreground tracking-widest mb-3 text-center">
            MATCH PHASE
          </p>
          <ol className="grid grid-cols-6 gap-1 sm:gap-2">
            {PHASES.map((p, i) => {
              const isPast = i < currentPhaseIdx;
              const isCurrent = i === currentPhaseIdx;
              return (
                <li key={p.key} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full h-1.5 rounded ${
                      isCurrent
                        ? "bg-neon-green animate-pulse-glow"
                        : isPast
                        ? "bg-neon-green/60"
                        : "bg-muted/60"
                    }`}
                  />
                  <span
                    className={`font-arcade text-[9px] tracking-widest text-center ${
                      isCurrent
                        ? "glow-green"
                        : isPast
                        ? "text-foreground/70"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {p.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Matchup preview */}
        <div className="rounded-md border border-border bg-card/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3 sm:gap-5">
            <CornerCard
              char={p1}
              token={state.p1.tokenName}
              side="left"
              ready={state.p1.ready}
              wager={state.wager.p1.amount}
              wagerLocked={state.wager.p1.locked}
              showWager={state.phase === "stakes" || state.phase === "vs" || state.phase === "battle" || state.phase === "results"}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="font-arcade text-2xl sm:text-3xl text-muted-foreground">vs</p>
              {pot > 0 && (
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border font-arcade text-[10px] ${
                    wagersLocked
                      ? "border-neon-green/60 glow-green"
                      : "border-neon-yellow/60 glow-yellow"
                  }`}
                >
                  💰 {pot}
                </div>
              )}
            </div>
            <CornerCard
              char={p2}
              token={state.p2.tokenName}
              side="right"
              ready={state.p2.ready}
              wager={state.wager.p2.amount}
              wagerLocked={state.wager.p2.locked}
              showWager={state.phase === "stakes" || state.phase === "vs" || state.phase === "battle" || state.phase === "results"}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-border text-center space-y-2">
            <Badge variant="outline" className="font-arcade text-[10px] border-neon-green/40">
              PHASE: {state.phase.toUpperCase()}
            </Badge>
            <p className="font-terminal text-base text-muted-foreground animate-flicker">
              {STATUS_COPY[state.phase]}
            </p>
          </div>
        </div>

        {/* Back / actions */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="font-arcade text-xs h-11 px-5"
          >
            ← LOBBY
          </Button>
          {state.phase === "battle" && (
            <Button
              onClick={() => router.push("/battle")}
              className="font-arcade text-xs h-11 px-5 bg-neon-green/90 hover:bg-neon-green text-black shadow-[0_0_18px_rgba(57,255,122,0.5)]"
            >
              JOIN CROWD →
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function CornerCard({
  char,
  token,
  side,
  ready,
  wager,
  wagerLocked,
  showWager,
}: {
  char: Fighter | null | undefined;
  token: string;
  side: "left" | "right";
  ready: boolean;
  wager: number;
  wagerLocked: boolean;
  showWager: boolean;
}) {
  const color = side === "left" ? "glow-red" : "glow-blue";
  const accent = side === "left" ? "text-neon-red" : "text-neon-blue";
  const borderCls = side === "left" ? "border-neon-red/50" : "border-neon-blue/50";
  const cornerLabel = side === "left" ? "RED CORNER · P1" : "BLUE CORNER · P2";

  return (
    <div className={`relative rounded-md border-2 ${borderCls} bg-background/40 p-3 sm:p-4`}>
      <span className={`absolute top-0 ${side === "left" ? "left-0" : "right-0"} w-2.5 h-2.5 border-t-2 ${side === "left" ? "border-l-2" : "border-r-2"} ${borderCls}`} />
      <span className={`absolute bottom-0 ${side === "left" ? "right-0" : "left-0"} w-2.5 h-2.5 border-b-2 ${side === "left" ? "border-r-2" : "border-l-2"} ${borderCls}`} />

      <p className={`font-arcade text-[9px] ${accent} tracking-widest`}>{cornerLabel}</p>

      <div className="mt-2 flex justify-center">
        <FighterPortrait fighter={char} size="md" corner={side === "left" ? "red" : "blue"} />
      </div>

      {char ? (
        <>
          <p className={`font-arcade text-xl sm:text-2xl mt-2 ${color}`}>{token || char.name}</p>
          <p className="font-terminal text-base text-muted-foreground truncate">{char.name}</p>
          <p className="font-terminal text-sm text-muted-foreground/70 italic truncate mt-0.5">
            {char.tagline}
          </p>
        </>
      ) : (
        <>
          <p className="font-arcade text-base sm:text-lg mt-2 text-muted-foreground/40 animate-flicker">
            ???
          </p>
          <p className="font-terminal text-sm text-muted-foreground/70 italic mt-1">
            selecting…
          </p>
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {ready && (
          <Badge variant="outline" className={`font-arcade text-[9px] ${side === "left" ? "border-neon-red/70 text-neon-red" : "border-neon-blue/70 text-neon-blue"}`}>
            READY
          </Badge>
        )}
        {showWager && (
          <Badge
            variant="outline"
            className={`font-arcade text-[9px] ${
              wagerLocked
                ? "border-neon-green/60 text-neon-green"
                : "border-muted-foreground/40 text-muted-foreground"
            }`}
          >
            {wagerLocked ? "✓" : "…"} {wager} PXL
          </Badge>
        )}
      </div>
    </div>
  );
}
