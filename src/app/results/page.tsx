"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFighter, type Fighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import {
  SETTLED_KEY,
  computeWalletDelta,
  getWallet,
  setWallet,
} from "@/lib/match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FighterPortrait, FighterBadge } from "@/components/fighter-portrait";

export default function ResultsPage() {
  const router = useRouter();
  const { state, role, hydrated, send } = useMatch();

  const p1 = getFighter(state.p1.fighterId);
  const p2 = getFighter(state.p2.fighterId);
  const p1Token = state.p1.tokenName;
  const p2Token = state.p2.tokenName;
  const total = state.votes.p1 + state.votes.p2;
  const p1Pct = total > 0 ? Math.round((state.votes.p1 / total) * 100) : 50;
  const p2Pct = 100 - p1Pct;
  const pot = state.wager.p1.amount + state.wager.p2.amount;

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
  const winnerToken =
    state.winner === "p1" ? p1Token : state.winner === "p2" ? p2Token : "";
  const winnerSide = state.winner === "p1" ? "left" : state.winner === "p2" ? "right" : null;

  const rematch = () => {
    send({ type: "RESET" });
    router.push("/");
  };

  return (
    <main className="arena-haze flex-1 flex items-center justify-center px-4 sm:px-6 py-12 overflow-hidden">
      <div className="w-full max-w-4xl space-y-8 text-center">
        {/* K.O. banner */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-arcade text-xs text-neon-yellow animate-flicker tracking-[0.5em]">
            ▷ FINAL ◁
          </p>
          {state.winner === "tie" ? (
            <h1 className="font-arcade text-4xl sm:text-6xl glow-magenta">DRAW</h1>
          ) : (
            <h1
              className={`font-arcade text-4xl sm:text-7xl leading-none ${
                winnerSide === "left" ? "glow-red" : "glow-blue"
              } text-chromatic-lg`}
            >
              {(winnerToken || winnerChar?.name)} WINS
            </h1>
          )}
          {state.winner !== "tie" && winnerChar && (
            <p className="font-terminal text-xl text-muted-foreground italic">
              &quot;{winnerChar.tagline}&quot;
            </p>
          )}
        </div>

        {/* Pot result */}
        {pot > 0 && (
          <div
            className={`relative rounded-md border-2 backdrop-blur-sm p-6 ${
              state.winner === "tie"
                ? "border-neon-magenta/50 bg-neon-magenta/[0.05]"
                : state.winner === role
                ? "border-neon-green ring-glow-green bg-neon-green/[0.06]"
                : "border-neon-red/40 bg-neon-red/[0.04]"
            }`}
          >
            <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
              POT · {pot} PXL
            </p>
            {role === "p1" || role === "p2" ? (
              <>
                <p
                  className={`font-arcade text-4xl sm:text-6xl mt-2 ${
                    delta > 0 ? "glow-green" : delta < 0 ? "glow-red" : "glow-yellow"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta} PXL
                </p>
                <p className="font-terminal text-lg text-muted-foreground mt-2">
                  {delta > 0
                    ? "💰 You took the pot."
                    : delta < 0
                    ? "💀 Wager forfeit."
                    : "🤝 Refunded — even match."}
                </p>
                {walletPost !== null && (
                  <p className="font-arcade text-[10px] text-muted-foreground mt-2 tracking-widest">
                    WALLET BALANCE · {walletPost} PXL
                  </p>
                )}
              </>
            ) : (
              <p className="font-terminal text-lg text-muted-foreground mt-1">
                Spectator view — no settlement.
              </p>
            )}
          </div>
        )}

        {/* Fighter score panels */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-5 items-center">
          <FighterTotal
            char={p1}
            token={p1Token}
            votes={state.votes.p1}
            pct={p1Pct}
            side="left"
            isWinner={state.winner === "p1"}
            isLoser={state.winner === "p2"}
            wager={state.wager.p1.amount}
          />
          <p className="font-arcade text-2xl sm:text-3xl text-muted-foreground">vs</p>
          <FighterTotal
            char={p2}
            token={p2Token}
            votes={state.votes.p2}
            pct={p2Pct}
            side="right"
            isWinner={state.winner === "p2"}
            isLoser={state.winner === "p1"}
            wager={state.wager.p2.amount}
          />
        </div>

        <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
          {total} TOTAL VOTES · {state.battle.posts.length} ARGUMENTS · MATCH {state.matchId}
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            onClick={rematch}
            className="font-arcade text-xs h-12 px-6 bg-neon-yellow/90 hover:bg-neon-yellow text-black shadow-[0_0_18px_rgba(255,230,0,0.5)]"
          >
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
            <summary className="font-arcade text-[10px] text-muted-foreground cursor-pointer tracking-widest hover:text-foreground">
              ▼ ROUND TRANSCRIPT ({state.battle.posts.length})
            </summary>
            <div className="mt-3 space-y-2">
              {state.battle.posts.map((p) => {
                const c = p.role === "p1" ? p1 : p2;
                return (
                  <div
                    key={p.id}
                    className={`flex gap-2 ${p.role === "p1" ? "" : "flex-row-reverse"}`}
                  >
                    {c && <FighterBadge fighter={c} size="sm" className="shrink-0" />}
                    <div
                      className={`flex-1 rounded border p-2 ${
                        p.role === "p1"
                          ? "border-neon-red/30 bg-neon-red/[0.04]"
                          : "border-neon-blue/30 bg-neon-blue/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-arcade text-[9px] text-muted-foreground">
                          {p.mode === "voice" ? "🎤" : "⌨"}
                        </span>
                        <span className="font-arcade text-[9px] text-muted-foreground">
                          {p.votes.total} VOTES
                        </span>
                      </div>
                      <p className="font-terminal text-base mt-1">{p.text}</p>
                    </div>
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
  token,
  votes,
  pct,
  side,
  isWinner,
  isLoser,
  wager,
}: {
  char: Fighter;
  token: string;
  votes: number;
  pct: number;
  side: "left" | "right";
  isWinner: boolean;
  isLoser: boolean;
  wager: number;
}) {
  const color = side === "left" ? "glow-red" : "glow-blue";
  const accent = side === "left" ? "text-neon-red" : "text-neon-blue";
  const ring = side === "left" ? "ring-glow-red" : "ring-glow-blue";
  const borderCls = side === "left" ? "border-neon-red" : "border-neon-blue";
  const bar = side === "left" ? "bg-neon-red" : "bg-neon-blue";

  return (
    <div
      className={`relative p-4 rounded-md border-2 backdrop-blur-sm ${
        isWinner
          ? `${borderCls} ${ring} bg-card/90`
          : isLoser
          ? "border-border bg-card/40 opacity-60 grayscale"
          : "border-border bg-card/70"
      }`}
    >
      {/* corner brackets only on winner */}
      {isWinner && (
        <>
          <span className={`absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 ${borderCls}`} />
          <span className={`absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 ${borderCls}`} />
          <span className={`absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 ${borderCls}`} />
          <span className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 ${borderCls}`} />
        </>
      )}

      <p className={`font-arcade text-[9px] ${accent} tracking-widest`}>
        {side === "left" ? "RED" : "BLUE"} CORNER
      </p>
      <div className="mt-2 flex justify-center">
        <FighterPortrait fighter={char} size="lg" corner={side === "left" ? "red" : "blue"} />
      </div>
      <p className={`font-arcade text-xl sm:text-2xl mt-2 ${color}`}>{token || char.name}</p>
      <p className="font-terminal text-base mt-1 truncate">{char.name}</p>
      <p className="font-arcade text-3xl sm:text-4xl mt-3 tabular-nums">{pct}%</p>

      <div className="mt-2 h-1.5 rounded bg-muted/60 overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>

      <p className="font-arcade text-[10px] text-muted-foreground mt-2">
        {votes} VOTE{votes === 1 ? "" : "S"}
      </p>
      <p className="font-arcade text-[10px] text-muted-foreground">
        WAGER {wager} PXL
      </p>
      {isWinner && (
        <Badge className="font-arcade text-[10px] mt-3 bg-neon-green text-black">
          ★ WINNER ★
        </Badge>
      )}
    </div>
  );
}
