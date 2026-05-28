#!/usr/bin/env python3
"""Generate the moderator portrait via Pollinations Flux."""
from __future__ import annotations
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "public" / "fighters" / "moderator.png"

PROMPT = (
    "Premium fighting-game broadcast referee character art in the style of "
    "Street Fighter 6 and Tekken 8 announcer screens. Polished 3D-rendered "
    "cinematic CG, glossy painterly shading, dramatic stage lighting with "
    "subtle volumetric haze, neutral confident pose, 1:1 square composition. "
    "Subject: a sharp-dressed sports commentator and crypto debate moderator "
    "in his 30s, wearing a tailored midnight-purple suit with subtle pinstripes, "
    "tasteful gold lapel pin, broadcast headset with neon-purple microphone arm, "
    "holding a tablet displaying glowing data, square jaw, well-groomed dark hair, "
    "warm intelligent eyes, calm authoritative expression. Cool indigo and "
    "violet rim light against a deep purple atmospheric background with bokeh."
)


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    encoded = urllib.parse.quote(PROMPT, safe="")
    qs = {
        "width": "768",
        "height": "768",
        "model": "flux",
        "nologo": "true",
        "enhance": "true",
        "private": "true",
    }
    url = f"https://image.pollinations.ai/prompt/{encoded}?{urllib.parse.urlencode(qs)}"
    print(f"generating moderator -> {OUT}")
    t0 = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": "cba/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = resp.read()
        if not data or len(data) < 1024:
            print(f"image too small: {len(data)} bytes")
            return 1
        OUT.write_bytes(data)
        print(f"OK {time.time()-t0:.1f}s {len(data)//1024} KB")
        return 0
    except Exception as e:
        print(f"FAIL {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
