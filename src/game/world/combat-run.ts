/** Hit plans the scene applies. No Phaser. */
import { MONSTERS, type MonsterKind, type Strike } from "../content.ts";
import { mobHitKnock, playerHitKnock } from "../combat.ts";
import { contactDamage } from "./rules.ts";
import type { Knock } from "../feel.ts";

export function rollStrike(dmg: number, rng = Math.random) {
  return Math.max(1, Math.round(dmg * (0.85 + rng() * 0.3)));
}

export type HurtPlan = {
  rolled: number;
  hp: number;
  dead: boolean;
  knock: Knock | null;
  stun: number;
};

export function planHurt(opts: {
  kind: MonsterKind;
  hp: number;
  dmg: number;
  playerX: number;
  mobX: number;
  rng?: () => number;
}): HurtPlan {
  const def = MONSTERS[opts.kind];
  const rolled = rollStrike(opts.dmg, opts.rng ?? Math.random);
  const hp = opts.hp - rolled;
  if (hp <= 0) return { rolled, hp, dead: true, knock: null, stun: 0 };
  const knock = mobHitKnock(opts.playerX, opts.mobX, def);
  return { rolled, hp, dead: false, knock, stun: knock.stun };
}

export type TouchPlan = {
  dmg: number;
  knock: Knock;
  invuln: number;
};

export function planTouch(opts: {
  kind: MonsterKind;
  def: number;
  playerX: number;
  mobX: number;
  invuln: number;
  dead: boolean;
}): TouchPlan | null {
  if (opts.invuln > 0 || opts.dead) return null;
  return {
    dmg: contactDamage(MONSTERS[opts.kind].atk, opts.def),
    knock: playerHitKnock(opts.playerX, opts.mobX),
    invuln: 1.05,
  };
}

export function strikeReach(strike: Strike) {
  if (strike.reach > 0) return strike.reach;
  if (strike.shape === "orb") return 260;
  if (strike.shape === "arrow") return 220;
  return 70;
}

export function inStrikeLane(opts: {
  playerX: number;
  playerY: number;
  facing: number;
  mobX: number;
  mobY: number;
  hitW: number;
  reach: number;
}) {
  if (Math.abs(opts.mobY - opts.playerY) > 96) return false;
  const half = opts.hitW * 0.5;
  const toward = (opts.mobX - opts.playerX) * opts.facing;
  return toward + half > -48 && toward - half < opts.reach + 16;
}

export type BoltSpec = {
  key: "orb" | "arrow";
  shots: number;
  speed: number;
  life: number;
  spread: number;
};

export function boltSpec(strike: Strike): BoltSpec | null {
  if (strike.shape !== "orb" && strike.shape !== "arrow") return null;
  return {
    key: strike.shape,
    shots: Math.max(1, strike.shots),
    speed: strike.shape === "arrow" ? 560 : 420,
    life: 0.85,
    spread: strike.shots > 1 ? 18 : 0,
  };
}
