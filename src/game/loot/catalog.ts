export type SlotId = "core" | "reach" | "anchor";
export type AspectId = "ward" | "swift" | "tempo" | "pierce";
export type Rarity = "common" | "uncommon" | "rare" | "relic";
export type Grade = "low" | "mid" | "high";

export type PropertyDef = {
  id: string;
  group: string;
  slots: SlotId[];
  min: number;
  max: number;
};

export type BaseDef = {
  id: string;
  slot: SlotId;
  implicit: string;
  aspects: AspectId[];
};

export const PROPERTIES: PropertyDef[] = [
  { id: "ward", group: "guard", slots: ["core", "anchor"], min: 4, max: 14 },
  { id: "swift", group: "motion", slots: ["reach", "anchor"], min: 4, max: 14 },
  { id: "tempo", group: "pace", slots: ["reach", "core"], min: 4, max: 14 },
  { id: "pierce", group: "edge", slots: ["reach"], min: 3, max: 12 },
];

export const BASES: BaseDef[] = [
  { id: "heartwood-plate", slot: "core", implicit: "hold", aspects: ["ward"] },
  { id: "needle-arm", slot: "reach", implicit: "strike", aspects: ["tempo", "pierce"] },
  { id: "root-weight", slot: "anchor", implicit: "plant", aspects: ["swift", "ward"] },
];

export type RolledProperty = {
  id: string;
  value: number;
  grade: Grade;
};

export type Piece = {
  id: string;
  baseId: string;
  slot: SlotId;
  rarity: Rarity;
  aspects: AspectId[];
  properties: RolledProperty[];
};

export function gradeOf(value: number, min: number, max: number): Grade {
  if (max <= min) return "mid";
  const t = (value - min) / (max - min);
  if (t < 0.34) return "low";
  if (t < 0.67) return "mid";
  return "high";
}

export function property(id: string) {
  return PROPERTIES.find((p) => p.id === id);
}

export function base(id: string) {
  return BASES.find((b) => b.id === id);
}
