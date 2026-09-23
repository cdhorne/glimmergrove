import assert from "node:assert/strict";
import { test } from "node:test";
import { isBossKind, skinFor, skinLook } from "./skin.ts";

test("extra kinds reuse base sheets", () => {
  assert.equal(skinFor("dewslug"), "dewslug");
  assert.equal(skinFor("bloom"), "dewslug");
  assert.equal(skinFor("stump"), "capling");
  assert.equal(skinFor("nettle"), "capling");
  assert.equal(skinFor("bramble"), "warden");
  assert.equal(skinFor("gorecap"), "warden");
});

test("boss kind and looks stay explicit", () => {
  assert.equal(isBossKind("warden"), true);
  assert.equal(isBossKind("gorecap"), false);
  assert.equal(skinLook("warden").scale, 0.5);
  assert.equal(skinLook("nettle").tint, 0xc45c4a);
});
