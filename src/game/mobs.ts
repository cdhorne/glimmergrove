/** Mob wander + stun. Scene owns sprites; this decides whether AI may write vx. */

export function mobAggroReach(kind: string) {
  return kind === "warden" || kind === "bramble" ? 420 : 180;
}

export type MobIntent = {
  hurtT: number;
  dir: number;
  vx: number | null;
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
}): MobIntent {
  const hurtT = Math.max(0, opts.hurtT - opts.dt);
  if (hurtT > 0) return { hurtT, dir: opts.dir, vx: null };

  let dir = opts.dir;
  const dist = Math.abs(opts.playerX - opts.x);
  const aggro = dist < mobAggroReach(opts.kind) && Math.abs(opts.playerY - opts.y) < 90;
  if (aggro) dir = opts.playerX < opts.x ? -1 : 1;
  else if (Math.abs(opts.x - opts.originX) > 90) dir = opts.x > opts.originX ? -1 : 1;
  if (!opts.groundAhead && opts.grounded) dir *= -1;

  return { hurtT, dir, vx: dir * opts.speed };
}
