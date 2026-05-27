"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CRYPTO_ROSTER, type CryptoCharacter } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function SelectPage() {
  const router = useRouter();
  const { state, role, send } = useMatch();

  // Spectators don't pick.
  useEffect(() => {
    if (role === "audience") router.push("/spectate");
  }, [role, router]);

  // When both fighters are ready, advance everyone to STAKES.
  useEffect(() => {
    if (state.p1.ready && state.p2.ready && state.phase === "select") {
      send({ type: "ENTER_STAKES" });
    }
  }, [state.p1.ready, state.p2.ready, state.phase, send]);

  // Once we move to stakes/vs, navigate.
  useEffect(() => {
    if (state.phase === "stakes") router.push("/stakes");
    if (state.phase === "vs") router.push("/vs");
  }, [state.phase, router]);

  const myPick = role === "p1" ? state.p1.cryptoId : role === "p2" ? state.p2.cryptoId : null;
  const opponentPick = role === "p1" ? state.p2.cryptoId : role === "p2" ? state.p1.cryptoId : null;
  const myReady = role === "p1" ? state.p1.ready : role === "p2" ? state.p2.ready : false;

  if (!role || role === "audience") {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-terminal text-xl">Loading…</p>
      </main>
    );
  }

  const pick = (c: CryptoCharacter) => {
    send({ type: "PICK_CRYPTO", role, cryptoId: c.id });
  };

  const toggleReady = () => {
    if (!myPick) return;
    send({ type: "READY", role, ready: !myReady });
  };

  return (
    <main className="flex-1 flex flex-col px-6 py-10 gap-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p
            className={`font-arcade text-xs ${role === "p1" ? "glow-red text-neon-red" : "glow-blue text-neon-blue"}`}
          >
            {role.toUpperCase()} — CHOOSE YOUR FIGHTER
          </p>
          <p className="font-terminal text-base text-muted-foreground mt-1">
            Match {state.matchId} · opponent {opponentPick ? "PICKED" : "selecting…"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {state.p1.ready && (
            <Badge variant="outline" className="font-arcade text-[10px] border-neon-red/60">
              P1 READY
            </Badge>
          )}
          {state.p2.ready && (
            <Badge variant="outline" className="font-arcade text-[10px] border-neon-blue/60">
              P2 READY
            </Badge>
          )}
          <Button
            onClick={toggleReady}
            disabled={!myPick}
            className={`font-arcade text-xs h-10 ${myReady ? "bg-neon-green/80 hover:bg-neon-green text-black" : ""}`}
          >
            {myReady ? "✓ READY" : "READY UP"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {CRYPTO_ROSTER.map((c) => {
          const taken = state.p1.cryptoId === c.id || state.p2.cryptoId === c.id;
          const mine = myPick === c.id;
          return (
            <button
              key={c.id}
              onClick={() => !taken || mine ? pick(c) : null}
              disabled={taken && !mine}
              className={`group relative text-left bg-card border rounded-md p-4 transition-all
                ${mine
                  ? role === "p1"
                    ? "border-neon-red ring-glow-red"
                    : "border-neon-blue ring-glow-blue"
                  : "border-border hover:border-foreground/40"}
                ${taken && !mine ? "opacity-30 cursor-not-allowed" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                <span className={`font-arcade text-sm ${c.glowClass}`}>{c.ticker}</span>
                {taken && (
                  <Badge variant="outline" className="font-arcade text-[9px]">
                    {state.p1.cryptoId === c.id ? "P1" : "P2"}
                  </Badge>
                )}
              </div>
              <p className="font-terminal text-base mt-2">{c.name}</p>
              <p className="font-terminal text-sm text-muted-foreground italic">{c.tagline}</p>
              <div className="mt-3 space-y-1.5">
                <StatBar label="HODL" value={c.stats.hodl} />
                <StatBar label="HYPE" value={c.stats.hype} />
                <StatBar label="UTIL" value={c.stats.utility} />
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-arcade text-[9px] text-muted-foreground w-10">{label}</span>
      <Progress value={value} className="h-1.5 flex-1" />
      <span className="font-arcade text-[9px] w-7 text-right">{value}</span>
    </div>
  );
}
