/** Hit resolution. Scene applies the returned impulse; this file stays Phaser-free. */

import { knockAway, knockVel, playerKnockVel, type Knock } from "./feel.ts";

export type Knockable = {
  knockback: number;
  mass?: number;
};

export function mobHitKnock(attackerX: number, targetX: number, def: Knockable): Knock {
  const power = Math.max(0.35, def.knockback);
  const mass = def.mass ?? (def.knockback > 0 ? 1 / def.knockback : 3);
  return knockVel(knockAway(attackerX, targetX), mass, power);
}

export function playerHitKnock(playerX: number, mobX: number): Knock {
  return playerKnockVel(knockAway(mobX, playerX));
}
