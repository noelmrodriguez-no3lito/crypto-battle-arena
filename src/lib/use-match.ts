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
import { getPusher, matchChannelName, type Channel } from "./pusher-client";

const PUSHER_ACTION_EVENT = "client-action";
const PUSHER_SYNC_REQUEST_EVENT = "client-sync-request";
const PUSHER_SYNC_RESPONSE_EVENT = "client-sync-response";

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
  activeQuestion: null,
  activeQuestionSource: null,
  crowdQuestions: [],
  updatedAt: 0,
};

export function useMatch() {
  const [state, dispatch] = useReducer(reduce, SSR_INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const pusherChannelRef = useRef<Channel | null>(null);
  const pusherMatchIdRef = useRef<string | null>(null);
  const clientIdRef = useRef<string>("");
  const stateRef = useRef(state);
  const roleRef = useRef<Role | null>(null);

  // Stable per-tab id so we can ignore our own Pusher echoes.
  if (!clientIdRef.current) {
    clientIdRef.current = Math.random().toString(36).slice(2, 12);
  }

  // Keep refs current
  useEffect(() => {
    stateRef.current = state;
    if (hydrated) saveToStorage(state);
  }, [state, hydrated]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // Mount: load persisted state and role from storage (client only).
  // ?match=ABC123 in the URL overrides — we join (or rejoin) that match.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMatch = (params.get("match") || "").trim().toUpperCase().slice(0, 12);
    const existing = loadFromStorage();
    let snapshot: MatchState;
    if (requestedMatch && existing?.matchId !== requestedMatch) {
      // Joining a friend's match — start with a fresh shell using their matchId.
      // Pusher subscription will pull the live state from peers on the channel.
      snapshot = makeInitialState(requestedMatch);
    } else {
      snapshot = existing ?? makeInitialState();
    }
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

  // Pusher cross-device sync — subscribes to a private channel keyed by matchId.
  // No-op when Pusher env vars aren't configured (BroadcastChannel still works
  // for same-browser tabs). When the matchId changes (RESET makes a new one),
  // we unsubscribe from the old channel and resubscribe to the new one.
  useEffect(() => {
    if (!hydrated) return;
    const pusher = getPusher();
    if (!pusher) return;
    const matchId = state.matchId;
    if (!matchId || matchId === "------") return;

    // Same channel as before — nothing to do.
    if (pusherMatchIdRef.current === matchId && pusherChannelRef.current) return;

    // Channel switched — unbind the old one first.
    if (pusherChannelRef.current && pusherMatchIdRef.current) {
      pusher.unsubscribe(matchChannelName(pusherMatchIdRef.current));
      pusherChannelRef.current = null;
    }

    const channel = pusher.subscribe(matchChannelName(matchId));
    pusherChannelRef.current = channel;
    pusherMatchIdRef.current = matchId;

    type PusherActionMsg = { from: string; action: Action };
    type PusherSyncReqMsg = { from: string };
    type PusherSyncRespMsg = { to: string; snapshot: MatchState };

    channel.bind(PUSHER_ACTION_EVENT, (msg: PusherActionMsg) => {
      if (!msg || msg.from === clientIdRef.current) return;
      dispatch(msg.action);
    });
    channel.bind(PUSHER_SYNC_REQUEST_EVENT, (msg: PusherSyncReqMsg) => {
      if (!msg || msg.from === clientIdRef.current) return;
      channel.trigger(PUSHER_SYNC_RESPONSE_EVENT, {
        to: msg.from,
        snapshot: stateRef.current,
      } satisfies PusherSyncRespMsg);
    });
    channel.bind(PUSHER_SYNC_RESPONSE_EVENT, (msg: PusherSyncRespMsg) => {
      if (!msg || msg.to !== clientIdRef.current) return;
      // Only adopt if the incoming snapshot is fresher than ours.
      if (msg.snapshot.updatedAt > stateRef.current.updatedAt) {
        dispatch({ type: "HOST_SYNC", snapshot: msg.snapshot });
      }
    });

    // Once subscribed, ask peers for a snapshot of the live match.
    channel.bind("pusher:subscription_succeeded", () => {
      channel.trigger(PUSHER_SYNC_REQUEST_EVENT, {
        from: clientIdRef.current,
      } satisfies PusherSyncReqMsg);
    });

    return () => {
      pusher.unsubscribe(matchChannelName(matchId));
      pusherChannelRef.current = null;
      pusherMatchIdRef.current = null;
    };
  }, [hydrated, state.matchId]);

  const send = useCallback((action: Action) => {
    dispatch(action);
    channelRef.current?.postMessage({
      kind: "action",
      action,
      from: roleRef.current,
    } satisfies ChannelMessage);
    // Cross-device fan-out via Pusher — no-op when not configured.
    pusherChannelRef.current?.trigger("client-action", {
      from: clientIdRef.current,
      action,
    });
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
