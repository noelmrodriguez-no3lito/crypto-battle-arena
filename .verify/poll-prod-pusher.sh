#!/usr/bin/env bash
# Poll prod /api/pusher/auth until the new deploy picks up Pusher creds
# (500 -> 200 signed) or we give up.
URL="https://crypto-battle-arena.vercel.app/api/pusher/auth"
for i in $(seq 1 30); do
  resp=$(curl -s -w '\n%{http_code}' -X POST "$URL" \
    -d 'socket_id=123.456&channel_name=private-match-PRODTST')
  code=$(printf '%s' "$resp" | tail -1)
  body=$(printf '%s' "$resp" | sed '$d')
  echo "[${i}] HTTP $code  $body"
  if [ "$code" = "200" ]; then echo "ACTIVATED — auth route is signing tokens in prod."; exit 0; fi
  sleep 8
done
echo "Gave up after ~4min — still not signing. Check Vercel deploy status + that the 4 vars are on the Production scope."
exit 1
