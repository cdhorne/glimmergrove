/**
 * Pile rules. Pure. Call only from world/install.ts (scene) and yard-panel (React).
 * Do not call from combat, input, or feel.
 */
import {
  BAG_CAP,
  bagTotal,
  pileOf,
  type EconomyState,
  type Pile,
} from "../economy";
import { collect } from "../loot/collect";
import { rarityFor, rollPiece } from "../loot/roll";
import type { SlotId } from "../loot/catalog";

export type SpawnSlot = { kind: string; when?: "bloom" };

export function shouldSpawn(
  slot: SpawnSlot,
  flags: { bloom: number },
  wardenDown: boolean,
): boolean {
  if (slot.kind === "warden" && wardenDown) return false;
  if (slot.when === "bloom" && flags.bloom < 1) return false;
  return true;
}

export function skinFor(kind: string): string {
  if (kind === "bloom") return "dewslug";
  if (kind === "stump") return "capling";
  if (kind === "bramble") return "warden";
  return kind;
}

export function pileAmount(kind: string): number {
  if (kind === "bloom") return 3;
  if (kind === "stump") return 2;
  if (kind === "bramble") return 2;
  return 1;
}

export function grantPile(
  eco: EconomyState,
  pile: Pile,
  n: number,
): { eco: EconomyState; prompt: string } {
  const { eco: next, prompt } = collect(eco, { kind: "fragment", pile, n });
  Object.assign(eco, next);
  if (prompt.startsWith("Bag +")) {
    return { eco, prompt: `${prompt}  (${bagTotal(eco.bag)}/${BAG_CAP})` };
  }
  return { eco, prompt };
}

export function slotFor(kind: string): SlotId {
  if (kind === "warden" || kind === "bramble") return "core";
  if (kind === "capling" || kind === "stump") return "anchor";
  return "reach";
}

/** Live drop plan. Fragments always. A piece only when rarity hits and it is not worse. */
export function planKill(
  eco: EconomyState,
  kind: string,
  rng: () => number,
): { eco: EconomyState; prompt: string } {
  const pile = pileOf(kind);
  let next = eco;
  let prompt = "";
  if (pile) {
    const granted = grantPile(next, pile, pileAmount(kind));
    next = granted.eco;
    prompt = granted.prompt;
  }
  const rarity = rarityFor(rng(), kind === "warden");
  if (!rarity) return { eco: next, prompt };
  const piece = rollPiece(slotFor(kind), rarity, rng);
  const got = collect(next, { kind: "piece", piece });
  return { eco: got.eco, prompt: got.prompt === "Left as dust" ? prompt : got.prompt };
}

export function dumpKind(eco: EconomyState, kind: string): EconomyState {
  if (pileOf(kind) === "feed") eco.lostThisRun.pitFeed += 1;
  return eco;
}

export function hudEconomy(eco: EconomyState | undefined) {
  return {
    bagFeed: eco?.bag.feed ?? 0,
    bagBulk: eco?.bag.bulk ?? 0,
    waterOk: eco?.waterOk ?? true,
    bloom: eco?.flags.bloom ?? 0,
    trayPieces: eco?.tray.pieces.length ?? 0,
  };
}
