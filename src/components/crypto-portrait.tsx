"use client";

import * as React from "react";
import type { CryptoCharacter } from "@/data/cryptos";

/* ───────────────────────── Brand SVG icons ────────────────────────────── */

type IconProps = { size?: number };

function BitcoinIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        fill="#fff"
        d="M21.7 14.4c.4-2-1-3-3.2-3.7l.7-2.8-1.7-.4-.7 2.7c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.3l-2.4-.6-.5 1.8s1.3.3 1.3.3c.7.2.8.6.8 1l-.8 3.2c.1 0 .1 0 .2.1l-.2-.1L11.7 18c0 .2-.3.5-.7.4l-1.3-.3-.9 2 2.3.6 1.3.3-.7 2.9 1.7.4.7-2.8c.5.1.9.2 1.4.4l-.7 2.8 1.7.4.7-2.9c2.9.6 5.2.3 6.1-2.4.8-2.1-.1-3.4-1.7-4.2 1.1-.3 2-1 2.2-2.5zm-4 5.6c-.5 2.2-4.2 1-5.4.7l1-3.8c1.1.3 4.9.9 4.4 3.1zm.6-5.7c-.5 1.9-3.5 1-4.5.7l.9-3.5c1 .2 4.1.7 3.6 2.8z"
      />
    </svg>
  );
}

function EthereumIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#fff">
        <path opacity=".6" d="M16 4v8.87l7.5 3.35z" />
        <path d="M16 4 8.5 16.22 16 12.87z" />
        <path opacity=".6" d="M16 21.97v6.03L23.5 17.6z" />
        <path d="M16 28v-6.03L8.5 17.6z" />
        <path opacity=".2" d="m16 20.57 7.5-4.35L16 12.87z" />
        <path opacity=".6" d="m8.5 16.22 7.5 4.35v-7.7z" />
      </g>
    </svg>
  );
}

function SolanaIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="sol-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="#181E33" />
      <g fill="url(#sol-a)">
        <path d="M9.5 21.5c.2-.2.4-.3.7-.3h13c.3 0 .5.4.2.6l-2.6 2.6c-.2.2-.4.3-.7.3h-13c-.3 0-.5-.4-.2-.6l2.6-2.6z" />
        <path d="M9.5 11.5c.2-.2.4-.3.7-.3h13c.3 0 .5.4.2.6l-2.6 2.6c-.2.2-.4.3-.7.3h-13c-.3 0-.5-.4-.2-.6l2.6-2.6z" />
        <path d="M20.5 16.5c-.2-.2-.4-.3-.7-.3h-13c-.3 0-.5.4-.2.6l2.6 2.6c.2.2.4.3.7.3h13c.3 0 .5-.4.2-.6l-2.6-2.6z" />
      </g>
    </svg>
  );
}

function DogecoinIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#C2A633" />
      <path
        fill="#fff"
        d="M14.6 14.6h4.6v2.4h-4.6v5.1H17c1.2 0 2.1-.2 2.9-.5.7-.3 1.3-.7 1.7-1.3.4-.5.7-1.2.8-1.9.1-.7.2-1.5.2-2.4 0-.9-.1-1.7-.2-2.4-.1-.7-.4-1.3-.8-1.9-.4-.5-1-1-1.7-1.3-.7-.3-1.7-.5-2.9-.5h-2.4v4.6zm-2.6 2.4h-1.5v-2.4H12V7.5h6.6c1.3 0 2.4.2 3.3.6.9.4 1.7 1 2.3 1.7.6.8 1 1.7 1.3 2.7.3 1 .4 2.1.4 3.3 0 1.2-.1 2.3-.4 3.3-.3 1-.7 1.9-1.3 2.7-.6.8-1.4 1.4-2.3 1.7-.9.4-2 .6-3.3.6H12v-7.1z"
      />
    </svg>
  );
}

function XrpIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#23292F" />
      <g fill="#fff">
        <path d="M22.6 9.5h2.6L19.9 14.7a4.8 4.8 0 0 1-7.1 0L7.2 9.5h2.6L13.9 13.5a3.4 3.4 0 0 0 4.5 0l4.2-4z" />
        <path d="M9.7 22.5H7L12.7 17a4.8 4.8 0 0 1 7.1 0l5.7 5.5h-2.7l-4.1-4.1a3.4 3.4 0 0 0-4.5 0L9.7 22.5z" />
      </g>
    </svg>
  );
}

function CardanoIcon({ size = 32 }: IconProps) {
  // Stylised Cardano "ouroboros" — concentric dot constellation.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#0033AD" />
      <g fill="#fff">
        <circle cx="16" cy="16" r="1.6" />
        {/* inner ring */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const r = 5;
          const x = 16 + Math.cos((deg * Math.PI) / 180) * r;
          const y = 16 + Math.sin((deg * Math.PI) / 180) * r;
          return <circle key={`i${deg}`} cx={x} cy={y} r="1" />;
        })}
        {/* outer ring */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const r = 9.5;
          const x = 16 + Math.cos((deg * Math.PI) / 180) * r;
          const y = 16 + Math.sin((deg * Math.PI) / 180) * r;
          return <circle key={`o${deg}`} cx={x} cy={y} r="0.9" />;
        })}
      </g>
    </svg>
  );
}

function BnbIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <g fill="#fff">
        {/* Four diamond shapes around center */}
        <path d="M16 6.5 12.6 10l1.7 1.7L16 9.9l1.7 1.7L19.4 10z" />
        <path d="M9.9 14.3 8.1 16l1.7 1.7L11.6 16z" />
        <path d="M22.1 14.3 20.4 16l1.7 1.7L23.9 16z" />
        <path d="M16 22.1l-1.7 1.7L16 25.5l1.7-1.7z" />
        <path d="m13.3 16 2.7-2.7 2.7 2.7-2.7 2.7z" />
      </g>
    </svg>
  );
}

function ChainlinkIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#2A5ADA" />
      <path
        fill="#fff"
        d="M16 5 6.5 10.5v11L16 27l9.5-5.5v-11L16 5zm0 4.4 5.7 3.3v6.6L16 22.6l-5.7-3.3v-6.6L16 9.4z"
      />
    </svg>
  );
}

/* ───────────────────────── Lookup map ─────────────────────────────────── */

const ICONS: Record<string, React.FC<IconProps>> = {
  btc: BitcoinIcon,
  eth: EthereumIcon,
  sol: SolanaIcon,
  doge: DogecoinIcon,
  xrp: XrpIcon,
  ada: CardanoIcon,
  bnb: BnbIcon,
  link: ChainlinkIcon,
};

/* ───────────────────────── Portrait frame ─────────────────────────────── */

const SIZE_MAP = {
  xs: { box: 28, icon: 18, ticker: "text-[8px]", pad: "p-1" },
  sm: { box: 44, icon: 28, ticker: "text-[9px]", pad: "p-1.5" },
  md: { box: 68, icon: 44, ticker: "text-[10px]", pad: "p-2" },
  lg: { box: 96, icon: 64, ticker: "text-xs", pad: "p-2.5" },
  xl: { box: 128, icon: 84, ticker: "text-sm", pad: "p-3" },
} as const;

export type PortraitSize = keyof typeof SIZE_MAP;

export function CryptoPortrait({
  crypto,
  size = "md",
  corner,
  showTicker = false,
  className = "",
}: {
  crypto: CryptoCharacter | null | undefined;
  size?: PortraitSize;
  /** Optional corner accent (red / blue / green) layered on top of the brand color. */
  corner?: "red" | "blue" | "green" | null;
  showTicker?: boolean;
  className?: string;
}) {
  const dims = SIZE_MAP[size];

  if (!crypto) {
    return (
      <div
        className={`relative grid place-items-center rounded-sm border border-border bg-card/60 ${dims.pad} ${className}`}
        style={{ width: dims.box, height: dims.box }}
        aria-hidden
      >
        <span className="font-arcade text-muted-foreground/40 animate-flicker">?</span>
      </div>
    );
  }

  const Icon = ICONS[crypto.id];
  const cornerRing =
    corner === "red"
      ? "ring-glow-red border-neon-red"
      : corner === "blue"
      ? "ring-glow-blue border-neon-blue"
      : corner === "green"
      ? "ring-glow-green border-neon-green"
      : "border-foreground/30";

  return (
    <div
      className={`relative ${className}`}
      style={{ width: dims.box, height: dims.box }}
    >
      {/* Hexagonal-ish frame: rotated square + brand halo */}
      <div
        className={`absolute inset-0 rounded-md border-2 ${cornerRing} bg-card/80 backdrop-blur-sm overflow-hidden`}
        style={{
          boxShadow: `0 0 18px ${crypto.color}55, inset 0 0 24px ${crypto.color}33`,
        }}
      >
        {/* brand-tinted halo behind logo */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(circle at center, ${crypto.color}40 0%, transparent 70%)`,
          }}
        />
        {/* corner ticks */}
        <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-foreground/40" />
        <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-foreground/40" />
        <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-foreground/40" />
        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-foreground/40" />

        {/* the logo */}
        <div className="absolute inset-0 grid place-items-center">
          {Icon ? <Icon size={dims.icon} /> : (
            <span className="font-arcade" style={{ color: crypto.color }}>
              {crypto.ticker}
            </span>
          )}
        </div>
      </div>

      {/* Ticker label tab at the bottom */}
      {showTicker && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded border border-foreground/30 bg-background font-arcade tracking-widest"
          style={{ color: crypto.color, fontSize: 10 }}
        >
          {crypto.ticker}
        </div>
      )}
    </div>
  );
}

export function CryptoBadge({
  crypto,
  size = "xs",
  className = "",
}: {
  crypto: CryptoCharacter | null | undefined;
  size?: PortraitSize;
  className?: string;
}) {
  const dims = SIZE_MAP[size];
  if (!crypto) {
    return (
      <span
        className={`inline-grid place-items-center rounded-sm border border-border bg-card/60 ${className}`}
        style={{ width: dims.box, height: dims.box }}
      >
        ?
      </span>
    );
  }
  const Icon = ICONS[crypto.id];
  return (
    <span
      className={`relative inline-grid place-items-center rounded-sm border border-foreground/30 bg-card/80 overflow-hidden ${className}`}
      style={{ width: dims.box, height: dims.box, boxShadow: `0 0 8px ${crypto.color}66` }}
    >
      <span
        className="absolute inset-0 opacity-50"
        style={{ background: `radial-gradient(circle, ${crypto.color}55, transparent 70%)` }}
      />
      {Icon ? <Icon size={dims.icon} /> : <span>{crypto.ticker}</span>}
    </span>
  );
}
