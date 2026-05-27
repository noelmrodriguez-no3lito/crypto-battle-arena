#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

chmod +x .verify/chrome-wrap.sh

echo "=== ensuring puppeteer-core ==="
if [ ! -d node_modules/puppeteer-core ]; then
  npm install --no-save --silent puppeteer-core 2>&1 | tail -5
fi

echo "=== starting dev server on 3010 ==="
pkill -f "next dev" 2>/dev/null || true
sleep 1
: > /tmp/cba-dev.log
PORT=3010 npm run dev > /tmp/cba-dev.log 2>&1 &
DEVPID=$!
trap 'kill "$DEVPID" 2>/dev/null || true' EXIT

for i in $(seq 1 60); do
  if grep -q "Ready" /tmp/cba-dev.log 2>/dev/null; then
    echo "dev ready after ${i}s"
    break
  fi
  sleep 1
done
grep -q "Ready" /tmp/cba-dev.log || { echo "dev not ready"; tail -30 /tmp/cba-dev.log; exit 1; }

echo "=== driving ==="
node .verify/drive.mjs
echo "=== done ==="
