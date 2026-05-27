"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCrypto } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import { formatClock, DEFAULT_TURN_MS } from "@/lib/match";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function BattlePage() {
  const router = useRouter();
  const { state, role, send } = useMatch();

  const p1Char = state.p1.cryptoId ? getCrypto(state.p1.cryptoId) : null;
  const p2Char = state.p2.cryptoId ? getCrypto(state.p2.cryptoId) : null;

  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const turnRemaining = state.battle.turnEndsAt
    ? Math.max(0, state.battle.turnEndsAt - now)
    : 0;
  const turnPct = state.battle.turnEndsAt
    ? Math.min(100, Math.max(0, (turnRemaining / DEFAULT_TURN_MS) * 100))
    : 0;
  const isCritical = turnRemaining > 0 && turnRemaining < 5_000;

  useEffect(() => {
    if (state.phase !== "battle") return;
    if (role !== state.battle.turnOwner) return;
    if (!state.battle.turnEndsAt) return;
    if (now < state.battle.turnEndsAt) return;
    send({ type: "ROTATE_TURN", at: now });
  }, [now, state.phase, state.battle.turnEndsAt, state.battle.turnOwner, role, send]);

  useEffect(() => {
    if (state.phase === "results") router.push("/results");
  }, [state.phase, router]);

  const isMyTurn = (role === "p1" || role === "p2") && state.battle.turnOwner === role;
  const canVote = role === "audience" && state.phase === "battle";

  if (!p1Char || !p2Char) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-terminal text-xl text-muted-foreground">
          Waiting for fighters…
        </p>
      </main>
    );
  }

  const totalVotes = state.votes.p1 + state.votes.p2;
  const p1Pct = totalVotes > 0 ? (state.votes.p1 / totalVotes) * 100 : 50;
  const p2Pct = 100 - p1Pct;
  const pot = state.wager.p1.amount + state.wager.p2.amount;

  return (
    <main className="arena-haze flex-1 grid grid-rows-[auto_auto_1fr_auto] gap-3 px-3 sm:px-6 py-3 sm:py-4 overflow-hidden">
      {/* HUD ROW */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4">
        <FighterHud
          char={p1Char}
          votes={state.votes.p1}
          pct={p1Pct}
          side="left"
          isTurn={state.battle.turnOwner === "p1"}
          isYou={role === "p1"}
        />

        {/* CENTER ARENA COLUMN */}
        <div className="flex flex-col items-center gap-1 px-2 sm:px-4 min-w-[140px] sm:min-w-[180px]">
          <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
            ROUND {state.battle.rounds.current}/{state.battle.rounds.max}
          </p>
          <p
            className={`font-arcade text-3xl sm:text-5xl tabular-nums leading-none ${
              isCritical ? "glow-red animate-pulse-glow" : "glow-yellow"
            }`}
          >
            {formatClock(turnRemaining)}
          </p>
          <div className="w-full h-1 rounded bg-muted/60 overflow-hidden">
            <div
              className={`h-full transition-[width] duration-200 ${
                isCritical ? "bg-neon-red" : "bg-neon-yellow"
              }`}
              style={{ width: `${turnPct}%` }}
            />
          </div>
          <Badge
            variant="outline"
            className={`font-arcade text-[9px] mt-1 ${
              state.battle.turnOwner === "p1"
                ? "border-neon-red/70 text-neon-red"
                : "border-neon-blue/70 text-neon-blue"
            }`}
          >
            {state.battle.turnOwner.toUpperCase()} SPEAKING
          </Badge>
          {pot > 0 && (
            <p className="font-arcade text-[10px] glow-green mt-0.5">
              💰 POT {pot}
            </p>
          )}
        </div>

        <FighterHud
          char={p2Char}
          votes={state.votes.p2}
          pct={p2Pct}
          side="right"
          isTurn={state.battle.turnOwner === "p2"}
          isYou={role === "p2"}
        />
      </div>

      {/* SPLIT VOTE METER */}
      <div className="relative h-2.5 rounded bg-muted/60 overflow-hidden border border-border">
        <div
          className="absolute inset-y-0 left-0 bg-neon-red transition-[width] duration-300 bar-shimmer"
          style={{ width: `${p1Pct}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-neon-blue transition-[width] duration-300 bar-shimmer"
          style={{ width: `${p2Pct}%` }}
        />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-foreground/40" />
      </div>

      {/* ARGUMENT FEED */}
      <ArgumentFeed
        posts={state.battle.posts}
        p1Char={p1Char}
        p2Char={p2Char}
        canVote={canVote}
        onVote={(target, postId) => send({ type: "VOTE", role: target, postId })}
      />

      {/* INPUT DOCK */}
      {role === "p1" || role === "p2" ? (
        <Composer
          disabled={!isMyTurn}
          turnLabel={
            isMyTurn ? "YOUR TURN — speak your case" : "Opponent is speaking…"
          }
          mySide={role}
          onSubmit={(text, mode) => send({ type: "POST_ARGUMENT", role, text, mode })}
        />
      ) : (
        <AudienceBar
          onVote={(target) => send({ type: "VOTE", role: target })}
          p1Ticker={p1Char.ticker}
          p2Ticker={p2Char.ticker}
        />
      )}
    </main>
  );
}

/* ---------------------------------------------------------------------- */

function FighterHud({
  char,
  votes,
  pct,
  side,
  isTurn,
  isYou,
}: {
  char: NonNullable<ReturnType<typeof getCrypto>>;
  votes: number;
  pct: number;
  side: "left" | "right";
  isTurn: boolean;
  isYou: boolean;
}) {
  const align = side === "left" ? "text-left" : "text-right";
  const flexAlign = side === "left" ? "" : "flex-row-reverse";
  const color = side === "left" ? "glow-red" : "glow-blue";
  const ring = side === "left" ? "ring-glow-red" : "ring-glow-blue";
  const borderTurn = side === "left" ? "border-neon-red" : "border-neon-blue";
  const accent = side === "left" ? "text-neon-red" : "text-neon-blue";
  const bar = side === "left" ? "bg-neon-red" : "bg-neon-blue";

  return (
    <div
      className={`relative p-3 sm:p-4 rounded-md border-2 bg-card/80 backdrop-blur-sm transition-all ${
        isTurn ? `${borderTurn} ${ring}` : "border-border"
      }`}
    >
      {/* corner notches */}
      <span className={`absolute top-0 ${side === "left" ? "left-0" : "right-0"} w-3 h-3 border-t-2 border-l-2 ${side === "left" ? "" : "rotate-90"} ${isTurn ? borderTurn : "border-border"}`} />
      <span className={`absolute bottom-0 ${side === "left" ? "right-0" : "left-0"} w-3 h-3 border-b-2 border-r-2 ${side === "left" ? "" : "rotate-90"} ${isTurn ? borderTurn : "border-border"}`} />

      <div className={`flex gap-3 items-center ${flexAlign}`}>
        <div
          className={`shrink-0 grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-sm border ${
            isTurn ? borderTurn : "border-border"
          } bg-background/60 font-arcade text-sm sm:text-base ${color}`}
        >
          {char.ticker}
        </div>
        <div className={`${align} flex-1 min-w-0`}>
          <p className={`font-arcade text-[10px] ${accent} tracking-widest`}>
            {side === "left" ? "RED CORNER" : "BLUE CORNER"}
            {isYou && " · YOU"}
          </p>
          <p className="font-terminal text-lg sm:text-xl truncate">{char.name}</p>
          <p className="font-arcade text-[10px] text-muted-foreground mt-0.5">
            {votes} VOTE{votes === 1 ? "" : "S"} · {Math.round(pct)}%
          </p>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded bg-muted/60 overflow-hidden">
        <div
          className={`h-full ${bar} transition-[width] duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isTurn && (
        <p
          className={`mt-1.5 font-arcade text-[9px] ${accent} ${align} animate-flicker tracking-widest`}
        >
          ◉ NOW SPEAKING
        </p>
      )}
    </div>
  );
}

function ArgumentFeed({
  posts,
  p1Char,
  p2Char,
  canVote,
  onVote,
}: {
  posts: import("@/lib/match").ArgumentPost[];
  p1Char: NonNullable<ReturnType<typeof getCrypto>>;
  p2Char: NonNullable<ReturnType<typeof getCrypto>>;
  canVote: boolean;
  onVote: (target: "p1" | "p2", postId: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [posts.length]);

  return (
    <div
      ref={scrollerRef}
      className="min-h-0 overflow-y-auto rounded-md border border-border bg-background/40 backdrop-blur-sm p-3 sm:p-4 space-y-3"
    >
      {posts.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center py-12 gap-3">
          <p className="font-arcade text-2xl text-muted-foreground/40">⚔</p>
          <p className="font-arcade text-xs text-muted-foreground animate-flicker tracking-widest">
            AWAITING FIRST STRIKE…
          </p>
        </div>
      ) : (
        posts.map((p, i) => {
          const char = p.role === "p1" ? p1Char : p2Char;
          const isLeft = p.role === "p1";
          return (
            <div
              key={p.id}
              className={`flex gap-2 sm:gap-3 animate-post-in ${
                isLeft ? "" : "flex-row-reverse"
              }`}
              style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
            >
              {/* avatar chip */}
              <div
                className={`shrink-0 grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-sm border ${
                  isLeft ? "border-neon-red/60" : "border-neon-blue/60"
                } bg-card font-arcade text-[10px] sm:text-xs ${
                  isLeft ? "glow-red" : "glow-blue"
                }`}
              >
                {char.ticker}
              </div>

              {/* speech bubble */}
              <div
                className={`relative max-w-[80%] sm:max-w-[70%] rounded-md border p-3 ${
                  isLeft
                    ? "border-neon-red/50 bg-neon-red/[0.06]"
                    : "border-neon-blue/50 bg-neon-blue/[0.06]"
                }`}
              >
                {/* tail */}
                <span
                  className={`absolute top-3 w-2 h-2 rotate-45 border ${
                    isLeft
                      ? "-left-[5px] border-l border-b border-neon-red/50 bg-[oklch(0.21_0.04_270)]"
                      : "-right-[5px] border-r border-t border-neon-blue/50 bg-[oklch(0.21_0.04_270)]"
                  }`}
                />
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span
                    className={`font-arcade text-[10px] tracking-widest ${
                      isLeft ? "glow-red" : "glow-blue"
                    }`}
                  >
                    {char.ticker} · {p.mode === "voice" ? "🎤" : "⌨"}
                  </span>
                  <span className="font-arcade text-[9px] text-muted-foreground">
                    {p.votes.total} VOTE{p.votes.total === 1 ? "" : "S"}
                  </span>
                </div>
                <p className="font-terminal text-lg leading-snug">{p.text}</p>
                {canVote && (
                  <div className={`mt-2 flex ${isLeft ? "" : "justify-end"}`}>
                    <Button
                      onClick={() => onVote(p.role, p.id)}
                      size="sm"
                      variant="outline"
                      className={`font-arcade text-[10px] h-7 ${
                        isLeft
                          ? "border-neon-red/60 hover:bg-neon-red/15 hover:text-neon-red"
                          : "border-neon-blue/60 hover:bg-neon-blue/15 hover:text-neon-blue"
                      }`}
                    >
                      ▲ +1 {char.ticker}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function Composer({
  disabled,
  turnLabel,
  mySide,
  onSubmit,
}: {
  disabled: boolean;
  turnLabel: string;
  mySide: "p1" | "p2";
  onSubmit: (text: string, mode: import("@/lib/match").TurnInputMode) => void;
}) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const accent =
    mySide === "p1"
      ? "border-neon-red/50 focus-visible:ring-neon-red"
      : "border-neon-blue/50 focus-visible:ring-neon-blue";
  const accentBtn =
    mySide === "p1"
      ? "bg-neon-red/90 hover:bg-neon-red text-white shadow-[0_0_18px_rgba(255,45,85,0.5)]"
      : "bg-neon-blue/90 hover:bg-neon-blue text-white shadow-[0_0_18px_rgba(45,140,255,0.5)]";

  const startVoice = () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      alert("Voice not supported in this browser. Try Chrome/Edge.");
      setMode("text");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      setText(full);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t, mode);
    setText("");
    if (listening) stopVoice();
  };

  return (
    <div
      className={`rounded-md border-2 ${disabled ? "border-border opacity-70" : accent} bg-card/90 backdrop-blur-sm p-3 space-y-2 transition-all`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-arcade text-[10px] text-muted-foreground tracking-widest truncate">
          {turnLabel}
        </p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mode === "text" ? "default" : "outline"}
            onClick={() => {
              setMode("text");
              if (listening) stopVoice();
            }}
            className="font-arcade text-[10px] h-7"
          >
            ⌨ TEXT
          </Button>
          <Button
            size="sm"
            variant={mode === "voice" ? "default" : "outline"}
            onClick={() => {
              setMode("voice");
              if (!listening) startVoice();
            }}
            className={`font-arcade text-[10px] h-7 ${listening ? "bg-neon-red/90 text-white hover:bg-neon-red animate-pulse-glow" : ""}`}
          >
            {listening ? "● REC" : "🎤 VOICE"}
          </Button>
        </div>
      </div>

      {listening && <VoiceVisualizer />}

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          disabled={disabled}
          placeholder={disabled ? "Wait for your turn…" : "Make your point (max 280 chars)…"}
          maxLength={280}
          className="font-terminal text-lg flex-1"
        />
        <Button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className={`font-arcade text-xs px-4 ${!disabled && text.trim() ? accentBtn : ""}`}
        >
          POST →
        </Button>
      </div>
      <p className="font-arcade text-[9px] text-muted-foreground text-right">
        {text.length}/280
      </p>
    </div>
  );
}

function VoiceVisualizer() {
  return (
    <div className="flex items-end justify-center gap-1 h-6">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="w-1 bg-neon-red rounded-sm animate-pulse-glow"
          style={{
            height: `${20 + ((i * 37) % 80)}%`,
            animationDelay: `${i * 70}ms`,
            animationDuration: `${600 + ((i * 53) % 400)}ms`,
          }}
        />
      ))}
    </div>
  );
}

function AudienceBar({
  onVote,
  p1Ticker,
  p2Ticker,
}: {
  onVote: (target: "p1" | "p2") => void;
  p1Ticker: string;
  p2Ticker: string;
}) {
  return (
    <div className="rounded-md border-2 border-neon-green/40 bg-card/90 backdrop-blur-sm p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 items-center justify-center">
      <p className="font-arcade text-[10px] text-neon-green tracking-widest sm:mr-2 animate-flicker">
        CROWD VOTE
      </p>
      <div className="flex gap-3 w-full sm:w-auto">
        <Button
          onClick={() => onVote("p1")}
          variant="outline"
          className="flex-1 sm:flex-none font-arcade text-xs h-11 px-6 border-neon-red/60 hover:bg-neon-red/15 hover:text-neon-red active:animate-vote-pulse"
        >
          ▲ {p1Ticker}
        </Button>
        <Button
          onClick={() => onVote("p2")}
          variant="outline"
          className="flex-1 sm:flex-none font-arcade text-xs h-11 px-6 border-neon-blue/60 hover:bg-neon-blue/15 hover:text-neon-blue active:animate-vote-pulse"
        >
          {p2Ticker} ▲
        </Button>
      </div>
    </div>
  );
}

declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly length: number;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  class SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: Event) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }
}
