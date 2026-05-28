"use client";

/**
 * Lazily-initialised Pusher client used by use-match for cross-device sync.
 *
 * Feature-gated: if NEXT_PUBLIC_PUSHER_KEY isn't set, this module returns null
 * everywhere and the rest of the app falls back to BroadcastChannel-only
 * (same-browser-tab sync, no cross-device). That makes local dev work without
 * Pusher credentials and lets prod gracefully degrade if env vars are missing.
 */

import PusherJS, { type Channel } from "pusher-js";

let cached: PusherJS | null = null;

export function getPusher(): PusherJS | null {
  if (typeof window === "undefined") return null;
  if (cached) return cached;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  cached = new PusherJS(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    // forceTLS defaults to true; keep it explicit
    forceTLS: true,
  });
  return cached;
}

export function isPusherConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER);
}

export function matchChannelName(matchId: string): string {
  // Private channel — clients authenticate against /api/pusher/auth and can
  // trigger client events to peers without going through a server fan-out.
  return `private-match-${matchId}`;
}

export type { Channel };
