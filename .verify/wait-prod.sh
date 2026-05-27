#!/usr/bin/env bash
set -u
URL="${1:-https://crypto-battle-arena.vercel.app}"
MARKER="${2:-WHICH COIN ARE YOU REPPING}"
echo "polling $URL for marker: $MARKER"
for i in $(seq 1 30); do
  body=$(curl -s "${URL}/select" 2>/dev/null)
  if echo "$body" | grep -q "$MARKER"; then
    echo "new build live after $((i * 10))s"
    exit 0
  fi
  echo "  attempt $i: marker not found yet, sleeping 10s"
  sleep 10
done
echo "FAIL: never saw marker after 5 minutes"
exit 1
