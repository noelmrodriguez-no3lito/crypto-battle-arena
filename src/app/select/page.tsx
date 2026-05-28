"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FIGHTER_ROSTER, getFighter, type Fighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArenaBackdrop, BroadcastTicker, SponsorStrip } from "@/components/broadcast";

const TOKEN_SUGGESTIONS = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "BNB", "LINK", "PEPE", "TRUMP"];

export default function SelectPage() {
  const router = useRouter();
  const { state, role, send } = useMatch();
  const [hoverId, setHoverId] = useState<string | null>(null);

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

  // Focused fighter: hover takes precedence; otherwise the player's pick; otherwise none.
  const focused: Fighter | undefined =
    (hoverId && getFighter(hoverId)) || myFighter || undefined;

  const pickFighter = (f: Fighter) => {
    if (myReady) return;
    send({ type: "PICK_FIGHTER", role, fighterId: f.id });
  };
  const setToken = (raw: string) => send({ type: "SET_TOKEN", role, tokenName: raw });
  const toggleReady = () => {
    if (!me.fighterId || me.tokenName.length < 2) return;
    send({ type: "READY", role, ready: !myReady });
  };
  const canReady = !!me.fighterId && me.tokenName.length >= 2;

  return (
    <main className="relative flex-1 flex flex-col overflow-hidden">
      <ArenaBackdrop variant="dim" />

      {/* TOP STRIP: role / opponent status */}
      <header className="flex items-center justify-between px-4 sm:px-6 pt-4 gap-3 flex-wrap">
        <SponsorStrip side={meColor} token={me.tokenName || "TBD"} />
        <div className="flex gap-2 items-center">
          <span className="font-arcade text-[10px] text-muted-foreground tracking-widest">
            OPPONENT {opp.fighterId ? "PICKED" : "SELECTING"}
          </span>
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
        </div>
      </header>

      {/* MAIN: featured | roster */}
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 sm:gap-6 px-4 sm:px-6 py-5 min-h-0">
        {/* FEATURED FIGHTER */}
        <FeaturedPanel
          fighter={focused}
          tokenName={me.tokenName}
          isMine={!!myFighter && focused?.id === myFighter.id}
          oppFighterId={opp.fighterId}
          cornerColor={meColor}
        />

        {/* ROSTER STRIP */}
        <div className="space-y-3 min-h-0 flex flex-col">
          <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
            ROSTER · {FIGHTER_ROSTER.length} FIGHTERS
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 overflow-y-auto pr-1 min-h-0">
            {FIGHTER_ROSTER.map((f) => {
              const taken = state.p1.fighterId === f.id || state.p2.fighterId === f.id;
              const mine = me.fighterId === f.id;
              const takenBy = state.p1.fighterId === f.id ? "p1" : state.p2.fighterId === f.id ? "p2" : null;

              return (
                <li key={f.id}>
                  <button
                    onClick={() => (!taken || mine) && pickFighter(f)}
                    onMouseEnter={() => setHoverId(f.id)}
                    onFocus={() => setHoverId(f.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onBlur={() => setHoverId(null)}
                    disabled={(taken && !mine) || myReady}
                    className={`group relative w-full text-left rounded-md overflow-hidden border-2 transition-all
                      ${mine
                        ? meColor === "red" ? "border-neon-red ring-glow-red" : "border-neon-blue ring-glow-blue"
                        : "border-border hover:border-foreground/40"}
                      ${taken && !mine ? "opacity-30 cursor-not-allowed grayscale" : ""}
                    `}
                  >
                    <div
                      className="relative aspect-square"
                      style={{ background: `radial-gradient(circle, ${f.color}33, transparent 70%)` }}
                    >
                      <Image src={f.portrait} alt={f.name} fill sizes="200px" className="object-contain" />
                      {takenBy && (
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 ${takenBy === "p1" ? "bg-neon-red" : "bg-neon-blue"}`}
                        />
                      )}
                    </div>
                    <div className="px-2 py-1.5 bg-card/80">
                      <p className={`font-arcade text-[10px] ${f.glowClass} tracking-widest truncate`}>
                        {f.name.toUpperCase()}
                      </p>
                      <p className="font-terminal text-[11px] text-muted-foreground truncate">
                        {f.archetype}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* BOTTOM: token input + ready */}
      <section
        className={`relative border-t-2 ${meColor === "red" ? "border-neon-red/50 bg-neon-red/[0.03]" : "border-neon-blue/50 bg-neon-blue/[0.03]"} px-4 sm:px-6 py-3 sm:py-4`}
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
          <div className="flex-1 min-w-0">
            <p className={`font-arcade text-[10px] tracking-widest mb-1.5 ${meColor === "red" ? "glow-red" : "glow-blue"}`}>
              REPRESENTING · TYPE THE COIN YOU&apos;RE DEFENDING
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch">
              <Input
                value={me.tokenName}
                onChange={(e) => setToken(e.target.value)}
                placeholder="BTC · ETH · $MOON · ANYTHING"
                maxLength={12}
                className="font-arcade text-lg tracking-widest flex-1"
                disabled={myReady}
              />
              <div className="flex flex-wrap gap-1">
                {TOKEN_SUGGESTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setToken(t)}
                    disabled={myReady}
                    className={`font-arcade text-[10px] px-2 h-9 rounded border transition-all
                      ${me.tokenName === t
                        ? meColor === "red"
                          ? "border-neon-red bg-neon-red/15 text-neon-red"
                          : "border-neon-blue bg-neon-blue/15 text-neon-blue"
                        : "border-border text-muted-foreground hover:border-foreground/40"}
                      ${myReady ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button
            onClick={toggleReady}
            disabled={!canReady}
            className={`font-arcade text-xs h-12 px-8 ${
              myReady
                ? "bg-neon-green/90 hover:bg-neon-green text-black shadow-[0_0_22px_rgba(57,255,122,0.6)]"
                : ""
            }`}
          >
            {myReady ? "✓ READY" : "READY UP →"}
          </Button>
        </div>
      </section>

      <BroadcastTicker
        items={[
          `MATCH ${state.matchId}`,
          `${state.p1.fighterId ? "P1 PICKED" : "P1 SELECTING"}`,
          `${state.p2.fighterId ? "P2 PICKED" : "P2 SELECTING"}`,
          "5 ROUNDS · 60s TURNS · WINNER TAKES POT",
        ]}
        accent={meColor === "red" ? "red" : "blue"}
      />
    </main>
  );
}

/* ───────────────────────── Featured panel ───────────────────────────── */

function FeaturedPanel({
  fighter,
  tokenName,
  isMine,
  oppFighterId,
  cornerColor,
}: {
  fighter: Fighter | undefined;
  tokenName: string;
  isMine: boolean;
  oppFighterId: string | null;
  cornerColor: "red" | "blue";
}) {
  const opp = getFighter(oppFighterId);

  if (!fighter) {
    return (
      <div className="relative rounded-md border-2 border-dashed border-border bg-card/40 grid place-items-center min-h-[340px]">
        <div className="text-center px-6">
          <p className="font-arcade text-xs text-muted-foreground tracking-widest animate-flicker">
            SELECT A FIGHTER
          </p>
          <p className="font-terminal text-base text-muted-foreground mt-2">
            Pick from the roster on the right. Each fighter has their own personality.
          </p>
        </div>
      </div>
    );
  }

  const accent = cornerColor === "red" ? "text-neon-red" : "text-neon-blue";
  const accentBg = cornerColor === "red" ? "bg-neon-red" : "bg-neon-blue";
  const borderCls = cornerColor === "red" ? "border-neon-red" : "border-neon-blue";
  const glow = cornerColor === "red" ? "glow-red" : "glow-blue";

  return (
    <div className={`relative rounded-xl border ${isMine ? borderCls : "border-border"} bg-card/70 overflow-hidden flex flex-col`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentBg}`} />

      {/* Top: portrait — controlled aspect, no overflow */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: "16 / 11",
          background: `radial-gradient(circle at 50% 40%, ${fighter.color}40 0%, transparent 65%)`,
        }}
      >
        <Image
          src={fighter.portrait}
          alt={fighter.name}
          fill
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover object-top"
          priority
        />
        {/* Bottom gradient for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />

        {/* Eyebrow + name overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className={`type-eyebrow ${accent}`}>
            {isMine ? "Your fighter" : "Preview"}
          </p>
          <h2 className="type-display text-3xl sm:text-4xl mt-1 text-foreground">
            {fighter.name}
          </h2>
        </div>
      </div>

      {/* Below portrait: stats + signature moves, side-by-side on lg */}
      <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1">
        <p className="text-base text-foreground/70 italic">{fighter.tagline}</p>

        {isMine && tokenName && (
          <div>
            <p className="type-eyebrow text-foreground/50">Representing</p>
            <p className={`type-display text-4xl sm:text-5xl ${glow} leading-none mt-1`}>
              {tokenName}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {/* Tale of the tape */}
          <div>
            <p className="type-eyebrow text-foreground/50 mb-2">Tale of the tape</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-foreground/55">Archetype</dt>
              <dd className="text-right text-foreground/95">{fighter.archetype}</dd>
              <dt className="text-foreground/55">Power</dt>
              <dd className="text-right type-mono tabular-nums">{fighter.stats.power}</dd>
              <dt className="text-foreground/55">Speed</dt>
              <dd className="text-right type-mono tabular-nums">{fighter.stats.speed}</dd>
              <dt className="text-foreground/55">Technique</dt>
              <dd className="text-right type-mono tabular-nums">{fighter.stats.technique}</dd>
            </dl>
          </div>

          {/* Signature moves */}
          <div>
            <p className="type-eyebrow text-foreground/50 mb-2">Signature moves</p>
            <ul className="space-y-1 text-sm">
              {fighter.signatureMoves.slice(0, 4).map((m) => (
                <li key={m} className="text-foreground/85 truncate">
                  ▸ {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

          {opp && (
            <div className="mt-auto pt-3 border-t border-border/60 flex items-center gap-3 text-xs">
              <span className="font-arcade text-[9px] text-muted-foreground tracking-widest">
                VS OPP
              </span>
              <div
                className="relative w-9 h-9 rounded-sm overflow-hidden border border-foreground/30"
                style={{ boxShadow: `0 0 10px ${opp.color}66` }}
              >
                <Image src={opp.portrait} alt={opp.name} fill sizes="36px" className="object-contain" />
              </div>
              <span className="font-terminal text-sm text-muted-foreground truncate">{opp.name}</span>
            </div>
          )}
      </div>
    </div>
  );
}
