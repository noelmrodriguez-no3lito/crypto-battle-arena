"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CRYPTO_ROSTER, getCrypto, type CryptoCharacter } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SelectPage() {
  const router = useRouter();
  const { state, role, send } = useMatch();

  useEffect(() => {
    if (role === "audience") router.push("/spectate");
  }, [role, router]);

  useEffect(() => {
    if (state.p1.ready && state.p2.ready && state.phase === "select") {
      send({ type: "ENTER_STAKES" });
    }
  }, [state.p1.ready, state.p2.ready, state.phase, send]);

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

  const myChar = myPick ? getCrypto(myPick) : null;
  const oppChar = opponentPick ? getCrypto(opponentPick) : null;
  const meColor = role === "p1" ? "red" : "blue";
  const oppRoleLabel = role === "p1" ? "P2" : "P1";

  return (
    <main className="arena-haze flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6">
      {/* HEADER */}
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p
            className={`font-arcade text-xs tracking-widest ${
              role === "p1" ? "glow-red text-neon-red" : "glow-blue text-neon-blue"
            }`}
          >
            {role.toUpperCase()} · CHOOSE YOUR FIGHTER
          </p>
          <p className="font-terminal text-base text-muted-foreground mt-1">
            Match {state.matchId} · opponent {opponentPick ? "PICKED" : "selecting…"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {state.p1.ready && (
            <Badge variant="outline" className="font-arcade text-[10px] border-neon-red/70 text-neon-red">
              P1 READY
            </Badge>
          )}
          {state.p2.ready && (
            <Badge variant="outline" className="font-arcade text-[10px] border-neon-blue/70 text-neon-blue">
              P2 READY
            </Badge>
          )}
          <Button
            onClick={toggleReady}
            disabled={!myPick}
            className={`font-arcade text-xs h-11 px-5 ${
              myReady
                ? "bg-neon-green/90 hover:bg-neon-green text-black shadow-[0_0_18px_rgba(57,255,122,0.55)]"
                : ""
            }`}
          >
            {myReady ? "✓ READY" : "READY UP"}
          </Button>
        </div>
      </header>

      {/* MATCHUP PREVIEW */}
      {(myChar || oppChar) && (
        <div className="rounded-md border border-border bg-card/50 backdrop-blur-sm p-3 sm:p-4">
          <p className="font-arcade text-[10px] text-muted-foreground text-center mb-3 tracking-widest">
            ▾ CURRENT MATCHUP ▾
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <MatchupSlot char={myChar} corner={meColor} label={`${role.toUpperCase()} (YOU)`} />
            <p className="font-arcade text-xl sm:text-2xl text-muted-foreground">vs</p>
            <MatchupSlot
              char={oppChar}
              corner={meColor === "red" ? "blue" : "red"}
              label={oppRoleLabel}
            />
          </div>
        </div>
      )}

      {/* ROSTER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {CRYPTO_ROSTER.map((c) => {
          const taken = state.p1.cryptoId === c.id || state.p2.cryptoId === c.id;
          const mine = myPick === c.id;
          const takenBy = state.p1.cryptoId === c.id ? "p1" : state.p2.cryptoId === c.id ? "p2" : null;

          return (
            <button
              key={c.id}
              onClick={() => (!taken || mine ? pick(c) : null)}
              disabled={taken && !mine}
              className={`group relative text-left bg-card/80 backdrop-blur-sm border-2 rounded-md p-4 transition-all overflow-hidden
                ${
                  mine
                    ? role === "p1"
                      ? "border-neon-red ring-glow-red"
                      : "border-neon-blue ring-glow-blue"
                    : "border-border hover:border-foreground/40"
                }
                ${taken && !mine ? "opacity-30 cursor-not-allowed grayscale" : ""}
              `}
            >
              {/* Corner-flag stripe when claimed */}
              {takenBy && (
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    takenBy === "p1" ? "bg-neon-red" : "bg-neon-blue"
                  }`}
                />
              )}

              <div className="flex items-center justify-between">
                <span className={`font-arcade text-sm ${c.glowClass}`}>{c.ticker}</span>
                {takenBy && (
                  <Badge
                    variant="outline"
                    className={`font-arcade text-[9px] ${
                      takenBy === "p1" ? "border-neon-red/60 text-neon-red" : "border-neon-blue/60 text-neon-blue"
                    }`}
                  >
                    {takenBy.toUpperCase()}
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

              <div
                className={`mt-3 grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ${
                  mine ? "grid-rows-[1fr]" : ""
                }`}
              >
                <div className="overflow-hidden">
                  <p className="font-arcade text-[9px] text-muted-foreground tracking-widest mb-1">
                    SIGNATURE MOVES
                  </p>
                  <ul className="space-y-0.5">
                    {c.signatureMoves.slice(0, 3).map((m) => (
                      <li
                        key={m}
                        className={`font-terminal text-sm ${c.glowClass}/80 truncate`}
                      >
                        ▸ {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function MatchupSlot({
  char,
  corner,
  label,
}: {
  char: CryptoCharacter | null | undefined;
  corner: "red" | "blue";
  label: string;
}) {
  const color = corner === "red" ? "glow-red" : "glow-blue";
  const accent = corner === "red" ? "text-neon-red" : "text-neon-blue";
  const borderCls = corner === "red" ? "border-neon-red/60" : "border-neon-blue/60";

  return (
    <div
      className={`relative rounded border ${borderCls} bg-card/60 p-3 ${char ? "" : "opacity-50"}`}
    >
      <p className={`font-arcade text-[9px] ${accent} tracking-widest`}>{label}</p>
      {char ? (
        <>
          <p className={`font-arcade text-xl mt-1 ${color}`}>{char.ticker}</p>
          <p className="font-terminal text-sm text-muted-foreground truncate">{char.name}</p>
        </>
      ) : (
        <p className="font-terminal text-sm text-muted-foreground italic mt-1">
          choosing…
        </p>
      )}
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-arcade text-[9px] text-muted-foreground w-9">{label}</span>
      <div className="flex-1 h-1.5 rounded bg-muted/60 overflow-hidden">
        <div className="h-full bg-foreground/70 transition-[width]" style={{ width: `${value}%` }} />
      </div>
      <span className="font-arcade text-[9px] w-6 text-right tabular-nums">{value}</span>
    </div>
  );
}
