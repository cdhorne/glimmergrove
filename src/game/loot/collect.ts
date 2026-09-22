/** Live collect. Fragments merge. Pieces land in the tray. No attune here. */
import { addToBag, type EconomyState, type Pile } from "../economy";
import { compare } from "./compare";
import type { Piece } from "./catalog";

export type WorldItem =
  | { kind: "fragment"; pile: Pile; n: number }
  | { kind: "piece"; piece: Piece };

export function collect(
  eco: EconomyState,
  item: WorldItem,
): { eco: EconomyState; prompt: string; consumed: boolean } {
  if (item.kind === "fragment") {
    const nextBag = addToBag(eco.bag, item.pile, item.n);
    const gained = nextBag[item.pile] - eco.bag[item.pile];
    const next = { ...eco, bag: nextBag };
    if (gained < item.n) {
      if (item.pile === "feed") next.lostThisRun = { pitFeed: eco.lostThisRun.pitFeed + (item.n - gained) };
      return { eco: next, prompt: "Bag full — drip", consumed: gained > 0 };
    }
    return { eco: next, prompt: `Bag +${gained} ${item.pile}`, consumed: true };
  }

  const worn = eco.loadout[item.piece.slot];
  if (worn && compare(item.piece, worn) === "worse") {
    return { eco, prompt: "Left as dust", consumed: true };
  }

  return {
    eco: { ...eco, tray: { pieces: [...eco.tray.pieces, item.piece] } },
    prompt: `${item.piece.rarity} ${item.piece.slot}`,
    consumed: true,
  };
}
