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
  ledgePx,
  ledgeY,
  GROUND_Y,
  steerFor,
  visualBox,
  knockVel,
  playerKnockVel,
  PLAYER_KNOCK_X,
} from "./feel.ts";

test("hop peaks in the Maple band, not the old float", () => {
  const peak = jumpPeakPx();
  assert.ok(peak >= 80 && peak <= 110, `peak ${peak}`);
  assert.ok(GRAVITY_DOWN > GRAVITY_UP, "fall harder than rise");
  assert.equal(gravityForVy(-10), GRAVITY_UP);
  assert.equal(gravityForVy(10), GRAVITY_DOWN);
  assert.ok(JUMP_V < 0);
});

test("one ledge is inside a single hop", () => {
  const hop = jumpPeakPx();
  const step = ledgePx();
  assert.ok(step < hop, `step ${step} vs hop ${hop}`);
  assert.ok(step * 2 > hop, "two steps need a mid ledge");
  assert.equal(ledgeY(0), GROUND_Y);
  assert.equal(ledgeY(1), GROUND_Y - step);
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

test("knockback shoves away and scales with mass", () => {
  const light = knockVel(1, 1, 1);
  const heavy = knockVel(1, 3, 1);
  assert.ok(light.vx > 0);
  assert.ok(light.vy < 0);
  assert.ok(heavy.vx < light.vx, "heavier travels less");
  assert.ok(heavy.stun > 0);
  const left = knockVel(-4, 1, 1);
  assert.ok(left.vx < 0);
});

test("player knock is a short stun, not a teleport", () => {
  const k = playerKnockVel(-1);
  assert.equal(k.vx, -PLAYER_KNOCK_X);
  assert.ok(k.vy < 0);
  assert.ok(k.stun > 0.1 && k.stun < 0.35);
});
