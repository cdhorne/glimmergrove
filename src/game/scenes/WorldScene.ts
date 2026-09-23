import * as Phaser from "phaser";
import {
  GAME_H,
  GAME_W,
  JOBS,
  MAPS,
  MONSTERS,
  rollDrop,
  type ItemDef,
  type JobId,
  type MapId,
  type MonsterKind,
} from "../content";
import { sampleActions, type ActionFrame } from "../input";
import { sfxPlay } from "../audio";
import { gameBus } from "../bus";
import { loadSave, writeSave, defaultSave, type SaveData } from "../save";
import { applyPlayerMotion } from "../motion";
import { applyUse, contactDamage } from "../world/rules";
import { pitDeath, tickTravel } from "../world/travel";
import { emitWorldHud } from "../world/present";
import { skinFor } from "../world/piles";

type Mob = Phaser.Physics.Arcade.Sprite & {
  kind: MonsterKind;
  hp: number;
  maxHp: number;
  dir: number;
  hurtT: number;
  chipT: number;
  originX: number;
  originY: number;
  uid: number;
};

export class WorldScene extends Phaser.Scene {
  mapId: MapId = "haven";
  jobId: JobId = "guardian";
  save!: SaveData;
  player!: Phaser.Physics.Arcade.Sprite;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  oneWays: Phaser.GameObjects.TileSprite[] = [];
  skipOneWay = 0;
  facing = 1;
  coyote = 0;
  jumpBuf = 0;
  attackCd = 0;
  skillCd = 0;
  invuln = 0;
  attackLock = 0;
  knockLock = 0;
  prompt: string | null = null;
  interact: { type: "npc" | "portal"; to?: MapId; require?: number } | null = null;
  mobs: Mob[] = [];
  bullets!: Phaser.Physics.Arcade.Group;
  drops!: Phaser.Physics.Arcade.Group;
  trauma = 0;
  dead = false;
  paused = false;
  hudT = 0;
  portalLock = 0;
  portalDwell = 0;
  changingMap = false;
  nextMobId = 1;
  lastHits: { k: string; dmg: number; x: number; n: string }[] = [];

  constructor() {
    super("world");
  }

  init(data: { job?: JobId; mapId?: MapId }) {
    this.mapId = data.mapId || (this.registry.get("mapId") as MapId) || "haven";
    this.jobId = data.job || (this.registry.get("job") as JobId) || "guardian";
    this.dead = false;
    this.paused = false;
    this.prompt = null;
    this.mobs = [];
    this.oneWays = [];
    this.facing = 1;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.attackCd = 0;
    this.skillCd = 0;
    this.invuln = 0.9;
    this.attackLock = 0;
    this.knockLock = 0;
    this.trauma = 0;
    this.skipOneWay = 0;
    this.portalLock = 0.9;
    this.portalDwell = 0;
    this.changingMap = false;
    this.interact = null;
    this.lastHits = [];
  }

  create() {
    const job = JOBS[this.jobId];
    const map = MAPS[this.mapId];
    const existing = loadSave();
    this.save = existing && existing.job === this.jobId ? existing : defaultSave(this.jobId, existing?.name ?? "Rowan");
    if (!existing || existing.job !== this.jobId) {
      this.save.hp = job.hp;
      this.save.mp = job.mp;
    } else if (this.save.hp <= 0) this.save.hp = job.hp;
    this.save.map = this.mapId;

    this.physics.world.setBounds(0, 0, map.width, GAME_H + 80);
    this.cameras.main.setBounds(0, 0, map.width, GAME_H);
    this.cameras.main.setDeadzone(90, 48);
    this.cameras.main.setLerp(0.14, 0.1);
    this.cameras.main.roundPixels = true;

    if (this.textures.exists(map.sky)) {
      this.add.image(GAME_W / 2, GAME_H / 2, map.sky).setDisplaySize(GAME_W, GAME_H).setScrollFactor(0).setDepth(-20);
    }

    this.solids = this.physics.add.staticGroup();
    for (const p of map.platforms) {
      const tile = this.add.tileSprite(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, p.kind === "wood" ? "wood" : "grass").setDepth(2);
      this.physics.add.existing(tile, true);
      (tile.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      this.solids.add(tile);
      if (p.oneWay) {
        tile.setData("oneWay", true);
        this.oneWays.push(tile);
      }
    }

    const spawnX = this.mapId === existing?.map ? existing.x : map.spawn.x;
    const spawnY = this.mapId === existing?.map ? existing.y : map.spawn.y;
    this.player = this.physics.add.sprite(spawnX, spawnY, this.tex(`${this.jobId}-idle`), 0);
    this.player.setScale(0.5).setOrigin(0.5, 1).setDepth(8).setCollideWorldBounds(true);
    const pbody = this.player.body as Phaser.Physics.Arcade.Body;
    pbody.setSize(42, 78);
    pbody.setOffset(75, 108);
    this.player.setMaxVelocity(job.speed, 1100);
    this.player.setGravityY(1680);
    this.playSafe(`${this.jobId}-idle`);
    this.invuln = 0.9;
    this.physics.add.collider(this.player, this.solids, undefined, (_p, plat) =>
      this.platformProcess(plat as Phaser.GameObjects.TileSprite),
    );
    this.cameras.main.startFollow(this.player, true, 0.14, 0.1);

    this.bullets = this.physics.add.group({ maxSize: 32, allowGravity: false });
    this.drops = this.physics.add.group({ maxSize: 24 });
    this.spawnActors();
    this.physics.add.overlap(this.player, this.drops, (_p, d) => this.collectDrop(d as Phaser.Physics.Arcade.Sprite));
    this.events.once("shutdown", () => this.cleanup());
    const offPause = gameBus.on("set-paused", (v) => this.setPaused(Boolean(v)));
    const offEquip = gameBus.on("equip", (item) => {
      const it = item as ItemDef;
      if (it?.slot) this.save.equipped = { ...this.save.equipped, [it.slot]: it };
    });
    this.events.once("shutdown", () => {
      offPause();
      offEquip();
    });
    this.emitHud();
    this.persist(true);
  }

  tex(key: string) {
    if (this.textures.exists(key)) return key;
    const idle = `${key.split("-")[0]}-idle`;
    if (this.textures.exists(idle)) return idle;
    return this.textures.exists("guardian-idle") ? "guardian-idle" : key;
  }

  playSafe(key: string) {
    const k = this.anims.exists(key) ? key : this.tex(key);
    if (this.anims.exists(k)) this.player.play(k, true);
  }

  platformProcess(plat: Phaser.GameObjects.TileSprite) {
    if (!plat.getData("oneWay")) return true;
    if (this.skipOneWay > 0) return false;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const platBody = plat.body as Phaser.Physics.Arcade.StaticBody;
    return body.velocity.y >= 0 && body.bottom <= platBody.top + 10;
  }

  spawnActors() {
    const map = MAPS[this.mapId];
    if (map.npc && this.textures.exists("herbalist-idle")) {
      const npc = this.add.sprite(map.npc.x, map.npc.y - 8, "herbalist-idle", 0);
      npc.setScale(0.5).setOrigin(0.5, 1).setDepth(7);
      if (this.anims.exists("herbalist-idle")) npc.play("herbalist-idle");
    }
    for (const p of map.portals) {
      const spr = this.textures.exists("portal")
        ? this.add.image(p.x, p.y - 8, "portal").setScale(0.42)
        : this.add.rectangle(p.x, p.y - 40, 48, 80, 0x6b8f71, 0.7);
      spr.setOrigin(0.5, 1).setDepth(6);
    }
    for (const s of map.monsters) {
      if (s.kind === "warden" && this.save.wardenDown) continue;
      this.spawnMob(s.kind, s.x, s.y);
    }
  }

  spawnMob(kind: MonsterKind, x: number, y: number) {
    const visual = skinFor(kind) as MonsterKind;
    const def = MONSTERS[kind] ?? MONSTERS[visual];
    const sprite = this.physics.add.sprite(x, y - 4, this.tex(`${visual}-idle`), 0) as Mob;
    sprite.kind = kind;
    sprite.hp = def.hp;
    sprite.maxHp = def.hp;
    sprite.dir = Math.random() < 0.5 ? -1 : 1;
    sprite.hurtT = 0;
    sprite.chipT = 0;
    sprite.originX = x;
    sprite.originY = y;
    sprite.uid = this.nextMobId++;
    sprite.setScale(kind === "warden" || kind === "gorecap" ? 0.5 : 0.4).setOrigin(0.5, 1).setDepth(7);
    if (kind === "nettle") sprite.setTint(0xc45c4a);
    if (kind === "gorecap") sprite.setTint(0x6a3040);
    const mb = sprite.body as Phaser.Physics.Arcade.Body;
    const sx = Math.abs(sprite.scaleX) || 1;
    const sy = Math.abs(sprite.scaleY) || 1;
    mb.setSize(def.hitW / sx, def.hitH / sy, false);
    mb.setOffset((sprite.width - def.hitW / sx) * 0.5, sprite.height - def.hitH / sy);
    mb.setAllowGravity(true);
    sprite.setCollideWorldBounds(true).setMaxVelocity(def.speed, 900).setGravityY(1800);
    this.physics.add.collider(sprite, this.solids);
    this.physics.add.overlap(this.player, sprite, () => this.touchMob(sprite));
    if (this.anims.exists(`${visual}-idle`)) sprite.play(`${visual}-idle`);
    this.mobs.push(sprite);
    return sprite;
  }

  update(_t: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const actions = sampleActions();
    if (actions.justPause) gameBus.emit("toggle-pause");
    if (actions.justInventory) {
      this.persist();
      gameBus.emit("toggle-bag");
    }
    if (this.paused) return;
    this.skipOneWay = Math.max(0, this.skipOneWay - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.skillCd = Math.max(0, this.skillCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.attackLock = Math.max(0, this.attackLock - dt);
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.portalLock = Math.max(0, this.portalLock - dt);
    if (this.dead) {
      this.emitHudThrottled(dt);
      return;
    }
    this.updatePlayer(dt, actions, _t);
    this.updateMobs(dt);
    this.updateInteract(dt, actions);
    this.checkPits();
    this.emitHudThrottled(dt);
  }

  updatePlayer(dt: number, a: ActionFrame, time: number) {
    applyPlayerMotion(this, dt, a, time);
    if (a.justUse) this.tryUse();
  }

  tryUse() {
    const result = applyUse(this.save.hp, this.maxHp());
    if (!result.ok) {
      this.prompt = "Nothing to use";
      this.time.delayedCall(900, () => {
        if (this.prompt === "Nothing to use") this.prompt = null;
      });
      return;
    }
    this.save.hp = result.hp;
    this.prompt = `Used · +${result.gained} HP`;
    sfxPlay.pickup();
    this.persist();
  }

  doAttack(skill: boolean) {
    const job = JOBS[this.jobId];
    const strike = skill ? job.skill : job.attack;
    this.attackCd = job.attackCd;
    if (skill) {
      this.save.mp -= job.skillCost;
      this.skillCd = job.skillCd;
    }
    this.attackLock = 0.32;
    this.playSafe(`${this.jobId}-attack`);
    sfxPlay.attack();
    const dmg = this.atk() * (skill ? 1.7 : 1);
    if (strike.shape !== "melee") return;
    const hits = this.mobs
      .filter((mob) => {
        if (!mob.active) return false;
        if (Math.abs(mob.y - this.player.y) > 96) return false;
        const half = MONSTERS[mob.kind].hitW * 0.5;
        const toward = (mob.x - this.player.x) * this.facing;
        return toward + half > -48 && toward - half < strike.reach + 16;
      })
      .sort((a, b) => (a.x - this.player.x) * this.facing - (b.x - this.player.x) * this.facing)
      .slice(0, Math.max(1, strike.pierce));
    hits.forEach((mob) => this.hurtMob(mob, dmg));
  }

  atk() {
    const eq = this.save.equipped;
    return JOBS[this.jobId].atk + (this.save.level - 1) * 2 + (eq.weapon?.atk ?? 0) + (eq.acc?.atk ?? 0);
  }

  def() {
    const eq = this.save.equipped;
    return JOBS[this.jobId].def + (eq.armor?.def ?? 0) + (eq.acc?.def ?? 0);
  }

  maxHp() {
    return JOBS[this.jobId].hp + (this.save.level - 1) * 12 + (this.save.equipped.armor?.def ?? 0) * 2;
  }

  maxMp() {
    return JOBS[this.jobId].mp + (this.save.level - 1) * 6;
  }

  hurtMob(mob: Mob, dmg: number) {
    if (!mob.active) return;
    const def = MONSTERS[mob.kind];
    const rolled = Math.max(1, Math.round(dmg * (0.85 + Math.random() * 0.3)));
    mob.hp -= rolled;
    mob.hurtT = 0.14;
    this.lastHits.push({ k: mob.kind, dmg: rolled, x: Math.round(mob.x), n: "hit" });
    sfxPlay.hit();
    if (mob.hp <= 0) this.killMob(mob);
    else {
      const body = mob.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(-Math.sign(mob.x - this.player.x || this.facing) * 90 * def.knockback);
    }
  }

  killMob(mob: Mob) {
    const def = MONSTERS[mob.kind];
    const isBoss = mob.kind === "warden";
    this.save.exp += def.exp;
    this.save.kills += 1;
    if (this.save.kills >= 8) this.save.heartwoodOpen = true;
    if (isBoss) this.save.wardenDown = true;
    this.save.glims += def.glims;
    const drop = rollDrop(isBoss);
    if (drop) this.save.inventory.push(drop);
    mob.destroy();
    this.mobs = this.mobs.filter((m) => m !== mob);
    this.persist();
    if (!isBoss) {
      const ox = mob.originX;
      const oy = mob.originY;
      const kind = mob.kind;
      this.time.delayedCall(8000, () => {
        if (!this.changingMap && !this.dead) this.spawnMob(kind, ox, oy);
      });
    }
  }

  touchMob(mob: Mob) {
    if (!mob.active || this.invuln > 0 || this.dead) return;
    const dmg = contactDamage(MONSTERS[mob.kind].atk, this.def());
    this.save.hp -= dmg;
    this.invuln = 1.05;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(-this.facing * 120, -180);
    sfxPlay.hurt();
    if (this.save.hp <= 0) this.die();
  }

  updateMobs(dt: number) {
    for (const mob of this.mobs) {
      if (!mob.active) continue;
      mob.hurtT = Math.max(0, mob.hurtT - dt);
      const def = MONSTERS[mob.kind];
      const body = mob.body as Phaser.Physics.Arcade.Body;
      if (mob.y > GAME_H + 20) {
        mob.setPosition(mob.originX, mob.originY - 4);
        body.setVelocity(0, 0);
        continue;
      }
      const dist = Math.abs(this.player.x - mob.x);
      const aggro = dist < (mob.kind === "warden" || mob.kind === "gorecap" ? 420 : 220);
      if (aggro) mob.dir = this.player.x < mob.x ? -1 : 1;
      else if (Math.abs(mob.x - mob.originX) > 90) mob.dir = mob.x > mob.originX ? -1 : 1;
      body.setVelocityX(mob.dir * def.speed);
      mob.setFlipX(mob.dir < 0);
    }
  }

  updateInteract(dt: number, a: ActionFrame) {
    const tick = tickTravel(
      {
        mapId: this.mapId,
        playerX: this.player.x,
        kills: this.save.kills,
        heartwoodOpen: this.save.heartwoodOpen,
        prompt: this.prompt,
        portalLock: this.portalLock,
        portalDwell: this.portalDwell,
      },
      dt,
      a,
    );
    this.prompt = tick.prompt;
    this.interact = tick.interact;
    this.portalDwell = tick.portalDwell;
    if (tick.rest) this.tryInteract();
    if (tick.enter) this.enterMap(tick.enter);
  }

  tryInteract() {
    if (this.interact?.type !== "npc") return;
    this.save.hp = this.maxHp();
    this.save.mp = this.maxMp();
    this.prompt = "Rested. HP and dew restored.";
    sfxPlay.pickup();
    this.persist();
  }

  enterMap(to: MapId, force = false) {
    if (this.changingMap) return;
    const dest = MAPS[to];
    if (!dest) return;
    if (!force) {
      const portal = MAPS[this.mapId].portals.find((p) => p.to === to);
      if (portal?.requireKills && this.save.kills < portal.requireKills && !this.save.heartwoodOpen) return;
    }
    this.changingMap = true;
    this.registry.set("mapId", to);
    this.save.map = to;
    this.save.x = dest.spawn.x;
    this.save.y = dest.spawn.y;
    writeSave(this.save);
    gameBus.emit("saved");
    sfxPlay.portal();
    this.scene.restart({ job: this.jobId, mapId: to });
  }

  checkPits() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (pitDeath(this.mapId, this.player.x, this.player.y, body.y, GAME_H)) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.save.hp = 0;
    this.save.glims = Math.floor(this.save.glims * 0.9);
    sfxPlay.death();
    this.time.delayedCall(900, () => {
      const map = MAPS[this.mapId];
      this.save.hp = Math.ceil(this.maxHp() * 0.5);
      this.save.mp = Math.ceil(this.maxMp() * 0.5);
      this.save.x = map.spawn.x;
      this.save.y = map.spawn.y;
      this.changingMap = true;
      writeSave(this.save);
      this.scene.restart({ job: this.jobId, mapId: this.mapId });
    });
  }

  collectDrop(d: Phaser.Physics.Arcade.Sprite) {
    if (!d.active) return;
    const item = d.getData("item") as ItemDef | undefined;
    const g = Number(d.getData("glims") ?? 0);
    if (item) this.save.inventory.push(item);
    if (g) this.save.glims += g;
    d.destroy();
    this.persist();
  }

  emitHudThrottled(dt: number) {
    this.hudT += dt;
    if (this.hudT < 0.08) return;
    this.hudT = 0;
    this.emitHud();
  }

  emitHud() {
    emitWorldHud({
      save: this.save,
      jobId: this.jobId,
      mapId: this.mapId,
      skillCd: this.skillCd,
      prompt: this.prompt,
      dead: this.dead,
      paused: this.paused,
      maxHp: this.maxHp(),
      maxMp: this.maxMp(),
    });
  }

  persist(force = false) {
    if (this.changingMap) return;
    this.save.x = this.player?.x ?? this.save.x;
    this.save.y = this.player?.y ?? this.save.y;
    this.save.map = this.mapId;
    this.save.job = this.jobId;
    writeSave(this.save);
    if (force) gameBus.emit("saved");
  }

  setPaused(v: boolean) {
    this.paused = v;
    this.physics.world.isPaused = v;
    this.emitHud();
  }

  cleanup() {
    if (!this.changingMap) this.persist(true);
    this.mobs = [];
  }
}
