import assert from "node:assert/strict";
import { test } from "node:test";
import { compare } from "./compare.ts";
import { collect } from "./collect.ts";
import { rarityFor, rollPiece } from "./roll.ts";
import { defaultEconomy } from "../economy.ts";
import type { Piece } from "./catalog.ts";

const rng = (() => {
  let i = 0;
  return () => {
    i = (i * 1103515245 + 12345) % 2147483648;
    return i / 2147483648;
  };
})();

test("rarity stays fragment-first", () => {
  assert.equal(rarityFor(0.5, false), null);
  assert.equal(rarityFor(0.1, false), "uncommon");
  assert.equal(rarityFor(0.01, false), "rare");
});

test("rolled pieces never share a property group", () => {
  const piece = rollPiece("reach", "rare", rng);
  const groups = piece.properties.map((p) => p.id);
  assert.equal(new Set(groups).size, groups.length);
  assert.ok(piece.properties.length >= 1);
});

test("worse pieces do not enter the tray", () => {
  const worn: Piece = {
    id: "a",
    baseId: "needle-arm",
    slot: "reach",
    rarity: "rare",
    aspects: ["tempo"],
    properties: [{ id: "tempo", value: 14, grade: "high" }],
  };
  const junk: Piece = {
    id: "b",
    baseId: "needle-arm",
    slot: "reach",
    rarity: "uncommon",
    aspects: ["tempo"],
    properties: [{ id: "tempo", value: 4, grade: "low" }],
  };
  assert.equal(compare(junk, worn), "worse");
  const eco = defaultEconomy();
  eco.loadout.reach = worn;
  const got = collect(eco, { kind: "piece", piece: junk });
  assert.equal(got.eco.tray.pieces.length, 0);
  assert.match(got.prompt, /dust/);
});
