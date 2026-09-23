/** Demo slice: bag yields, one digester load, one cover store, bloom flag, water lamp.
 * Load = scheduled eat. Gap loss fouls water unless covered. Store = cover / cistern.
 */

export type Yield = "feed" | "oil" | "bulk" | "ore" | "ash";

export const BAG_CAP = 12;

export type Bag = Record<Yield, number>;

export type EconomyState = {
  bag: Bag;
  stocks: Bag & { gas: number };
  built: { digester: 0 | 1; cover: 0 | 1 };
  flags: { bloom: 0 | 1 };
  waterOk: boolean;
  lostThisRun: { gapFeed: number };
};

export function emptyBag(): Bag {
  return { feed: 0, oil: 0, bulk: 0, ore: 0, ash: 0 };
}

export function defaultEconomy(): EconomyState {
  return {
    bag: emptyBag(),
    stocks: { ...emptyBag(), gas: 0 },
    built: { digester: 0, cover: 0 },
    flags: { bloom: 0 },
    waterOk: true,
    lostThisRun: { gapFeed: 0 },
  };
}

export function bagTotal(bag: Bag) {
  return bag.feed + bag.oil + bag.bulk + bag.ore + bag.ash;
}

export function addToBag(bag: Bag, kind: Yield, n: number): Bag {
  const next = { ...bag };
  const room = Math.max(0, BAG_CAP - bagTotal(next));
  next[kind] += Math.min(n, room);
  return next;
}

export function yieldOf(kind: string): Yield | null {
  if (kind === "dewslug" || kind === "capling" || kind === "bloom" || kind === "nettle") return "feed";
  if (kind === "stump" || kind === "bramble" || kind === "gorecap") return "bulk";
  return null;
}

export function depositBag(eco: EconomyState): EconomyState {
  const stocks = { ...eco.stocks };
  const bag = emptyBag();
  (Object.keys(eco.bag) as Yield[]).forEach((k) => {
    stocks[k] += eco.bag[k];
  });
  return { ...eco, bag, stocks };
}

export function build(eco: EconomyState, id: "digester" | "cover"): EconomyState {
  return { ...eco, built: { ...eco.built, [id]: 1 } };
}

export function runDigester(eco: EconomyState): EconomyState {
  if (!eco.built.digester) return eco;
  if (eco.stocks.feed < 3) return eco;
  return {
    ...eco,
    stocks: { ...eco.stocks, feed: eco.stocks.feed - 3, gas: eco.stocks.gas + 1 },
    flags: { bloom: 0 },
  };
}

export function tickSeason(eco: EconomyState): EconomyState {
  const lost = eco.lostThisRun.gapFeed;
  const effective = eco.built.cover ? Math.floor(lost * 0.3) : lost;
  const leftover = eco.stocks.feed + eco.bag.feed;
  const bloom: 0 | 1 = leftover >= 6 ? 1 : 0;
  const waterOk = eco.built.cover === 1 || effective === 0;
  return {
    ...eco,
    flags: { bloom },
    waterOk,
    lostThisRun: { gapFeed: 0 },
  };
}
