import * as Phaser from "phaser";
import { GAME_H, GAME_W, type JobId, type MapId } from "./content";
import { BootScene } from "./scenes/BootScene";
import { WorldScene } from "./scenes/WorldScene";

export type CreateOpts = {
  parent: HTMLElement;
  job: JobId;
  mapId: MapId;
};

export function createGame(opts: CreateOpts) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: opts.parent,
    width: GAME_W,
    height: GAME_H,
    backgroundColor: "#121814",
    pixelArt: false,
    roundPixels: true,
    audio: { noAudio: true },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_W,
      height: GAME_H,
    },
    fps: { target: 60, min: 30, smoothStep: true },
    callbacks: {
      preBoot: (g) => {
        g.registry.set("job", opts.job);
        g.registry.set("mapId", opts.mapId);
      },
    },
    scene: [BootScene, WorldScene],
    banner: false,
  });
  return game;
}
