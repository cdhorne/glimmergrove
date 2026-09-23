/** Mob wander + stun. Scene owns sprites; this decides whether AI may write vx. */

export const MOB_EDGE = 48;

export function mobAggroReach(kind: string) {
  return kind === "warden" || kind === "bramble" || kind === "gorecap" ? 420 : kind === "nettle" ? 260 : 180;
}

export type MobIntent = {
  hurtT: number;
  dir: number;
  vx: number | null;
  pinX: number | null;
};

export function stepMob(opts: {
  dt: number;
  hurtT: number;
  dir: number;
  x: number;
  y: number;
  originX: number;
  playerX: number;
  playerY: number;
  kind: string;
  speed: number;
  grounded: boolean;
  groundAhead: boolean;
  mapW: number;
}): MobIntent {
  const hurtT = Math.max(0, opts.hurtT - opts.dt);
  const minX = MOB_EDGE;
  const maxX = Math.max(minX + 8, opts.mapW - MOB_EDGE);
  let pinX: number | null = null;
  if (opts.x < minX) pinX = minX;
  if (opts.x > maxX) pinX = maxX;
  if (hurtT > 0) return { hurtT, dir: opts.dir, vx: null, pinX };

  let dir = opts.dir;
  const dist = Math.abs(opts.playerX - opts.x);
  const aggro = dist < mobAggroReach(opts.kind) && Math.abs(opts.playerY - opts.y) < 90;
  if (aggro) dir = opts.playerX < opts.x ? -1 : 1;
  else if (Math.abs(opts.x - opts.originX) > 90) dir = opts.x > opts.originX ? -1 : 1;
  if (!opts.groundAhead && opts.grounded) dir *= -1;
  if (opts.x <= minX) dir = 1;
  if (opts.x >= maxX) dir = -1;

  return { hurtT, dir, vx: dir * opts.speed, pinX };
}
