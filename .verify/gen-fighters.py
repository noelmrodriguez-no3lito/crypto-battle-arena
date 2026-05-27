#!/usr/bin/env python3
"""
Generate 8 SF6-style 3D-rendered fighting-game character portraits via
Pollinations.ai (Flux). No API key. Outputs PNGs to public/fighters/.

Usage:
    python3 .verify/gen-fighters.py
    python3 .verify/gen-fighters.py --only veteran
    python3 .verify/gen-fighters.py --model flux            # default
    python3 .verify/gen-fighters.py --size 768
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

# SF6 / Tekken 8 / Capcom-Vs aesthetic — premium 3D game CG with broadcast polish.
STYLE_PREFIX = (
    "Premium fighting-game character art in the style of Street Fighter 6 "
    "and Tekken 8, polished 3D-rendered cinematic key art, glossy painterly "
    "shading, dramatic neon rim lighting from above and behind, hero pose "
    "with confident eye contact, deep dark background with subtle volumetric "
    "haze and bokeh, 1:1 square composition, ultra-detailed face and "
    "costume, photogenic athletic proportions, modern esports broadcast feel. "
    "Subject: "
)

FIGHTERS: dict[str, str] = {
    "veteran": (
        "A legendary heavyweight boxer in his late 50s — grizzled chiseled "
        "face with battle scars, salt-and-pepper beard, thick gold chain over "
        "a tank top, brown leather wraps on raised fists, intimidating calm "
        "expression. Warm amber and burnished gold rim light against a deep "
        "blood-red atmospheric background."
    ),
    "architect": (
        "A sleek cyberpunk technician in his 20s — sharp jawline, asymmetric "
        "undercut, holographic AR visor across the eyes streaming live data, "
        "glowing cyan circuit-board tattoos along the forearms, tactical "
        "techwear jacket with cyan glow seams. Electric cyan and deep "
        "indigo rim light against a dark blue atmospheric background."
    ),
    "flash": (
        "A young hyper-speed runner caught mid-stride pose — athletic lean "
        "build, asymmetric two-tone hair (electric green on one side, hot "
        "magenta on the other), racing windbreaker, motion-blur neon speed "
        "trails behind in lime and magenta. Confident toothy grin. Vivid lime "
        "and magenta rim light against a dark teal background."
    ),
    "trickster": (
        "A muscular anthropomorphic Shibe Inu wrestler standing upright, "
        "championship belt slung over shoulder, oversized red boxing gloves, "
        "wrestling singlet, toothy cocky grin showing teeth, jaunty pose. "
        "Warm gold and crimson rim light against a deep orange background."
    ),
    "operator": (
        "A sharp-suited stoic dark agent — tailored black trench coat over a "
        "fitted three-piece suit, mirrored aviator sunglasses, briefcase held "
        "low like a weapon, cold tactical stance, square jaw, short cropped "
        "hair. Crimson and steel-silver rim light against a charcoal "
        "atmospheric background."
    ),
    "sage": (
        "A robed scholar-mage in his 40s — dignified beard, round wire-rimmed "
        "glasses, long flowing robes patterned with luminous circuit-board "
        "traces and golden runes, holding a glowing parchment scroll like a "
        "staff, third-eye gem glowing on forehead, calm methodical "
        "expression. Royal purple and electric gold rim light against a deep "
        "violet background."
    ),
    "tycoon": (
        "A flashy wealthy young champion — confident smirk, well-groomed "
        "hair, golden double-breasted jacket with jeweled lapels, multiple "
        "diamond rings on every finger, gold chains, oversized diamond watch, "
        "leaning back with arms spread. Golden-yellow and warm-white rim "
        "light against a deep green emerald background."
    ),
    "oracle": (
        "A hooded mystic warrior — partial face shadow under deep hood, "
        "glowing eyes, heavy iron chains wrapped as armor over flowing robes, "
        "large hexagonal hex-pendant glowing on chest, mystical third eye "
        "glowing on forehead, supernatural calm pose with hands raised. "
        "Glowing white and electric teal rim light against a deep teal-black "
        "background."
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


def fetch_one(url: str, dest: Path, *, timeout: int = 180) -> int:
    req = urllib.request.Request(url, headers={"User-Agent": "crypto-battle-arena/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    if not data or len(data) < 1024:
        raise RuntimeError(f"image too small ({len(data)} bytes)")
    dest.write_bytes(data)
    return len(data)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Generate only this fighter")
    ap.add_argument("--model", default="flux", help="Pollinations model (flux, flux-realism, flux-pro, turbo)")
    ap.add_argument("--size", type=int, default=768)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--skip-existing", action="store_true")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    targets = {args.only: FIGHTERS[args.only]} if args.only else FIGHTERS

    print(f"generating {len(targets)} fighters via Pollinations [{args.model}] @ {args.size}px")
    success = 0
    for name, brief in targets.items():
        dest = OUT_DIR / f"{name}.png"
        if args.skip_existing and dest.exists():
            print(f"  skip {name}")
            continue
        prompt = STYLE_PREFIX + brief
        url = build_url(prompt, width=args.size, height=args.size, model=args.model, seed=args.seed)
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
