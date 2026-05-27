/**
 * Local match state + BroadcastChannel sync.
 * No backend: P1 / P2 / audience are separate tabs on the same origin
 * that talk over a BroadcastChannel and persist a shared snapshot to
 * localStorage so a refreshing tab can rejoin.
 *
 * Authoritative model: each tab applies actions to its own copy of state.
 * The "host" (whichever tab created the match) is the tie-breaker for
 * timer ticks and turn rotation. Non-host tabs accept HOST_SYNC snapshots.
 */

export type Phase =
  | "lobby"
  | "select"
  | "stakes"
  | "vs"
  | "battle"
  | "results";

export type Role = "p1" | "p2" | "audience";

export type TurnInputMode = "text" | "voice";

export type ArgumentPost = {
  id: string;
  role: "p1" | "p2";
  text: string;
  at: number;
  mode: TurnInputMode;
  votes: { p1: number; p2: number; total: number };
};

export type WagerSide = {
  amount: number;
  locked: boolean;
};

export type MatchState = {
  matchId: string;
  hostRole: Role | null;
  phase: Phase;
  p1: { cryptoId: string | null; ready: boolean };
  p2: { cryptoId: string | null; ready: boolean };
  wager: { p1: WagerSide; p2: WagerSide };
  battle: {
    startedAt: number | null;
    durationMs: number;
    turnOwner: "p1" | "p2";
    turnEndsAt: number | null;
    turnDurationMs: number;
    rounds: { current: number; max: number };
    posts: ArgumentPost[];
  };
  votes: { p1: number; p2: number };
  audienceCount: number;
  winner: "p1" | "p2" | "tie" | null;
  updatedAt: number;
};

export const STORAGE_KEY = "cba:match";
export const CHANNEL_NAME = "cba:channel";
export const ROLE_KEY = "cba:role";
export const WALLET_KEY = (role: "p1" | "p2") => `cba:wallet:${role}`;
export const SETTLED_KEY = (matchId: string, role: "p1" | "p2") =>
  `cba:settled:${matchId}:${role}`;

export const DEFAULT_BATTLE_MS = 2 * 60 * 1000;
export const DEFAULT_TURN_MS = 20 * 1000;
export const DEFAULT_ROUNDS = 3; // 3 rounds × 2 turns × 20s = 2 min, equal turns guaranteed
export const STARTING_BALANCE = 100;
export const WAGER_CHIPS = [5, 10, 25, 50, 100] as const;

export function makeInitialState(matchId: string = randomMatchId()): MatchState {
  return {
    matchId,
    hostRole: null,
    phase: "lobby",
    p1: { cryptoId: null, ready: false },
    p2: { cryptoId: null, ready: false },
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
    updatedAt: Date.now(),
  };
}

function randomMatchId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── Actions ──────────────────────────────────────────────────────────────

export type Action =
  | { type: "RESET" }
  | { type: "CLAIM_ROLE"; role: Role }
  | { type: "PICK_CRYPTO"; role: "p1" | "p2"; cryptoId: string }
  | { type: "READY"; role: "p1" | "p2"; ready: boolean }
  | { type: "ENTER_STAKES" }
  | { type: "SET_WAGER"; role: "p1" | "p2"; amount: number }
  | { type: "LOCK_WAGER"; role: "p1" | "p2"; locked: boolean }
  | { type: "ENTER_VS" }
  | { type: "START_BATTLE"; at: number }
  | { type: "POST_ARGUMENT"; role: "p1" | "p2"; text: string; mode: TurnInputMode }
  | { type: "VOTE"; role: "p1" | "p2"; postId?: string }
  | { type: "ROTATE_TURN"; at: number }
  | { type: "END_BATTLE"; at: number }
  | { type: "AUDIENCE_PING"; delta: 1 | -1 }
  | { type: "HOST_SYNC"; snapshot: MatchState };

export function reduce(state: MatchState, action: Action): MatchState {
  const stamp = (s: MatchState): MatchState => ({ ...s, updatedAt: Date.now() });

  switch (action.type) {
    case "RESET":
      return stamp(makeInitialState(state.matchId));

    case "CLAIM_ROLE":
      return stamp({
        ...state,
        hostRole: state.hostRole ?? action.role,
      });

    case "PICK_CRYPTO":
      return stamp({
        ...state,
        phase: "select",
        [action.role]: { ...state[action.role], cryptoId: action.cryptoId },
      });

    case "READY":
      return stamp({
        ...state,
        [action.role]: { ...state[action.role], ready: action.ready },
      });

    case "ENTER_STAKES":
      if (!state.p1.cryptoId || !state.p2.cryptoId) return state;
      return stamp({ ...state, phase: "stakes" });

    case "SET_WAGER":
      if (state.wager[action.role].locked) return state;
      return stamp({
        ...state,
        wager: {
          ...state.wager,
          [action.role]: { amount: Math.max(0, action.amount), locked: false },
        },
      });

    case "LOCK_WAGER":
      return stamp({
        ...state,
        wager: {
          ...state.wager,
          [action.role]: { ...state.wager[action.role], locked: action.locked },
        },
      });

    case "ENTER_VS":
      if (!state.p1.cryptoId || !state.p2.cryptoId) return state;
      if (!state.wager.p1.locked || !state.wager.p2.locked) return state;
      if (state.wager.p1.amount !== state.wager.p2.amount) return state;
      return stamp({ ...state, phase: "vs" });

    case "START_BATTLE": {
      const startedAt = action.at;
      return stamp({
        ...state,
        phase: "battle",
        battle: {
          ...state.battle,
          startedAt,
          turnOwner: "p1",
          turnEndsAt: startedAt + state.battle.turnDurationMs,
          rounds: { current: 1, max: state.battle.rounds.max },
          posts: [],
        },
        votes: { p1: 0, p2: 0 },
        winner: null,
      });
    }

    case "POST_ARGUMENT": {
      if (state.phase !== "battle") return state;
      if (state.battle.turnOwner !== action.role) return state;
      const post: ArgumentPost = {
        id: Math.random().toString(36).slice(2, 10),
        role: action.role,
        text: action.text.trim().slice(0, 280),
        at: Date.now(),
        mode: action.mode,
        votes: { p1: 0, p2: 0, total: 0 },
      };
      if (!post.text) return state;
      return stamp({
        ...state,
        battle: { ...state.battle, posts: [...state.battle.posts, post] },
      });
    }

    case "VOTE": {
      if (state.phase !== "battle") return state;
      const votes = { ...state.votes, [action.role]: state.votes[action.role] + 1 };
      let posts = state.battle.posts;
      if (action.postId) {
        posts = state.battle.posts.map((p) =>
          p.id === action.postId
            ? { ...p, votes: { ...p.votes, [action.role]: p.votes[action.role] + 1, total: p.votes.total + 1 } }
            : p
        );
      }
      return stamp({ ...state, votes, battle: { ...state.battle, posts } });
    }

    case "ROTATE_TURN": {
      if (state.phase !== "battle") return state;
      const next = state.battle.turnOwner === "p1" ? "p2" : "p1";
      // A "round" is complete after P1 + P2 both spoke (i.e. transition p2 → p1).
      const completingRound = state.battle.turnOwner === "p2";
      const nextRound = completingRound
        ? state.battle.rounds.current + 1
        : state.battle.rounds.current;
      // If we'd exceed max rounds, end the battle instead of rotating.
      if (nextRound > state.battle.rounds.max) {
        const { p1, p2 } = state.votes;
        const winner = p1 === p2 ? "tie" : p1 > p2 ? "p1" : "p2";
        return stamp({
          ...state,
          phase: "results",
          winner,
          battle: { ...state.battle, turnEndsAt: null },
        });
      }
      return stamp({
        ...state,
        battle: {
          ...state.battle,
          turnOwner: next,
          turnEndsAt: action.at + state.battle.turnDurationMs,
          rounds: { ...state.battle.rounds, current: nextRound },
        },
      });
    }

    case "END_BATTLE": {
      const { p1, p2 } = state.votes;
      const winner = p1 === p2 ? "tie" : p1 > p2 ? "p1" : "p2";
      return stamp({ ...state, phase: "results", winner, battle: { ...state.battle, turnEndsAt: null } });
    }

    case "AUDIENCE_PING":
      return stamp({
        ...state,
        audienceCount: Math.max(0, state.audienceCount + action.delta),
      });

    case "HOST_SYNC":
      if (action.snapshot.updatedAt < state.updatedAt) return state;
      return action.snapshot;

    default:
      return state;
  }
}

// ─── Persistence + Channel helpers ────────────────────────────────────────

function isValidMatchState(s: unknown): s is MatchState {
  if (!s || typeof s !== "object") return false;
  const m = s as Partial<MatchState>;
  return (
    typeof m.matchId === "string" &&
    typeof m.phase === "string" &&
    !!m.p1 &&
    !!m.p2 &&
    !!m.wager &&
    !!m.wager.p1 &&
    !!m.wager.p2 &&
    !!m.battle &&
    !!m.battle.rounds &&
    typeof m.battle.rounds.max === "number" &&
    !!m.votes
  );
}

export function loadFromStorage(): MatchState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidMatchState(parsed)) {
      // Stale shape from an older build — discard so we generate a fresh state.
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveToStorage(state: MatchState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota; ignore
  }
}

export function loadRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    return (sessionStorage.getItem(ROLE_KEY) as Role | null) ?? null;
  } catch {
    return null;
  }
}

export function saveRole(role: Role): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ─── Wallet (per-role, persisted in localStorage) ─────────────────────────

export function getWallet(role: "p1" | "p2"): number {
  if (typeof window === "undefined") return STARTING_BALANCE;
  try {
    const raw = localStorage.getItem(WALLET_KEY(role));
    if (raw === null) return STARTING_BALANCE;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : STARTING_BALANCE;
  } catch {
    return STARTING_BALANCE;
  }
}

export function setWallet(role: "p1" | "p2", amount: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WALLET_KEY(role), String(Math.max(0, Math.floor(amount))));
  } catch {
    /* ignore */
  }
}

export function resetWallets(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WALLET_KEY("p1"), String(STARTING_BALANCE));
    localStorage.setItem(WALLET_KEY("p2"), String(STARTING_BALANCE));
    // Also drop settled markers so future matches aren't blocked
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith("cba:settled:")) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Compute the wallet delta for a given role at end of match.
 *   winner role:  +opponent's wager (net of their own wager which is the stake)
 *   loser role:   -own wager
 *   tie:          0  (both refunded — wallet unchanged)
 */
export function computeWalletDelta(
  state: MatchState,
  role: "p1" | "p2"
): number {
  if (!state.winner) return 0;
  if (state.winner === "tie") return 0;
  const ownWager = state.wager[role].amount;
  const oppWager =
    role === "p1" ? state.wager.p2.amount : state.wager.p1.amount;
  if (state.winner === role) return oppWager;
  return -ownWager;
}
