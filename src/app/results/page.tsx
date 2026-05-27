"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCrypto } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import {
  SETTLED_KEY,
  computeWalletDelta,
  getWallet,
  setWallet,
} from "@/lib/match";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ResultsPage() {
  const router = useRouter();
  const { state, role, hydrated, send } = useMatch();

  const p1 = state.p1.cryptoId ? getCrypto(state.p1.cryptoId) : null;
  const p2 = state.p2.cryptoId ? getCrypto(state.p2.cryptoId) : null;
  const total = state.votes.p1 + state.votes.p2;
  const p1Pct = total > 0 ? Math.round((state.votes.p1 / total) * 100) : 50;
  const p2Pct = 100 - p1Pct;
  const pot = state.wager.p1.amount + state.wager.p2.amount;

  // Settle the wallet exactly once per (matchId, role)
  const [walletPost, setWalletPost] = useState<number | null>(null);
  const [delta, setDelta] = useState<number>(0);

  useEffect(() => {
    if (!hydrated) return;
    if (state.phase !== "results" || !state.winner) return;
    if (role !== "p1" && role !== "p2") return;

    const key = SETTLED_KEY(state.matchId, role);
    if (localStorage.getItem(key)) {
      setWalletPost(getWallet(role));
      return;
    }

    const d = computeWalletDelta(state, role);
    const before = getWallet(role);
    const after = Math.max(0, before + d);
    setWallet(role, after);
    localStorage.setItem(key, "1");

    setWalletPost(after);
    setDelta(d);
  }, [hydrated, state, role]);

  if (!p1 || !p2) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-terminal text-xl">No match data.</p>
      </main>
    );
  }

  const winnerChar =
    state.winner === "p1" ? p1 : state.winner === "p2" ? p2 : null;
  const winnerSide = state.winner === "p1" ? "left" : state.winner === "p2" ? "right" : null;

  const rematch = () => {
    send({ type: "RESET" });
    router.push("/");
  };

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-8 text-center">
        <p className="font-arcade text-xs text-neon-yellow animate-flicker tracking-widest">
          K.O.
        </p>

        {state.winner === "tie" ? (
          <h1 className="font-arcade text-3xl sm:text-5xl glow-magenta">DRAW</h1>
        ) : (
          <h1
            className={`font-arcade text-3xl sm:text-5xl ${
              winnerSide === "left" ? "glow-red" : "glow-blue"
            }`}
          >
            {winnerChar?.ticker} WINS
          </h1>
        )}

        {/* Pot result */}
        {pot > 0 && (
          <Card
            className={
              state.winner === "tie"
                ? "border-neon-magenta/40"
                : state.winner === role
                ? "border-neon-green ring-glow-green"
                : "border-neon-red/40"
            }
          >
            <CardContent className="p-6 space-y-2">
              <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
                POT · {pot} PXL
              </p>
              {role === "p1" || role === "p2" ? (
                <>
                  <p
                    className={`font-arcade text-3xl sm:text-4xl ${
                      delta > 0 ? "glow-green" : delta < 0 ? "glow-red" : "glow-yellow"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta} PXL
                  </p>
                  <p className="font-terminal text-lg text-muted-foreground">
                    {delta > 0
                      ? "💰 You took the pot."
                      : delta < 0
                      ? "💀 Wager forfeit."
                      : "🤝 Refunded — even match."}
                  </p>
                  {walletPost !== null && (
                    <p className="font-arcade text-[10px] text-muted-foreground">
                      WALLET: {walletPost} PXL
                    </p>
                  )}
                </>
              ) : (
                <p className="font-terminal text-lg text-muted-foreground">
                  Spectator view — no settlement.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-foreground/10">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 items-center">
              <FighterTotal
                char={p1}
                votes={state.votes.p1}
                pct={p1Pct}
                side="left"
                isWinner={state.winner === "p1"}
                wager={state.wager.p1.amount}
              />
              <p className="font-arcade text-2xl text-muted-foreground">vs</p>
              <FighterTotal
                char={p2}
                votes={state.votes.p2}
                pct={p2Pct}
                side="right"
                isWinner={state.winner === "p2"}
                wager={state.wager.p2.amount}
              />
            </div>
            <div className="pt-4">
              <p className="font-arcade text-[10px] text-muted-foreground">
                {total} TOTAL VOTES · {state.battle.posts.length} ARGUMENTS · MATCH {state.matchId}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={rematch} className="font-arcade text-xs h-12 px-6">
            ▶ NEW MATCH
          </Button>
          <Button
            onClick={() => router.push("/spectate")}
            variant="outline"
            className="font-arcade text-xs h-12 px-6"
          >
            REPLAY HUD
          </Button>
        </div>

        {state.battle.posts.length > 0 && (
          <details className="text-left mt-6">
            <summary className="font-arcade text-[10px] text-muted-foreground cursor-pointer">
              ▼ ROUND TRANSCRIPT ({state.battle.posts.length})
            </summary>
            <div className="mt-3 space-y-2">
              {state.battle.posts.map((p) => {
                const c = p.role === "p1" ? p1 : p2;
                return (
                  <div
                    key={p.id}
                    className={`rounded border p-2 ${
                      p.role === "p1"
                        ? "border-neon-red/30 bg-neon-red/[0.04]"
                        : "border-neon-blue/30 bg-neon-blue/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`font-arcade text-[9px] ${
                          p.role === "p1" ? "border-neon-red/60" : "border-neon-blue/60"
                        }`}
                      >
                        {c.ticker}
                      </Badge>
                      <span className="font-arcade text-[9px] text-muted-foreground">
                        {p.votes.total} VOTES
                      </span>
                    </div>
                    <p className="font-terminal text-base mt-1">{p.text}</p>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </main>
  );
}

function FighterTotal({
  char,
  votes,
  pct,
  side,
  isWinner,
  wager,
}: {
  char: NonNullable<ReturnType<typeof getCrypto>>;
  votes: number;
  pct: number;
  side: "left" | "right";
  isWinner: boolean;
  wager: number;
}) {
  const color = side === "left" ? "glow-red" : "glow-blue";
  return (
    <div
      className={`p-4 rounded-md border ${
        isWinner
          ? side === "left"
            ? "border-neon-red ring-glow-red"
            : "border-neon-blue ring-glow-blue"
          : "border-border opacity-70"
      }`}
    >
      <p className={`font-arcade text-2xl ${color}`}>{char.ticker}</p>
      <p className="font-terminal text-base mt-1 truncate">{char.name}</p>
      <p className="font-arcade text-2xl mt-2">{pct}%</p>
      <p className="font-arcade text-[10px] text-muted-foreground">
        {votes} VOTE{votes === 1 ? "" : "S"}
      </p>
      <p className="font-arcade text-[10px] text-muted-foreground mt-1">
        WAGER {wager} PXL
      </p>
      {isWinner && (
        <Badge className="font-arcade text-[10px] mt-2 bg-neon-green text-black">
          WINNER
        </Badge>
      )}
    </div>
  );
}
