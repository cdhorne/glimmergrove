#!/usr/bin/env python3
"""Snap JPEG magenta, process sprite sheets, copy engine-ready PNGs."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace")
ART = ROOT / "artifacts" / "imagine_images"
PROC = ROOT / ".grok" / "skills" / "generate2dsprite" / "scripts" / "generate2dsprite.py"
OUT_SPRITES = ROOT / "public" / "game" / "sprites"
OUT_MAP = ROOT / "public" / "game" / "map"
WORK = ROOT / "assets" / "processed"
OUT_SPRITES.mkdir(parents=True, exist_ok=True)
OUT_MAP.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)

SHEETS: list[tuple[str, str, str, str, int]] = [
    # name, asset_id, target, mode, cell
    ("guardian-idle", "ccb70199-a70a-4f16-a2cb-2aa569cd5f44", "player", "idle", 192),
    ("guardian-run", "c1e28b7c-55f6-45f0-b2cb-3f3ba947dd38", "player", "run", 192),
    ("guardian-attack", "9328623e-0ac6-4f80-ab83-4b6025e69e36", "player", "attack", 192),
    ("weaver-idle", "1bb81d2b-791f-435f-b80c-d412dac505d4", "player", "idle", 192),
    ("weaver-run", "5124c72f-6a36-4428-9ce8-b397443d0029", "player", "run", 192),
    ("weaver-attack", "1c056fe7-1df2-4627-a373-0d453d2e1d51", "player", "cast", 192),
    ("ranger-idle", "62336817-1855-4e7f-96e4-c4b6a3215a3a", "player", "idle", 192),
    ("ranger-run", "faf62416-ba87-4ae7-a3b0-4ddfafb75149", "player", "run", 192),
    ("ranger-attack", "7210f73d-d92a-457f-9a1f-8c5298604180", "player", "shoot", 192),
    ("dewslug-idle", "3cf80bf5-caf9-433c-82e0-f2b68cd3b64c", "creature", "idle", 160),
    ("dewslug-walk", "2f84be5a-0cdf-4445-9491-5d790612c4f9", "creature", "walk", 160),
    ("capling-idle", "b5641523-2225-43e4-9cf6-da52722040b4", "creature", "idle", 160),
    ("capling-walk", "7a06ef28-abe4-4abf-8bd2-f2b6ef11bb60", "creature", "walk", 160),
    ("warden-idle", "3aba4e55-26ff-4785-a89a-6d3b55e4355b", "creature", "idle", 256),
    ("arrow", "688e295d-0c74-4d21-832e-0f598fb3235a", "asset", "projectile", 128),
    ("orb", "e9e2a039-9bce-4735-b40e-f90acc75b62c", "asset", "projectile", 128),
    ("slash", "5c0553fa-31f8-4f1a-af16-20f2745fde22", "asset", "fx", 128),
    ("glim", "8f209516-7d6f-4e3e-bfb6-bf8274cb3221", "asset", "idle", 96),
    ("herbalist-idle", "89544095-c798-40fe-b271-7b69ae3249b2", "npc", "idle", 192),
]

SINGLES = [
    ("portal", "a32b0e61-4c98-403e-aef7-859b33d139dd", 256),
]


def snap_magenta(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGB")
    a = np.array(im)
    r = a[:, :, 0].astype(np.int16)
    g = a[:, :, 1].astype(np.int16)
    b = a[:, :, 2].astype(np.int16)
    mag = (r > 165) & (b > 165) & (g < 140) & (np.abs(r - b) < 90)
    a[mag] = (255, 0, 255)
    Image.fromarray(a).save(dst)


def run_process(name: str, png: Path, target: str, mode: str, cell: int) -> None:
    out = WORK / name
    if out.exists():
        shutil.rmtree(out)
    cmd = [
        sys.executable,
        str(PROC),
        "process",
        "--input",
        str(png),
        "--target",
        target,
        "--mode",
        mode,
        "--output-dir",
        str(out),
        "--shared-scale",
        "--align",
        "feet" if target in {"player", "npc", "creature"} else "center",
        "--component-mode",
        "largest" if target in {"player", "npc", "creature"} else "all",
        "--cell-size",
        str(cell),
        "--rows",
        "2",
        "--cols",
        "2",
        "--threshold",
        "90",
        "--edge-threshold",
        "140",
    ]
    print("PROCESS", name, flush=True)
    subprocess.check_call(cmd)
    sheet = out / "sheet-transparent.png"
    if not sheet.exists():
        raise SystemExit(f"missing sheet for {name}")
    shutil.copy2(sheet, OUT_SPRITES / f"{name}.png")
    meta = json.loads((out / "pipeline-meta.json").read_text())
    print(
        f"  {name}: {meta.get('cell_size')} edge={meta.get('edge_touch_frames')}",
        flush=True,
    )


def run_single(name: str, png: Path, size: int) -> None:
    out = WORK / name
    if out.exists():
        shutil.rmtree(out)
    cmd = [
        sys.executable,
        str(PROC),
        "process",
        "--input",
        str(png),
        "--target",
        "asset",
        "--mode",
        "single",
        "--output-dir",
        str(out),
        "--single-size",
        str(size),
        "--threshold",
        "90",
        "--edge-threshold",
        "140",
    ]
    print("PROCESS", name, flush=True)
    subprocess.check_call(cmd)
    clean = out / "clean.png"
    shutil.copy2(clean, OUT_SPRITES / f"{name}.png")


def copy_maps() -> None:
    mapping = {
        "haven-sky": "d402fe7f-a6a0-4c0b-a25d-10b024981204",
        "dewpath-sky": "d0ce86f5-345e-49d9-86e1-747857532063",
        "heartwood-sky": "2c82b3fc-fe91-4bee-96f5-34efb73af7b3",
    }
    for name, aid in mapping.items():
        src = ART / f"{aid}.jpg"
        shutil.copy2(src, OUT_MAP / f"{name}.jpg")

    grass = Image.open(ART / "3b4ed130-9a98-4f5a-b47f-de1957759b44.jpg").convert("RGB")
    gw, gh = grass.size
    grass.crop((0, 0, gw, int(gh * 0.38))).save(OUT_MAP / "grass.png")
    wood = Image.open(ART / "36f057c6-4b69-4fd2-9983-c996d1c4485b.jpg").convert("RGB")
    ww, wh = wood.size
    wood.crop((0, 0, ww, int(wh * 0.42))).save(OUT_MAP / "wood.png")


def portraits() -> None:
    """First idle frame as job-select portrait."""
    for job in ("guardian", "weaver", "ranger"):
        src = WORK / f"{job}-idle" / "sheet-transparent.png"
        if not src.exists():
            continue
        im = Image.open(src).convert("RGBA")
        w, h = im.size
        im.crop((0, 0, w // 2, h // 2)).save(OUT_SPRITES / f"{job}-portrait.png")


def main() -> None:
    copy_maps()
    for name, aid, target, mode, cell in SHEETS:
        raw = ART / f"{aid}.jpg"
        if not raw.exists():
            print("MISSING", name, raw)
            continue
        png = WORK / f"{name}-raw.png"
        snap_magenta(raw, png)
        run_process(name, png, target, mode, cell)
    for name, aid, size in SINGLES:
        raw = ART / f"{aid}.jpg"
        png = WORK / f"{name}-raw.png"
        snap_magenta(raw, png)
        run_single(name, png, size)
    portraits()
    print("DONE")


if __name__ == "__main__":
    main()
