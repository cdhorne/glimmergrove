import assert from "node:assert/strict";
import { test } from "node:test";
import { buyNode, clusterOpen, emptyBoard } from "./board.ts";
import { attune } from "./slots.ts";
import { defaultEconomy } from "../economy.ts";
import type { Piece } from "../loot/catalog.ts";

test("clusters stay dark without the aspect", () => {
  assert.equal(clusterOpen([], "tempo"), false);
  assert.equal(clusterOpen(["tempo"], "tempo"), true);
  const closed = buyNode(emptyBoard(), "tempo-1", []);
  assert.deepEqual(closed.bought, []);
  const open = buyNode({ points: 2, bought: [] }, "tempo-1", ["tempo"]);
  assert.deepEqual(open.bought, ["tempo-1"]);
  assert.equal(open.points, 1);
});

test("attune swaps the worn piece back into the tray", () => {
  const first: Piece = {
    id: "1",
    baseId: "needle-arm",
    slot: "reach",
    rarity: "uncommon",
    aspects: ["tempo"],
    properties: [{ id: "tempo", value: 8, grade: "mid" }],
  };
  const second: Piece = { ...first, id: "2", rarity: "rare" };
  let eco = defaultEconomy();
  eco.tray.pieces = [first, second];
  eco = attune(eco, "1", "reach");
  assert.equal(eco.loadout.reach?.id, "1");
  eco = attune(eco, "2", "reach");
  assert.equal(eco.loadout.reach?.id, "2");
  assert.equal(eco.tray.pieces.some((p) => p.id === "1"), true);
});
