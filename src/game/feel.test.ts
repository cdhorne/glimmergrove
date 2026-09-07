import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AIR_ACCEL,
  CHROME,
  GRAVITY_DOWN,
  GRAVITY_UP,
  GROUND_ACCEL,
  JUMP_V,
  computeStick,
  gravityForVy,
  jumpPeakPx,
  steerFor,
  visualBox,
} from "./feel.ts";

test("hop peaks in the Maple band, not the old float", () => {
  const peak = jumpPeakPx();
  assert.ok(peak >= 80 && peak <= 110, `peak ${peak}`);
  assert.ok(GRAVITY_DOWN > GRAVITY_UP, "fall harder than rise");
  assert.equal(gravityForVy(-10), GRAVITY_UP);
  assert.equal(gravityForVy(10), GRAVITY_DOWN);
  assert.ok(JUMP_V < 0);
});

test("air steer is at least as strong as ground so jump+attack can still turn", () => {
  const air = steerFor(false, 1);
  const ground = steerFor(true, 1);
  assert.equal(air.accelX, AIR_ACCEL);
  assert.equal(ground.accelX, GROUND_ACCEL);
  assert.ok(air.accelX >= ground.accelX);
  const idleAir = steerFor(false, 0);
  assert.equal(idleAir.accelX, 0);
  assert.ok(idleAir.dragX > 0);
});

test("stick origin-relative and capped", () => {
  const mid = computeStick(28, 0, 56);
  assert.ok(Math.abs(mid.moveX - 0.5) < 1e-9);
  assert.equal(mid.down, false);
  const far = computeStick(400, 400, 56);
  assert.ok(Math.hypot(far.nx, far.ny) <= 56 + 1e-6);
  const drop = computeStick(0, 50, 56);
  assert.equal(drop.down, true);
});

test("visualViewport pin follows the toolbar, not 100dvh", () => {
  const open = visualBox({ width: 844, height: 320, offsetLeft: 0, offsetTop: 70 }, { innerWidth: 844, innerHeight: 390 });
  assert.equal(open.y, 70);
  assert.equal(open.h, 320);
  assert.equal(open.orientation, "landscape");
  const portrait = visualBox(null, { innerWidth: 390, innerHeight: 844 });
  assert.equal(portrait.orientation, "portrait");
});

test("landscape chrome stays in the corners", () => {
  assert.ok(CHROME.landscapeStickW <= 0.34);
  assert.ok(CHROME.landscapeStickHPx <= 120);
  assert.ok(CHROME.landscapeJumpPx <= 56);
  assert.ok(CHROME.landscapeAttackPx <= 48);
});
