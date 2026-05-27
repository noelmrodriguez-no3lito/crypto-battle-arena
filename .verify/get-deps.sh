#!/usr/bin/env bash
set -euo pipefail
DEPS=("$HOME/.cache/chrome-headless/deps")
mkdir -p "$DEPS"
cd "$DEPS"
for pkg in libnspr4 libnss3; do
  echo "downloading $pkg"
  apt-get download "$pkg" >/dev/null 2>&1
done
ls *.deb
for d in *.deb; do
  echo "extracting $d"
  dpkg-deb -x "$d" .
done
echo "--- libs ---"
find . -name "libnspr*.so*" -o -name "libnss*.so*" -o -name "libnssutil*.so*" | head
