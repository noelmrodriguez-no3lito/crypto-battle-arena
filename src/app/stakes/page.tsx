"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFighter, type Fighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import { WAGER_CHIPS, getWallet } from "@/lib/match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArenaBackdrop, BroadcastTicker } from "@/components/broadcast";

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

  const myBalance = useMemo(() => {
    if (!hydrated || (role !== "p1" && role !== "p2")) return 0;
    return getWallet(role);
  }, [hydrated, role, state.matchId]);

  if (!hydrated || (role !== "p1" && role !== "p2") || !p1Char || !p2Char) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-terminal text-xl">Loading…</p>
      </main>
    );
  }

  const myWager = state.wager[role];
  const oppRole: "p1" | "p2" = role === "p1" ? "p2" : "p1";
  const oppWager = state.wager[oppRole];
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
    <main className="relative flex-1 flex flex-col overflow-hidden">
      <ArenaBackdrop variant="dim" />

      {/* TOP: event tag */}
      <header className="text-center pt-5 sm:pt-8 px-4">
        <p className="font-arcade text-[10px] text-neon-yellow animate-flicker tracking-[0.5em]">
          ▷ THE BOOKMAKER ◁
        </p>
        <h1 className="font-arcade text-3xl sm:text-4xl glow-yellow mt-2">STAKES</h1>
      </header>

      <section className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 px-4 sm:px-8 py-6 sm:py-8 items-stretch">
        {/* P1 tale of the tape */}
        <TaleOfTheTape
          fighter={role === "p1" ? p1Char : p2Char}
          token={role === "p1" ? state.p1.tokenName : state.p2.tokenName}
          wager={myWager.amount}
          balance={myBalance}
          locked={myWager.locked}
          side="left"
          you
        />

        {/* CENTER: pot */}
        <div className="flex flex-col items-center justify-center min-w-[180px] sm:min-w-[220px] gap-4">
          <p className="font-arcade text-[10px] tracking-widest text-muted-foreground">
            {matched ? "POT LOCKED" : "POT IF MATCHED"}
          </p>
          <div
            className={`relative rounded-full w-32 h-32 sm:w-40 sm:h-40 grid place-items-center border-4 ${
              matched ? "border-neon-green ring-glow-green animate-pulse-glow" : "border-neon-yellow/60"
            }`}
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,230,0,0.18), transparent 60%)",
            }}
          >
            <span
              className={`font-arcade text-3xl sm:text-4xl tabular-nums leading-none ${matched ? "glow-green" : "glow-yellow"}`}
            >
              {pot}
            </span>
            <span className="font-arcade text-[9px] text-muted-foreground tracking-widest absolute bottom-3">
              PXL
            </span>
          </div>
          <p className="font-arcade text-[9px] text-muted-foreground tracking-widest text-center max-w-[180px]">
            WINNER TAKES ALL · POT REFUNDED ON TIE
          </p>

          {state.wager.p1.locked && state.wager.p2.locked && !matched && (
            <p className="font-terminal text-base text-neon-red text-center animate-flicker">
              ⚠ wagers don&apos;t match
            </p>
          )}
        </div>

        {/* P2 / opponent tale of the tape */}
        <TaleOfTheTape
          fighter={role === "p1" ? p2Char : p1Char}
          token={role === "p1" ? state.p2.tokenName : state.p1.tokenName}
          wager={oppWager.amount}
          balance={null}
          locked={oppWager.locked}
          side="right"
        />
      </section>

      {/* BOTTOM: bet slip */}
      <section className="border-t-2 border-neon-yellow/40 bg-neon-yellow/[0.03] px-4 sm:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-4 items-center">
          <p className="font-arcade text-[10px] text-neon-yellow tracking-widest">
            ▶ YOUR SLIP · BALANCE {myBalance} PXL
          </p>
          <div className="flex flex-wrap gap-2">
            {WAGER_CHIPS.map((chip) => {
              const disabled = chip > myBalance || myWager.locked;
              const selected = myWager.amount === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setWager(chip)}
                  disabled={disabled}
                  className={`relative font-arcade text-xs rounded h-10 px-3 border-2 transition-all
                    ${selected
                      ? role === "p1"
                        ? "border-neon-red bg-neon-red/15 text-neon-red ring-glow-red"
                        : "border-neon-blue bg-neon-blue/15 text-neon-blue ring-glow-blue"
                      : "border-border bg-card/60 hover:border-foreground/40"}
                    ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  {chip}
                </button>
              );
            })}
            <button
              onClick={() => setWager(myBalance)}
              disabled={myWager.locked || myBalance === 0}
              className={`font-arcade text-xs rounded h-10 px-3 border-2 transition-all
                ${myWager.amount === myBalance && myBalance > 0
                  ? "border-neon-yellow bg-neon-yellow/15 glow-yellow"
                  : "border-border hover:border-foreground/40"}
                ${myWager.locked || myBalance === 0 ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              ALL IN ({myBalance})
            </button>
          </div>
          <Button
            onClick={toggleLock}
            disabled={!canAfford && !myWager.locked}
            className={`font-arcade text-xs h-12 px-6 ${
              myWager.locked
                ? "bg-neon-green/90 hover:bg-neon-green text-black shadow-[0_0_22px_rgba(57,255,122,0.6)]"
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
      </section>

      <BroadcastTicker
        items={[
          `POT · ${pot} PXL`,
          state.wager.p1.locked ? `P1 LOCKED · ${state.wager.p1.amount}` : "P1 STILL CHOOSING",
          state.wager.p2.locked ? `P2 LOCKED · ${state.wager.p2.amount}` : "P2 STILL CHOOSING",
          matched && state.wager.p1.locked && state.wager.p2.locked ? "▶ ENTERING ARENA" : "WAGERS MUST MATCH TO ENTER",
        ]}
        accent="yellow"
      />
    </main>
  );
}

/* ───────────────────────── Tale of the tape ───────────────────────────── */

function TaleOfTheTape({
  fighter,
  token,
  wager,
  balance,
  locked,
  side,
  you = false,
}: {
  fighter: Fighter;
  token: string;
  wager: number;
  balance: number | null;
  locked: boolean;
  side: "left" | "right";
  you?: boolean;
}) {
  const cornerLabel = side === "left" ? "RED CORNER" : "BLUE CORNER";
  const accentBg = side === "left" ? "bg-neon-red" : "bg-neon-blue";
  const accent = side === "left" ? "text-neon-red" : "text-neon-blue";
  const borderCls = side === "left" ? "border-neon-red/60" : "border-neon-blue/60";
  const glow = side === "left" ? "glow-red" : "glow-blue";

  return (
    <div className={`relative rounded-md border-2 ${borderCls} bg-card/70 overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentBg}`} />

      <div className="grid grid-cols-[1fr_1.1fr] gap-0">
        <div
          className="relative aspect-square"
          style={{ background: `radial-gradient(circle, ${fighter.color}40, transparent 70%)` }}
        >
          <Image src={fighter.portrait} alt={fighter.name} fill sizes="320px" className="object-contain" />
        </div>

        <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between">
            <p className={`font-arcade text-[9px] ${accent} tracking-widest`}>
              {cornerLabel} {you && "· YOU"}
            </p>
            {locked ? (
              <Badge className="font-arcade text-[9px] bg-neon-green/90 text-black">LOCKED</Badge>
            ) : (
              <Badge variant="outline" className="font-arcade text-[9px] animate-flicker">CHOOSING</Badge>
            )}
          </div>

          <p className={`font-arcade text-2xl sm:text-3xl ${glow} leading-none`}>
            {token || fighter.name.toUpperCase()}
          </p>
          <p className="font-terminal text-sm text-muted-foreground truncate">
            {fighter.name} · <span className="italic">{fighter.archetype}</span>
          </p>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-arcade text-[10px] tracking-widest mt-1">
            <dt className="text-muted-foreground">PWR</dt>
            <dd className="text-right tabular-nums">{fighter.stats.power}</dd>
            <dt className="text-muted-foreground">SPD</dt>
            <dd className="text-right tabular-nums">{fighter.stats.speed}</dd>
            <dt className="text-muted-foreground">TEC</dt>
            <dd className="text-right tabular-nums">{fighter.stats.technique}</dd>
            <dt className="text-muted-foreground">WAGER</dt>
            <dd className="text-right tabular-nums">{wager}</dd>
            {balance !== null && (
              <>
                <dt className="text-muted-foreground">PURSE</dt>
                <dd className="text-right tabular-nums">{balance}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
