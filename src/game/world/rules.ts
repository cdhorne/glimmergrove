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
    prompt.startsWith("The Warden") ||
    prompt.startsWith("Rested") ||
    prompt.startsWith("Used") ||
    prompt === "Nothing to use"
  );
}
