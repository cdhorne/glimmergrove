import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEconomy } from "../economy.ts";
import { dumpKind, grantPile, planKill, shouldSpawn, skinFor } from "./piles.ts";

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

test("planKill always bags fragments and rarely a piece", () => {
  const never = () => 0.99;
  const always = (() => {
    let n = 0;
    return () => {
      n += 1;
      return n === 1 ? 0.01 : 0.2;
    };
  })();
  const miss = planKill(defaultEconomy(), "dewslug", never);
  assert.equal(miss.eco.bag.feed, 1);
  assert.equal(miss.eco.tray.pieces.length, 0);
  const hit = planKill(defaultEconomy(), "dewslug", always);
  assert.equal(hit.eco.bag.feed, 1);
  assert.equal(hit.eco.tray.pieces.length, 1);
  assert.equal(hit.eco.tray.pieces[0]?.slot, "reach");
});
