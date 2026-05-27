"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCrypto } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import { Button } from "@/components/ui/button";
import { CryptoPortrait } from "@/components/crypto-portrait";

export default function VsPage() {
  const router = useRouter();
  const { state, role, send } = useMatch();

  const p1 = state.p1.cryptoId ? getCrypto(state.p1.cryptoId) : null;
  const p2 = state.p2.cryptoId ? getCrypto(state.p2.cryptoId) : null;

  useEffect(() => {
    if (state.phase === "battle") router.push("/battle");
  }, [state.phase, router]);

  // First fighter tab auto-starts after the reveal animation.
  useEffect(() => {
    if (role === "audience") return;
    if (state.phase !== "vs") return;
    const t = setTimeout(() => {
      send({ type: "START_BATTLE", at: Date.now() });
    }, 3500);
    return () => clearTimeout(t);
  }, [role, state.phase, send]);

  const pot = state.wager.p1.amount + state.wager.p2.amount;

  return (
    <main className="arena-grid flex-1 flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Shockwave rings */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="w-[140vmin] h-[140vmin] rounded-full border border-neon-yellow/20" />
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="w-[90vmin] h-[90vmin] rounded-full border border-neon-yellow/30 animate-pulse-glow" />
      </div>

      <div className="relative grid grid-cols-3 items-center gap-4 sm:gap-6 px-2 sm:px-6 max-w-6xl w-full animate-vs-zoom">
        <FighterColumn fighter={p1} side="left" />

        {/* VS badge */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
            ROUND 1
          </p>
          <p className="font-arcade text-7xl sm:text-9xl text-chromatic-lg animate-pulse-glow leading-none">
            VS
          </p>
          <p className="font-arcade text-xs text-neon-yellow animate-flicker tracking-widest">
            ▶ FIGHT! ◀
          </p>
          {pot > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded border border-neon-green/60 bg-neon-green/[0.08] font-arcade text-[10px] glow-green">
              💰 POT {pot} PXL
            </div>
          )}
        </div>

        <FighterColumn fighter={p2} side="right" />
      </div>

      {role !== "audience" && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <Button
            onClick={() => send({ type: "START_BATTLE", at: Date.now() })}
            variant="outline"
            className="font-arcade text-xs border-neon-green/60 hover:bg-neon-green/15 hover:text-neon-green"
          >
            SKIP INTRO →
          </Button>
        </div>
      )}
    </main>
  );
}

function FighterColumn({
  fighter,
  side,
}: {
  fighter: ReturnType<typeof getCrypto> | null | undefined;
  side: "left" | "right";
}) {
  const color = side === "left" ? "glow-red" : "glow-blue";
  const accent = side === "left" ? "text-neon-red" : "text-neon-blue";
  const ring = side === "left" ? "ring-glow-red" : "ring-glow-blue";
  const borderCls = side === "left" ? "border-neon-red" : "border-neon-blue";
  const bar = side === "left" ? "bg-neon-red" : "bg-neon-blue";
  const cornerLabel = side === "left" ? "RED CORNER" : "BLUE CORNER";

  if (!fighter) {
    return (
      <div className="aspect-square rounded-md bg-card border border-border flex items-center justify-center">
        <p className="font-arcade text-xs text-muted-foreground">…</p>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-md bg-card/80 backdrop-blur-sm border-2 ${borderCls} ${ring} p-4 sm:p-6 text-center`}
    >
      {/* corner brackets */}
      <span className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 ${borderCls}`} />
      <span className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 ${borderCls}`} />
      <span className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${borderCls}`} />
      <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 ${borderCls}`} />

      <p className={`font-arcade text-[10px] ${accent} tracking-widest`}>{cornerLabel}</p>
      <div className="mt-3 flex justify-center">
        <CryptoPortrait crypto={fighter} size="xl" corner={side === "left" ? "red" : "blue"} />
      </div>
      <p className={`font-arcade text-2xl sm:text-3xl mt-3 ${color}`}>{fighter.ticker}</p>
      <p className="font-terminal text-lg sm:text-xl mt-1">{fighter.name}</p>
      <p className="font-terminal text-sm text-muted-foreground italic mt-1">
        &quot;{fighter.tagline}&quot;
      </p>

      {/* archetype */}
      <p className={`font-arcade text-[9px] mt-3 ${accent}/80`}>
        {fighter.archetype.toUpperCase()}
      </p>

      {/* stats */}
      <div className="mt-3 space-y-1 text-left">
        <StatLine label="HODL" value={fighter.stats.hodl} bar={bar} />
        <StatLine label="HYPE" value={fighter.stats.hype} bar={bar} />
        <StatLine label="UTIL" value={fighter.stats.utility} bar={bar} />
      </div>
    </div>
  );
}

function StatLine({ label, value, bar }: { label: string; value: number; bar: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-arcade text-[9px] text-muted-foreground w-9">{label}</span>
      <div className="flex-1 h-1.5 rounded bg-muted/60 overflow-hidden">
        <div className={`h-full ${bar} transition-[width]`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-arcade text-[9px] w-6 text-right tabular-nums">{value}</span>
    </div>
  );
}
