"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCrypto } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SpectatePage() {
  const router = useRouter();
  const { state, role, claimRole } = useMatch();

  useEffect(() => {
    if (!role) claimRole("audience");
  }, [role, claimRole]);

  // Auto-route the spectator to the right place based on match phase
  useEffect(() => {
    if (state.phase === "battle") router.push("/battle");
    if (state.phase === "results") router.push("/results");
  }, [state.phase, router]);

  const p1 = state.p1.cryptoId ? getCrypto(state.p1.cryptoId) : null;
  const p2 = state.p2.cryptoId ? getCrypto(state.p2.cryptoId) : null;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <p className="font-arcade text-xs text-neon-green animate-flicker tracking-widest">
          SPECTATOR MODE
        </p>
        <h1 className="font-arcade text-2xl sm:text-3xl glow-green">CROWD VIEW</h1>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <CornerCard char={p1} side="left" label="P1" />
              <p className="font-arcade text-2xl text-muted-foreground">vs</p>
              <CornerCard char={p2} side="right" label="P2" />
            </div>
            <Badge variant="outline" className="font-arcade text-[10px]">
              PHASE: {state.phase.toUpperCase()}
            </Badge>
            <p className="font-terminal text-base text-muted-foreground">
              {state.phase === "lobby" && "Waiting for fighters to claim corners…"}
              {state.phase === "select" && "Fighters are picking their coins."}
              {state.phase === "vs" && "Get ready — battle starting!"}
              {state.phase === "battle" && "Battle in progress (you'll be moved automatically)."}
              {state.phase === "results" && "Match decided."}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="font-arcade text-xs"
          >
            ← LOBBY
          </Button>
        </div>
      </div>
    </main>
  );
}

function CornerCard({
  char,
  side,
  label,
}: {
  char: ReturnType<typeof getCrypto> | null | undefined;
  side: "left" | "right";
  label: string;
}) {
  const color = side === "left" ? "glow-red" : "glow-blue";
  return (
    <div
      className={`p-3 rounded-md border ${
        side === "left" ? "border-neon-red/40" : "border-neon-blue/40"
      }`}
    >
      <p className={`font-arcade text-xs ${color}`}>{label}</p>
      {char ? (
        <>
          <p className={`font-arcade text-xl mt-2 ${color}`}>{char.ticker}</p>
          <p className="font-terminal text-base text-muted-foreground truncate">{char.name}</p>
        </>
      ) : (
        <p className="font-terminal text-base text-muted-foreground mt-2 italic">…</p>
      )}
    </div>
  );
}
