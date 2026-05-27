#!/usr/bin/env bash
set -euo pipefail
mkdir -p "$HOME/.cache/chrome-headless"
cd "$HOME/.cache/chrome-headless"
VER="149.0.7827.22"
URL="https://storage.googleapis.com/chrome-for-testing-public/${VER}/linux64/chrome-headless-shell-linux64.zip"
if [ ! -f chs.zip ]; then
  echo "downloading"
  curl -sSL -o chs.zip "$URL"
fi
ls -la chs.zip
python3 -c "import zipfile; zipfile.ZipFile('chs.zip').extractall('.')"
BIN="$(find . -name chrome-headless-shell -type f | head -1)"
chmod +x "$BIN"
echo "BIN=$BIN"
"$BIN" --version || true
