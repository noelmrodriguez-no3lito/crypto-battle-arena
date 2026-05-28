"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFighter, type Fighter } from "@/data/fighters";
import { useMatch } from "@/lib/use-match";
import { formatClock, DEFAULT_TURN_MS, roundType, roundLabel } from "@/lib/match";
import { filterQuestions, QUESTION_POOL, type Question } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArenaBackdrop,
  BroadcastTicker,
  LowerThird,
  StatCallout,
} from "@/components/broadcast";

export default function BattlePage() {
  const router = useRouter();
  const { state, role, send } = useMatch();

  const p1Char = getFighter(state.p1.fighterId);
  const p2Char = getFighter(state.p2.fighterId);
  const p1Token = state.p1.tokenName;
  const p2Token = state.p2.tokenName;

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

  // ── Broadcast overlays state ─────────────────────────────────────────
  const [showSpeakerLT, setShowSpeakerLT] = useState(false);
  const [callout, setCallout] = useState<{ label: string; value: string; body?: string; key: number } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const lastSpeakerRef = useRef<"p1" | "p2">("p1");
  const lastVotesRef = useRef<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const speakerLTHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Round 2 (Q&A) and Round 3 (Crowd) are moderator-paced — no timer auto-advance.
  const currentRoundType = roundType(state.battle.rounds.current);
  const isModeratorPacedRound =
    currentRoundType === "moderator_qa" || currentRoundType === "crowd";

  // ── Auto-rotate turn on timeout (skipped during moderator-paced rounds) ──
  useEffect(() => {
    if (state.phase !== "battle") return;
    if (isModeratorPacedRound) return;
    if (role !== state.battle.turnOwner) return;
    if (!state.battle.turnEndsAt) return;
    if (now < state.battle.turnEndsAt) return;
    send({ type: "ROTATE_TURN", at: now });
  }, [now, state.phase, state.battle.turnEndsAt, state.battle.turnOwner, role, send, isModeratorPacedRound]);

  useEffect(() => {
    if (state.phase === "results") router.push("/results");
  }, [state.phase, router]);

  // ── Detect speaker change → pop lower-third ──
  useEffect(() => {
    if (state.battle.turnOwner === lastSpeakerRef.current) return;
    lastSpeakerRef.current = state.battle.turnOwner;
    setShowSpeakerLT(true);
    if (speakerLTHideTimer.current) clearTimeout(speakerLTHideTimer.current);
    speakerLTHideTimer.current = setTimeout(() => setShowSpeakerLT(false), 2400);
    return () => {
      if (speakerLTHideTimer.current) clearTimeout(speakerLTHideTimer.current);
    };
  }, [state.battle.turnOwner]);

  // ── Detect swing votes → callout + shake ──
  useEffect(() => {
    const dP1 = state.votes.p1 - lastVotesRef.current.p1;
    const dP2 = state.votes.p2 - lastVotesRef.current.p2;
    lastVotesRef.current = { p1: state.votes.p1, p2: state.votes.p2 };
    const swing = Math.max(dP1, dP2);
    if (swing >= 3) {
      const leader = dP1 > dP2 ? "p1" : "p2";
      const token = leader === "p1" ? p1Token : p2Token;
      const fighterName = leader === "p1" ? p1Char?.name : p2Char?.name;
      setCallout({
        label: "BIG SWING",
        value: `+${swing} ${token}`,
        body: fighterName ? `${fighterName} pulling the crowd.` : undefined,
        key: Date.now(),
      });
      setShakeKey((k) => k + 1);
    }
  }, [state.votes.p1, state.votes.p2, p1Token, p2Token, p1Char, p2Char]);

  const isMyTurn = (role === "p1" || role === "p2") && state.battle.turnOwner === role;
  const canVote = role === "audience" && state.phase === "battle";

  if (!p1Char || !p2Char) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-terminal text-xl text-muted-foreground">Waiting for fighters…</p>
      </main>
    );
  }

  const totalVotes = state.votes.p1 + state.votes.p2;
  const p1Pct = totalVotes > 0 ? (state.votes.p1 / totalVotes) * 100 : 50;
  const p2Pct = 100 - p1Pct;
  const pot = state.wager.p1.amount + state.wager.p2.amount;

  // Ticker copy — dynamic
  const tickerItems = [
    `ROUND ${state.battle.rounds.current} OF ${state.battle.rounds.max}`,
    `POT · ${pot} PXL`,
    `${p1Token} ${Math.round(p1Pct)}% · ${p2Token} ${Math.round(p2Pct)}%`,
    `${state.battle.turnOwner === "p1" ? p1Token : p2Token} ON THE MIC`,
    `${state.battle.posts.length} ARGUMENTS POSTED`,
    "WINNER TAKES POT",
  ];

  const speakerFighter = state.battle.turnOwner === "p1" ? p1Char : p2Char;
  const speakerToken = state.battle.turnOwner === "p1" ? p1Token : p2Token;
  const speakerSide: "left" | "right" = state.battle.turnOwner === "p1" ? "left" : "right";

  return (
    <main className="relative flex-1 flex flex-col overflow-hidden">
      <ArenaBackdrop variant="dim" />

      <div
        key={shakeKey || "still"}
        className="flex-1 flex flex-col gap-3 px-3 sm:px-6 py-3 sm:py-4 min-h-0 animate-hud-shake"
      >
        {/* HUD ROW */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4">
          <FighterHud
            char={p1Char}
            token={p1Token}
            votes={state.votes.p1}
            pct={p1Pct}
            side="left"
            isTurn={state.battle.turnOwner === "p1"}
            isYou={role === "p1"}
          />
          <div className="flex flex-col items-center gap-1 px-2 sm:px-4 min-w-[140px] sm:min-w-[180px]">
            <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
              ROUND {state.battle.rounds.current}/{state.battle.rounds.max} · {roundLabel(state.battle.rounds.current)}
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
            {pot > 0 && (
              <p className="font-arcade text-[10px] glow-green mt-1">POT · {pot}</p>
            )}
          </div>
          <FighterHud
            char={p2Char}
            token={p2Token}
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

        {/* ACTIVE QUESTION (Round 2 only, when moderator has posed one) */}
        {currentRoundType === "moderator_qa" && state.activeQuestion && (
          <div className="rounded-md border-2 border-purple-500/50 bg-purple-500/[0.06] p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-md overflow-hidden border border-purple-500/50 flex-shrink-0">
              <Image
                src="/fighters/moderator.png"
                alt="Moderator"
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-arcade text-[10px] text-purple-300 tracking-widest">
                QUESTION FROM THE MODERATOR
              </p>
              <p className="font-sans text-lg sm:text-xl text-foreground mt-1 leading-snug">
                &ldquo;{state.activeQuestion}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* ARGUMENT FEED */}
        <ArgumentFeed
          posts={state.battle.posts}
          p1Char={p1Char}
          p2Char={p2Char}
          p1Token={p1Token}
          p2Token={p2Token}
          canVote={canVote}
          onVote={(target, postId) => send({ type: "VOTE", role: target, postId })}
        />

        {/* INPUT DOCK */}
        {role === "p1" || role === "p2" ? (
          <Composer
            disabled={!isMyTurn}
            speakerToken={state.battle.turnOwner === "p1" ? p1Token : p2Token}
            mySide={role}
            onSubmit={(text, mode) => send({ type: "POST_ARGUMENT", role, text, mode })}
            onEndTurn={() => send({ type: "ROTATE_TURN", at: Date.now() })}
            onForfeit={() => {
              if (typeof window !== "undefined" && window.confirm("Forfeit the match? Opponent takes the pot.")) {
                send({ type: "FORFEIT", role });
              }
            }}
          />
        ) : role === "moderator" ? (
          currentRoundType === "moderator_qa" ? (
            <ModeratorQAPanel
              round={state.battle.rounds.current}
              maxRounds={state.battle.rounds.max}
              activeQuestion={state.activeQuestion}
              tokens={[p1Token, p2Token].filter(Boolean)}
              onPose={(text) => send({ type: "POSE_QUESTION", text })}
              onClear={() => send({ type: "CLEAR_QUESTION" })}
              onNextSpeaker={() => send({ type: "ROTATE_TURN", at: Date.now() })}
              onNextRound={() => {
                const last = state.battle.rounds.current === state.battle.rounds.max;
                const msg = last
                  ? "End the match and go to results?"
                  : `End Round ${state.battle.rounds.current} and start Round ${state.battle.rounds.current + 1}?`;
                if (typeof window !== "undefined" && window.confirm(msg)) {
                  send({ type: "NEXT_ROUND", at: Date.now() });
                }
              }}
            />
          ) : (
            <ModeratorPanel
              round={state.battle.rounds.current}
              maxRounds={state.battle.rounds.max}
              speakerToken={state.battle.turnOwner === "p1" ? p1Token : p2Token}
              isPaced={isModeratorPacedRound}
              onNextSpeaker={() => send({ type: "ROTATE_TURN", at: Date.now() })}
              onNextRound={() => {
                const last = state.battle.rounds.current === state.battle.rounds.max;
                const msg = last
                  ? "End the match and go to results?"
                  : `End Round ${state.battle.rounds.current} and start Round ${state.battle.rounds.current + 1}?`;
                if (typeof window !== "undefined" && window.confirm(msg)) {
                  send({ type: "NEXT_ROUND", at: Date.now() });
                }
              }}
            />
          )
        ) : (
          <AudienceBar
            onVote={(target) => send({ type: "VOTE", role: target })}
            p1Token={p1Token || p1Char.name}
            p2Token={p2Token || p2Char.name}
          />
        )}
      </div>

      {/* OVERLAYS */}
      <LowerThird
        fighter={speakerFighter}
        token={speakerToken}
        side={speakerSide}
        visible={showSpeakerLT}
      />
      {callout && (
        <StatCallout
          label={callout.label}
          value={callout.value}
          body={callout.body}
          show
          onDone={() => setCallout(null)}
        />
      )}
      <BroadcastTicker items={tickerItems} accent="yellow" />
    </main>
  );
}

/* ─────────────────────────────── FighterHud ───────────────────────────── */

function FighterHud({
  char,
  token,
  votes,
  pct,
  side,
  isTurn,
  isYou,
}: {
  char: Fighter;
  token: string;
  votes: number;
  pct: number;
  side: "left" | "right";
  isTurn: boolean;
  isYou: boolean;
}) {
  const align = side === "left" ? "text-left" : "text-right";
  const flexAlign = side === "left" ? "" : "flex-row-reverse";
  const ring = side === "left" ? "ring-glow-red" : "ring-glow-blue";
  const borderTurn = side === "left" ? "border-neon-red" : "border-neon-blue";
  const accent = side === "left" ? "text-neon-red" : "text-neon-blue";
  const glow = side === "left" ? "glow-red" : "glow-blue";
  const bar = side === "left" ? "bg-neon-red" : "bg-neon-blue";

  // Detect vote increase → fire "+N" pop + portrait flash. Key changes
  // force React to remount the animated nodes so the animation re-fires.
  const prevVotesRef = useRef(votes);
  const [boost, setBoost] = useState<{ amount: number; key: number } | null>(null);
  useEffect(() => {
    const delta = votes - prevVotesRef.current;
    prevVotesRef.current = votes;
    if (delta > 0) {
      setBoost({ amount: delta, key: Date.now() });
    }
  }, [votes]);
  // Clean up the boost after the longer animation (vote-pop = 1.4s)
  useEffect(() => {
    if (!boost) return;
    const t = setTimeout(() => setBoost(null), 1500);
    return () => clearTimeout(t);
  }, [boost]);

  return (
    <div
      className={`relative p-3 sm:p-4 rounded-md border-2 bg-card/80 transition-all ${
        isTurn ? `${borderTurn} ${ring}` : "border-border"
      }`}
    >
      <span className={`absolute top-0 ${side === "left" ? "left-0" : "right-0"} w-3 h-3 border-t-2 border-l-2 ${side === "left" ? "" : "rotate-90"} ${isTurn ? borderTurn : "border-border"}`} />
      <span className={`absolute bottom-0 ${side === "left" ? "right-0" : "left-0"} w-3 h-3 border-b-2 border-r-2 ${side === "left" ? "" : "rotate-90"} ${isTurn ? borderTurn : "border-border"}`} />

      <div className={`flex gap-3 items-center ${flexAlign}`}>
        <div className="relative">
          <div
            key={boost ? `flash-${boost.key}` : "still"}
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden flex-shrink-0 ${boost ? "animate-boost-flash" : ""}`}
            style={{
              background: `radial-gradient(circle, ${char.color}55, transparent 70%)`,
              boxShadow: boost
                ? `inset 0 0 14px ${char.color}33, 0 0 24px ${char.color}aa`
                : `inset 0 0 14px ${char.color}33`,
              transition: "box-shadow 200ms ease-out",
            }}
          >
            <Image src={char.portrait} alt={char.name} fill sizes="80px" className="object-contain" />
          </div>

          {/* +N badge floats up from above the portrait when votes hit */}
          {boost && (
            <span
              key={`pop-${boost.key}`}
              className={`pointer-events-none absolute -top-1 left-1/2 font-bold text-xl tabular-nums animate-vote-pop ${accent}`}
              style={{
                textShadow: `0 0 12px ${char.color}`,
              }}
            >
              +{boost.amount}
            </span>
          )}
        </div>
        <div className={`${align} flex-1 min-w-0`}>
          <p className={`font-arcade text-[10px] ${accent} tracking-widest`}>
            {side === "left" ? "RED CORNER" : "BLUE CORNER"}
            {isYou && " · YOU"}
          </p>
          <p className={`font-arcade text-lg sm:text-2xl ${glow} truncate`}>
            {token || char.name}
          </p>
          <p className="font-terminal text-sm text-muted-foreground truncate">{char.name}</p>
          <p className="font-arcade text-[10px] text-muted-foreground mt-0.5">
            {votes} VOTE{votes === 1 ? "" : "S"} · {Math.round(pct)}%
          </p>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded bg-muted/60 overflow-hidden">
        <div className={`h-full ${bar} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
      </div>
      {isTurn && (
        <p className={`mt-1.5 font-arcade text-[9px] ${accent} ${align} animate-flicker tracking-widest`}>
          ◉ NOW SPEAKING
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────── ArgumentFeed ─────────────────────────── */

function ArgumentFeed({
  posts,
  p1Char,
  p2Char,
  p1Token,
  p2Token,
  canVote,
  onVote,
}: {
  posts: import("@/lib/match").ArgumentPost[];
  p1Char: Fighter;
  p2Char: Fighter;
  p1Token: string;
  p2Token: string;
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
      className="flex-1 min-h-0 overflow-y-auto rounded-md border border-border bg-background/30 p-3 sm:p-4 space-y-3"
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
          const token = p.role === "p1" ? p1Token : p2Token;
          const isLeft = p.role === "p1";
          const label = token || char.name;
          return (
            <div
              key={p.id}
              className={`flex gap-2 sm:gap-3 animate-post-in ${isLeft ? "" : "flex-row-reverse"}`}
              style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
            >
              <div
                className="relative w-12 h-12 rounded-sm overflow-hidden flex-shrink-0 border border-foreground/30"
                style={{
                  background: `radial-gradient(circle, ${char.color}55, transparent 70%)`,
                  boxShadow: `0 0 10px ${char.color}55`,
                }}
              >
                <Image src={char.portrait} alt={char.name} fill sizes="48px" className="object-contain" />
              </div>

              <div
                className={`relative max-w-[80%] sm:max-w-[70%] rounded-md border p-3 ${
                  isLeft ? "border-neon-red/50 bg-neon-red/[0.06]" : "border-neon-blue/50 bg-neon-blue/[0.06]"
                }`}
              >
                <span
                  className={`absolute top-3 w-2 h-2 rotate-45 border ${
                    isLeft
                      ? "-left-[5px] border-l border-b border-neon-red/50 bg-[oklch(0.21_0.04_270)]"
                      : "-right-[5px] border-r border-t border-neon-blue/50 bg-[oklch(0.21_0.04_270)]"
                  }`}
                />
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className={`font-arcade text-sm tracking-widest ${isLeft ? "glow-red" : "glow-blue"}`}>
                    {label}
                  </span>
                  <span className="font-arcade text-[9px] text-muted-foreground">
                    {p.mode === "voice" ? "🎤" : "⌨"} · {p.votes.total} VOTE{p.votes.total === 1 ? "" : "S"}
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
                      ▲ +1 {label}
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

/* ─────────────────────────────── Composer ─────────────────────────────── */

function Composer({
  disabled,
  speakerToken,
  mySide,
  onSubmit,
  onEndTurn,
  onForfeit,
}: {
  disabled: boolean;
  speakerToken: string;
  mySide: "p1" | "p2";
  onSubmit: (text: string, mode: import("@/lib/match").TurnInputMode) => void;
  onEndTurn: () => void;
  onForfeit: () => void;
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
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
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

  if (disabled) {
    // Distinct lockout treatment — no text input visible, just a wait card
    return (
      <div className="relative rounded-md border-2 border-dashed border-border bg-muted/30 px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse-glow" />
          <p className="font-arcade text-xs text-muted-foreground tracking-widest">
            🎤 {speakerToken || "OPPONENT"} ON THE MIC · WAIT YOUR TURN
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onForfeit}
          className="font-arcade text-[10px] h-7 text-foreground/60 border-foreground/20 hover:text-foreground hover:border-foreground/40"
        >
          Forfeit
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative rounded-md border-2 ${accent} bg-card/90 p-3 space-y-2 transition-all`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-arcade text-[10px] text-neon-green tracking-widest truncate animate-flicker">
          ◉ YOUR TURN · SPEAK YOUR CASE
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
          placeholder="Make your point (max 280 chars)…"
          maxLength={280}
          className="font-terminal text-lg flex-1"
        />
        <Button
          onClick={submit}
          disabled={!text.trim()}
          className={`font-arcade text-xs px-4 ${text.trim() ? accentBtn : ""}`}
        >
          POST →
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-arcade text-[9px] text-muted-foreground">{text.length}/280</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onForfeit}
            className="font-arcade text-[10px] text-foreground/40 hover:text-foreground/80 transition-colors px-1"
            title="Forfeit the match. Opponent takes the pot."
          >
            Forfeit
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (listening) stopVoice();
              onEndTurn();
            }}
            className="font-arcade text-[10px] h-7 border-neon-green/60 hover:bg-neon-green/15 hover:text-neon-green"
            title="Pass the mic. Remaining time forfeit."
          >
            ⏭ END TURN
          </Button>
        </div>
      </div>
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

function ModeratorQAPanel({
  round,
  maxRounds,
  activeQuestion,
  tokens,
  onPose,
  onClear,
  onNextSpeaker,
  onNextRound,
}: {
  round: number;
  maxRounds: number;
  activeQuestion: string | null;
  tokens: string[];
  onPose: (text: string) => void;
  onClear: () => void;
  onNextSpeaker: () => void;
  onNextRound: () => void;
}) {
  const [tab, setTab] = useState<"general" | "tokens" | "all">("tokens");
  const [custom, setCustom] = useState("");
  const isLast = round === maxRounds;

  const questions: Question[] =
    tab === "general"
      ? QUESTION_POOL.filter((q) => q.tokens.length === 0)
      : tab === "tokens"
      ? filterQuestions(tokens).filter((q) => q.tokens.length > 0)
      : QUESTION_POOL;

  const askCustom = () => {
    const t = custom.trim();
    if (t.length < 5) return;
    onPose(t);
    setCustom("");
  };

  return (
    <div className="rounded-md border-2 border-purple-500/50 bg-purple-500/[0.04] backdrop-blur-sm p-3 flex flex-col gap-3 max-h-[40vh]">
      {/* Header row: status + flow controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px] font-medium tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Moderator · Round {round}/{maxRounds} · Q&A
          </span>
          {activeQuestion && (
            <span className="font-arcade text-[10px] text-purple-200 tracking-widest">
              QUESTION LIVE
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {activeQuestion && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClear}
              className="font-arcade text-[10px] h-8 border-foreground/30 hover:border-foreground/60"
            >
              Clear question
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onNextSpeaker}
            className="font-arcade text-[10px] h-8 border-foreground/30 hover:border-foreground/60"
          >
            ⏭ Next speaker
          </Button>
          <Button
            size="sm"
            onClick={onNextRound}
            className="font-arcade text-[10px] h-8 px-4 bg-purple-500/90 hover:bg-purple-500 text-white shadow-[0_0_18px_rgba(168,85,247,0.45)]"
          >
            {isLast ? "End match →" : "End round →"}
          </Button>
        </div>
      </div>

      {/* Custom question input */}
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") askCustom(); }}
          placeholder="Type your own question…"
          maxLength={240}
          className="font-sans text-base flex-1"
        />
        <Button
          size="sm"
          onClick={askCustom}
          disabled={custom.trim().length < 5}
          className="font-arcade text-[10px] h-9 px-4 bg-purple-500/90 hover:bg-purple-500 text-white"
        >
          Ask custom →
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border/60 pb-1">
        {(["tokens", "general", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-t text-xs tracking-wider uppercase font-medium transition-colors ${
              tab === t
                ? "bg-purple-500/15 text-purple-200 border-b-2 border-purple-500"
                : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {t === "tokens" ? `Both tokens (${tokens.join(" · ") || "—"})` : t}
          </button>
        ))}
      </div>

      {/* Question list */}
      <div className="overflow-y-auto -mx-1 px-1 flex-1 min-h-0">
        <ul className="space-y-1.5">
          {questions.length === 0 ? (
            <li className="text-sm text-foreground/50 italic px-2 py-3">
              No questions for these tokens yet. Use the custom input above.
            </li>
          ) : (
            questions.map((q) => (
              <li
                key={q.id}
                className="flex items-start gap-2 rounded border border-border/40 bg-background/30 p-2 hover:border-purple-500/40 transition-colors"
              >
                <p className="flex-1 text-sm text-foreground/90 leading-snug">
                  {q.text}
                </p>
                {q.tokens.length > 0 && (
                  <span className="font-arcade text-[9px] text-foreground/50 tracking-widest mt-0.5">
                    {q.tokens.join("/")}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPose(q.text)}
                  className="font-arcade text-[10px] h-7 px-3 border-purple-500/40 hover:bg-purple-500/15 hover:text-purple-200 flex-shrink-0"
                >
                  Ask
                </Button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function ModeratorPanel({
  round,
  maxRounds,
  speakerToken,
  isPaced,
  onNextSpeaker,
  onNextRound,
}: {
  round: number;
  maxRounds: number;
  speakerToken: string;
  isPaced: boolean;
  onNextSpeaker: () => void;
  onNextRound: () => void;
}) {
  const label = roundLabel(round);
  const isLast = round === maxRounds;
  return (
    <div className="rounded-md border-2 border-purple-500/50 bg-purple-500/[0.04] backdrop-blur-sm p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px] font-medium tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          Moderator
        </span>
        <p className="font-arcade text-[10px] text-foreground/70 tracking-widest">
          ROUND {round}/{maxRounds} · {label}
          {isPaced && " · YOU PACE"}
        </p>
        <p className="font-arcade text-[10px] text-foreground/50 tracking-widest hidden md:block">
          🎤 {speakerToken || "—"} HAS THE MIC
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onNextSpeaker}
          className="font-arcade text-[10px] h-8 border-foreground/30 hover:border-foreground/60"
        >
          ⏭ Next speaker
        </Button>
        <Button
          size="sm"
          onClick={onNextRound}
          className="font-arcade text-[10px] h-8 px-4 bg-purple-500/90 hover:bg-purple-500 text-white shadow-[0_0_18px_rgba(168,85,247,0.45)]"
        >
          {isLast ? "End match →" : "End round →"}
        </Button>
      </div>
    </div>
  );
}

function AudienceBar({
  onVote,
  p1Token,
  p2Token,
}: {
  onVote: (target: "p1" | "p2") => void;
  p1Token: string;
  p2Token: string;
}) {
  return (
    <div className="rounded-md border-2 border-neon-green/40 bg-card/90 p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 items-center justify-center">
      <p className="font-arcade text-[10px] text-neon-green tracking-widest sm:mr-2 animate-flicker">
        CROWD VOTE
      </p>
      <div className="flex gap-3 w-full sm:w-auto">
        <Button
          onClick={() => onVote("p1")}
          variant="outline"
          className="flex-1 sm:flex-none font-arcade text-xs h-11 px-6 border-neon-red/60 hover:bg-neon-red/15 hover:text-neon-red active:animate-vote-pulse"
        >
          ▲ {p1Token}
        </Button>
        <Button
          onClick={() => onVote("p2")}
          variant="outline"
          className="flex-1 sm:flex-none font-arcade text-xs h-11 px-6 border-neon-blue/60 hover:bg-neon-blue/15 hover:text-neon-blue active:animate-vote-pulse"
        >
          {p2Token} ▲
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
