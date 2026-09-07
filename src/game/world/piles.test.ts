import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEconomy } from "../economy.ts";
import { dumpKind, grantPile, shouldSpawn, skinFor } from "./piles.ts";

test("bloom slots stay off until the flag is on", () => {
  const slot = { kind: "bloom", when: "bloom" as const };
  assert.equal(shouldSpawn(slot, { bloom: 0 }, false), false);
  assert.equal(shouldSpawn(slot, { bloom: 1 }, false), true);
  assert.equal(shouldSpawn({ kind: "dewslug" }, { bloom: 0 }, false), true);
  assert.equal(shouldSpawn({ kind: "warden" }, { bloom: 0 }, true), false);
});

test("grantPile caps and pit-drips overflow Feed", () => {
  const eco = defaultEconomy();
  const once = grantPile(eco, "feed", 12);
  assert.equal(once.eco.bag.feed, 12);
  const drip = grantPile(eco, "feed", 2);
  assert.match(drip.prompt, /drip/);
  assert.equal(eco.lostThisRun.pitFeed, 2);
});

test("skin and dump stay kind-keyed", () => {
  assert.equal(skinFor("bloom"), "dewslug");
  assert.equal(skinFor("stump"), "capling");
  const eco = defaultEconomy();
  dumpKind(eco, "dewslug");
  assert.equal(eco.lostThisRun.pitFeed, 1);
  dumpKind(eco, "warden");
  assert.equal(eco.lostThisRun.pitFeed, 1);
});
