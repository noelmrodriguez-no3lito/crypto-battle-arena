"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCrypto } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import { WAGER_CHIPS, getWallet } from "@/lib/match";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StakesPage() {
  const router = useRouter();
  const { state, role, send, hydrated } = useMatch();

  // Spectators don't bet — push to spectate
  useEffect(() => {
    if (!hydrated) return;
    if (role === "audience" || role === null) {
      router.push("/spectate");
    }
  }, [hydrated, role, router]);

  // Once both wagers are locked AND matched → enter VS
  useEffect(() => {
    if (state.phase !== "stakes") return;
    if (
      state.wager.p1.locked &&
      state.wager.p2.locked &&
      state.wager.p1.amount === state.wager.p2.amount
    ) {
      send({ type: "ENTER_VS" });
    }
  }, [state.phase, state.wager, send]);

  useEffect(() => {
    if (state.phase === "vs") router.push("/vs");
  }, [state.phase, router]);

  const p1Char = state.p1.cryptoId ? getCrypto(state.p1.cryptoId) : null;
  const p2Char = state.p2.cryptoId ? getCrypto(state.p2.cryptoId) : null;

  // My wallet (read live each render via a memo on hydration changes)
  const myBalance = useMemo(() => {
    if (!hydrated || (role !== "p1" && role !== "p2")) return 0;
    return getWallet(role);
  }, [hydrated, role, state.matchId]);

  if (!hydrated || (role !== "p1" && role !== "p2")) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-terminal text-xl">Loading…</p>
      </main>
    );
  }

  const myWager = state.wager[role];
  const oppWager = role === "p1" ? state.wager.p2 : state.wager.p1;
  const oppRole: "p1" | "p2" = role === "p1" ? "p2" : "p1";
  const matched = state.wager.p1.amount === state.wager.p2.amount;
  const pot = state.wager.p1.amount + state.wager.p2.amount;
  const canAfford = myBalance >= myWager.amount;

  const setWager = (amount: number) => {
    if (myWager.locked) return;
    send({ type: "SET_WAGER", role, amount });
  };

  const toggleLock = () => {
    if (!canAfford && !myWager.locked) return;
    send({ type: "LOCK_WAGER", role, locked: !myWager.locked });
  };

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-6">
        <header className="text-center space-y-2">
          <p
            className={`font-arcade text-xs tracking-widest ${role === "p1" ? "glow-red" : "glow-blue"} animate-flicker`}
          >
            {role.toUpperCase()} · PLACE YOUR WAGER
          </p>
          <h1 className="font-arcade text-2xl sm:text-3xl glow-yellow">
            STAKES
          </h1>
          <p className="font-terminal text-base text-muted-foreground">
            Both fighters must match wagers to enter the ring. Winner takes the pot.
          </p>
        </header>

        {/* Pot preview */}
        <Card className={matched ? "border-neon-green ring-glow-green" : "border-neon-yellow/40"}>
          <CardContent className="p-4 sm:p-6 text-center space-y-2">
            <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
              {matched ? "POT (LOCKED)" : "POT IF MATCHED"}
            </p>
            <p
              className={`font-arcade text-4xl sm:text-5xl ${matched ? "glow-green" : "glow-yellow"}`}
            >
              💰 {pot} PXL
            </p>
            <p className="font-terminal text-base text-muted-foreground">
              Winner takes all
            </p>
          </CardContent>
        </Card>

        {/* Wallet + my wager */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={role === "p1" ? "border-neon-red/40" : "border-neon-blue/40"}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`font-arcade text-xs ${role === "p1" ? "glow-red" : "glow-blue"}`}
                >
                  YOU ({role.toUpperCase()})
                </span>
                <Badge variant="outline" className="font-arcade text-[10px]">
                  💰 {myBalance} PXL
                </Badge>
              </div>
              {p1Char && p2Char && (
                <p className="font-terminal text-base text-muted-foreground">
                  Repping {role === "p1" ? p1Char.ticker : p2Char.ticker}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2">
                {WAGER_CHIPS.map((chip) => {
                  const disabled = chip > myBalance || myWager.locked;
                  const selected = myWager.amount === chip;
                  return (
                    <button
                      key={chip}
                      onClick={() => setWager(chip)}
                      disabled={disabled}
                      className={`rounded-md py-3 font-arcade text-xs border transition-all
                        ${selected
                          ? role === "p1"
                            ? "border-neon-red bg-neon-red/15 ring-glow-red"
                            : "border-neon-blue bg-neon-blue/15 ring-glow-blue"
                          : "border-border hover:border-foreground/40"}
                        ${disabled ? "opacity-30 cursor-not-allowed" : ""}
                      `}
                    >
                      {chip}
                    </button>
                  );
                })}
                <button
                  onClick={() => setWager(myBalance)}
                  disabled={myWager.locked || myBalance === 0}
                  className={`rounded-md py-3 font-arcade text-xs border transition-all col-span-3
                    ${myWager.amount === myBalance && myBalance > 0
                      ? "border-neon-yellow bg-neon-yellow/15 glow-yellow"
                      : "border-border hover:border-foreground/40"}
                    ${myWager.locked || myBalance === 0 ? "opacity-30 cursor-not-allowed" : ""}
                  `}
                >
                  ALL IN ({myBalance})
                </button>
              </div>

              <Button
                onClick={toggleLock}
                disabled={!canAfford && !myWager.locked}
                className={`w-full font-arcade text-xs h-11 ${
                  myWager.locked ? "bg-neon-green/80 hover:bg-neon-green text-black" : ""
                }`}
              >
                {myWager.locked
                  ? `✓ LOCKED · ${myWager.amount} PXL`
                  : canAfford
                  ? `LOCK IN ${myWager.amount} PXL`
                  : "INSUFFICIENT FUNDS"}
              </Button>
            </CardContent>
          </Card>

          {/* Opponent panel */}
          <Card className={oppRole === "p1" ? "border-neon-red/40" : "border-neon-blue/40"}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`font-arcade text-xs ${oppRole === "p1" ? "glow-red" : "glow-blue"}`}
                >
                  OPPONENT ({oppRole.toUpperCase()})
                </span>
                {oppWager.locked ? (
                  <Badge className="font-arcade text-[10px] bg-neon-green/80 text-black">
                    LOCKED
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-arcade text-[10px] animate-flicker">
                    CHOOSING…
                  </Badge>
                )}
              </div>
              {p1Char && p2Char && (
                <p className="font-terminal text-base text-muted-foreground">
                  Repping {oppRole === "p1" ? p1Char.ticker : p2Char.ticker}
                </p>
              )}
              <div className="rounded-md border border-border p-6 text-center bg-muted/30">
                <p className="font-arcade text-[10px] text-muted-foreground">
                  WAGER
                </p>
                <p className="font-arcade text-3xl mt-2">{oppWager.amount} PXL</p>
              </div>

              {state.wager.p1.locked && state.wager.p2.locked && !matched && (
                <p className="font-terminal text-base text-neon-red text-center">
                  Wagers don&apos;t match — adjust to continue
                </p>
              )}
              {matched && state.wager.p1.locked && state.wager.p2.locked && (
                <p className="font-terminal text-base text-neon-green text-center animate-pulse-glow">
                  Entering arena…
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
