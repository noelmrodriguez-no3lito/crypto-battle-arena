#!/usr/bin/env bash
set -u
URL="${1:-https://crypto-battle-arena.vercel.app}"
MARKER="TONIGHT.S MAIN EVENT"
echo "polling $URL for marker"
for i in $(seq 1 36); do
  body=$(curl -s "$URL/" 2>/dev/null)
  if echo "$body" | grep -qiE "$MARKER|MAIN EVENT|ON THE CARD"; then
    echo "new build live after $((i * 10))s"
    break
  fi
  echo "  attempt $i: not yet, sleeping 10s"
  sleep 10
done
cd "$(dirname "$0")/.."
URL="$URL" node .verify/drive-prod-all.mjs
echo "done"
