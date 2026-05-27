"use client";

import Image from "next/image";
import type { Fighter } from "@/data/fighters";

const SIZE_MAP = {
  xs: { box: 36, img: 32 },
  sm: { box: 56, img: 48 },
  md: { box: 88, img: 80 },
  lg: { box: 128, img: 116 },
  xl: { box: 192, img: 176 },
  "2xl": { box: 260, img: 240 },
} as const;

export type PortraitSize = keyof typeof SIZE_MAP;

export function FighterPortrait({
  fighter,
  size = "md",
  corner,
  showName = false,
  showToken,
  className = "",
}: {
  fighter: Fighter | null | undefined;
  size?: PortraitSize;
  /** Optional corner accent layered on top of the fighter's brand color. */
  corner?: "red" | "blue" | "green" | null;
  /** Show the fighter's character name (e.g., "The Veteran") under the portrait. */
  showName?: boolean;
  /** Show the user-assigned token name (e.g., "BTC") below the portrait. */
  showToken?: string;
  className?: string;
}) {
  const dims = SIZE_MAP[size];

  if (!fighter) {
    return (
      <div
        className={`relative grid place-items-center rounded-md border-2 border-dashed border-border bg-card/50 ${className}`}
        style={{ width: dims.box, height: dims.box }}
        aria-hidden
      >
        <span className="font-arcade text-muted-foreground/40 animate-flicker text-2xl">
          ?
        </span>
      </div>
    );
  }

  const cornerCls =
    corner === "red"
      ? "border-neon-red ring-glow-red"
      : corner === "blue"
      ? "border-neon-blue ring-glow-blue"
      : corner === "green"
      ? "border-neon-green ring-glow-green"
      : "border-foreground/30";

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div
        className={`relative overflow-hidden rounded-md border-2 ${cornerCls} bg-card/80 backdrop-blur-sm`}
        style={{
          width: dims.box,
          height: dims.box,
          boxShadow: `0 0 24px ${fighter.color}66, inset 0 0 24px ${fighter.color}22`,
        }}
      >
        {/* brand-color halo */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${fighter.color}55 0%, transparent 70%)`,
          }}
        />
        <Image
          src={fighter.portrait}
          alt={fighter.name}
          width={dims.img}
          height={dims.img}
          className="absolute inset-0 m-auto object-contain"
          priority={size === "xl" || size === "2xl"}
        />
        {/* corner ticks */}
        <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-foreground/40" />
        <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-foreground/40" />
        <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-foreground/40" />
        <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-foreground/40" />
      </div>

      {showToken !== undefined && showToken !== "" && (
        <span
          className="px-2 py-0.5 rounded border border-foreground/30 bg-background font-arcade text-[10px] tracking-widest"
          style={{ color: fighter.color }}
        >
          {showToken}
        </span>
      )}
      {showName && (
        <span className={`font-arcade text-[10px] tracking-widest ${fighter.glowClass}`}>
          {fighter.name.toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function FighterBadge({
  fighter,
  size = "xs",
  className = "",
}: {
  fighter: Fighter | null | undefined;
  size?: PortraitSize;
  className?: string;
}) {
  const dims = SIZE_MAP[size];
  if (!fighter) {
    return (
      <span
        className={`inline-grid place-items-center rounded-sm border border-border bg-card/60 ${className}`}
        style={{ width: dims.box, height: dims.box }}
        aria-hidden
      >
        ?
      </span>
    );
  }
  return (
    <span
      className={`relative inline-block overflow-hidden rounded-sm border border-foreground/30 bg-card/80 ${className}`}
      style={{
        width: dims.box,
        height: dims.box,
        boxShadow: `0 0 10px ${fighter.color}66`,
      }}
    >
      <span
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${fighter.color}55, transparent 70%)` }}
      />
      <Image
        src={fighter.portrait}
        alt={fighter.name}
        width={dims.img}
        height={dims.img}
        className="absolute inset-0 m-auto object-contain"
      />
    </span>
  );
}
