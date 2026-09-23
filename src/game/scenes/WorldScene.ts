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
import { GRAVITY_DOWN, MAX_FALL, landsOn } from "../feel";
import { stepMob } from "../mobs";
import { defaultEconomy, yieldOf } from "../economy";
import { applyUse } from "../world/rules";
import { gapDeath, inGap, tickTravel } from "../world/travel";
import { emitWorldHud } from "../world/present";
import { grantHarvest, harvestAmount, loseToGap, shouldSpawn } from "../world/harvest";
import { planHurt, planTouch } from "../world/combat-run";
import { isBossKind, NPC_SHEET, skinFor, skinLook } from "../skin";

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
    this.save = existing && existing.job === this.jobId ? existing : defaultSave(this.jobId, existing?.name ?? "Player");
    if (!existing || existing.job !== this.jobId) {
      this.save.hp = job.hp;
      this.save.mp = job.mp;
    } else if (this.save.hp <= 0) this.save.hp = job.hp;
    this.save.map = this.mapId;
    if (!this.save.economy) this.save.economy = defaultEconomy();

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
    this.player.setMaxVelocity(job.speed, MAX_FALL);
    this.player.setGravityY(GRAVITY_DOWN);
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
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const platBody = plat.body as Phaser.Physics.Arcade.StaticBody;
    return landsOn(Boolean(plat.getData("oneWay")), this.skipOneWay > 0, body.velocity.y, body.bottom, platBody.top);
  }

  spawnActors() {
    const map = MAPS[this.mapId];
    if (map.npc && this.textures.exists(NPC_SHEET)) {
      const npc = this.add.sprite(map.npc.x, map.npc.y - 8, NPC_SHEET, 0);
      npc.setScale(0.5).setOrigin(0.5, 1).setDepth(7);
      if (this.anims.exists(NPC_SHEET)) npc.play(NPC_SHEET);
    }
    for (const p of map.portals) {
      const spr = this.textures.exists("portal")
        ? this.add.image(p.x, p.y - 8, "portal").setScale(0.42)
        : this.add.rectangle(p.x, p.y - 40, 48, 80, 0x6b8f71, 0.7);
      spr.setOrigin(0.5, 1).setDepth(6);
    }
    for (const s of map.monsters) {
      if (!shouldSpawn(s, this.save.economy.flags, this.save.wardenDown)) continue;
      this.spawnMob(s.kind, s.x, s.y);
    }
  }

  spawnMob(kind: MonsterKind, x: number, y: number) {
    const visual = skinFor(kind) as MonsterKind;
    const look = skinLook(kind);
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
    sprite.setScale(look.scale).setOrigin(0.5, 1).setDepth(7);
    if (look.tint != null) sprite.setTint(look.tint);
    const mb = sprite.body as Phaser.Physics.Arcade.Body;
    const sx = Math.abs(sprite.scaleX) || 1;
    const sy = Math.abs(sprite.scaleY) || 1;
    mb.setSize(def.hitW / sx, def.hitH / sy, false);
    mb.setOffset((sprite.width - def.hitW / sx) * 0.5, sprite.height - def.hitH / sy);
    mb.setAllowGravity(true);
    sprite.setCollideWorldBounds(true).setMaxVelocity(def.speed, 900).setGravityY(1800);
    this.physics.add.collider(sprite, this.solids, undefined, (_m, plat) => {
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      const platBody = (plat as Phaser.GameObjects.TileSprite).body as Phaser.Physics.Arcade.StaticBody;
      return landsOn(Boolean((plat as Phaser.GameObjects.GameObject).getData("oneWay")), false, body.velocity.y, body.bottom, platBody.top);
    });
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
    this.checkGaps();
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
    const plan = planHurt({ kind: mob.kind, hp: mob.hp, dmg, playerX: this.player.x, mobX: mob.x });
    mob.hp = plan.hp;
    mob.hurtT = plan.stun;
    this.lastHits.push({ k: mob.kind, dmg: plan.rolled, x: Math.round(mob.x), n: "hit" });
    sfxPlay.hit();
    if (plan.dead) this.killMob(mob);
    else if (plan.knock) {
      const body = mob.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(plan.knock.vx, plan.knock.vy);
    }
  }

  killMob(mob: Mob) {
    const def = MONSTERS[mob.kind];
    const isBoss = isBossKind(mob.kind);
    const yieldKind = yieldOf(mob.kind);
    if (yieldKind && this.save.economy) {
      const { prompt } = grantHarvest(this.save.economy, yieldKind, harvestAmount(mob.kind));
      this.prompt = prompt;
      this.time.delayedCall(1400, () => {
        if (this.prompt?.startsWith("Bag")) this.prompt = null;
      });
    }
    this.save.exp += def.exp;
    this.save.kills += 1;
    if (this.save.kills >= 8) this.save.heartwoodOpen = true;
    if (isBoss) {
      this.save.wardenDown = true;
      this.prompt = "The boss is down";
    }
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
    if (!mob.active) return;
    const plan = planTouch({
      kind: mob.kind,
      def: this.def(),
      playerX: this.player.x,
      mobX: mob.x,
      invuln: this.invuln,
      dead: this.dead,
    });
    if (!plan) return;
    this.save.hp -= plan.dmg;
    this.invuln = plan.invuln;
    this.knockLock = plan.knock.stun;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(plan.knock.vx, plan.knock.vy);
    sfxPlay.hurt();
    if (this.save.hp <= 0) this.die();
  }

  updateMobs(dt: number) {
    for (const mob of this.mobs) {
      if (!mob.active) continue;
      const body = mob.body as Phaser.Physics.Arcade.Body;
      const intent = stepMob({
        dt,
        hurtT: mob.hurtT,
        dir: mob.dir,
        x: mob.x,
        y: mob.y,
        originX: mob.originX,
        playerX: this.player.x,
        playerY: this.player.y,
        kind: mob.kind,
        speed: MONSTERS[mob.kind].speed,
        grounded: body.blocked.down || body.touching.down,
        groundAhead: true,
      });
      mob.hurtT = intent.hurtT;
      mob.dir = intent.dir;
      if (intent.vx != null) body.setVelocityX(intent.vx);
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
    this.prompt = "Rested. HP and MP restored.";
    sfxPlay.pickup();
    this.persist();
    gameBus.emit("open-yard");
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

  checkGaps() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (gapDeath(this.mapId, this.player.x, this.player.y, body.y, GAME_H)) this.die();
    for (const mob of [...this.mobs]) {
      if (!mob.active) continue;
      const mb = mob.body as Phaser.Physics.Arcade.Body;
      if (!inGap(this.mapId, mob.x, mob.y, mb.y, GAME_H, 20)) continue;
      loseToGap(this.save.economy, mob.kind);
      const ox = mob.originX;
      const oy = mob.originY;
      const kind = mob.kind;
      mob.destroy();
      this.mobs = this.mobs.filter((m) => m !== mob);
      this.prompt = "Lost to the gap";
      this.time.delayedCall(1200, () => {
        if (this.prompt === "Lost to the gap") this.prompt = null;
      });
      if (!isBossKind(kind)) {
        this.time.delayedCall(8000, () => {
          if (!this.changingMap && !this.dead) this.spawnMob(kind, ox, oy);
        });
      }
      this.persist();
    }
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
