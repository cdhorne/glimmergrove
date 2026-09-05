#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace")
KEEP = ROOT / "assets" / "keep"
PROC = ROOT / ".grok" / "skills" / "generate2dsprite" / "scripts" / "generate2dsprite.py"
OUT = ROOT / "public" / "game" / "sprites"
WORK = ROOT / "assets" / "processed"
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    ("guardian-attack", "player", "attack", 192),
    ("weaver-run", "player", "run", 192),
    ("weaver-attack", "player", "attack", 192),
    ("ranger-run", "player", "run", 192),
    ("ranger-attack", "player", "shoot", 192),
    ("dewslug-idle", "creature", "idle", 160),
    ("capling-walk", "creature", "walk", 160),
    ("warden-idle", "creature", "idle", 256),
    ("arrow", "asset", "projectile", 128),
    ("orb", "asset", "projectile", 128),
    ("slash", "asset", "fx", 128),
    ("glim", "asset", "idle", 96),
    ("herbalist-idle", "npc", "idle", 192),
]


def snap(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGB")
    a = np.array(im)
    r = a[:, :, 0].astype(np.int16)
    g = a[:, :, 1].astype(np.int16)
    b = a[:, :, 2].astype(np.int16)
    mag = (r > 165) & (b > 165) & (g < 140) & (np.abs(r - b) < 90)
    a[mag] = (255, 0, 255)
    Image.fromarray(a).save(dst)


def process_grid(name: str, src: Path, target: str, mode: str, cell: int) -> None:
    out = WORK / name
    if out.exists():
        shutil.rmtree(out)
    png = WORK / f"{name}-raw.png"
    snap(src, png)
    cmd = [
        sys.executable, str(PROC), "process",
        "--input", str(png), "--target", target, "--mode", mode,
        "--output-dir", str(out), "--shared-scale",
        "--align", "feet" if target in {"player", "npc", "creature"} else "center",
        "--component-mode", "largest" if target in {"player", "npc", "creature"} else "all",
        "--cell-size", str(cell), "--rows", "2", "--cols", "2",
        "--threshold", "90", "--edge-threshold", "140",
    ]
    print("PROCESS", name, flush=True)
    subprocess.check_call(cmd)
    shutil.copy2(out / "sheet-transparent.png", OUT / f"{name}.png")


def process_single(name: str, src: Path) -> None:
    out = WORK / name
    if out.exists():
        shutil.rmtree(out)
    png = WORK / f"{name}-raw.png"
    snap(src, png)
    cmd = [
        sys.executable, str(PROC), "process",
        "--input", str(png), "--target", "asset", "--mode", "single",
        "--output-dir", str(out), "--single-size", "256",
        "--threshold", "90", "--edge-threshold", "140",
    ]
    print("PROCESS", name, flush=True)
    subprocess.check_call(cmd)
    shutil.copy2(out / "clean.png", OUT / f"{name}.png")


def portraits() -> None:
    for job in ("guardian", "weaver", "ranger"):
        src = WORK / f"{job}-idle" / "sheet-transparent.png"
        if src.exists():
            im = Image.open(src).convert("RGBA")
            w, h = im.size
            im.crop((0, 0, w // 2, h // 2)).save(OUT / f"{job}-portrait.png")


def main() -> None:
    capling_idle = ROOT / "assets" / "sprites" / "capling" / "raw-idle.jpg"
    if capling_idle.exists() and not (OUT / "capling-idle.png").exists():
        process_grid("capling-idle", capling_idle, "creature", "idle", 160)
    for name, target, mode, cell in JOBS:
        src = KEEP / f"{name}.jpg"
        if not src.exists():
            print("skip missing", name)
            continue
        if (OUT / f"{name}.png").exists():
            print("have", name)
            continue
        process_grid(name, src, target, mode, cell)
    portal = KEEP / "portal.jpg"
    if portal.exists():
        process_single("portal", portal)
    portraits()
    print("KEEP DONE", list(OUT.iterdir()))


if __name__ == "__main__":
    main()
