/** Hit plans the scene applies. No Phaser. */
import { MONSTERS, type MonsterKind } from "../content.ts";
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
