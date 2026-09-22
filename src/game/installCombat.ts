/**
 * Wires knock + stun onto WorldScene without rewriting the scene file.
 * hurt/touch set the impulse; updateMobs wander is undone while hurtT > 0.
 */
import * as Phaser from "phaser";
import { MONSTERS } from "./content";
import { mobHitKnock, playerHitKnock } from "./combat";

type Mob = Phaser.Physics.Arcade.Sprite & {
  kind: keyof typeof MONSTERS | string;
  hurtT: number;
  active: boolean;
};

type SceneLike = {
  player: Phaser.Physics.Arcade.Sprite;
  knockLock: number;
  dead: boolean;
  mobs: Mob[];
  hurtMob: (mob: Mob, dmg: number, where?: { sparkX: number; sparkY: number }) => void;
  touchMob: (mob: Mob) => void;
  updateMobs: (dt: number) => void;
};

export function installCombat(SceneCls: { prototype: Record<string, unknown> }) {
  const proto = SceneCls.prototype as SceneLike;

  const prevHurt = proto.hurtMob;
  proto.hurtMob = function hurtMobKnock(mob, dmg, where) {
    prevHurt.call(this, mob, dmg, where);
    if (!mob.active) return;
    const def = MONSTERS[mob.kind as keyof typeof MONSTERS] ?? { knockback: 1, mass: 1, speed: 40 };
    const knock = mobHitKnock(this.player.x, mob.x, def);
    mob.hurtT = knock.stun;
    const body = mob.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) return;
    body.setVelocity(knock.vx, knock.vy);
    body.setMaxVelocity(Math.max((def as { speed?: number }).speed ?? 40, Math.abs(knock.vx) + 20), 900);
  };

  const prevTouch = proto.touchMob;
  proto.touchMob = function touchMobKnock(mob) {
    const wasDead = this.dead;
    prevTouch.call(this, mob);
    if (wasDead || this.dead) return;
    const knock = playerHitKnock(this.player.x, mob.x);
    this.knockLock = knock.stun;
    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.setVelocity(knock.vx, knock.vy);
  };

  const prevUpdate = proto.updateMobs;
  proto.updateMobs = function updateMobsStun(dt) {
    const prior = this.mobs.map((m) => {
      const body = m.body as Phaser.Physics.Arcade.Body | undefined;
      return { hurt: m.hurtT, vx: body?.velocity.x ?? 0 };
    });
    prevUpdate.call(this, dt);
    this.mobs.forEach((mob, i) => {
      if (!mob.active || prior[i]!.hurt <= 0) return;
      const body = mob.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) body.setVelocityX(prior[i]!.vx);
    });
  };
}
