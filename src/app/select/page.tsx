"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FIGHTER_ROSTER, getFighter, type Fighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FighterPortrait } from "@/components/fighter-portrait";

const TOKEN_SUGGESTIONS = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "BNB", "LINK", "PEPE", "TRUMP"];

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

  const me = role === "p1" ? state.p1 : role === "p2" ? state.p2 : null;
  const opp = role === "p1" ? state.p2 : role === "p2" ? state.p1 : null;
  const myReady = me?.ready ?? false;

  if (!role || role === "audience" || !me || !opp) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-terminal text-xl">Loading…</p>
      </main>
    );
  }

  const myFighter = getFighter(me.fighterId);
  const oppFighter = getFighter(opp.fighterId);
  const meColor: "red" | "blue" = role === "p1" ? "red" : "blue";
  const oppCornerColor: "red" | "blue" = role === "p1" ? "blue" : "red";
  const oppRoleLabel = role === "p1" ? "P2" : "P1";

  const pickFighter = (f: Fighter) => {
    send({ type: "PICK_FIGHTER", role, fighterId: f.id });
  };

  const setToken = (raw: string) => {
    send({ type: "SET_TOKEN", role, tokenName: raw });
  };

  const toggleReady = () => {
    if (!me.fighterId || !me.tokenName) return;
    send({ type: "READY", role, ready: !myReady });
  };

  const canReady = !!me.fighterId && me.tokenName.length >= 2;

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
            Match {state.matchId} · opponent {opp.fighterId ? "PICKED" : "selecting…"}
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
            disabled={!canReady}
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
      <div className="rounded-md border border-border bg-card/50 backdrop-blur-sm p-3 sm:p-5">
        <p className="font-arcade text-[10px] text-muted-foreground text-center mb-3 tracking-widest">
          ▾ CURRENT MATCHUP ▾
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
          <MatchupCard
            fighter={myFighter}
            tokenName={me.tokenName}
            cornerColor={meColor}
            label={`${role.toUpperCase()} (YOU)`}
            ready={myReady}
          />
          <p className="font-arcade text-2xl sm:text-3xl text-muted-foreground">vs</p>
          <MatchupCard
            fighter={oppFighter}
            tokenName={opp.tokenName}
            cornerColor={oppCornerColor}
            label={oppRoleLabel}
            ready={opp.ready}
          />
        </div>
      </div>

      {/* TOKEN INPUT */}
      <div
        className={`rounded-md border-2 backdrop-blur-sm p-4 ${
          meColor === "red" ? "border-neon-red/50 bg-neon-red/[0.03]" : "border-neon-blue/50 bg-neon-blue/[0.03]"
        }`}
      >
        <p className={`font-arcade text-[10px] tracking-widest mb-2 ${meColor === "red" ? "glow-red" : "glow-blue"}`}>
          ▷ WHICH COIN ARE YOU REPPING?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <Input
            value={me.tokenName}
            onChange={(e) => setToken(e.target.value)}
            placeholder="BTC, ETH, $MOON, ANYTHING…"
            maxLength={12}
            className="font-arcade text-lg flex-1 tracking-widest"
            disabled={myReady}
          />
          <div className="flex flex-wrap gap-1.5">
            {TOKEN_SUGGESTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setToken(t)}
                disabled={myReady}
                className={`font-arcade text-[10px] px-2 py-1 rounded border transition-all ${
                  me.tokenName === t
                    ? meColor === "red"
                      ? "border-neon-red bg-neon-red/15 text-neon-red"
                      : "border-neon-blue bg-neon-blue/15 text-neon-blue"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                } ${myReady ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <p className="font-terminal text-sm text-muted-foreground mt-2">
          The coin you&apos;re defending. Can be real (BTC, ETH) or anything you want to argue for.
        </p>
      </div>

      {/* ROSTER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {FIGHTER_ROSTER.map((f) => {
          const taken = state.p1.fighterId === f.id || state.p2.fighterId === f.id;
          const mine = me.fighterId === f.id;
          const takenBy = state.p1.fighterId === f.id ? "p1" : state.p2.fighterId === f.id ? "p2" : null;

          return (
            <button
              key={f.id}
              onClick={() => (!taken || mine) && !myReady ? pickFighter(f) : null}
              disabled={(taken && !mine) || myReady}
              className={`group relative text-left bg-card/80 backdrop-blur-sm border-2 rounded-md p-3 sm:p-4 transition-all overflow-hidden
                ${
                  mine
                    ? role === "p1"
                      ? "border-neon-red ring-glow-red"
                      : "border-neon-blue ring-glow-blue"
                    : "border-border hover:border-foreground/40"
                }
                ${taken && !mine ? "opacity-30 cursor-not-allowed grayscale" : ""}
                ${myReady && mine ? "" : ""}
              `}
            >
              {takenBy && (
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    takenBy === "p1" ? "bg-neon-red" : "bg-neon-blue"
                  }`}
                />
              )}

              <div className="flex justify-center">
                <FighterPortrait
                  fighter={f}
                  size="lg"
                  corner={takenBy === "p1" ? "red" : takenBy === "p2" ? "blue" : null}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className={`font-arcade text-xs ${f.glowClass}`}>{f.name.toUpperCase()}</p>
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
              <p className="font-terminal text-sm text-muted-foreground italic mt-0.5">{f.tagline}</p>

              <div className="mt-3 space-y-1.5">
                <StatBar label="PWR" value={f.stats.power} color={f.color} />
                <StatBar label="SPD" value={f.stats.speed} color={f.color} />
                <StatBar label="TEC" value={f.stats.technique} color={f.color} />
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
                    {f.signatureMoves.slice(0, 3).map((m) => (
                      <li
                        key={m}
                        className={`font-terminal text-sm ${f.glowClass}/80 truncate`}
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

function MatchupCard({
  fighter,
  tokenName,
  cornerColor,
  label,
  ready,
}: {
  fighter: Fighter | null | undefined;
  tokenName: string;
  cornerColor: "red" | "blue";
  label: string;
  ready: boolean;
}) {
  const accent = cornerColor === "red" ? "text-neon-red" : "text-neon-blue";
  const border = cornerColor === "red" ? "border-neon-red/60" : "border-neon-blue/60";

  return (
    <div className={`relative rounded border ${border} bg-card/60 p-3 flex items-center gap-3 ${fighter ? "" : "opacity-60"}`}>
      <FighterPortrait fighter={fighter} size="md" corner={cornerColor} />
      <div className="min-w-0 flex-1">
        <p className={`font-arcade text-[9px] ${accent} tracking-widest`}>{label}</p>
        {fighter ? (
          <>
            <p className={`font-arcade text-sm sm:text-base mt-1 ${cornerColor === "red" ? "glow-red" : "glow-blue"}`}>
              {fighter.name.toUpperCase()}
            </p>
            <p className="font-terminal text-sm text-muted-foreground truncate">
              {tokenName ? <>repping <span className="text-foreground font-bold">{tokenName}</span></> : <span className="italic">no coin yet</span>}
            </p>
          </>
        ) : (
          <p className="font-terminal text-sm text-muted-foreground italic mt-1">choosing…</p>
        )}
        {ready && fighter && (
          <Badge className="mt-1.5 font-arcade text-[9px] bg-neon-green/90 text-black">READY</Badge>
        )}
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-arcade text-[9px] text-muted-foreground w-8">{label}</span>
      <div className="flex-1 h-1.5 rounded bg-muted/60 overflow-hidden">
        <div className="h-full transition-[width]" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="font-arcade text-[9px] w-6 text-right tabular-nums">{value}</span>
    </div>
  );
}
