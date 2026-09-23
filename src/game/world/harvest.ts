/** Harvest rules. Pure. Scene and yard call these; combat/input/feel do not. */
import {
  addToBag,
  BAG_CAP,
  bagTotal,
  yieldOf,
  type EconomyState,
  type Yield,
} from "../economy.ts";
import { isBossKind } from "../skin.ts";

export type SpawnSlot = { kind: string; when?: "bloom" };

export { skinFor } from "../skin.ts";

export function shouldSpawn(
  slot: SpawnSlot,
  flags: { bloom: number },
  wardenDown: boolean,
): boolean {
  if (isBossKind(slot.kind) && wardenDown) return false;
  if (slot.when === "bloom" && flags.bloom < 1) return false;
  return true;
}

export function harvestAmount(kind: string): number {
  if (kind === "bloom") return 3;
  if (kind === "stump" || kind === "gorecap") return 2;
  if (kind === "bramble" || kind === "nettle") return 2;
  return 1;
}

export function grantHarvest(
  eco: EconomyState,
  kind: Yield,
  n: number,
): { eco: EconomyState; prompt: string } {
  const next = addToBag(eco.bag, kind, n);
  const gained = next[kind] - eco.bag[kind];
  eco.bag = next;
  if (gained < n) {
    if (kind === "feed") eco.lostThisRun.gapFeed += n - gained;
    return { eco, prompt: "Bag full — drip" };
  }
  return { eco, prompt: `Bag +${gained} ${kind}  (${bagTotal(eco.bag)}/${BAG_CAP})` };
}

export function loseToGap(eco: EconomyState, kind: string): EconomyState {
  if (yieldOf(kind) === "feed") eco.lostThisRun.gapFeed += 1;
  return eco;
}

export function hudHarvest(eco: EconomyState | undefined) {
  return {
    bagFeed: eco?.bag.feed ?? 0,
    bagBulk: eco?.bag.bulk ?? 0,
    waterOk: eco?.waterOk ?? true,
    bloom: eco?.flags.bloom ?? 0,
  };
}
