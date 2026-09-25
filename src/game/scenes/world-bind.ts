import * as Phaser from "phaser";
import { GAME_H, JOBS, MAPS, MONSTERS, expToNext, rollDrop, type ItemDef, type MapId } from "../content";
import { sfxPlay } from "../audio";
import { gameBus } from "../bus";
import { writeSave } from "../save";
import { stepMob } from "../mobs";
import { yieldOf } from "../economy";
import { grantXp } from "../world/rules";
import { gapDeath, inGap, solidUnder, tickTravel } from "../world/travel";
import { emitWorldHud } from "../world/present";
import { grantHarvest, harvestAmount, loseToGap, skinFor } from "../world/harvest";
import { skinLook } from "../skin";
import { boltSpec, planBoltTouch, planHurt, planTouch } from "../world/combat-run";
import { dropChip, drawMobChip, flashFx, popNumber, spawnGlims, spawnItem } from "./hitRead";
import type { ActionFrame } from "../input";

export type SceneHit = Phaser.Scene & {
  mapId: MapId;
  jobId: any;
  save: any;
  player: Phaser.Physics.Arcade.Sprite;
  solids: Phaser.Physics.Arcade.StaticGroup;
  facing: number;
  invuln: number;
  knockLock: number;
  trauma: number;
  dead: boolean;
  paused: boolean;
  hudT: number;
  prompt: string | null;
  interact: any;
  mobs: any[];
  bullets: Phaser.Physics.Arcade.Group;
  drops: Phaser.Physics.Arcade.Group;
  lastHits: { k: string; dmg: number; x: number; n: string }[];
  changingMap: boolean;
  portalLock: number;
  portalDwell: number;
  skillCd: number;
  tex: (key: string) => string;
  spawnMob: (kind: any, x: number, y: number) => any;
  hurtMob: (mob: any, dmg: number) => void;
  killMob: (mob: any) => void;
  die: () => void;
  persist: (force?: boolean) => void;
  tryInteract: () => void;
  enterMap: (to: MapId, force?: boolean) => void;
  emitHud: () => void;
  maxHp: () => number;
  maxMp: () => number;
  def: () => number;
};

export function atkOf(scene: SceneHit) {
  const eq = scene.save.equipped;
  return JOBS[scene.jobId].atk + (scene.save.level - 1) * 2 + (eq.weapon?.atk ?? 0) + (eq.acc?.atk ?? 0);
}
export function defOf(scene: SceneHit) {
  const eq = scene.save.equipped;
  return JOBS[scene.jobId].def + (eq.armor?.def ?? 0) + (eq.acc?.def ?? 0);
}
export function maxHpOf(scene: SceneHit) {
  return JOBS[scene.jobId].hp + (scene.save.level - 1) * 12 + (scene.save.equipped.armor?.def ?? 0) * 2;
}
export function maxMpOf(scene: SceneHit) {
  return JOBS[scene.jobId].mp + (scene.save.level - 1) * 6;
}

export function fireBoltsOn(scene: SceneHit, bolt: NonNullable<ReturnType<typeof boltSpec>>, dmg: number, pierce: number, falloff: number) {
  const key = scene.textures.exists(bolt.key) ? bolt.key : scene.tex("glim");
  for (let i = 0; i < bolt.shots; i++) {
    const mid = (bolt.shots - 1) / 2;
    const yOff = (i - mid) * bolt.spread;
    const shot = scene.bullets.get(scene.player.x + scene.facing * 28, scene.player.y - 46 + yOff, key) as Phaser.Physics.Arcade.Sprite | null;
    if (!shot) continue;
    shot.setActive(true).setVisible(true).setDepth(9).setScale(bolt.key === "orb" ? 0.28 : 0.34);
    shot.setFlipX(scene.facing < 0);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(scene.facing * bolt.speed, 0);
    shot.setData("dmg", dmg);
    shot.setData("pierce", Math.max(1, pierce));
    shot.setData("falloff", falloff);
    shot.setData("hitIds", [] as number[]);
    if (scene.anims.exists(bolt.key)) shot.play(bolt.key, true);
    scene.physics.add.overlap(shot, scene.mobs as unknown as Phaser.GameObjects.GameObject[], (_b, m) => {
      const mob = m as any;
      if (!shot.active || !mob.active) return;
      const touch = planBoltTouch({
        hitIds: (shot.getData("hitIds") as number[]) ?? [],
        uid: mob.uid,
        base: Number(shot.getData("dmg") ?? dmg),
        falloff: Number(shot.getData("falloff") ?? 0),
        pierce: Number(shot.getData("pierce") ?? 1),
        blockPierce: MONSTERS[mob.kind].blockPierce,
      });
      if (!touch) return;
      shot.setData("hitIds", touch.hitIds);
      scene.hurtMob(mob, touch.dmg);
      if (touch.stop) shot.destroy();
    });
    scene.time.delayedCall(bolt.life * 1000, () => {
      if (shot.active) shot.destroy();
    });
  }
}

export function hurtMobOn(scene: SceneHit, mob: any, dmg: number) {
  if (!mob.active) return;
  const plan = planHurt({ kind: mob.kind, hp: mob.hp, dmg, playerX: scene.player.x, mobX: mob.x });
  mob.hp = plan.hp;
  mob.hurtT = plan.stun;
  mob.chipT = plan.chipT;
  scene.trauma = Math.min(1, scene.trauma + plan.trauma);
  scene.lastHits.push({ k: mob.kind, dmg: plan.rolled, x: Math.round(mob.x), n: plan.tone });
  if (scene.lastHits.length > 24) scene.lastHits.shift();
  popNumber(scene, mob.x + (Math.random() - 0.5) * 18, mob.y - 48, `${plan.rolled}`, plan.tone);
  flashFx(scene, mob.x, mob.y - 36, scene.facing);
  mob.setTintFill(0xffffff);
  scene.time.delayedCall(70, () => {
    if (!mob.active) return;
    mob.clearTint();
    const look = skinLook(mob.kind);
    if (look.tint) mob.setTint(look.tint);
  });
  sfxPlay.hit();
  if (plan.dead) scene.killMob(mob);
  else if (plan.knock) {
    (mob.body as Phaser.Physics.Arcade.Body).setVelocity(plan.knock.vx, plan.knock.vy);
  }
}

export function killMobOn(scene: SceneHit, mob: any) {
  const def = MONSTERS[mob.kind];
  const isBoss = mob.kind === "warden";
  const yieldKind = yieldOf(mob.kind);
  if (yieldKind && scene.save.economy) {
    const { prompt } = grantHarvest(scene.save.economy, yieldKind, harvestAmount(mob.kind));
    scene.prompt = prompt;
    scene.time.delayedCall(1400, () => {
      if (scene.prompt?.startsWith("Bag")) scene.prompt = null;
    });
  }
  const xp = grantXp({ exp: scene.save.exp, level: scene.save.level, amount: def.exp, nextAt: expToNext });
  scene.save.exp = xp.exp;
  scene.save.level = xp.level;
  if (xp.leveled) {
    scene.save.hp = scene.maxHp();
    scene.save.mp = scene.maxMp();
    sfxPlay.level();
    popNumber(scene, scene.player.x, scene.player.y - 70, "Level up", "good");
  }
  scene.save.kills += 1;
  if (scene.save.kills >= 8) scene.save.heartwoodOpen = true;
  if (isBoss) {
    scene.save.wardenDown = true;
    scene.prompt = "The boss is down";
    scene.trauma = Math.min(1, scene.trauma + 0.8);
  }
  spawnGlims(scene, scene.drops, scene.solids, mob.x, mob.y, def.glims, (k) => scene.tex(k));
  const drop = rollDrop(isBoss);
  if (drop) spawnItem(scene, scene.drops, scene.solids, mob.x, mob.y - 10, drop, (k) => scene.tex(k));
  flashFx(scene, mob.x, mob.y, scene.facing);
  dropChip(mob);
  mob.destroy();
  scene.mobs = scene.mobs.filter((m) => m !== mob);
  scene.persist();
  if (!isBoss) {
    const ox = mob.originX;
    const oy = mob.originY;
    const kind = mob.kind;
    scene.time.delayedCall(8000, () => {
      if (!scene.changingMap && !scene.dead) scene.spawnMob(kind, ox, oy);
    });
  }
}

export function touchMobOn(scene: SceneHit, mob: any) {
  if (!mob.active) return;
  const plan = planTouch({
    kind: mob.kind,
    def: scene.def(),
    playerX: scene.player.x,
    mobX: mob.x,
    invuln: scene.invuln,
    dead: scene.dead,
  });
  if (!plan) return;
  scene.save.hp -= plan.dmg;
  scene.invuln = plan.invuln;
  scene.knockLock = plan.knock.stun;
  (scene.player.body as Phaser.Physics.Arcade.Body).setVelocity(plan.knock.vx, plan.knock.vy);
  scene.trauma = Math.min(1, scene.trauma + plan.trauma);
  sfxPlay.hurt();
  popNumber(scene, scene.player.x, scene.player.y - 36, `${plan.dmg}`, "hurt");
  if (scene.save.hp <= 0) scene.die();
}
