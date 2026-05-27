"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Fighter } from "@/data/fighters";

/* ───────────────────────── Arena backdrop ─────────────────────────────── */

export function ArenaBackdrop({ variant = "default" }: { variant?: "default" | "dim" }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 spotlights" />
      <div
        className={`absolute inset-0 ${
          variant === "dim" ? "opacity-50" : "opacity-100"
        }`}
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(0,0,0,0.45) 95%)",
        }}
      />
      {/* Perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 45, 85, 0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(45, 140, 255, 0.28) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "perspective(600px) rotateX(62deg)",
          transformOrigin: "top center",
          maskImage:
            "linear-gradient(to bottom, transparent 8%, black 30%, black 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 8%, black 30%, black 80%, transparent 100%)",
          animation: "grid-pan 8s linear infinite",
        }}
      />
      {/* Crowd silhouette band */}
      <div className="absolute inset-x-0 bottom-0 h-20 crowd-strip animate-crowd-bob" aria-hidden />
    </div>
  );
}

/* ───────────────────────── Broadcast ticker ───────────────────────────── */

export function BroadcastTicker({
  items,
  accent = "yellow",
  className = "",
}: {
  items: string[];
  accent?: "yellow" | "red" | "blue" | "green";
  className?: string;
}) {
  const accentMap = {
    yellow: { border: "border-neon-yellow/50", text: "text-neon-yellow", bg: "bg-neon-yellow" },
    red: { border: "border-neon-red/50", text: "text-neon-red", bg: "bg-neon-red" },
    blue: { border: "border-neon-blue/50", text: "text-neon-blue", bg: "bg-neon-blue" },
    green: { border: "border-neon-green/50", text: "text-neon-green", bg: "bg-neon-green" },
  } as const;
  const a = accentMap[accent];
  // Duplicate to allow seamless loop.
  const stream = [...items, ...items];

  return (
    <div
      className={`relative w-full border-y ${a.border} bg-background/90 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* "ON AIR" leader */}
      <div className={`absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 ${a.bg} text-black`}>
        <span className="font-arcade text-[10px] tracking-widest">● LIVE</span>
      </div>
      <div className="ticker-track py-1.5 pl-20 font-arcade text-[10px] tracking-widest">
        {stream.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span className={a.text}>◆</span>
            <span className="text-foreground/90">{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Lower-third nameplate ─────────────────────── */

export function LowerThird({
  fighter,
  token,
  side,
  visible,
  variant = "speaking",
}: {
  fighter: Fighter | null | undefined;
  token: string;
  side: "left" | "right";
  visible: boolean;
  variant?: "speaking" | "entering";
}) {
  // Stay mounted during exit animation
  const [shouldRender, setShouldRender] = useState(visible);
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      return;
    }
    const t = setTimeout(() => setShouldRender(false), 400);
    return () => clearTimeout(t);
  }, [visible]);

  if (!shouldRender || !fighter) return null;

  const isLeft = side === "left";
  const enter = isLeft ? "animate-lt-in-left" : "animate-lt-in-right";
  const exit = isLeft ? "animate-lt-out-left" : "animate-lt-out-right";
  const accentBg = isLeft ? "bg-neon-red" : "bg-neon-blue";
  const accentGlow = isLeft ? "glow-red" : "glow-blue";
  const borderCls = isLeft ? "border-neon-red" : "border-neon-blue";
  const cornerLabel = isLeft ? "RED CORNER" : "BLUE CORNER";

  return (
    <div
      className={`pointer-events-none absolute ${isLeft ? "left-0" : "right-0"} top-1/2 -translate-y-1/2 z-20 ${visible ? enter : exit}`}
    >
      <div
        className={`relative flex items-stretch gap-0 border-y-2 ${borderCls} bg-card/95 backdrop-blur-sm shadow-[0_0_32px_rgba(0,0,0,0.6)]`}
        style={{ minWidth: 360, [isLeft ? "borderLeft" : "borderRight"]: "0" } as React.CSSProperties}
      >
        {/* Portrait block */}
        <div
          className={`relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden flex-shrink-0 ${isLeft ? "order-first" : "order-last"}`}
          style={{
            background: `radial-gradient(circle, ${fighter.color}55, transparent 70%)`,
            boxShadow: `inset 0 0 20px ${fighter.color}44`,
          }}
        >
          <Image
            src={fighter.portrait}
            alt={fighter.name}
            fill
            sizes="96px"
            className="object-contain"
          />
        </div>

        {/* Info block */}
        <div className={`flex-1 px-4 py-2 min-w-[200px] ${isLeft ? "text-left" : "text-right"}`}>
          <div className={`flex items-center gap-2 ${isLeft ? "" : "flex-row-reverse"}`}>
            <span className={`px-1.5 py-0.5 ${accentBg} text-black font-arcade text-[9px] tracking-widest`}>
              {cornerLabel}
            </span>
            {variant === "speaking" && (
              <span className="font-arcade text-[9px] text-neon-green animate-flicker tracking-widest">
                ◉ NOW SPEAKING
              </span>
            )}
          </div>
          <p className={`font-arcade text-xl sm:text-2xl mt-1 ${accentGlow} truncate`}>
            {token || fighter.name}
          </p>
          <p className="font-terminal text-sm text-muted-foreground truncate">
            {fighter.name} · <span className="italic">{fighter.archetype}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Stat callout ───────────────────────────────── */

export function StatCallout({
  label,
  value,
  body,
  show,
  onDone,
}: {
  label: string;
  value: string;
  body?: string;
  show: boolean;
  onDone?: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDone?.(), 2800);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-24 right-6 z-30 animate-callout"
      key={`${label}-${value}`}
    >
      <div className="relative bg-background/95 border-2 border-neon-yellow rounded-md p-3 pr-5 min-w-[200px] shadow-[0_0_24px_rgba(255,230,0,0.4)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-neon-red rounded-full animate-pulse-glow" />
          <p className="font-arcade text-[9px] text-neon-yellow tracking-widest">{label}</p>
        </div>
        <p className="font-arcade text-2xl glow-yellow leading-none">{value}</p>
        {body && (
          <p className="font-terminal text-sm text-muted-foreground mt-1 max-w-[260px]">{body}</p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Round-break interstitial ───────────────────── */

export function RoundBreak({
  round,
  totalRounds,
  p1Token,
  p2Token,
  p1Pct,
  p2Pct,
  visible,
  onDone,
}: {
  round: number;
  totalRounds: number;
  p1Token: string;
  p2Token: string;
  p1Pct: number;
  p2Pct: number;
  visible: boolean;
  onDone?: () => void;
}) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onDone?.(), 2400);
    return () => clearTimeout(t);
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center pointer-events-none animate-round-break">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      <div className="relative text-center">
        <p className="font-arcade text-xs text-neon-yellow tracking-[0.5em] animate-flicker">
          ▷ INTERMISSION ◁
        </p>
        <p className="font-arcade text-7xl sm:text-9xl text-chromatic-lg mt-2 leading-none">
          ROUND {round}
        </p>
        <p className="font-arcade text-xs text-muted-foreground tracking-widest mt-2">
          OF {totalRounds}
        </p>
        <div className="mt-6 flex items-center justify-center gap-6 font-arcade text-sm">
          <span className="glow-red">{p1Token} {Math.round(p1Pct)}%</span>
          <span className="text-muted-foreground">·</span>
          <span className="glow-blue">{p2Token} {Math.round(p2Pct)}%</span>
        </div>
        <p className="mt-4 font-arcade text-[10px] text-neon-green animate-flicker tracking-widest">
          ▶ FIGHT
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── Sponsor strip ──────────────────────────────── */

export function SponsorStrip({
  side,
  token,
  className = "",
}: {
  side: "left" | "right" | "red" | "blue";
  token: string;
  className?: string;
}) {
  const isRed = side === "left" || side === "red";
  const accent = isRed ? "border-neon-red/60 text-neon-red" : "border-neon-blue/60 text-neon-blue";
  const label = isRed ? "RED CORNER" : "BLUE CORNER";
  return (
    <div
      className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-sm border ${accent} bg-background/60 font-arcade text-[9px] tracking-widest ${className}`}
    >
      <span className="opacity-80">{label}</span>
      <span className="opacity-60">·</span>
      <span>POWERED BY ${token}</span>
    </div>
  );
}

/* ───────────────────────── Pot transfer animation ─────────────────────── */

export function PotTransfer({
  potAmount,
  winnerSide,
  visible,
  onDone,
}: {
  potAmount: number;
  winnerSide: "left" | "right" | null;
  visible: boolean;
  onDone?: () => void;
}) {
  useEffect(() => {
    if (!visible || winnerSide === null) return;
    const t = setTimeout(() => onDone?.(), 1800);
    return () => clearTimeout(t);
  }, [visible, winnerSide, onDone]);

  if (!visible || winnerSide === null) return null;
  const flyClass = winnerSide === "left" ? "animate-chip-fly-left" : "animate-chip-fly-right";

  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
      <div className="relative">
        {/* Multiple chips with staggered delays */}
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`absolute -left-3 -top-3 text-3xl ${flyClass}`}
            style={{
              animationDelay: `${i * 90}ms`,
              animationDuration: `${1.4 + i * 0.08}s`,
            }}
          >
            💰
          </span>
        ))}
        <span className="font-arcade text-3xl glow-yellow opacity-40">{potAmount}</span>
      </div>
    </div>
  );
}

/* ───────────────────────── Fighter reel (lobby) ───────────────────────── */

export function FighterReel({
  fighters,
  className = "",
}: {
  fighters: Fighter[];
  className?: string;
}) {
  const stream = [...fighters, ...fighters];
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="marquee-track py-2">
        {stream.map((f, i) => (
          <div
            key={`${f.id}-${i}`}
            className="relative inline-flex items-center gap-3 px-4 py-2 mr-4 rounded-md border border-foreground/15 bg-card/50"
          >
            <div
              className="relative w-12 h-12 rounded-sm overflow-hidden"
              style={{ boxShadow: `0 0 14px ${f.color}55` }}
            >
              <Image src={f.portrait} alt={f.name} fill sizes="48px" className="object-contain" />
            </div>
            <div>
              <p className={`font-arcade text-[10px] ${f.glowClass} tracking-widest`}>
                {f.name.toUpperCase()}
              </p>
              <p className="font-terminal text-xs text-muted-foreground">{f.archetype}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
