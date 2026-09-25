/** Pure world rules. No Phaser. Scene applies the result. */

export function contactDamage(atk: number, def: number, floor = 3) {
  return Math.max(floor, atk - def);
}

export function canShowUse(hp: number, maxHp: number) {
  return maxHp > 0 && hp / maxHp <= 0.4;
}

export type UseResult =
  | { ok: false; reason: "full"; hp: number; gained: 0 }
  | { ok: true; hp: number; gained: number };

export function applyUse(hp: number, maxHp: number, ratio = 0.28, minHeal = 18): UseResult {
  if (hp >= maxHp) return { ok: false, reason: "full", hp, gained: 0 };
  const heal = Math.max(minHeal, Math.round(maxHp * ratio));
  const next = Math.min(maxHp, hp + heal);
  return { ok: true, hp: next, gained: next - hp };
}

export function portalLocked(kills: number, need: number | undefined, unlocked: boolean) {
  return Boolean(need && kills < need && !unlocked);
}

export function keepWorldPrompt(prompt: string | null) {
  if (!prompt) return false;
  return (
    prompt.startsWith("Found") ||
    prompt.startsWith("The boss") ||
    prompt.startsWith("Rested") ||
    prompt.startsWith("Used") ||
    prompt === "Nothing to use"
  );
}

export type XpPlan = {
  exp: number;
  level: number;
  leveled: boolean;
};

export function grantXp(opts: {
  exp: number;
  level: number;
  amount: number;
  nextAt: (level: number) => number;
}): XpPlan {
  let exp = opts.exp + opts.amount;
  let level = opts.level;
  let leveled = false;
  let next = opts.nextAt(level);
  while (exp >= next) {
    exp -= next;
    level += 1;
    next = opts.nextAt(level);
    leveled = true;
  }
  return { exp, level, leveled };
}
