#!/usr/bin/env bash
# Local smoke test for the Pusher auth route. Waits for dev server, then
# checks a valid private-match channel signs (200) and a foreign channel is
# refused (403).
set -u
BASE="http://localhost:3002"

for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/" 2>/dev/null)
  if [ "$code" = "200" ]; then echo "dev server ready after ${i}s"; break; fi
  sleep 1
done

echo "=== valid private-match channel (expect HTTP 200 + auth token) ==="
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/api/pusher/auth" \
  -d 'socket_id=123.456&channel_name=private-match-TESTAB'

echo
echo "=== foreign channel (expect HTTP 403) ==="
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/api/pusher/auth" \
  -d 'socket_id=123.456&channel_name=private-other'
