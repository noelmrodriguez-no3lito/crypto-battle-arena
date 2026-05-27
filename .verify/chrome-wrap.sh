#!/usr/bin/env bash
# Wraps chrome-headless-shell with LD_LIBRARY_PATH for the locally-extracted
# nspr/nss libs. Both downloaded into ~/.cache/chrome-headless by the sibling
# get-chrome.sh + get-deps.sh scripts. Overridable for non-default cache roots.
CACHE_ROOT="${CBA_CHROME_CACHE:-$HOME/.cache/chrome-headless}"
export LD_LIBRARY_PATH="${CACHE_ROOT}/deps/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
exec "${CACHE_ROOT}/chrome-headless-shell-linux64/chrome-headless-shell" "$@"
