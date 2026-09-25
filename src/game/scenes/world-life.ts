import * as Phaser from "phaser";
import { GAME_H, MAPS, MONSTERS, type ItemDef, type MapId } from "../content";
import { sfxPlay } from "../audio";
import { gameBus } from "../bus";
import { writeSave } from "../save";
import { stepMob } from "../mobs";
import { loseToGap, skinFor } from "../world/harvest";
import { gapDeath, inGap, solidUnder, tickTravel } from "../world/travel";
import { emitWorldHud } from "../world/present";
import { dropChip, drawMobChip } from "./hitRead";
import type { ActionFrame } from "../input";
import type { SceneHit } from "./world-bind";

export function updateMobsOn(scene: SceneHit, dt: number) {
  const mapW = MAPS[scene.mapId].width;
  for (const mob of scene.mobs) {
    if (!mob.active) continue;
    const body = mob.body as Phaser.Physics.Arcade.Body;
    const intent = stepMob({
      dt,
      hurtT: mob.hurtT,
      dir: mob.dir,
      x: mob.x,
      y: mob.y,
      originX: mob.originX,
      playerX: scene.player.x,
      playerY: scene.player.y,
      kind: mob.kind,
      speed: MONSTERS[mob.kind].speed,
      grounded: body.blocked.down || body.touching.down,
      groundAhead: solidUnder(scene.mapId, mob.x + mob.dir * 28),
      mapW,
    });
    mob.hurtT = intent.hurtT;
    mob.dir = intent.dir;
    if (intent.pinX != null) {
      mob.setX(intent.pinX);
      if (body.velocity.x * (intent.pinX - 48 > 10 ? 1 : -1) < 0) body.setVelocityX(0);
    }
    if (intent.vx != null) body.setVelocityX(intent.vx);
    if (mob.y > GAME_H + 20) {
      mob.setPosition(mob.originX, mob.originY);
      body.setVelocity(0, 0);
    }
    mob.setFlipX(mob.dir < 0);
    mob.chipT = Math.max(0, mob.chipT - dt);
    drawMobChip(mob);
    const visual = skinFor(mob.kind);
    const walk = `${visual}-walk`;
    const idle = `${visual}-idle`;
    if (intent.vx && scene.anims.exists(walk)) mob.play(walk, true);
    else if (scene.anims.exists(idle)) mob.play(idle, true);
  }
}

export function updateInteractOn(scene: SceneHit, dt: number, a: ActionFrame) {
  const tick = tickTravel(
    {
      mapId: scene.mapId,
      playerX: scene.player.x,
      kills: scene.save.kills,
      heartwoodOpen: scene.save.heartwoodOpen,
      prompt: scene.prompt,
      portalLock: scene.portalLock,
      portalDwell: scene.portalDwell,
    },
    dt,
    a,
  );
  scene.prompt = tick.prompt;
  scene.interact = tick.interact;
  scene.portalDwell = tick.portalDwell;
  if (tick.rest) scene.tryInteract();
  if (tick.enter) scene.enterMap(tick.enter);
}

export function tryInteractOn(scene: SceneHit) {
  if (scene.interact?.type !== "npc") return;
  scene.save.hp = scene.maxHp();
  scene.save.mp = scene.maxMp();
  scene.prompt = "Rested. HP and dew restored.";
  sfxPlay.pickup();
  scene.persist();
  gameBus.emit("open-yard");
}

export function enterMapOn(scene: SceneHit, to: MapId, force = false) {
  if (scene.changingMap) return;
  const dest = MAPS[to];
  if (!dest) return;
  if (!force) {
    const portal = MAPS[scene.mapId].portals.find((p) => p.to === to);
    if (portal?.requireKills && scene.save.kills < portal.requireKills && !scene.save.heartwoodOpen) return;
  }
  scene.changingMap = true;
  scene.registry.set("mapId", to);
  scene.save.map = to;
  scene.save.x = dest.spawn.x;
  scene.save.y = dest.spawn.y;
  writeSave(scene.save);
  gameBus.emit("saved");
  sfxPlay.portal();
  scene.scene.restart({ job: scene.jobId, mapId: to });
}

export function checkGapsOn(scene: SceneHit) {
  const body = scene.player.body as Phaser.Physics.Arcade.Body;
  if (gapDeath(scene.mapId, scene.player.x, scene.player.y, body.y, GAME_H)) scene.die();
  for (const mob of [...scene.mobs]) {
    if (!mob.active) continue;
    const mb = mob.body as Phaser.Physics.Arcade.Body;
    if (!inGap(scene.mapId, mob.x, mob.y, mb.y, GAME_H, 20)) continue;
    loseToGap(scene.save.economy, mob.kind);
    const ox = mob.originX;
    const oy = mob.originY;
    const kind = mob.kind;
    dropChip(mob);
    mob.destroy();
    scene.mobs = scene.mobs.filter((m) => m !== mob);
    scene.prompt = "Lost to the gap";
    scene.time.delayedCall(1200, () => {
      if (scene.prompt === "Lost to the gap") scene.prompt = null;
    });
    if (kind !== "warden") {
      scene.time.delayedCall(8000, () => {
        if (!scene.changingMap && !scene.dead) scene.spawnMob(kind, ox, oy);
      });
    }
    scene.persist();
  }
}

export function dieOn(scene: SceneHit) {
  if (scene.dead) return;
  scene.dead = true;
  scene.save.hp = 0;
  scene.save.glims = Math.floor(scene.save.glims * 0.9);
  sfxPlay.death();
  scene.player.setTint(0x442222);
  scene.time.delayedCall(900, () => {
    const map = MAPS[scene.mapId];
    scene.save.hp = Math.ceil(scene.maxHp() * 0.5);
    scene.save.mp = Math.ceil(scene.maxMp() * 0.5);
    scene.save.x = map.spawn.x;
    scene.save.y = map.spawn.y;
    scene.changingMap = true;
    writeSave(scene.save);
    scene.scene.restart({ job: scene.jobId, mapId: scene.mapId });
  });
}

export function collectDropOn(scene: SceneHit, d: Phaser.Physics.Arcade.Sprite) {
  if (!d.active) return;
  const item = d.getData("item") as ItemDef | undefined;
  const g = Number(d.getData("glims") ?? 0);
  if (item) {
    scene.save.inventory.push(item);
    scene.prompt = `Found ${item.name}`;
    scene.time.delayedCall(1800, () => {
      if (scene.prompt?.startsWith("Found")) scene.prompt = null;
    });
  }
  if (g) scene.save.glims += g;
  sfxPlay.pickup();
  d.destroy();
  scene.persist();
}

export function emitHudThrottledOn(scene: SceneHit, dt: number) {
  scene.hudT += dt;
  if (scene.hudT < 0.08) return;
  scene.hudT = 0;
  scene.emitHud();
}

export function emitHudOn(scene: SceneHit) {
  emitWorldHud({
    save: scene.save,
    jobId: scene.jobId,
    mapId: scene.mapId,
    skillCd: scene.skillCd,
    prompt: scene.prompt,
    dead: scene.dead,
    paused: scene.paused,
    maxHp: scene.maxHp(),
    maxMp: scene.maxMp(),
  });
}

export function persistOn(scene: SceneHit, force = false) {
  if (scene.changingMap) return;
  scene.save.x = scene.player?.x ?? scene.save.x;
  scene.save.y = scene.player?.y ?? scene.save.y;
  scene.save.map = scene.mapId;
  scene.save.job = scene.jobId;
  writeSave(scene.save);
  if (force) gameBus.emit("saved");
}

export function setPausedOn(scene: SceneHit, v: boolean) {
  scene.paused = v;
  scene.physics.world.isPaused = v;
  scene.emitHud();
}

export function cleanupOn(scene: SceneHit) {
  if (!scene.changingMap) scene.persist(true);
  scene.mobs = [];
}
