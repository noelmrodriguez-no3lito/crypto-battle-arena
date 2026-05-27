"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getFighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import { WAGER_CHIPS, getWallet } from "@/lib/match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StakesPage() {
  const router = useRouter();
  const { state, role, send, hydrated } = useMatch();

  useEffect(() => {
    if (!hydrated) return;
    if (role === "audience" || role === null) {
      router.push("/spectate");
    }
  }, [hydrated, role, router]);

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

  const p1Char = getFighter(state.p1.fighterId);
  const p2Char = getFighter(state.p2.fighterId);
  const myToken = role === "p1" ? state.p1.tokenName : role === "p2" ? state.p2.tokenName : "";
  const oppToken = role === "p1" ? state.p2.tokenName : role === "p2" ? state.p1.tokenName : "";

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

  const meColor = role === "p1" ? "red" : "blue";
  const oppColor = oppRole === "p1" ? "red" : "blue";

  return (
    <main className="arena-haze flex-1 flex items-center justify-center px-4 sm:px-6 py-10 overflow-hidden">
      <div className="w-full max-w-3xl space-y-6">
        <header className="text-center space-y-2">
          <p
            className={`font-arcade text-xs tracking-[0.3em] ${role === "p1" ? "glow-red" : "glow-blue"} animate-flicker`}
          >
            {role.toUpperCase()} · PLACE YOUR WAGER
          </p>
          <h1 className="font-arcade text-3xl sm:text-4xl glow-yellow text-chromatic">
            STAKES
          </h1>
          <p className="font-terminal text-base text-muted-foreground">
            Both fighters must match wagers to enter the ring. Winner takes the pot.
          </p>
        </header>

        {/* POT SHOWCASE */}
        <div
          className={`relative rounded-md border-2 backdrop-blur-sm p-5 sm:p-7 text-center overflow-hidden ${
            matched
              ? "border-neon-green ring-glow-green bg-neon-green/[0.06]"
              : "border-neon-yellow/50 bg-neon-yellow/[0.03]"
          }`}
        >
          {/* corner brackets */}
          <span className={`absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 ${matched ? "border-neon-green" : "border-neon-yellow"}`} />
          <span className={`absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 ${matched ? "border-neon-green" : "border-neon-yellow"}`} />
          <span className={`absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 ${matched ? "border-neon-green" : "border-neon-yellow"}`} />
          <span className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 ${matched ? "border-neon-green" : "border-neon-yellow"}`} />

          <p className="font-arcade text-[10px] text-muted-foreground tracking-[0.4em]">
            {matched ? "▷ POT LOCKED ◁" : "POT IF MATCHED"}
          </p>
          <p
            className={`font-arcade text-5xl sm:text-6xl mt-3 tabular-nums leading-none ${
              matched ? "glow-green animate-pulse-glow" : "glow-yellow"
            }`}
          >
            💰 {pot}
          </p>
          <p className="font-arcade text-[10px] text-muted-foreground mt-2 tracking-widest">
            WINNER TAKES ALL · PXL
          </p>
        </div>

        {/* WALLET + WAGER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* My panel */}
          <div
            className={`relative rounded-md border-2 backdrop-blur-sm p-4 space-y-3 ${
              meColor === "red" ? "border-neon-red/50 bg-neon-red/[0.03]" : "border-neon-blue/50 bg-neon-blue/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-arcade text-xs ${meColor === "red" ? "glow-red" : "glow-blue"}`}
              >
                YOU ({role.toUpperCase()})
              </span>
              <Badge variant="outline" className="font-arcade text-[10px]">
                💰 {myBalance} PXL
              </Badge>
            </div>
            {p1Char && p2Char && (
              <p className="font-terminal text-base text-muted-foreground">
                Repping <span className="text-foreground font-bold">{myToken}</span>
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {WAGER_CHIPS.map((chip) => {
                const disabled = chip > myBalance || myWager.locked;
                const selected = myWager.amount === chip;
                return (
                  <Chip
                    key={chip}
                    label={String(chip)}
                    onClick={() => setWager(chip)}
                    disabled={disabled}
                    selected={selected}
                    corner={meColor}
                  />
                );
              })}
              <button
                onClick={() => setWager(myBalance)}
                disabled={myWager.locked || myBalance === 0}
                className={`relative rounded-md py-3 font-arcade text-xs border-2 transition-all col-span-3
                  ${myWager.amount === myBalance && myBalance > 0
                    ? "border-neon-yellow bg-neon-yellow/15 glow-yellow ring-1 ring-neon-yellow/40"
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
              className={`w-full font-arcade text-xs h-12 ${
                myWager.locked
                  ? "bg-neon-green/90 hover:bg-neon-green text-black shadow-[0_0_18px_rgba(57,255,122,0.55)]"
                  : ""
              }`}
            >
              {myWager.locked
                ? `✓ LOCKED · ${myWager.amount} PXL`
                : canAfford
                ? `LOCK IN ${myWager.amount} PXL`
                : "INSUFFICIENT FUNDS"}
            </Button>
          </div>

          {/* Opponent panel */}
          <div
            className={`relative rounded-md border-2 backdrop-blur-sm p-4 space-y-3 ${
              oppColor === "red" ? "border-neon-red/50 bg-neon-red/[0.03]" : "border-neon-blue/50 bg-neon-blue/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-arcade text-xs ${oppColor === "red" ? "glow-red" : "glow-blue"}`}
              >
                OPPONENT ({oppRole.toUpperCase()})
              </span>
              {oppWager.locked ? (
                <Badge className="font-arcade text-[10px] bg-neon-green/90 text-black">
                  ✓ LOCKED
                </Badge>
              ) : (
                <Badge variant="outline" className="font-arcade text-[10px] animate-flicker">
                  CHOOSING…
                </Badge>
              )}
            </div>
            {p1Char && p2Char && (
              <p className="font-terminal text-base text-muted-foreground">
                Repping <span className="text-foreground font-bold">{oppToken}</span>
              </p>
            )}
            <div className="rounded-md border border-border p-6 text-center bg-muted/30 relative overflow-hidden">
              {!oppWager.locked && (
                <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(45deg,transparent_0,transparent_8px,rgba(255,255,255,0.04)_8px,rgba(255,255,255,0.04)_16px)]" />
              )}
              <p className="font-arcade text-[10px] text-muted-foreground tracking-widest relative">
                WAGER
              </p>
              <p className="font-arcade text-4xl mt-2 tabular-nums relative">{oppWager.amount} PXL</p>
            </div>

            {state.wager.p1.locked && state.wager.p2.locked && !matched && (
              <p className="font-terminal text-base text-neon-red text-center animate-flicker">
                ⚠ Wagers don&apos;t match — adjust to continue
              </p>
            )}
            {matched && state.wager.p1.locked && state.wager.p2.locked && (
              <p className="font-terminal text-base text-neon-green text-center animate-pulse-glow">
                ▶ Entering arena…
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Chip({
  label,
  onClick,
  disabled,
  selected,
  corner,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
  corner: "red" | "blue";
}) {
  const selectedCls =
    corner === "red"
      ? "border-neon-red bg-neon-red/15 ring-glow-red"
      : "border-neon-blue bg-neon-blue/15 ring-glow-blue";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-full aspect-square font-arcade text-sm border-2 transition-all
        flex items-center justify-center
        ${selected ? selectedCls : "border-border hover:border-foreground/40 bg-card"}
        ${disabled ? "opacity-30 cursor-not-allowed" : ""}
      `}
    >
      <span
        className={`absolute inset-1 rounded-full border border-dashed ${
          selected ? "border-foreground/40" : "border-border/60"
        } pointer-events-none`}
      />
      <span className="relative">{label}</span>
    </button>
  );
}
