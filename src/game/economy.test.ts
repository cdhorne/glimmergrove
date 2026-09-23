import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addToBag,
  BAG_CAP,
  defaultEconomy,
  depositBag,
  yieldOf,
  runDigester,
  tickSeason,
  build,
} from "./economy.ts";

test("bag caps and names yields from kinds", () => {
  assert.equal(yieldOf("dewslug"), "feed");
  assert.equal(yieldOf("stump"), "bulk");
  assert.equal(yieldOf("warden"), null);
  const bag = addToBag(defaultEconomy().bag, "feed", 20);
  assert.equal(bag.feed, BAG_CAP);
});

test("deposit then digester clears bloom fuel", () => {
  let eco = defaultEconomy();
  eco = { ...eco, bag: addToBag(eco.bag, "feed", 8) };
  eco = depositBag(eco);
  assert.equal(eco.bag.feed, 0);
  assert.equal(eco.stocks.feed, 8);
  eco = build(eco, "digester");
  eco = runDigester(eco);
  assert.equal(eco.stocks.feed, 5);
  assert.equal(eco.stocks.gas, 1);
  eco = tickSeason(eco);
  assert.equal(eco.flags.bloom, 0);
  eco = { ...eco, stocks: { ...eco.stocks, feed: 6 }, bag: { ...eco.bag, feed: 0 } };
  eco = tickSeason(eco);
  assert.equal(eco.flags.bloom, 1);
});

test("cover forgives gap loss for water", () => {
  let eco = defaultEconomy();
  eco = { ...eco, lostThisRun: { gapFeed: 4 } };
  eco = tickSeason(eco);
  assert.equal(eco.waterOk, false);
  eco = build(eco, "cover");
  eco = { ...eco, lostThisRun: { gapFeed: 4 } };
  eco = tickSeason(eco);
  assert.equal(eco.waterOk, true);
});
