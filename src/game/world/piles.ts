/**
 * Pile rules. Pure. Call only from world/install.ts (scene) and yard-panel (React).
 * Do not call from combat, input, or feel.
 */
import {
  addToBag,
  BAG_CAP,
  bagTotal,
  pileOf,
  type EconomyState,
  type Pile,
} from "../economy";

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
  return kind;
}

export function pileAmount(kind: string): number {
  if (kind === "bloom") return 3;
  if (kind === "stump") return 2;
  return 1;
}

export function grantPile(
  eco: EconomyState,
  pile: Pile,
  n: number,
): { eco: EconomyState; prompt: string } {
  const next = addToBag(eco.bag, pile, n);
  const gained = next[pile] - eco.bag[pile];
  eco.bag = next;
  if (gained < n) {
    if (pile === "feed") eco.lostThisRun.pitFeed += n - gained;
    return { eco, prompt: "Bag full — drip" };
  }
  return { eco, prompt: `Bag +${gained} ${pile}  (${bagTotal(eco.bag)}/${BAG_CAP})` };
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
  };
}
