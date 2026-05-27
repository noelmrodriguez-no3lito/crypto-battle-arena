"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCrypto } from "@/data/cryptos";
import { useMatch } from "@/lib/use-match";
import { formatClock } from "@/lib/match";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function BattlePage() {
  const router = useRouter();
  const { state, role, send } = useMatch();

  const p1Char = state.p1.cryptoId ? getCrypto(state.p1.cryptoId) : null;
  const p2Char = state.p2.cryptoId ? getCrypto(state.p2.cryptoId) : null;

  // Drive the local clock at 250ms (starts at 0 to avoid SSR/client mismatch)
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Time remaining in current turn
  const turnRemaining = state.battle.turnEndsAt
    ? Math.max(0, state.battle.turnEndsAt - now)
    : 0;

  // Only the active speaker's tab fires ROTATE_TURN — prevents double-rotation
  // when both fighter tabs detect the timeout simultaneously. Match ends are
  // handled inside the reducer when rounds are exhausted.
  useEffect(() => {
    if (state.phase !== "battle") return;
    if (role !== state.battle.turnOwner) return;
    if (!state.battle.turnEndsAt) return;
    if (now < state.battle.turnEndsAt) return;
    send({ type: "ROTATE_TURN", at: now });
  }, [now, state.phase, state.battle.turnEndsAt, state.battle.turnOwner, role, send]);

  // Once we're at results, navigate everyone
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

  return (
    <main className="flex-1 grid grid-rows-[auto_1fr_auto] gap-4 px-4 sm:px-6 py-4">
      {/* HUD */}
      <div className="grid grid-cols-3 items-center gap-3">
        <FighterHud
          char={p1Char}
          votes={state.votes.p1}
          totalVotes={state.votes.p1 + state.votes.p2}
          side="left"
          isTurn={state.battle.turnOwner === "p1"}
          isYou={role === "p1"}
        />
        <div className="flex flex-col items-center gap-1">
          <p className="font-arcade text-xs text-muted-foreground tracking-widest">
            ROUND {state.battle.rounds.current}/{state.battle.rounds.max}
          </p>
          <p className="font-arcade text-3xl glow-yellow">{formatClock(turnRemaining)}</p>
          <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
            TURN TIMER
          </p>
          {(state.wager.p1.amount + state.wager.p2.amount) > 0 && (
            <p className="font-arcade text-[10px] glow-green mt-1">
              💰 POT {state.wager.p1.amount + state.wager.p2.amount}
            </p>
          )}
          <Badge className="font-arcade text-[9px] mt-1">
            {state.battle.turnOwner === "p1" ? "P1" : "P2"} SPEAKING
          </Badge>
        </div>
        <FighterHud
          char={p2Char}
          votes={state.votes.p2}
          totalVotes={state.votes.p1 + state.votes.p2}
          side="right"
          isTurn={state.battle.turnOwner === "p2"}
          isYou={role === "p2"}
        />
      </div>

      {/* Feed */}
      <ArgumentFeed
        posts={state.battle.posts}
        p1Char={p1Char}
        p2Char={p2Char}
        canVote={canVote}
        onVote={(target, postId) => send({ type: "VOTE", role: target, postId })}
      />

      {/* Input dock */}
      {role === "p1" || role === "p2" ? (
        <Composer
          disabled={!isMyTurn}
          turnLabel={
            isMyTurn ? "YOUR TURN — speak your case" : "Opponent is speaking…"
          }
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
  totalVotes,
  side,
  isTurn,
  isYou,
}: {
  char: NonNullable<ReturnType<typeof getCrypto>>;
  votes: number;
  totalVotes: number;
  side: "left" | "right";
  isTurn: boolean;
  isYou: boolean;
}) {
  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 50;
  const align = side === "left" ? "text-left" : "text-right";
  const flexAlign = side === "left" ? "" : "flex-row-reverse";
  const color = side === "left" ? "glow-red" : "glow-blue";
  const bar = side === "left" ? "bg-neon-red" : "bg-neon-blue";

  return (
    <div
      className={`p-3 rounded-md border ${
        isTurn
          ? side === "left"
            ? "border-neon-red ring-glow-red"
            : "border-neon-blue ring-glow-blue"
          : "border-border"
      } bg-card transition-all`}
    >
      <div className={`flex gap-3 items-center ${flexAlign}`}>
        <div className={`font-arcade text-xl ${color}`}>{char.ticker}</div>
        <div className={`${align} flex-1 min-w-0`}>
          <p className="font-terminal text-base truncate">{char.name}</p>
          <p className="font-arcade text-[10px] text-muted-foreground">
            {votes} VOTE{votes === 1 ? "" : "S"} {isYou && "· YOU"}
          </p>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded bg-muted overflow-hidden">
        <div
          className={`h-full ${bar} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
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
      className="min-h-0 overflow-y-auto rounded-md border border-border bg-background/60 p-3 sm:p-4 space-y-3"
    >
      {posts.length === 0 ? (
        <div className="h-full flex items-center justify-center py-12">
          <p className="font-arcade text-xs text-muted-foreground animate-flicker">
            AWAITING FIRST STRIKE…
          </p>
        </div>
      ) : (
        posts.map((p) => {
          const char = p.role === "p1" ? p1Char : p2Char;
          const isLeft = p.role === "p1";
          return (
            <Card
              key={p.id}
              className={`${isLeft ? "border-neon-red/40 bg-neon-red/[0.04]" : "border-neon-blue/40 bg-neon-blue/[0.04]"} ${
                isLeft ? "mr-8 sm:mr-24" : "ml-8 sm:ml-24"
              }`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`font-arcade text-xs ${
                      isLeft ? "glow-red" : "glow-blue"
                    }`}
                  >
                    {char.ticker}
                  </span>
                  <span className="font-arcade text-[9px] text-muted-foreground">
                    {p.mode === "voice" ? "🎤" : "⌨"} · {p.votes.total} VOTE
                    {p.votes.total === 1 ? "" : "S"}
                  </span>
                </div>
                <p className="font-terminal text-lg leading-snug">{p.text}</p>
                {canVote && (
                  <div className="mt-2">
                    <Button
                      onClick={() => onVote(p.role, p.id)}
                      size="sm"
                      variant="outline"
                      className={`font-arcade text-[10px] h-7 ${
                        isLeft
                          ? "border-neon-red/60 hover:bg-neon-red/10"
                          : "border-neon-blue/60 hover:bg-neon-blue/10"
                      }`}
                    >
                      +1 FOR {char.ticker}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

function Composer({
  disabled,
  turnLabel,
  onSubmit,
}: {
  disabled: boolean;
  turnLabel: string;
  onSubmit: (text: string, mode: import("@/lib/match").TurnInputMode) => void;
}) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Lazy init Web Speech API
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
      // Iterate ALL results (not just from resultIndex) so pauses don't
      // wipe earlier finalized segments. Final results stay in the list
      // even after the API moves on to a new interim chunk.
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
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-arcade text-[10px] text-muted-foreground">{turnLabel}</p>
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
            className="font-arcade text-[10px] h-7"
          >
            {listening ? "● REC" : "🎤 VOICE"}
          </Button>
        </div>
      </div>
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
          className="font-arcade text-xs"
        >
          POST →
        </Button>
      </div>
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
    <div className="rounded-md border border-border bg-card p-3 flex gap-3 items-center justify-center">
      <p className="font-arcade text-[10px] text-muted-foreground mr-2">CROWD VOTE:</p>
      <Button
        onClick={() => onVote("p1")}
        variant="outline"
        className="font-arcade text-xs border-neon-red/60 hover:bg-neon-red/10 animate-vote-pulse"
      >
        ▲ {p1Ticker}
      </Button>
      <Button
        onClick={() => onVote("p2")}
        variant="outline"
        className="font-arcade text-xs border-neon-blue/60 hover:bg-neon-blue/10"
      >
        {p2Ticker} ▲
      </Button>
    </div>
  );
}

/* Minimal SpeechRecognition typing (Web Speech API not in lib.dom in all TS configs) */
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
