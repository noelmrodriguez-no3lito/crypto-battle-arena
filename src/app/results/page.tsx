"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { ArenaBackdrop, BroadcastTicker, PotTransfer } from "@/components/broadcast";

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
  const [showPotTransfer, setShowPotTransfer] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowPotTransfer(false), 2000);
    return () => clearTimeout(t);
  }, []);

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

  // Match stats — most-voted post, biggest swing turn
  const stats = useMemo(() => {
    const posts = state.battle.posts;
    if (posts.length === 0) return null;
    const sorted = [...posts].sort((a, b) => b.votes.total - a.votes.total);
    const topPost = sorted[0];
    let biggestSwing = 0;
    for (const p of posts) {
      if (p.votes.total > biggestSwing) biggestSwing = p.votes.total;
    }
    return { topPost, biggestSwing };
  }, [state.battle.posts]);

  if (!p1 || !p2) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-terminal text-xl">No match data.</p>
      </main>
    );
  }

  const winnerChar = state.winner === "p1" ? p1 : state.winner === "p2" ? p2 : null;
  const loserChar = state.winner === "p1" ? p2 : state.winner === "p2" ? p1 : null;
  const winnerToken =
    state.winner === "p1" ? p1Token : state.winner === "p2" ? p2Token : "";
  const winnerSide: "left" | "right" | null =
    state.winner === "p1" ? "left" : state.winner === "p2" ? "right" : null;

  const rematch = () => {
    send({ type: "RESET" });
    router.push("/");
  };

  return (
    <main className="relative flex-1 flex flex-col overflow-hidden">
      <ArenaBackdrop />

      {/* TOP RIBBON: FINAL tag */}
      <header className="text-center pt-5 sm:pt-7 px-4">
        <p className="font-arcade text-[10px] text-neon-yellow animate-flicker tracking-[0.5em]">
          ▷ FINAL ◁
        </p>
        {state.winner === "tie" ? (
          <h1 className="font-arcade text-4xl sm:text-7xl glow-magenta mt-2 leading-none">DRAW</h1>
        ) : (
          <h1
            className={`font-arcade text-4xl sm:text-7xl mt-2 leading-none ${
              winnerSide === "left" ? "glow-red" : "glow-blue"
            } text-chromatic-lg`}
          >
            {winnerToken || winnerChar?.name} WINS
          </h1>
        )}
        {winnerChar && (
          <p className="font-terminal text-base sm:text-lg text-muted-foreground italic mt-2">
            &quot;{winnerChar.tagline}&quot;
          </p>
        )}
      </header>

      <section className="flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-6 px-4 sm:px-8 py-5 sm:py-8 items-stretch min-h-0">
        {/* LEFT: Winner pose + scorecard */}
        <div
          className="relative grid grid-cols-[1.2fr_1fr] gap-0 rounded-md border-2 overflow-hidden"
          style={{
            borderColor:
              winnerSide === "left"
                ? "var(--neon-red)"
                : winnerSide === "right"
                ? "var(--neon-blue)"
                : "var(--neon-magenta)",
          }}
        >
          {winnerChar ? (
            <div
              className="relative aspect-square"
              style={{ background: `radial-gradient(circle, ${winnerChar.color}55, transparent 70%)` }}
            >
              <Image
                src={winnerChar.portrait}
                alt={winnerChar.name}
                fill
                sizes="(min-width: 1024px) 400px, 50vw"
                className="object-contain"
                priority
              />
              {/* Sparkles */}
              <span className="absolute top-3 left-3 text-2xl animate-flicker">✦</span>
              <span className="absolute top-12 right-4 text-xl animate-flicker" style={{ animationDelay: "300ms" }}>✦</span>
              <span className="absolute bottom-5 left-8 text-base animate-flicker" style={{ animationDelay: "600ms" }}>✦</span>
            </div>
          ) : (
            <div className="aspect-square grid place-items-center bg-muted/30">
              <p className="font-arcade text-2xl glow-magenta">DRAW</p>
            </div>
          )}

          <div className="p-4 sm:p-5 bg-card/80 flex flex-col gap-3">
            {/* Pot delta with chip-fly animation overlay */}
            <div className="relative">
              <PotTransfer
                potAmount={pot}
                winnerSide={winnerSide}
                visible={showPotTransfer && pot > 0 && state.winner !== "tie"}
                onDone={() => setShowPotTransfer(false)}
              />
              <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
                PURSE
              </p>
              {role === "p1" || role === "p2" ? (
                <>
                  <p
                    className={`font-arcade text-3xl sm:text-4xl leading-none mt-1 ${
                      delta > 0 ? "glow-green" : delta < 0 ? "glow-red" : "glow-yellow"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta} PXL
                  </p>
                  <p className="font-terminal text-sm text-muted-foreground mt-1">
                    {delta > 0
                      ? "Pot delivered to your wallet."
                      : delta < 0
                      ? "Wager forfeit. Better luck next round."
                      : "Refunded — tie, no settlement."}
                  </p>
                  {walletPost !== null && (
                    <p className="font-arcade text-[10px] text-muted-foreground mt-1 tracking-widest">
                      WALLET · {walletPost} PXL
                    </p>
                  )}
                </>
              ) : (
                <p className="font-terminal text-sm text-muted-foreground mt-1">
                  Spectator view — no settlement.
                </p>
              )}
            </div>

            {/* Vote split */}
            <div className="space-y-1.5 mt-2">
              <ScoreRow side="left" token={p1Token} fighter={p1} pct={p1Pct} votes={state.votes.p1} wager={state.wager.p1.amount} isWinner={state.winner === "p1"} />
              <ScoreRow side="right" token={p2Token} fighter={p2} pct={p2Pct} votes={state.votes.p2} wager={state.wager.p2.amount} isWinner={state.winner === "p2"} />
            </div>

            {/* Match stats */}
            {stats && (
              <div className="mt-2 pt-3 border-t border-border/60 grid grid-cols-2 gap-3">
                <div>
                  <p className="font-arcade text-[9px] text-muted-foreground tracking-widest">TOP ARGUMENT</p>
                  <p className="font-arcade text-xl glow-yellow mt-0.5 tabular-nums">
                    {stats.topPost.votes.total} VOTES
                  </p>
                </div>
                <div>
                  <p className="font-arcade text-[9px] text-muted-foreground tracking-widest">TOTAL</p>
                  <p className="font-arcade text-xl mt-0.5 tabular-nums">
                    {state.battle.posts.length} POSTS
                  </p>
                </div>
              </div>
            )}

            <div className="mt-auto pt-3 flex gap-2">
              <Button
                onClick={rematch}
                className="flex-1 font-arcade text-xs h-11 bg-neon-yellow/90 hover:bg-neon-yellow text-black shadow-[0_0_18px_rgba(255,230,0,0.5)]"
              >
                ▶ NEW MATCH
              </Button>
              <Button
                onClick={() => router.push("/spectate")}
                variant="outline"
                className="font-arcade text-xs h-11 px-4"
              >
                REPLAY
              </Button>
            </div>
          </div>

          {/* Loser pose in small overlay */}
          {loserChar && (
            <div className="absolute bottom-3 left-3 w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden border border-border/60 bg-card/90 grayscale opacity-60">
              <Image src={loserChar.portrait} alt={loserChar.name} fill sizes="80px" className="object-contain" />
              <span className="absolute inset-x-0 bottom-0 text-center font-arcade text-[8px] text-muted-foreground bg-background/80 py-0.5">
                K.O.
              </span>
            </div>
          )}
        </div>

        {/* RIGHT: Top argument card + transcript */}
        <div className="flex flex-col gap-4 min-h-0">
          {stats && (
            <div className="rounded-md border-2 border-neon-yellow/40 bg-neon-yellow/[0.04] p-4">
              <p className="font-arcade text-[10px] text-neon-yellow tracking-widest">
                ★ KNOCKOUT QUOTE
              </p>
              <p className="font-terminal text-lg sm:text-xl mt-2 leading-snug">
                &ldquo;{stats.topPost.text}&rdquo;
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`font-arcade text-[10px] tracking-widest ${stats.topPost.role === "p1" ? "glow-red" : "glow-blue"}`}>
                  {stats.topPost.role === "p1" ? p1Token : p2Token}
                </span>
                <span className="font-arcade text-[10px] text-muted-foreground">
                  {stats.topPost.votes.total} VOTES
                </span>
              </div>
            </div>
          )}

          {/* TRANSCRIPT — promoted, scrollable */}
          {state.battle.posts.length > 0 && (
            <div className="rounded-md border border-border bg-card/60 flex flex-col min-h-0">
              <p className="font-arcade text-[10px] text-muted-foreground tracking-widest px-4 pt-3 pb-2 border-b border-border/60">
                ▾ ROUND TRANSCRIPT · {state.battle.posts.length}
              </p>
              <div className="overflow-y-auto p-3 space-y-2 min-h-0">
                {state.battle.posts.map((p) => {
                  const c = p.role === "p1" ? p1 : p2;
                  const t = p.role === "p1" ? p1Token : p2Token;
                  return (
                    <div
                      key={p.id}
                      className={`flex gap-2 ${p.role === "p1" ? "" : "flex-row-reverse"}`}
                    >
                      <div
                        className="relative w-8 h-8 rounded-sm overflow-hidden flex-shrink-0 border border-foreground/30"
                        style={{
                          background: `radial-gradient(circle, ${c.color}55, transparent 70%)`,
                        }}
                      >
                        <Image src={c.portrait} alt={c.name} fill sizes="32px" className="object-contain" />
                      </div>
                      <div
                        className={`flex-1 rounded border p-2 ${
                          p.role === "p1" ? "border-neon-red/30 bg-neon-red/[0.04]" : "border-neon-blue/30 bg-neon-blue/[0.04]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-arcade text-[10px] ${
                              p.role === "p1" ? "glow-red" : "glow-blue"
                            }`}
                          >
                            {t || c.name}
                          </span>
                          <span className="font-arcade text-[9px] text-muted-foreground">
                            {p.mode === "voice" ? "🎤" : "⌨"} · {p.votes.total} VOTE{p.votes.total === 1 ? "" : "S"}
                          </span>
                        </div>
                        <p className="font-terminal text-sm mt-1">{p.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <BroadcastTicker
        items={[
          `MATCH ${state.matchId}`,
          `${total} TOTAL VOTES`,
          `${state.battle.posts.length} ARGUMENTS`,
          pot > 0 ? `POT · ${pot} PXL` : "NO POT",
          state.winner === "tie" ? "DRAW · POT REFUNDED" : `WINNER · ${winnerToken || winnerChar?.name}`,
        ]}
        accent="green"
      />
    </main>
  );
}

function ScoreRow({
  side,
  token,
  fighter,
  pct,
  votes,
  wager,
  isWinner,
}: {
  side: "left" | "right";
  token: string;
  fighter: Fighter;
  pct: number;
  votes: number;
  wager: number;
  isWinner: boolean;
}) {
  const accent = side === "left" ? "text-neon-red" : "text-neon-blue";
  const bar = side === "left" ? "bg-neon-red" : "bg-neon-blue";

  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
      <span className={`font-arcade text-xs ${accent} ${isWinner ? "" : "opacity-60"} truncate max-w-[110px]`}>
        {token || fighter.name}
      </span>
      <div className={`h-2 rounded bg-muted/60 overflow-hidden ${isWinner ? "" : "opacity-60"}`}>
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-arcade text-xs tabular-nums ${isWinner ? "" : "opacity-60"}`}>
        {pct}%
      </span>
      {isWinner && (
        <Badge className="col-span-3 font-arcade text-[9px] bg-neon-green/90 text-black w-fit">
          ★ WINNER · {votes} VOTES · WAGER {wager}
        </Badge>
      )}
    </div>
  );
}
