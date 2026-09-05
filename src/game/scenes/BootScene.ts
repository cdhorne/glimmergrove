import * as Phaser from "phaser";
import { IMAGES, SHEETS } from "../assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bar = this.add.rectangle(w / 2, h / 2, 240, 8, 0x2d3a32).setOrigin(0.5);
    const fill = this.add.rectangle(w / 2 - 120, h / 2, 0, 8, 0x6b8f71).setOrigin(0, 0.5);
    this.add
      .text(w / 2, h / 2 - 28, "Loading the groves", {
        fontFamily: "Figtree, sans-serif",
        fontSize: "16px",
        color: "#f4efe4",
      })
      .setOrigin(0.5);

    this.load.on("loaderror", (file: { key: string }) => {
      console.warn("missing asset", file.key);
    });

    this.load.on("progress", (v: number) => {
      fill.width = 240 * v;
    });

    for (const img of IMAGES) this.load.image(img.key, img.url);
    for (const sheet of SHEETS) {
      if (sheet.image) this.load.image(sheet.key, sheet.url);
      else this.load.spritesheet(sheet.key, sheet.url, { frameWidth: sheet.frame, frameHeight: sheet.frame });
    }
  }

  create() {
    for (const sheet of SHEETS) {
      if (sheet.image) continue;
      this.sliceSheet(sheet.key, sheet.frame, sheet.frame);
    }

    const make = (key: string, rate: number, repeat = -1) => {
      if (!this.textures.exists(key)) return;
      if (this.anims.exists(key)) this.anims.remove(key);
      const tex = this.textures.get(key);
      const frames = [0, 1, 2, 3]
        .filter((n) => tex.has(String(n)))
        .map((frame) => ({ key, frame }));
      if (frames.length < 2) return;
      this.anims.create({ key, frames, frameRate: rate, repeat });
    };

    make("guardian-idle", 5);
    make("guardian-run", 10);
    make("guardian-attack", 12, 0);
    make("weaver-idle", 5);
    make("weaver-run", 10);
    make("weaver-attack", 11, 0);
    make("ranger-idle", 5);
    make("ranger-run", 10);
    make("ranger-attack", 11, 0);
    make("dewslug-idle", 5);
    make("dewslug-walk", 8);
    make("capling-idle", 5);
    make("capling-walk", 8);
    make("warden-idle", 4);
    make("arrow", 8);
    make("orb", 8);
    make("slash", 14, 0);
    make("glim", 8);
    make("herbalist-idle", 5);

    const job = this.registry.get("job") as string;
    const map = this.registry.get("mapId") as string;
    this.scene.start("world", { job, mapId: map });
  }

  private sliceSheet(key: string, fw: number, fh: number) {
    if (!this.textures.exists(key)) return;
    const tex = this.textures.get(key);
    const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!src || !src.width) return;
    const cols = Math.max(1, Math.floor(src.width / fw));
    const rows = Math.max(1, Math.floor(src.height / fh));
    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (tex.has(String(i))) tex.remove(String(i));
        tex.add(i, 0, x * fw, y * fh, fw, fh);
        i += 1;
      }
    }
  }
}
