import Pusher from "pusher";
import { NextResponse } from "next/server";

/**
 * Signs Pusher private/presence channel auth tokens.
 *
 * Public match channels would let any client publish to any match — for
 * peer-to-peer action streaming we use private channels and let Pusher
 * authorize each subscription. Clients POST { socket_id, channel_name }
 * and we sign the token using the server-only PUSHER_SECRET.
 *
 * Env vars required (set in Vercel + .env.local):
 *   PUSHER_APP_ID
 *   NEXT_PUBLIC_PUSHER_KEY     (same key the client uses)
 *   PUSHER_SECRET              (server-only — NEVER expose)
 *   NEXT_PUBLIC_PUSHER_CLUSTER (same cluster the client uses)
 */
export async function POST(req: Request) {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    return NextResponse.json(
      { error: "Pusher credentials not configured on the server" },
      { status: 500 }
    );
  }

  // Pusher's official client posts as application/x-www-form-urlencoded.
  const body = await req.formData();
  const socketId = body.get("socket_id");
  const channelName = body.get("channel_name");
  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return NextResponse.json(
      { error: "Missing socket_id or channel_name" },
      { status: 400 }
    );
  }
  if (!channelName.startsWith("private-match-")) {
    return NextResponse.json(
      { error: "Only private match channels are signable here" },
      { status: 403 }
    );
  }

  const pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
  const authToken = pusher.authorizeChannel(socketId, channelName);
  return NextResponse.json(authToken);
}
