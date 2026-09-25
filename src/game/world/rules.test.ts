import assert from "node:assert/strict";
import { test } from "node:test";
import { applyUse, canShowUse, contactDamage, grantXp, keepWorldPrompt, portalLocked } from "./rules.ts";

test("dewslug cannot chip a guardian below the floor; nettles punch through def", () => {
  assert.equal(contactDamage(8, 10), 3);
  assert.equal(contactDamage(11, 10), 3);
  assert.equal(contactDamage(16, 10), 6);
  assert.equal(contactDamage(34, 10), 24);
  assert.equal(contactDamage(26, 10), 16);
  assert.equal(contactDamage(34, 4), 30);
});

test("use pip at 40% and heal is a fraction of max, never overheal", () => {
  assert.equal(canShowUse(128, 128), false);
  assert.equal(canShowUse(52, 128), false);
  assert.equal(canShowUse(51, 128), true);
  const full = applyUse(128, 128);
  assert.equal(full.ok, false);
  const mid = applyUse(40, 128);
  assert.equal(mid.ok, true);
  if (mid.ok) {
    assert.equal(mid.gained, Math.max(18, Math.round(128 * 0.28)));
    assert.equal(mid.hp, 40 + mid.gained);
  }
  const almost = applyUse(120, 128);
  assert.equal(almost.ok, true);
  if (almost.ok) {
    assert.equal(almost.hp, 128);
    assert.equal(almost.gained, 8);
  }
});

test("heartwood gate and sticky prompts", () => {
  assert.equal(portalLocked(3, 8, false), true);
  assert.equal(portalLocked(8, 8, false), false);
  assert.equal(portalLocked(0, 8, true), false);
  assert.equal(portalLocked(0, undefined, false), false);
  assert.equal(keepWorldPrompt("Used \u00b7 +36 HP"), true);
  assert.equal(keepWorldPrompt("The boss is down"), true);
  assert.equal(keepWorldPrompt("Walk in  \u00b7  Field"), false);
});

test("grantXp banks leftover and flags a level", () => {
  const nextAt = (level) => 10 * level;
  const mid = grantXp({ exp: 4, level: 1, amount: 3, nextAt });
  assert.equal(mid.leveled, false);
  assert.equal(mid.exp, 7);
  const up = grantXp({ exp: 8, level: 1, amount: 5, nextAt });
  assert.equal(up.leveled, true);
  assert.equal(up.level, 2);
  assert.equal(up.exp, 3);
});
