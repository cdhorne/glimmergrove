/**
 * The only WorldScene contact for piles.
 * Call from createGame next to installMotion. Do not call from React or feel.
 *
 * Hooks: create, spawnActors, spawnMob, killMob, checkPits, emitHud, tryInteract.
 * Does not replace combat, wander, or input.
 */
import * as Phaser from "phaser";
import { GAME_H, MAPS, type MonsterKind } from "../content";
import { defaultEconomy, pileOf } from "../economy";
import { gameBus } from "../bus";
import type { SaveData } from "../save";
import { dumpKind, grantPile, hudEconomy, pileAmount, shouldSpawn, skinFor } from "./piles";

type SceneLike = {
  mapId: string;
  save: SaveData;
  mobs: Array<
    Phaser.Physics.Arcade.Sprite & {
      kind: string;
      originX: number;
      originY: number;
      active: boolean;
    }
  >;
  prompt: string | null;
  time: Phaser.Time.Clock;
  persist: (force?: boolean) => void;
  spawnMob: (kind: MonsterKind, x: number, y: number) => unknown;
  changingMap: boolean;
  dead: boolean;
};

export function installPiles(SceneCls: { prototype: Record<string, unknown> }) {
  const proto = SceneCls.prototype as SceneLike & {
    create: () => void;
    spawnActors: () => void;
    spawnMob: (kind: MonsterKind, x: number, y: number) => Phaser.Physics.Arcade.Sprite;
    killMob: (mob: SceneLike["mobs"][number]) => void;
    checkPits: () => void;
    emitHud: () => void;
    tryInteract: () => void;
    interact: { type: string } | null;
  };

  const prevCreate = proto.create;
  proto.create = function createPiles() {
    prevCreate.call(this);
    if (this.save && !this.save.economy) this.save.economy = defaultEconomy();
  };

  const prevActors = proto.spawnActors;
  proto.spawnActors = function spawnActorsPiles() {
    const map = MAPS[this.mapId as keyof typeof MAPS];
    const kept = map.monsters;
    map.monsters = kept.filter((s) =>
      shouldSpawn(s, this.save.economy.flags, this.save.wardenDown),
    );
    try {
      prevActors.call(this);
    } finally {
      map.monsters = kept;
    }
  };

  const prevSpawn = proto.spawnMob;
  proto.spawnMob = function spawnMobPiles(kind, x, y) {
    const skin = skinFor(kind) as MonsterKind;
    const mob = prevSpawn.call(this, skin, x, y) as Phaser.Physics.Arcade.Sprite & {
      kind: string;
    };
    if (kind !== skin) {
      mob.kind = kind;
      if (kind === "bloom") {
        mob.setScale(0.52);
        mob.setTint(0x7ecf8a);
      }
      if (kind === "stump") {
        mob.setScale(0.48);
        mob.setTint(0x8a6a48);
      }
    }
    return mob;
  };

  const prevKill = proto.killMob;
  proto.killMob = function killMobPiles(mob) {
    const pile = pileOf(mob.kind);
    if (pile && this.save.economy) {
      const { prompt } = grantPile(this.save.economy, pile, pileAmount(mob.kind));
      this.prompt = prompt;
      this.time.delayedCall(1400, () => {
        if (this.prompt?.startsWith("Bag")) this.prompt = null;
      });
    }
    prevKill.call(this, mob);
  };

  const prevPits = proto.checkPits;
  proto.checkPits = function checkPitsPiles() {
    prevPits.call(this);
    const map = MAPS[this.mapId as keyof typeof MAPS];
    for (const mob of [...this.mobs]) {
      if (!mob.active) continue;
      const inWorld = mob.y > GAME_H + 20;
      const inGap = map.pits.some((pit) => mob.x > pit.x && mob.x < pit.x + pit.w && mob.y > 500);
      if (!inWorld && !inGap) continue;
      dumpKind(this.save.economy, mob.kind);
      const ox = mob.originX;
      const oy = mob.originY;
      const kind = mob.kind as MonsterKind;
      const chip = mob.getData("chip") as Phaser.GameObjects.Graphics | undefined;
      chip?.destroy();
      mob.destroy();
      this.mobs = this.mobs.filter((m) => m !== mob);
      this.prompt = "Lost to the gap";
      this.time.delayedCall(1200, () => {
        if (this.prompt === "Lost to the gap") this.prompt = null;
      });
      if (kind !== "warden") {
        this.time.delayedCall(8000, () => {
          if (this.changingMap || this.dead) return;
          this.spawnMob(kind, ox, oy);
        });
      }
      this.persist();
    }
  };

  const prevHud = proto.emitHud;
  proto.emitHud = function emitHudPiles() {
    const emit = gameBus.emit.bind(gameBus);
    gameBus.emit = (event: string, ...args: unknown[]) => {
      if (event === "hud" && args[0] && typeof args[0] === "object") {
        Object.assign(args[0], hudEconomy(this.save.economy));
      }
      return emit(event, ...args);
    };
    try {
      prevHud.call(this);
    } finally {
      gameBus.emit = emit;
    }
  };

  const prevInteract = proto.tryInteract;
  proto.tryInteract = function tryInteractPiles() {
    const npc = this.interact?.type === "npc";
    prevInteract.call(this);
    if (npc) gameBus.emit("open-yard");
  };
}
