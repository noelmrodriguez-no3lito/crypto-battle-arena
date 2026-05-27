#!/usr/bin/env python3
"""
Generate 8 anime cel-shaded fighting-game character portraits via
Pollinations.ai (Flux). No API key. Outputs PNGs to public/fighters/.

Usage:
    python3 .verify/gen-fighters.py
    python3 .verify/gen-fighters.py --only veteran
    python3 .verify/gen-fighters.py --model flux-anime  # default
    python3 .verify/gen-fighters.py --size 768          # 768x768 instead of 512
    python3 .verify/gen-fighters.py --skip-existing
"""
from __future__ import annotations
import argparse
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "public" / "fighters"

STYLE_PREFIX = (
    "Anime cel-shaded fighting game character art, Street Fighter Alpha and "
    "Capcom Vs Marvel era, bold inked linework, dramatic neon rim lighting, "
    "vibrant flat shading, dynamic 3/4 bust portrait, expressive face, "
    "heroic exaggerated proportions, solid dark navy background, 1:1 square "
    "composition, highly detailed character design. Character: "
)

FIGHTERS: dict[str, str] = {
    "veteran": (
        "Aging heavyweight boxer in his late 50s. Grizzled scarred face, "
        "thick gray beard, brown leather boxing hand-wraps, gold chain over "
        "a tank top, fists raised in stance. Battle-worn intimidating. "
        "Warm browns, gold, deep red palette."
    ),
    "architect": (
        "Lean cyberpunk hacker in his 20s. Holographic visor over eyes "
        "scrolling code, glowing cyan geometric circuit tattoos along "
        "forearms, slim black techwear jacket with neon accents, smirk. "
        "Midnight blue, neon cyan, electric purple palette."
    ),
    "flash": (
        "Young sprinter physique in dynamic mid-stride pose with motion-"
        "blur neon speed trails behind. Asymmetric two-tone hair half "
        "neon green half magenta. Racing-jacket and high-tops. Confident "
        "grin. Lime green, magenta, white palette."
    ),
    "trickster": (
        "Anthropomorphic Shibe Inu wrestler standing on two legs. Cocky "
        "smug toothy grin, oversized red boxing gloves, wrestling singlet, "
        "championship belt over shoulder. Meme-coin energy. Golden tan fur, "
        "red, gold palette."
    ),
    "operator": (
        "Sharp-suited dark agent fighter. Black trench coat over fitted "
        "suit, mirrored sunglasses, holding a metallic briefcase like a "
        "weapon, cold tactical posture, expressionless. Jet black, charcoal, "
        "steel gray with crimson accents palette."
    ),
    "sage": (
        "Robed scholar mage. Long mantle patterned with glowing circuit-"
        "board traces, round wire-rimmed glasses, holding glowing scroll "
        "like a staff, third-eye gem on forehead, methodical calm. Deep "
        "purple, gold, electric blue palette."
    ),
    "tycoon": (
        "Flashy wealthy champion. Golden jacket with jeweled lapels, rings "
        "on every finger, gold chains, oversized diamond watch, confident "
        "smirk, casino-styled. Gold, white, deep emerald palette."
    ),
    "oracle": (
        "Hooded mystic warrior. Chains wrapped as armor over flowing "
        "robes, glowing hexagonal pendant on chest, mystical third eye "
        "glowing on forehead, partial face shadow under hood, supernatural "
        "calm. Deep teal, silver, glowing white palette."
    ),
}


def build_url(prompt: str, *, width: int, height: int, model: str, seed: int | None) -> str:
    encoded = urllib.parse.quote(prompt, safe="")
    qs = {
        "width": str(width),
        "height": str(height),
        "model": model,
        "nologo": "true",
        "enhance": "true",
        "private": "true",
    }
    if seed is not None:
        qs["seed"] = str(seed)
    return f"https://image.pollinations.ai/prompt/{encoded}?{urllib.parse.urlencode(qs)}"


def fetch_one(url: str, dest: Path, *, timeout: int = 120) -> int:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "crypto-battle-arena/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    if not data or len(data) < 1024:
        raise RuntimeError(f"image too small ({len(data)} bytes) — bad response")
    # Pollinations returns JPEG sometimes; PNG sometimes. Sniff and save under .png anyway.
    dest.write_bytes(data)
    return len(data)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Generate only this fighter")
    ap.add_argument("--model", default="flux-anime",
                    help="Pollinations model (flux-anime, flux, flux-realism, turbo)")
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--skip-existing", action="store_true")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    targets = {args.only: FIGHTERS[args.only]} if args.only else FIGHTERS

    print(f"generating {len(targets)} fighters via Pollinations [{args.model}] -> {OUT_DIR}")
    success = 0
    for name, brief in targets.items():
        dest = OUT_DIR / f"{name}.png"
        if args.skip_existing and dest.exists():
            print(f"  skip {name}")
            continue
        prompt = STYLE_PREFIX + brief
        url = build_url(prompt, width=args.size, height=args.size,
                        model=args.model, seed=args.seed)
        print(f"  {name:10s}  ", end="", flush=True)
        t0 = time.time()
        try:
            size = fetch_one(url, dest)
            elapsed = time.time() - t0
            print(f"OK   {elapsed:5.1f}s   {size // 1024:5d} KB")
            success += 1
        except Exception as e:
            print(f"FAIL   {e}")
    print(f"\n{success}/{len(targets)} succeeded.")
    return 0 if success == len(targets) else 1


if __name__ == "__main__":
    sys.exit(main())
