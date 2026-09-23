import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HOLD_SKILL_MS,
  emptyTouch,
  loadMoveStyle,
  mapFlick,
  mergeDevice,
  padPressed,
  resolveHoldRelease,
  resolveVerbs,
  shouldShowOverlay,
} from "./scheme.ts";

test("hold under threshold is attack; at threshold is skill", () => {
  assert.equal(resolveHoldRelease(0), "none");
  assert.equal(resolveHoldRelease(HOLD_SKILL_MS - 1), "attack");
  assert.equal(resolveHoldRelease(HOLD_SKILL_MS), "skill");
  assert.equal(resolveHoldRelease(HOLD_SKILL_MS + 40), "skill");
});

test("flick up is jump, flick down is drop, tap is ignored", () => {
  assert.equal(mapFlick(0, -40, 120)?.justJump, true);
  assert.equal(mapFlick(0, 40, 120)?.downHeld, true);
  assert.equal(mapFlick(0, -10, 80), null);
  assert.equal(mapFlick(50, -10, 80), null);
  assert.equal(mapFlick(0, -80, 400), null);
});

test("verbs follow prompt, resource, and quick-use — not item flavor", () => {
  assert.deepEqual(resolveVerbs(null), { interact: false, skill: true, use: false });
  assert.equal(resolveVerbs({ prompt: "Talk" }).interact, true);
  assert.equal(resolveVerbs({ mp: 0, skillCost: 8, skillCd: 0 }).skill, false);
  assert.equal(resolveVerbs({ mp: 8, skillCost: 8, skillCd: 0 }).skill, true);
  assert.equal(resolveVerbs({ mp: 8, skillCost: 8, skillCd: 1 }).skill, false);
  assert.equal(resolveVerbs({ canUse: true }).use, true);
  assert.equal(resolveVerbs({ hp: 20, maxHp: 100 }).use, true);
  assert.equal(resolveVerbs({ hp: 90, maxHp: 100 }).use, false);
});

test("last active device wins", () => {
  assert.equal(mergeDevice("touch", "gamepad", true), "gamepad");
  assert.equal(mergeDevice("gamepad", "keyboard", true), "keyboard");
  assert.equal(mergeDevice("keyboard", "touch", false), "keyboard");
});

test("overlay hides for a pad; keyboard hides only on fine pointers", () => {
  assert.equal(shouldShowOverlay("gamepad", true), false);
  assert.equal(shouldShowOverlay("keyboard", false), false);
  assert.equal(shouldShowOverlay("keyboard", true), true);
  assert.equal(shouldShowOverlay("touch", true), true);
});

test("pad B is interact, not a second face button mash", () => {
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
  buttons[1] = { pressed: true };
  assert.equal(padPressed(buttons, 1), true);
  assert.equal(padPressed(buttons, 3), false);
  assert.equal(padPressed(buttons, [2, 5]), false);
  buttons[5] = { pressed: true };
  assert.equal(padPressed(buttons, [2, 5]), true);
});

test("reset touch zeros every flag including use", () => {
  const t = emptyTouch();
  assert.equal(t.use, false);
  assert.equal("potion" in t, false);
  assert.equal(t.moveX, 0);
});

test("unknown stored style falls back to ghost", () => {
  assert.equal(loadMoveStyle("veil"), "ghost");
  assert.equal(loadMoveStyle("well"), "well");
  assert.equal(loadMoveStyle(null), "ghost");
});
