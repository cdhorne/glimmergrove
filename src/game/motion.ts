import type { ActionFrame } from "./input";
import { JOBS, type JobId } from "./content";
import { sfxPlay } from "./audio";

/** Maple-tight hop. Peak ~ v² / 2g ≈ 90px. No apex float. */
export const JUMP_V = -620;
export const GRAVITY_UP = 2100;
export const GRAVITY_DOWN = 3400;
export const MAX_FALL = 980;
export const GROUND_ACCEL = 3800;
export const AIR_ACCEL = 4200;
export const AIR_DRAG = 40;

type SteerScene = {
  jobId: JobId;
  player: Phaser.Physics.Arcade.Sprite;
  coyote: number;
  jumpBuf: number;
  skipOneWay: number;
  facing: number;
  attackLock: number;
  attackCd: number;
  skillCd: number;
  invuln: number;
  save: { mp: number };
  playSafe: (key: string) => void;
  doAttack: (skill: boolean) => void;
};

export function applyPlayerMotion(scene: SteerScene, dt: number, a: ActionFrame, time: number) {
  const job = JOBS[scene.jobId];
  const body = scene.player.body as Phaser.Physics.Arcade.Body;
  const grounded = body.blocked.down || body.touching.down;

  if (grounded) scene.coyote = 0.1;
  else scene.coyote -= dt;
  if (a.justJump) scene.jumpBuf = 0.13;
  else scene.jumpBuf -= dt;

  if (a.downHeld && a.justJump && grounded) {
    scene.skipOneWay = 0.28;
    scene.jumpBuf = 0;
  } else if ((grounded || scene.coyote > 0) && scene.jumpBuf > 0) {
    body.setVelocityY(JUMP_V);
    if (Math.abs(a.moveX) > 0.12) body.setVelocityX(a.moveX * job.speed);
    scene.coyote = 0;
    scene.jumpBuf = 0;
    sfxPlay.jump();
  }

  body.setGravityY(body.velocity.y < 0 ? GRAVITY_UP : GRAVITY_DOWN);

  const accel = grounded ? GROUND_ACCEL : AIR_ACCEL;
  if (Math.abs(a.moveX) > 0.12) {
    body.setAccelerationX(a.moveX * accel);
    scene.facing = a.moveX > 0 ? 1 : -1;
    scene.player.setFlipX(scene.facing < 0);
    body.setDragX(0);
  } else {
    body.setAccelerationX(0);
    body.setDragX(grounded ? 2800 : AIR_DRAG);
  }
  body.setMaxVelocity(grounded ? job.speed : job.speed + 80, MAX_FALL);

  if (scene.attackLock <= 0) {
    if (grounded && Math.abs(body.velocity.x) > 30) scene.playSafe(`${scene.jobId}-run`);
    else if (grounded) scene.playSafe(`${scene.jobId}-idle`);
  }

  if (a.justAttack && scene.attackCd <= 0) scene.doAttack(false);
  if (a.justSkill && scene.skillCd <= 0 && scene.save.mp >= job.skillCost) scene.doAttack(true);

  if (scene.invuln > 0) scene.player.setAlpha(Math.sin(time * 0.02) > 0 ? 0.45 : 1);
  else scene.player.setAlpha(1);
}

export function installMotion(SceneCls: { prototype: Record<string, unknown> }) {
  const proto = SceneCls.prototype as {
    create: () => void;
    updatePlayer: (dt: number, a: ActionFrame, time: number) => void;
    player: Phaser.Physics.Arcade.Sprite;
    jobId: JobId;
  };
  const prevCreate = proto.create;
  proto.create = function createPatched(this: typeof proto) {
    prevCreate.call(this);
    if (!this.player?.body) return;
    const job = JOBS[this.jobId];
    this.player.setMaxVelocity(job.speed, MAX_FALL);
    this.player.setGravityY(GRAVITY_DOWN);
  };
  proto.updatePlayer = function updatePlayerPatched(this: SteerScene, dt, a, time) {
    applyPlayerMotion(this, dt, a, time);
  };
}
