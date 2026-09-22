import assert from "node:assert/strict";
import { test } from "node:test";
import { mobHitKnock, playerHitKnock } from "./combat.ts";
import { stepMob } from "./mobs.ts";
import { PLAYER_KNOCK_X } from "./feel.ts";

test("slug slides farther than bramble; warden barely moves", () => {
  const slug = mobHitKnock(0, 40, { knockback: 1, mass: 1 });
  const bramble = mobHitKnock(0, 40, { knockback: 0.7, mass: 1.85 });
  const warden = mobHitKnock(0, 40, { knockback: 0.35, mass: 3.1 });
  assert.ok(slug.vx > bramble.vx);
  assert.ok(bramble.vx > warden.vx);
  assert.ok(warden.vx > 20 && warden.vx < 80, `warden ${warden.vx}`);
  assert.ok(slug.stun >= bramble.stun);
});

test("player is thrown away from the mob, not along facing", () => {
  const fromRight = playerHitKnock(100, 40);
  assert.equal(fromRight.vx, PLAYER_KNOCK_X);
  const fromLeft = playerHitKnock(40, 100);
  assert.equal(fromLeft.vx, -PLAYER_KNOCK_X);
});

test("hurt mobs do not write wander vx", () => {
  const stunned = stepMob({
    dt: 0.016,
    hurtT: 0.2,
    dir: 1,
    x: 100,
    y: 400,
    originX: 100,
    playerX: 200,
    playerY: 400,
    kind: "dewslug",
    speed: 42,
    grounded: true,
    groundAhead: true,
  });
  assert.equal(stunned.vx, null);
  assert.ok(stunned.hurtT < 0.2);

  const free = stepMob({
    dt: 0.016,
    hurtT: 0,
    dir: 1,
    x: 100,
    y: 400,
    originX: 100,
    playerX: 200,
    playerY: 400,
    kind: "dewslug",
    speed: 42,
    grounded: true,
    groundAhead: true,
  });
  assert.equal(free.vx, 42);
  assert.equal(free.dir, 1);
});
