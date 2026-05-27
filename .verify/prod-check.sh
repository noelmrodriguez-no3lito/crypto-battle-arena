#!/usr/bin/env bash
set -u
URL="${1:-https://crypto-battle-arena.vercel.app}"
echo "checking $URL"

echo "=== route HTTP codes ==="
for p in / /select /stakes /vs /battle /results /spectate; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' "${URL}${p}")
  echo "  ${p} -> ${code}"
done

echo "=== lobby HTML hits ==="
curl -sS "${URL}/" | grep -ohE 'CRYPTO|BATTLE|ARENA|INSERT COIN|QUICK START|JOIN AS P1|JOIN AS P2|JOIN AS CROWD' | sort -u

echo "=== spectate HTML hits ==="
curl -sS "${URL}/spectate" | grep -ohE 'CROWD VIEW|SPECTATOR MODE|MATCH PHASE|RED CORNER|BLUE CORNER' | sort -u

echo "=== response headers ==="
curl -sSI "${URL}/" | grep -iE 'HTTP/|x-vercel-id|content-type|cache-control' | head
