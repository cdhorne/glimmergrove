import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEconomy } from "../economy.ts";
import { loseToGap, grantHarvest, shouldSpawn, skinFor } from "./harvest.ts";

test("bloom slots stay off until the flag is on", () => {
  const slot = { kind: "bloom", when: "bloom" as const };
  assert.equal(shouldSpawn(slot, { bloom: 0 }, false), false);
  assert.equal(shouldSpawn(slot, { bloom: 1 }, false), true);
  assert.equal(shouldSpawn({ kind: "dewslug" }, { bloom: 0 }, false), true);
  assert.equal(shouldSpawn({ kind: "warden" }, { bloom: 0 }, true), false);
});

test("grantHarvest caps and drips overflow Feed into the gap ledger", () => {
  const eco = defaultEconomy();
  const once = grantHarvest(eco, "feed", 12);
  assert.equal(once.eco.bag.feed, 12);
  const drip = grantHarvest(eco, "feed", 2);
  assert.match(drip.prompt, /drip/);
  assert.equal(eco.lostThisRun.gapFeed, 2);
});

test("skin and gap loss stay kind-keyed", () => {
  assert.equal(skinFor("bloom"), "dewslug");
  assert.equal(skinFor("stump"), "capling");
  const eco = defaultEconomy();
  loseToGap(eco, "dewslug");
  assert.equal(eco.lostThisRun.gapFeed, 1);
  loseToGap(eco, "warden");
  assert.equal(eco.lostThisRun.gapFeed, 1);
});
