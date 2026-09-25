/** Hit plans the scene applies. No Phaser. */
import { MONSTERS, type MonsterKind, type Strike } from "../content.ts";
import { mobHitKnock, playerHitKnock } from "../combat.ts";
import { contactDamage } from "./rules.ts";
import type { Knock } from "../feel.ts";

export const CRIT_CHANCE = 0.12;
export const CRIT_MULT = 1.45;
export const CHIP_HOLD = 2.2;

export function rollStrike(dmg: number, rng = Math.random) {
  return Math.max(1, Math.round(dmg * (0.85 + rng() * 0.3)));
}

export function rollCrit(rng = Math.random) {
  return rng() < CRIT_CHANCE;
}

export type HurtPlan = {
  rolled: number;
  crit: boolean;
  hp: number;
  dead: boolean;
  knock: Knock | null;
  stun: number;
  chipT: number;
  trauma: number;
  tone: "hit" | "crit";
};

export function planHurt(opts: {
  kind: MonsterKind;
  hp: number;
  dmg: number;
  playerX: number;
  mobX: number;
  rng?: () => number;
  critRng?: () => number;
}): HurtPlan {
  const def = MONSTERS[opts.kind];
  const rng = opts.rng ?? Math.random;
  const crit = rollCrit(opts.critRng ?? rng);
  const rolled = Math.max(1, Math.round(rollStrike(opts.dmg, rng) * (crit ? CRIT_MULT : 1)));
  const hp = opts.hp - rolled;
  const tone = crit ? "crit" : "hit";
  const trauma = crit ? 0.34 : 0.2;
  if (hp <= 0) return { rolled, crit, hp, dead: true, knock: null, stun: 0, chipT: CHIP_HOLD, trauma, tone };
  const knock = mobHitKnock(opts.playerX, opts.mobX, def);
  return { rolled, crit, hp, dead: false, knock, stun: knock.stun, chipT: CHIP_HOLD, trauma, tone };
}

export type TouchPlan = {
  dmg: number;
  knock: Knock;
  invuln: number;
  trauma: number;
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
    trauma: 0.4,
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

export type BoltTouch = {
  hitIds: number[];
  dmg: number;
  stop: boolean;
};

export function planBoltTouch(opts: {
  hitIds: number[];
  uid: number;
  base: number;
  falloff: number;
  pierce: number;
  blockPierce: boolean;
}): BoltTouch | null {
  if (opts.hitIds.includes(opts.uid)) return null;
  const hitIds = [...opts.hitIds, opts.uid];
  const dmg = Math.max(0, opts.base * (1 - opts.falloff * (hitIds.length - 1)));
  const stop = opts.blockPierce || hitIds.length >= Math.max(1, opts.pierce);
  return { hitIds, dmg, stop };
}

export function chipOpen(chipT: number, hp: number, maxHp: number) {
  return chipT > 0 || hp < maxHp;
}

export function chipGeom(display: number, hitH: number) {
  const w = display >= 120 ? 72 : display >= 90 ? 52 : 40;
  return { w, h: 5, lift: hitH + 14 };
}

export function glimBurstCount(glims: number) {
  return Math.min(5, 1 + Math.floor(glims / 8));
}

export function shakePixels(trauma: number) {
  return trauma * trauma * 7;
}
