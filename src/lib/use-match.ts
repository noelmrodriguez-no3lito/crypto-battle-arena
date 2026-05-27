"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  type Action,
  type MatchState,
  type Role,
  CHANNEL_NAME,
  DEFAULT_BATTLE_MS,
  DEFAULT_ROUNDS,
  DEFAULT_TURN_MS,
  STORAGE_KEY,
  loadFromStorage,
  loadRole,
  makeInitialState,
  reduce,
  saveRole,
  saveToStorage,
} from "./match";

type ChannelMessage =
  | { kind: "action"; action: Action; from: Role | null }
  | { kind: "request-sync"; from: Role | null }
  | { kind: "sync"; snapshot: MatchState };

// Deterministic initial state so SSR output === first client render.
// Real state is loaded/generated in a mount-time effect to avoid hydration mismatch.
const SSR_INITIAL: MatchState = {
  matchId: "------",
  hostRole: null,
  phase: "lobby",
  p1: { fighterId: null, tokenName: "", ready: false },
  p2: { fighterId: null, tokenName: "", ready: false },
  wager: {
    p1: { amount: 10, locked: false },
    p2: { amount: 10, locked: false },
  },
  battle: {
    startedAt: null,
    durationMs: DEFAULT_BATTLE_MS,
    turnOwner: "p1",
    turnEndsAt: null,
    turnDurationMs: DEFAULT_TURN_MS,
    rounds: { current: 1, max: DEFAULT_ROUNDS },
    posts: [],
  },
  votes: { p1: 0, p2: 0 },
  audienceCount: 0,
  winner: null,
  updatedAt: 0,
};

export function useMatch() {
  const [state, dispatch] = useReducer(reduce, SSR_INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef(state);
  const roleRef = useRef<Role | null>(null);

  // Keep refs current
  useEffect(() => {
    stateRef.current = state;
    if (hydrated) saveToStorage(state);
  }, [state, hydrated]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // Mount: load persisted state and role from storage (client only)
  useEffect(() => {
    const existing = loadFromStorage();
    const snapshot = existing ?? makeInitialState();
    dispatch({ type: "HOST_SYNC", snapshot });
    setRole(loadRole());
    setHydrated(true);
  }, []);

  // BroadcastChannel + storage listener — wait until after hydration
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;

    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;

    ch.onmessage = (e: MessageEvent<ChannelMessage>) => {
      const msg = e.data;
      if (!msg) return;
      if (msg.kind === "action") {
        dispatch(msg.action);
      } else if (msg.kind === "sync") {
        dispatch({ type: "HOST_SYNC", snapshot: msg.snapshot });
      } else if (msg.kind === "request-sync") {
        ch.postMessage({ kind: "sync", snapshot: stateRef.current } satisfies ChannelMessage);
      }
    };

    ch.postMessage({ kind: "request-sync", from: roleRef.current } satisfies ChannelMessage);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const snapshot = JSON.parse(e.newValue) as MatchState;
        dispatch({ type: "HOST_SYNC", snapshot });
      } catch {
        /* noop */
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      ch.close();
      window.removeEventListener("storage", onStorage);
      channelRef.current = null;
    };
  }, [hydrated]);

  const send = useCallback((action: Action) => {
    dispatch(action);
    channelRef.current?.postMessage({
      kind: "action",
      action,
      from: roleRef.current,
    } satisfies ChannelMessage);
  }, []);

  const claimRole = useCallback(
    (r: Role) => {
      setRole(r);
      saveRole(r);
      send({ type: "CLAIM_ROLE", role: r });
    },
    [send]
  );

  return {
    state,
    role,
    hydrated,
    send,
    claimRole,
  };
}
