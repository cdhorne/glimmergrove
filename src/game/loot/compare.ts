import { property, type Piece } from "./catalog";

export type Verdict = "upgrade" | "sidegrade" | "worse";

function score(piece: Piece) {
  const rarityBias = { common: 0, uncommon: 2, rare: 6, relic: 12 }[piece.rarity];
  const grades = piece.properties.reduce((sum, p) => {
    const def = property(p.id);
    if (!def) return sum;
    return sum + (p.value - def.min) / Math.max(1, def.max - def.min);
  }, 0);
  return rarityBias + grades;
}

export function compare(next: Piece, current: Piece | null): Verdict {
  if (!current) return "upgrade";
  if (next.slot !== current.slot) return "sidegrade";
  const groups = (p: Piece) => p.properties.map((x) => property(x.id)?.group).sort().join(",");
  const delta = score(next) - score(current);
  if (groups(next) !== groups(current) && Math.abs(delta) <= 1.2) return "sidegrade";
  return delta > 0.15 ? "upgrade" : "worse";
}
