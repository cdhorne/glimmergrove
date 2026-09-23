import assert from "node:assert/strict";
import { test } from "node:test";
import { stepMob } from "./mobs.ts";

const base = {
  dt: 0.016,
  hurtT: 0,
  dir: -1,
  x: 40,
  y: 400,
  originX: 200,
  playerX: 20,
  playerY: 400,
  kind: "nettle",
  speed: 92,
  grounded: true,
  groundAhead: true,
  mapW: 1680,
};

test("mobs on the left edge turn right instead of walking off", () => {
  const next = stepMob(base);
  assert.equal(next.dir, 1);
  assert.ok((next.vx ?? 0) > 0);
  assert.equal(next.pinX, 48);
});

test("stun does not write walk vx", () => {
  const next = stepMob({ ...base, hurtT: 0.2, x: 200 });
  assert.equal(next.vx, null);
});
