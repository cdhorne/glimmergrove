/** Pure feel numbers. Keep Phaser off this file so tests stay cheap. */

export const JUMP_V = -620;
export const GRAVITY_UP = 2100;
export const GRAVITY_DOWN = 3400;
export const MAX_FALL = 980;
export const GROUND_ACCEL = 3800;
export const AIR_ACCEL = 4200;
export const AIR_DRAG = 40;
export const MOVE_DEADZONE = 0.12;
export const COYOTE = 0.1;
export const JUMP_BUFFER = 0.13;

export const HIT_STUN = 0.2;
export const PLAYER_KNOCK_X = 300;
export const PLAYER_KNOCK_Y = -240;
export const MOB_KNOCK_X = 280;
export const MOB_KNOCK_Y = -160;

export const STICK_R = 56;

/** Floor top. Ledges are this minus n × ledgePx(). */
export const GROUND_Y = 468;
/** Fraction of hop used as one comfortable step. */
export const LEDGE_RATIO = 0.62;

export const CHROME = {
  landscapeStickW: 0.32,
  landscapeStickHPx: 112,
  landscapeJumpPx: 56,
  landscapeAttackPx: 48,
  landscapeHudMaxW: 320,
};

export function jumpPeakPx(v = JUMP_V, g = GRAVITY_UP) {
  return (v * v) / (2 * g);
}

export function ledgePx() {
  return Math.round(jumpPeakPx() * LEDGE_RATIO);
}

export function ledgeY(steps: number, groundY = GROUND_Y) {
  return groundY - steps * ledgePx();
}

export function gravityForVy(vy: number) {
  return vy < 0 ? GRAVITY_UP : GRAVITY_DOWN;
}

export function steerFor(grounded: boolean, moveX: number) {
  if (Math.abs(moveX) <= MOVE_DEADZONE) {
    return { accelX: 0, dragX: grounded ? 2800 : AIR_DRAG, facing: 0 as 0 | 1 | -1 };
  }
  return {
    accelX: moveX * (grounded ? GROUND_ACCEL : AIR_ACCEL),
    dragX: 0,
    facing: (moveX > 0 ? 1 : -1) as 1 | -1,
  };
}

export function computeStick(dx: number, dy: number, r = STICK_R) {
  const mag = Math.hypot(dx, dy);
  const cap = Math.min(mag, r);
  const nx = mag > 0 ? (dx / mag) * cap : 0;
  const ny = mag > 0 ? (dy / mag) * cap : 0;
  const moveX = nx / r;
  const moveY = ny / r;
  return { nx, ny, moveX, moveY, down: moveY > 0.55 };
}

export function visualBox(
  vv: { width?: number; height?: number; offsetLeft?: number; offsetTop?: number } | null | undefined,
  fallback: { innerWidth: number; innerHeight: number },
) {
  const w = Math.max(1, Math.round(vv?.width ?? fallback.innerWidth));
  const h = Math.max(1, Math.round(vv?.height ?? fallback.innerHeight));
  const x = Math.round(vv?.offsetLeft ?? 0);
  const y = Math.round(vv?.offsetTop ?? 0);
  return { x, y, w, h, orientation: w >= h ? ("landscape" as const) : ("portrait" as const) };
}

export type Knock = { vx: number; vy: number; stun: number };

/** `dir` is travel direction after the hit. mass 1 = dewslug. */
export function knockVel(dir: number, mass: number, power = 1): Knock {
  const m = Math.max(0.25, mass);
  const sign = dir < 0 ? -1 : 1;
  return {
    vx: (sign * MOB_KNOCK_X * power) / m,
    vy: (MOB_KNOCK_Y * power) / Math.sqrt(m),
    stun: HIT_STUN * (0.7 + 0.5 / m),
  };
}

export function playerKnockVel(away: number): Knock {
  const sign = away < 0 ? -1 : 1;
  return { vx: sign * PLAYER_KNOCK_X, vy: PLAYER_KNOCK_Y, stun: HIT_STUN };
}

export function knockAway(fromX: number, toX: number) {
  return toX >= fromX ? 1 : -1;
}
