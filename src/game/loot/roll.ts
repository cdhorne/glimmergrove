import {
  BASES,
  PROPERTIES,
  gradeOf,
  type AspectId,
  type Piece,
  type Rarity,
  type RolledProperty,
  type SlotId,
} from "./catalog";

export type Rng = () => number;

export function rarityFor(roll: number, boss: boolean): Rarity | null {
  if (boss) {
    if (roll < 0.08) return "relic";
    if (roll < 0.45) return "rare";
    if (roll < 0.85) return "uncommon";
    return null;
  }
  if (roll < 0.02) return "rare";
  if (roll < 0.12) return "uncommon";
  return null;
}

export function countFor(rarity: Rarity) {
  if (rarity === "relic") return 3;
  if (rarity === "rare") return 2;
  return 1;
}

export function rollPiece(slot: SlotId, rarity: Rarity, rng: Rng): Piece {
  const pool = BASES.filter((b) => b.slot === slot);
  const def = pool[Math.floor(rng() * pool.length)] ?? BASES[0]!;
  const props = PROPERTIES.filter((p) => p.slots.includes(slot));
  const picked: RolledProperty[] = [];
  const used = new Set<string>();
  const n = Math.min(countFor(rarity), props.length);
  let guard = 0;
  while (picked.length < n && guard++ < 16) {
    const p = props[Math.floor(rng() * props.length)]!;
    if (used.has(p.group)) continue;
    used.add(p.group);
    const value = p.min + Math.floor(rng() * (p.max - p.min + 1));
    picked.push({ id: p.id, value, grade: gradeOf(value, p.min, p.max) });
  }
  const aspects = def.aspects.filter((a) => picked.some((pr) => pr.id === a) || rng() < 0.5) as AspectId[];
  const unique = Array.from(new Set(aspects.length ? aspects : def.aspects.slice(0, 1)));
  return {
    id: `${def.id}-${Math.floor(rng() * 1e9)}`,
    baseId: def.id,
    slot,
    rarity,
    aspects: unique,
    properties: picked,
  };
}
