"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCrypto } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import { Button } from "@/components/ui/button";

export default function VsPage() {
  const router = useRouter();
  const { state, role, send } = useMatch();

  const p1 = state.p1.cryptoId ? getCrypto(state.p1.cryptoId) : null;
  const p2 = state.p2.cryptoId ? getCrypto(state.p2.cryptoId) : null;

  useEffect(() => {
    if (state.phase === "battle") router.push("/battle");
  }, [state.phase, router]);

  // The first tab to land on VS auto-starts after the reveal animation,
  // unless we're spectating (audience).
  useEffect(() => {
    if (role === "audience") return;
    if (state.phase !== "vs") return;
    const t = setTimeout(() => {
      send({ type: "START_BATTLE", at: Date.now() });
    }, 3500);
    return () => clearTimeout(t);
  }, [role, state.phase, send]);

  return (
    <main className="flex-1 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,45,85,0.18)_0%,rgba(45,140,255,0.18)_100%)] pointer-events-none" />

      <div className="relative grid grid-cols-3 items-center gap-6 px-6 max-w-5xl w-full animate-vs-zoom">
        {/* P1 portrait */}
        <FighterColumn fighter={p1} side="left" />

        {/* VS badge */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-arcade text-7xl sm:text-9xl glow-yellow animate-pulse-glow">VS</p>
          <p className="font-arcade text-xs text-neon-yellow animate-flicker">
            ROUND 1 · FIGHT!
          </p>
        </div>

        {/* P2 portrait */}
        <FighterColumn fighter={p2} side="right" />
      </div>

      {role !== "audience" && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <Button
            onClick={() => send({ type: "START_BATTLE", at: Date.now() })}
            variant="outline"
            className="font-arcade text-xs border-neon-green/60 hover:bg-neon-green/10"
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
  const ring = side === "left" ? "ring-glow-red" : "ring-glow-blue";

  if (!fighter) {
    return (
      <div className="aspect-square rounded-md bg-card border border-border flex items-center justify-center">
        <p className="font-arcade text-xs text-muted-foreground">…</p>
      </div>
    );
  }

  return (
    <div className={`aspect-square rounded-md bg-card border-2 ${ring} ${side === "left" ? "border-neon-red" : "border-neon-blue"} flex flex-col items-center justify-center p-4 text-center`}>
      <p className={`font-arcade text-2xl sm:text-4xl ${color}`}>{fighter.ticker}</p>
      <p className="font-terminal text-lg mt-2">{fighter.name}</p>
      <p className="font-terminal text-sm text-muted-foreground italic mt-1">
        &quot;{fighter.tagline}&quot;
      </p>
    </div>
  );
}
