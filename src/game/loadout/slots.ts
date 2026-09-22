/** Parked only. */
import type { Piece, SlotId } from "../loot/catalog";
import type { EconomyState } from "../economy";

export function attune(eco: EconomyState, pieceId: string, slot: SlotId): EconomyState {
  const piece = eco.tray.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.slot !== slot) return eco;
  const previous = eco.loadout[slot];
  const pieces = eco.tray.pieces.filter((p) => p.id !== pieceId);
  if (previous) pieces.push(previous);
  return {
    ...eco,
    tray: { pieces },
    loadout: { ...eco.loadout, [slot]: piece },
  };
}

export function wornAspects(eco: EconomyState): string[] {
  const slots: SlotId[] = ["core", "reach", "anchor"];
  return slots.flatMap((s) => eco.loadout[s]?.aspects ?? []);
}
