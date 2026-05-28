"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMatch } from "@/lib/use-match";
import { getWallet, resetWallets } from "@/lib/match";
import { FIGHTER_ROSTER } from "@/data/fighters";
import { BroadcastTicker } from "@/components/broadcast";

type RoleKey = "p1" | "p2" | "audience";

export default function LobbyPage() {
  const router = useRouter();
  const { state, role, hydrated, claimRole, send } = useMatch();
  const [wallets, setWallets] = useState<{ p1: number; p2: number } | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    setWallets({ p1: getWallet("p1"), p2: getWallet("p2") });
  }, [hydrated, state.matchId, state.phase]);

  const joinAs = (r: RoleKey, fresh = false) => {
    if (fresh) send({ type: "RESET" });
    claimRole(r);
    if (r === "audience") {
      router.push(state.phase === "battle" ? "/battle" : "/spectate");
    } else {
      router.push("/select");
    }
  };

  const onResetWallets = () => {
    resetWallets();
    setWallets({ p1: 100, p2: 100 });
  };

  return (
    <main className="relative flex-1 flex flex-col overflow-hidden">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 -z-10 lobby-aura" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.6),transparent_60%)]" />

      {/* TOP BAR — minimal */}
      <header className="flex items-center justify-between px-5 sm:px-8 pt-5 sm:pt-7 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
          <span className="type-mono text-xs text-foreground/60">
            MATCH · {state.matchId}
          </span>
          {role && (
            <span className="type-mono text-xs text-foreground/80">
              YOU · {role.toUpperCase()}
            </span>
          )}
        </div>
        <button
          onClick={onResetWallets}
          className="type-mono text-xs text-foreground/40 hover:text-foreground/80"
          title="Reset both wallets to 100 PXL"
        >
          ⟲ reset wallets
        </button>
      </header>

      {/* HERO */}
      <section className="flex-1 flex flex-col justify-center px-5 sm:px-8 py-8 sm:py-12 min-h-0">
        {/* Title block — modern display type */}
        <div className="max-w-5xl mb-8 sm:mb-12">
          <p className="type-eyebrow text-foreground/50 mb-3">
            ▷ Tonight&apos;s Main Event
          </p>
          <h1 className="type-display text-[clamp(2.5rem,7vw,5.5rem)] text-foreground">
            Crypto Battle
            <br className="hidden md:block" />
            <span className="text-foreground/45 font-light">Arena</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-foreground/70 max-w-2xl leading-relaxed">
            Pick a fighter. Defend your coin. Win the crowd. Five rounds,
            sixty-second turns, winner takes the pot.
          </p>
        </div>

        {/* THREE ROLE ZONES — the hero affordance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <RoleZone
            kind="p1"
            label="Red Corner"
            subtitle="Player 1"
            description="Start the fight. Pick your fighter and stake your coin."
            cta="Enter the ring →"
            accent="red"
            wallet={wallets?.p1}
            previewFighter={FIGHTER_ROSTER[0]}
            onClick={() => joinAs("p1", true)}
          />
          <RoleZone
            kind="p2"
            label="Blue Corner"
            subtitle="Player 2"
            description="Challenge the red corner. Same picks, opposing claims."
            cta="Take the challenge →"
            accent="blue"
            wallet={wallets?.p2}
            previewFighter={FIGHTER_ROSTER[1]}
            onClick={() => joinAs("p2")}
          />
          <RoleZone
            kind="audience"
            label="The Crowd"
            subtitle="Spectator"
            description="Watch live. Vote on every argument. The crowd decides who wins."
            cta="Join the crowd →"
            accent="green"
            onClick={() => joinAs("audience")}
          />
        </div>

        {/* Bottom hint */}
        <p className="mt-8 type-mono text-xs text-foreground/40 text-center">
          Need three tabs (P1 · P2 · Audience) on the same browser. Multiplayer
          across devices is coming.
        </p>

        {/* Roster preview */}
        <div className="mt-8">
          <p className="type-eyebrow text-foreground/40 mb-3 text-center">
            ◇ On the card · {FIGHTER_ROSTER.length} fighters
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {FIGHTER_ROSTER.map((f) => (
              <div
                key={f.id}
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-foreground/15"
                style={{ boxShadow: `0 0 14px ${f.color}33` }}
                title={`${f.name} · ${f.archetype}`}
              >
                <Image src={f.portrait} alt={f.name} fill sizes="64px" className="object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <BroadcastTicker
        items={[
          "TONIGHT · MAIN EVENT",
          "5 ROUNDS · 60s TURNS",
          "WINNER TAKES THE POT",
          `${FIGHTER_ROSTER.length} FIGHTERS ON THE CARD`,
          "PICK A FIGHTER · DEFEND YOUR COIN",
        ]}
        accent="yellow"
      />

      <Link
        href="/spectate"
        className="absolute bottom-12 right-6 type-mono text-xs text-foreground/40 hover:text-foreground/90 hidden sm:inline-block"
      >
        skip to spectator view →
      </Link>
    </main>
  );
}

/* ───────────────────────── Role zone ───────────────────────────────── */

type Accent = "red" | "blue" | "green";

function RoleZone({
  kind,
  label,
  subtitle,
  description,
  cta,
  accent,
  wallet,
  previewFighter,
  onClick,
}: {
  kind: RoleKey;
  label: string;
  subtitle: string;
  description: string;
  cta: string;
  accent: Accent;
  wallet?: number;
  previewFighter?: (typeof FIGHTER_ROSTER)[number];
  onClick: () => void;
}) {
  const accentMap: Record<Accent, { surface: string; border: string; text: string; chip: string; ring: string }> = {
    red: {
      surface: "surface-red",
      border: "border-red-500/40 hover:border-red-500",
      text: "text-red-300",
      chip: "bg-red-500/15 text-red-300 border-red-500/40",
      ring: "hover:ring-1 hover:ring-red-500/60 hover:shadow-[0_0_30px_rgba(255,45,85,0.35)]",
    },
    blue: {
      surface: "surface-blue",
      border: "border-blue-500/40 hover:border-blue-500",
      text: "text-blue-300",
      chip: "bg-blue-500/15 text-blue-300 border-blue-500/40",
      ring: "hover:ring-1 hover:ring-blue-500/60 hover:shadow-[0_0_30px_rgba(45,140,255,0.35)]",
    },
    green: {
      surface: "surface-green",
      border: "border-emerald-500/40 hover:border-emerald-500",
      text: "text-emerald-300",
      chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
      ring: "hover:ring-1 hover:ring-emerald-500/60 hover:shadow-[0_0_30px_rgba(57,255,122,0.35)]",
    },
  };
  const a = accentMap[accent];

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border ${a.border} ${a.surface} ${a.ring} p-5 sm:p-6 text-left transition-all duration-300 min-h-[260px] flex flex-col`}
    >
      {/* Fighter portrait peeking from the side */}
      {previewFighter && (
        <div className="absolute -right-8 -bottom-6 w-44 h-44 sm:w-52 sm:h-52 opacity-50 group-hover:opacity-80 transition-opacity">
          <Image
            src={previewFighter.portrait}
            alt=""
            fill
            sizes="200px"
            className="object-contain object-bottom-right"
          />
        </div>
      )}

      {/* Crowd zone gets a stylized icon instead */}
      {!previewFighter && accent === "green" && (
        <div className="absolute right-3 bottom-3 text-7xl opacity-30 group-hover:opacity-60 transition-opacity leading-none">
          ◉
        </div>
      )}

      <div className="relative z-10 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium tracking-wider uppercase ${a.chip}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${accent === "red" ? "bg-red-500" : accent === "blue" ? "bg-blue-500" : "bg-emerald-500"}`} />
            {subtitle}
          </span>
        </div>
        <h2 className={`type-display text-3xl sm:text-4xl mt-3 ${a.text}`}>
          {label}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-foreground/70 max-w-[20rem] leading-snug">
          {description}
        </p>
      </div>

      <div className="relative z-10 flex items-end justify-between mt-4">
        <div className="space-y-1">
          {typeof wallet === "number" && (
            <p className="type-mono text-xs text-foreground/60">
              💰 {wallet} PXL
            </p>
          )}
          {kind === "audience" && (
            <p className="type-mono text-xs text-foreground/60">
              no wager · no risk
            </p>
          )}
        </div>
        <span className={`text-sm font-medium ${a.text} group-hover:translate-x-1 transition-transform`}>
          {cta}
        </span>
      </div>
    </button>
  );
}
