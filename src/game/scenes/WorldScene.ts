import * as Phaser from "phaser";
import {
  GAME_H,
  GAME_W,
  JOBS,
  MAPS,
  MONSTERS,
  expToNext,
  rollDrop,
  type ItemDef,
  type JobId,
  type MapId,
  type MonsterKind,
} from "../content";
import { sampleActions, setKeys, type ActionFrame } from "../input";
import { sfxPlay } from "../audio";
import { gameBus, type HudSnap } from "../bus";
import { loadSave, writeSave, defaultSave, type SaveData } from "../save";

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
  private mapId: MapId = "haven";
  private jobId: JobId = "guardian";
  private save!: SaveData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private oneWays: Phaser.GameObjects.TileSprite[] = [];
  private skipOneWay = 0;
  private facing = 1;
  private coyote = 0;
  private jumpBuf = 0;
  private jumpCut = false;
  private attackCd = 0;
  private skillCd = 0;
  private invuln = 0;
  private attackLock = 0;
  private prompt: string | null = null;
  private interact: { type: "npc" | "portal"; to?: MapId; require?: number } | null = null;
  private mobs: Mob[] = [];
  private bullets!: Phaser.Physics.Arcade.Group;
  private drops!: Phaser.Physics.Arcade.Group;
  private numbers!: Phaser.GameObjects.Group;
  private trauma = 0;
  private dead = false;
  private paused = false;
  private hudT = 0;
  private portalLock = 0;
  private portalDwell = 0;
  private changingMap = false;
  private nextMobId = 1;
  private lastHits: { k: string; dmg: number; x: number; n: string }[] = [];


  constructor() {
    super("world");
  }

  init(data: { job?: JobId; mapId?: MapId }) {
    this.mapId = (data.mapId as MapId) || (this.registry.get("mapId") as MapId) || "haven";
    this.jobId = (data.job as JobId) || (this.registry.get("job") as JobId) || "guardian";
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
      this.save.map = this.mapId;
    } else {
      this.save.map = this.mapId;
      if (this.save.hp <= 0) this.save.hp = job.hp;
    }

    this.physics.world.setBounds(0, 0, map.width, GAME_H + 80);
    this.cameras.main.setBounds(0, 0, map.width, GAME_H);
    this.cameras.main.setDeadzone(90, 48);
    this.cameras.main.setLerp(0.14, 0.1);
    this.cameras.main.roundPixels = true;

    if (this.textures.exists(map.sky)) {
      this.add.image(GAME_W / 2, GAME_H / 2, map.sky).setDisplaySize(GAME_W, GAME_H).setScrollFactor(0).setDepth(-20);
      const far = this.add
        .image(map.width * 0.35, GAME_H * 0.52, map.sky)
        .setDisplaySize(map.width * 0.7, GAME_H * 1.05)
        .setAlpha(0.55)
        .setScrollFactor(0.12)
        .setDepth(-19);
      far.setTint(0xdde8d8);
    }

    this.solids = this.physics.add.staticGroup();
    for (const p of map.platforms) {
      const key = p.kind === "wood" ? "wood" : "grass";
      const tile = this.add.tileSprite(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, key).setDepth(2);
      this.physics.add.existing(tile, true);
      const body = tile.body as Phaser.Physics.Arcade.StaticBody;
      body.updateFromGameObject();
      this.solids.add(tile);
      if (p.oneWay) {
        tile.setData("oneWay", true);
        this.oneWays.push(tile);
      }
    }

    const idleKey = this.tex(`${this.jobId}-idle`);
    const spawnX = this.mapId === existing?.map ? existing.x : map.spawn.x;
    const spawnY = this.mapId === existing?.map ? existing.y : map.spawn.y;
    this.player = this.physics.add.sprite(spawnX, spawnY, idleKey, 0);
    this.player.setScale(0.5);
    this.player.setOrigin(0.5, 1);
    const pbody = this.player.body as Phaser.Physics.Arcade.Body;
    pbody.setSize(42, 78);
    pbody.setOffset(75, 108);
    this.player.setCollideWorldBounds(true);
    this.player.setMaxVelocity(job.speed, 980);
    this.player.setDragX(0);
    this.player.setDepth(8);
    this.playSafe(`${this.jobId}-idle`);
    this.player.setScale(0.5);
    this.player.setOrigin(0.5, 1);
    this.invuln = 0.9;

    this.physics.add.collider(this.player, this.solids, undefined, (_player, plat) => this.platformProcess(plat as Phaser.GameObjects.TileSprite));

    this.cameras.main.startFollow(this.player, true, 0.14, 0.1);

    this.bullets = this.physics.add.group({ maxSize: 32, allowGravity: false });
    this.drops = this.physics.add.group({ maxSize: 24 });
    this.numbers = this.add.group();

    this.spawnActors();

    this.physics.add.overlap(this.player, this.drops, (_p, d) => this.collectDrop(d as Phaser.Physics.Arcade.Sprite));

    this.events.once("shutdown", () => this.cleanup());

    const offPause = gameBus.on("set-paused", (v) => this.setPaused(Boolean(v)));
    const offEquip = gameBus.on("equip", (item) => {
      const it = item as ItemDef;
      if (!it?.slot) return;
      this.save.equipped = { ...this.save.equipped, [it.slot]: it };
    });
    this.events.once("shutdown", () => {
      offPause();
      offEquip();
    });

    if (import.meta.env.DEV || new URLSearchParams(location.search).get("qa") === "1") {
      window.__controlsTest = {
        getYaw: () => (this.facing < 0 ? Math.PI : 0),
        getSpeed: () => {
          const b = this.player.body as Phaser.Physics.Arcade.Body | undefined;
          if (!b) return 0;
          return Math.hypot(b.velocity.x, b.velocity.y);
        },
        setKeys: (codes: string[]) => setKeys(codes),
      };
      window.__qa = {
        scale: () => ({
          sx: this.player.scaleX,
          dw: this.player.displayWidth,
          fw: this.player.frame.width,
          x: this.player.x,
          y: this.player.y,
        }),
        map: () => this.mapId,
        prompt: () => this.prompt,
        kills: () => this.save.kills,
        hp: () => this.save.hp,
        enter: () => this.tryInteract(),
        warp: (id: string) => this.enterMap(id as MapId, true),
        job: () => this.jobId,
        cd: () => this.attackCd,
        swing: () => {
          this.doAttack(false);
          return {
            cd: this.attackCd,
            hits: this.lastHits.slice(-8),
            mobs: this.mobs.filter((m) => m.active).map((m) => ({ k: m.kind, x: Math.round(m.x), hp: Math.round(m.hp) })),
          };
        },
        skill: () => {
          this.doAttack(true);
          return { cd: this.skillCd, hits: this.lastHits.slice(-8) };
        },
        hits: () => this.lastHits.slice(-12),
        shots: () =>
          (this.bullets.getChildren() as Phaser.Physics.Arcade.Sprite[])
            .filter((b) => b.active)
            .map((b) => ({
              x: Math.round(b.x),
              y: Math.round(b.y),
              vx: Math.round(Number(b.getData("vx") ?? 0)),
            })),
        mobs: () => this.mobs.filter((m) => m.active).map((m) => ({ k: m.kind, x: Math.round(m.x), y: Math.round(m.y), hp: Math.round(m.hp) })),
      };
    }

    this.emitHud();
    this.persist(true);
  }

  private tex(key: string) {
    return this.textures.exists(key) ? key : this.texFallback(key);
  }

  private texFallback(key: string) {
    const job = key.split("-")[0];
    const idle = `${job}-idle`;
    if (this.textures.exists(idle)) return idle;
    if (this.textures.exists("guardian-idle")) return "guardian-idle";
    return key;
  }

  private playSafe(key: string) {
    const k = this.anims.exists(key) ? key : this.texFallback(key);
    if (this.anims.exists(k)) this.player.play(k, true);
  }

  private platformProcess(plat: Phaser.GameObjects.TileSprite) {
    if (!plat.getData("oneWay")) return true;
    if (this.skipOneWay > 0) return false;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const platBody = plat.body as Phaser.Physics.Arcade.StaticBody;
    return body.velocity.y >= 0 && body.bottom <= platBody.top + 10;
  }

  private spawnActors() {
    const map = MAPS[this.mapId];
    if (map.npc && this.textures.exists("herbalist-idle")) {
      const npc = this.add.sprite(map.npc.x, map.npc.y - 8, "herbalist-idle", 0);
      npc.setScale(0.5);
      npc.setOrigin(0.5, 1);
      npc.setDepth(7);
      if (this.anims.exists("herbalist-idle")) npc.play("herbalist-idle");
      npc.setData("kind", "npc");
    }

    for (const p of map.portals) {
      const spr = this.textures.exists("portal")
        ? this.add.image(p.x, p.y - 8, "portal").setScale(0.42)
        : this.add.rectangle(p.x, p.y - 40, 48, 80, 0x6b8f71, 0.7);
      spr.setOrigin(0.5, 1);
      spr.setDepth(6);
      spr.setData("portal", p);
    }

    for (const s of map.monsters) {
      if (s.kind === "warden" && this.save.wardenDown) continue;
      this.spawnMob(s.kind, s.x, s.y);
    }
  }

  private spawnMob(kind: MonsterKind, x: number, y: number) {
    const def = MONSTERS[kind];
    const idle = this.tex(`${kind}-idle`);
    const sprite = this.physics.add.sprite(x, y - 4, idle, 0) as Mob;
    sprite.kind = kind;
    sprite.hp = def.hp;
    sprite.maxHp = def.hp;
    sprite.dir = Math.random() < 0.5 ? -1 : 1;
    sprite.hurtT = 0;
    sprite.chipT = 0;
    sprite.originX = x;
    sprite.originY = y;
    sprite.uid = this.nextMobId++;
    sprite.setScale(kind === "warden" ? 0.62 : 0.42);
    sprite.setOrigin(0.5, 1);
    const mb = sprite.body as Phaser.Physics.Arcade.Body;
    this.fitBody(sprite, def.hitW, def.hitH, true);
    mb.setAllowGravity(true);
    sprite.setCollideWorldBounds(true);
    sprite.setMaxVelocity(def.speed, 900);
    sprite.setGravityY(1800);
    sprite.setDepth(7);
    sprite.setData("mob", true);
    sprite.setData("uid", sprite.uid);
    const chip = this.add.graphics().setDepth(18);
    sprite.setData("chip", chip);
    this.physics.add.collider(sprite, this.solids);
    this.physics.add.overlap(this.player, sprite, () => this.touchMob(sprite));
    this.physics.add.overlap(this.bullets, sprite, (b, m) => this.bulletHit(b as Phaser.Physics.Arcade.Sprite, m as Mob));
    if (this.anims.exists(`${kind}-idle`)) sprite.play(`${kind}-idle`);
    this.mobs.push(sprite);
    return sprite;
  }

  private fitBody(spr: Phaser.Physics.Arcade.Sprite, worldW: number, worldH: number, feet: boolean) {
    const body = spr.body as Phaser.Physics.Arcade.Body;
    const sx = Math.abs(spr.scaleX) || 1;
    const sy = Math.abs(spr.scaleY) || 1;
    const bw = worldW / sx;
    const bh = worldH / sy;
    body.setSize(bw, bh, false);
    if (feet) body.setOffset((spr.width - bw) * 0.5, spr.height - bh);
    else body.setOffset((spr.width - bw) * 0.5, (spr.height - bh) * 0.5);
  }

  update(_t: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const actions = sampleActions();
    if (actions.justPause) {
      gameBus.emit("toggle-pause");
    }
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

    const shake = this.trauma * this.trauma * 7;
    this.cameras.main.setScroll(
      this.cameras.main.scrollX + (Math.random() - 0.5) * shake,
      this.cameras.main.scrollY + (Math.random() - 0.5) * shake,
    );

    if (this.dead) {
      this.emitHudThrottled(dt);
      return;
    }

    this.updatePlayer(dt, actions, _t);
    this.updateMobs(dt);
    this.updateShots(dt);
    this.updateInteract(dt, actions);
    this.checkPits();
    this.emitHudThrottled(dt);
  }

  private updatePlayer(dt: number, a: ActionFrame, time: number) {
    const job = JOBS[this.jobId];
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;

    if (grounded) this.coyote = 0.1;
    else this.coyote -= dt;
    if (a.justJump) this.jumpBuf = 0.13;
    else this.jumpBuf -= dt;

    if (a.downHeld && a.justJump && grounded) {
      this.skipOneWay = 0.28;
      this.jumpBuf = 0;
    } else if ((grounded || this.coyote > 0) && this.jumpBuf > 0) {
      body.setVelocityY(-560);
      this.coyote = 0;
      this.jumpBuf = 0;
      this.jumpCut = false;
      sfxPlay.jump();
    }

    if (!a.jumpHeld && !this.jumpCut && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * 0.48);
      this.jumpCut = true;
    }

    if (!grounded && Math.abs(body.velocity.y) < 42) body.setGravityY(720);
    else body.setGravityY(body.velocity.y < 0 ? 1080 : 2280);

    const accel = grounded ? 3400 : 1700;
    if (Math.abs(a.moveX) > 0.15) {
      body.setAccelerationX(a.moveX * accel);
      this.facing = a.moveX > 0 ? 1 : -1;
      this.player.setFlipX(this.facing < 0);
      body.setDragX(0);
    } else {
      body.setAccelerationX(0);
      body.setDragX(grounded ? 2600 : 280);
    }
    body.setMaxVelocity(job.speed, 980);

    if (this.attackLock <= 0) {
      if (grounded && Math.abs(body.velocity.x) > 30) this.playSafe(`${this.jobId}-run`);
      else if (grounded) this.playSafe(`${this.jobId}-idle`);
    }

    if (a.justAttack && this.attackCd <= 0) this.doAttack(false);
    if (a.justSkill && this.skillCd <= 0 && this.save.mp >= job.skillCost) this.doAttack(true);

    if (this.invuln > 0) this.player.setAlpha(Math.sin(time * 0.02) > 0 ? 0.45 : 1);
    else this.player.setAlpha(1);
  }

  private doAttack(skill: boolean) {
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
    if (strike.shape === "melee") this.melee(dmg, strike.reach, strike.pierce, strike.falloff);
    else this.shoot(strike.shape, dmg, strike.shots, strike.pierce, strike.falloff);
  }

  private atk() {
    const job = JOBS[this.jobId];
    const eq = this.save.equipped;
    return job.atk + (this.save.level - 1) * 2 + (eq.weapon?.atk ?? 0) + (eq.acc?.atk ?? 0);
  }

  private def() {
    const job = JOBS[this.jobId];
    const eq = this.save.equipped;
    return job.def + (eq.armor?.def ?? 0) + (eq.acc?.def ?? 0);
  }

  private maxHp() {
    return JOBS[this.jobId].hp + (this.save.level - 1) * 12 + (this.save.equipped.armor?.def ?? 0) * 2;
  }

  private maxMp() {
    return JOBS[this.jobId].mp + (this.save.level - 1) * 6;
  }

  private melee(dmg: number, reach: number, pierce: number, falloff: number) {
    const x = this.player.x + this.facing * reach * 0.55;
    const y = this.player.y - 32;
    this.flashFx(x, y);
    const hits = this.mobs
      .filter((mob) => {
        if (!mob.active) return false;
        if (Math.abs(mob.y - this.player.y) > 96) return false;
        const half = MONSTERS[mob.kind].hitW * 0.5;
        const toward = (mob.x - this.player.x) * this.facing;
        return toward + half > -48 && toward - half < reach + 16;
      })
      .sort((a, b) => (a.x - this.player.x) * this.facing - (b.x - this.player.x) * this.facing)
      .slice(0, Math.max(1, pierce));
    hits.forEach((mob, i) => {
      const scaled = dmg * (1 - falloff * i);
      this.hurtMob(mob, scaled, { sparkX: x, sparkY: y });
    });
  }

  private shoot(kind: "orb" | "arrow", dmg: number, count: number, pierce: number, falloff: number) {
    const key = kind === "orb" ? "orb" : "arrow";
    const spreads = count === 1 ? [0] : [-0.22, 0, 0.22];
    const ox = this.player.x + this.facing * 26;
    const oy = this.player.y - 28;
    for (const ang of spreads) {
      const b = this.bullets.get(ox, oy, this.tex(key)) as Phaser.Physics.Arcade.Sprite | null;
      if (!b) continue;
      b.setActive(true).setVisible(true);
      b.setPosition(ox, oy);
      if (this.anims.exists(key)) b.play(key);
      b.setDisplaySize(kind === "orb" ? 28 : 36, kind === "orb" ? 28 : 18);
      b.setFlipX(this.facing < 0);
      b.setDepth(11);
      b.setData("dmg", dmg);
      b.setData("pierce", pierce);
      b.setData("falloff", falloff);
      b.setData("hitIds", [] as number[]);
      b.setData("vx", Math.cos(ang) * 460 * this.facing);
      b.setData("vy", Math.sin(ang) * 460 * 0.35);
      const body = b.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
      body.stop();
      this.time.delayedCall(1400, () => this.recycleBullet(b));
    }
  }

  private recycleBullet(b: Phaser.Physics.Arcade.Sprite) {
    b.setActive(false).setVisible(false);
    const body = b.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.stop();
      body.enable = false;
    }
  }

  private updateShots(dt: number) {
    const shots = this.bullets.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const b of shots) {
      if (!b.active) continue;
      b.x += Number(b.getData("vx") ?? 0) * dt;
      b.y += Number(b.getData("vy") ?? 0) * dt;
      const hw = 18;
      const hh = 14;
      const bl = b.x - hw;
      const br = b.x + hw;
      const bt = b.y - hh;
      const bbott = b.y + hh;
      for (const mob of this.mobs) {
        if (!mob.active) continue;
        const def = MONSTERS[mob.kind];
        const ml = mob.x - def.hitW * 0.5;
        const mr = mob.x + def.hitW * 0.5;
        const mt = mob.y - def.hitH;
        const mbott = mob.y + 8;
        if (bl < mr && br > ml && bt < mbott && bbott > mt) this.bulletHit(b, mob);
      }
    }
  }

  private bulletHit(b: Phaser.Physics.Arcade.Sprite, mob: Mob) {
    if (!b.active || !mob.active) return;
    const hitIds = (b.getData("hitIds") as number[] | undefined) ?? [];
    if (hitIds.includes(mob.uid)) return;
    hitIds.push(mob.uid);
    b.setData("hitIds", hitIds);
    const base = Number(b.getData("dmg") ?? 10);
    const falloff = Number(b.getData("falloff") ?? 0);
    const pierce = Math.max(1, Number(b.getData("pierce") ?? 1));
    const dmg = base * (1 - falloff * (hitIds.length - 1));
    const def = MONSTERS[mob.kind];
    this.hurtMob(mob, dmg, { sparkX: b.x, sparkY: b.y });
    if (def.blockPierce || hitIds.length >= pierce) this.recycleBullet(b);
  }

  private flashFx(x: number, y: number) {
    if (!this.textures.exists("slash")) return;
    const fx = this.add.sprite(x, y, "slash").setDisplaySize(56, 56).setFlipX(this.facing < 0).setDepth(12);
    if (this.anims.exists("slash")) fx.play("slash");
    this.time.delayedCall(280, () => fx.destroy());
  }

  private hurtMob(mob: Mob, dmg: number, where?: { sparkX: number; sparkY: number }) {
    if (!mob.active) return;
    const def = MONSTERS[mob.kind];
    const crit = Math.random() < 0.12;
    const rolled = Math.max(1, Math.round(dmg * (0.85 + Math.random() * 0.3) * (crit ? 1.45 : 1)));
    mob.hp -= rolled;
    mob.chipT = 2.2;
    mob.hurtT = 0.14;
    const body = mob.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-Math.sign(mob.x - this.player.x || this.facing) * 90 * def.knockback);
    const nx = where?.sparkX ?? mob.x;
    const ny = (where?.sparkY ?? mob.y - 36) - 8;
    this.popNumber(mob.x + (Math.random() - 0.5) * 18, mob.y - 48, `${rolled}`, crit ? "crit" : "hit");
    this.flashFx(nx, ny);
    this.trauma = Math.min(1, this.trauma + (crit ? 0.34 : 0.2));
    sfxPlay.hit();
    mob.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (mob.active) mob.clearTint();
    });
    this.lastHits.push({ k: mob.kind, dmg: rolled, x: Math.round(mob.x), n: crit ? "crit" : "hit" });
    if (this.lastHits.length > 24) this.lastHits.shift();
    if (mob.hp <= 0) this.killMob(mob);
  }

  private killMob(mob: Mob) {
    const def = MONSTERS[mob.kind];
    const isBoss = mob.kind === "warden";
    this.grantExp(def.exp);
    this.save.kills += 1;
    if (this.save.kills >= 8) this.save.heartwoodOpen = true;
    if (isBoss) this.save.wardenDown = true;
    this.spawnGlims(mob.x, mob.y, def.glims);
    const drop = rollDrop(isBoss);
    if (drop) this.spawnItem(mob.x, mob.y - 10, drop);
    this.flashFx(mob.x, mob.y);
    const chip = mob.getData("chip") as Phaser.GameObjects.Graphics | undefined;
    chip?.destroy();
    mob.destroy();
    this.mobs = this.mobs.filter((m) => m !== mob);
    this.persist();
    if (isBoss) {
      this.prompt = "The Warden falls. Glimmergrove is quieter.";
      this.trauma = 0.8;
    } else {
      const ox = mob.originX;
      const oy = mob.originY;
      const kind = mob.kind;
      this.time.delayedCall(8000, () => {
        if (this.changingMap || this.dead) return;
        this.spawnMob(kind, ox, oy);
      });
    }
  }

  private grantExp(amount: number) {
    this.save.exp += amount;
    let next = expToNext(this.save.level);
    let leveled = false;
    while (this.save.exp >= next) {
      this.save.exp -= next;
      this.save.level += 1;
      next = expToNext(this.save.level);
      this.save.hp = this.maxHp();
      this.save.mp = this.maxMp();
      leveled = true;
    }
    if (leveled) {
      sfxPlay.level();
      this.popNumber(this.player.x, this.player.y - 70, "Level up", "good");
    }
  }

  private spawnGlims(x: number, y: number, n: number) {
    const count = Math.min(5, 1 + Math.floor(n / 8));
    for (let i = 0; i < count; i++) {
      const key = this.textures.exists("glim") ? "glim" : this.tex("orb");
      const d = this.drops.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null;
      if (!d) continue;
      d.setActive(true).setVisible(true);
      d.setDisplaySize(22, 22);
      d.setData("glims", Math.ceil(n / count));
      const body = d.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.setAllowGravity(true);
      body.setGravityY(900);
      body.setVelocity((Math.random() - 0.5) * 160, -180 - Math.random() * 80);
      body.setBounce(0.35, 0.2);
      this.physics.add.collider(d, this.solids);
      if (this.anims.exists("glim")) d.play("glim");
    }
  }

  private spawnItem(x: number, y: number, item: ItemDef) {
    const d = this.drops.get(x, y, this.tex("glim")) as Phaser.Physics.Arcade.Sprite | null;
    if (!d) return;
    d.setActive(true).setVisible(true);
    d.setDisplaySize(26, 26);
    d.setTint(0xc8d2c4);
    d.setData("item", item);
    const body = d.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(true);
    body.setGravityY(900);
    body.setVelocity(40, -220);
    this.physics.add.collider(d, this.solids);
  }

  private collectDrop(d: Phaser.Physics.Arcade.Sprite) {
    if (!d.active) return;
    const item = d.getData("item") as ItemDef | undefined;
    const g = Number(d.getData("glims") ?? 0);
    if (item) {
      this.save.inventory.push(item);
      this.prompt = `Found ${item.name}`;
      this.time.delayedCall(1800, () => {
        if (this.prompt?.startsWith("Found")) this.prompt = null;
      });
    }
    if (g) this.save.glims += g;
    sfxPlay.pickup();
    d.destroy();
    this.persist();
  }

  private touchMob(mob: Mob) {
    if (!mob.active || this.invuln > 0 || this.dead) return;
    const raw = MONSTERS[mob.kind].atk;
    const dmg = Math.max(3, raw - this.def());
    this.save.hp -= dmg;
    this.invuln = 1.05;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(-this.facing * 120, -180);
    this.trauma = Math.min(1, this.trauma + 0.4);
    sfxPlay.hurt();
    this.popNumber(this.player.x, this.player.y - 36, `${dmg}`, "hurt");
    if (this.save.hp <= 0) this.die();
  }

  private updateMobs(dt: number) {
    for (const mob of this.mobs) {
      if (!mob.active) continue;
      mob.hurtT = Math.max(0, mob.hurtT - dt);
      mob.chipT = Math.max(0, mob.chipT - dt);
      this.drawMobChip(mob);
      const def = MONSTERS[mob.kind];
      const body = mob.body as Phaser.Physics.Arcade.Body;
      if (mob.y > GAME_H + 20) {
        mob.setPosition(mob.originX, mob.originY - 4);
        body.setVelocity(0, 0);
        continue;
      }
      const dist = Math.abs(this.player.x - mob.x);
      const aggro = dist < (mob.kind === "warden" ? 420 : 180) && Math.abs(this.player.y - mob.y) < 90;
      if (aggro) mob.dir = this.player.x < mob.x ? -1 : 1;
      else if (Math.abs(mob.x - mob.originX) > 90) mob.dir = mob.x > mob.originX ? -1 : 1;
      const ahead = mob.x + mob.dir * 28;
      if (!this.groundUnder(ahead) && body.blocked.down) mob.dir *= -1;
      body.setVelocityX(mob.dir * def.speed);
      mob.setFlipX(mob.dir < 0);
      const walk = `${mob.kind}-walk`;
      if (this.anims.exists(walk)) mob.play(walk, true);
      else if (this.anims.exists(`${mob.kind}-idle`)) mob.play(`${mob.kind}-idle`, true);
    }
  }

  private groundUnder(x: number) {
    const map = MAPS[this.mapId];
    for (const p of map.platforms) {
      if (p.oneWay) continue;
      if (x >= p.x && x <= p.x + p.w) return true;
    }
    return false;
  }

  private updateInteract(dt: number, a: ActionFrame) {
    const map = MAPS[this.mapId];
    this.interact = null;
    const keepPrompt =
      this.prompt?.startsWith("Found") || this.prompt?.startsWith("The Warden") || this.prompt?.startsWith("Rested");
    if (!keepPrompt) this.prompt = null;

    if (map.npc && Math.abs(this.player.x - map.npc.x) < 100) {
      this.interact = { type: "npc" };
      if (!keepPrompt) this.prompt = "E  Rest with Wren";
      if (a.justInteract) this.tryInteract();
    }

    let onPortal = false;
    for (const p of map.portals) {
      if (Math.abs(this.player.x - p.x) >= 100) continue;
      onPortal = true;
      const locked = !!(p.requireKills && this.save.kills < p.requireKills && !this.save.heartwoodOpen);
      this.interact = { type: "portal", to: p.to, require: p.requireKills };
      if (!keepPrompt) {
        this.prompt = locked ? `Locked · hunt ${p.requireKills! - this.save.kills} more` : `Walk in  ·  ${p.label}`;
      }
      if (!locked && this.portalLock <= 0) {
        this.portalDwell += dt;
        if (a.interactHeld || a.justInteract || this.portalDwell > 0.28) {
          this.enterMap(p.to);
          return;
        }
      }
    }
    if (!onPortal) this.portalDwell = 0;

    if (this.mapId === "dewpath" && this.player.x > 780 && this.player.x < 940 && !keepPrompt && !this.prompt) {
      this.prompt = "Jump the mist gap";
    }
  }

  private tryInteract() {
    if (!this.interact) return;
    if (this.interact.type === "npc") {
      this.save.hp = this.maxHp();
      this.save.mp = this.maxMp();
      this.prompt = "Rested. HP and dew restored.";
      sfxPlay.pickup();
      this.persist();
      this.time.delayedCall(1600, () => {
        if (this.prompt?.startsWith("Rested")) this.prompt = null;
      });
      return;
    }
    if (this.interact.to) this.enterMap(this.interact.to);
  }

  private enterMap(to: MapId, force = false) {
    if (this.changingMap) return;
    const dest = MAPS[to];
    if (!dest) return;
    if (!force) {
      const portal = MAPS[this.mapId].portals.find((p) => p.to === to);
      const need = portal?.requireKills ?? 0;
      if (need && this.save.kills < need && !this.save.heartwoodOpen) return;
    }
    this.changingMap = true;
    this.registry.set("mapId", to);
    this.registry.set("job", this.jobId);
    this.save.map = to;
    this.save.x = dest.spawn.x;
    this.save.y = dest.spawn.y;
    writeSave(this.save);
    gameBus.emit("saved");
    sfxPlay.portal();
    this.scene.restart({ job: this.jobId, mapId: to });
  }

  private checkPits() {
    const map = MAPS[this.mapId];
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.player.y > GAME_H + 40) {
      this.die();
      return;
    }
    for (const pit of map.pits) {
      if (this.player.x > pit.x && this.player.x < pit.x + pit.w && body.y > 500) {
        this.die();
      }
    }
  }

  private die() {
    if (this.dead) return;
    this.dead = true;
    this.save.hp = 0;
    this.save.glims = Math.floor(this.save.glims * 0.9);
    sfxPlay.death();
    this.player.setTint(0x442222);
    this.time.delayedCall(900, () => {
      const map = MAPS[this.mapId];
      this.save.hp = Math.ceil(this.maxHp() * 0.5);
      this.save.mp = Math.ceil(this.maxMp() * 0.5);
      this.save.x = map.spawn.x;
      this.save.y = map.spawn.y;
      this.changingMap = true;
      this.registry.set("mapId", this.mapId);
      this.registry.set("job", this.jobId);
      writeSave(this.save);
      this.scene.restart({ job: this.jobId, mapId: this.mapId });
    });
  }

  private drawMobChip(mob: Mob) {
    const g = mob.getData("chip") as Phaser.GameObjects.Graphics | undefined;
    if (!g) return;
    g.clear();
    if (mob.chipT <= 0 && mob.hp >= mob.maxHp) return;
    const w = mob.kind === "warden" ? 72 : 40;
    const h = 5;
    const x = mob.x - w / 2;
    const y = mob.y - (mob.kind === "warden" ? 128 : 62);
    const pct = Math.max(0, Math.min(1, mob.hp / mob.maxHp));
    g.fillStyle(0x121814, 0.78);
    g.fillRoundedRect(x, y, w, h, 2);
    g.fillStyle(pct > 0.35 ? 0xc45c4a : 0xa33b2c, 1);
    g.fillRoundedRect(x, y, Math.max(2, w * pct), h, 2);
  }

  private popNumber(x: number, y: number, text: string, tone: string) {
    const pal: Record<string, { fill: string; stroke: string; size: string }> = {
      hit: { fill: "#fff6d8", stroke: "#121814", size: "26px" },
      crit: { fill: "#f0c14b", stroke: "#3a2208", size: "32px" },
      hurt: { fill: "#f2b4a8", stroke: "#3a1410", size: "22px" },
      good: { fill: "#c5e0c0", stroke: "#121814", size: "20px" },
    };
    const s = pal[tone] ?? { fill: "#fff6d8", stroke: "#121814", size: "24px" };
    const t = this.add
      .text(x, y, text, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: s.size,
        color: s.fill,
        fontStyle: "bold",
        stroke: s.stroke,
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setScale(0.7);
    this.tweens.add({
      targets: t,
      y: y - 46,
      duration: 740,
      ease: "Cubic.easeOut",
    });
    this.tweens.add({
      targets: t,
      scale: 1.12,
      duration: 140,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: t,
      alpha: 0,
      duration: 260,
      delay: 460,
      onComplete: () => t.destroy(),
    });
  }

  private emitHudThrottled(dt: number) {
    this.hudT += dt;
    if (this.hudT < 0.08) return;
    this.hudT = 0;
    this.emitHud();
  }

  private emitHud() {
    const job = JOBS[this.jobId];
    const snap: HudSnap = {
      name: this.save.name,
      job: job.name,
      map: MAPS[this.mapId].name,
      hp: Math.max(0, this.save.hp),
      maxHp: this.maxHp(),
      mp: Math.max(0, this.save.mp),
      maxMp: this.maxMp(),
      exp: this.save.exp,
      next: expToNext(this.save.level),
      level: this.save.level,
      glims: this.save.glims,
      kills: this.save.kills,
      attackName: job.attackName,
      skillName: job.skillName,
      skillCd: this.skillCd,
      skillMax: job.skillCd,
      prompt: this.prompt,
      dead: this.dead,
      paused: this.paused,
    };
    gameBus.emit("hud", snap);
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

  private cleanup() {
    if (!this.changingMap) this.persist(true);
    this.mobs = [];
    window.__controlsTest = undefined;
    window.__qa = undefined;
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
    };
    __qa?: {
      scale: () => { sx: number; dw: number; fw: number; x: number; y: number };
      map: () => string;
      prompt: () => string | null;
      kills: () => number;
      hp: () => number;
      enter: () => void;
      warp: (id: string) => void;
      job: () => string;
      cd: () => number;
      swing: () => unknown;
      skill: () => unknown;
      hits: () => unknown;
      shots: () => unknown;
      mobs: () => unknown;
    };
  }
}
