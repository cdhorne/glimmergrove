import assert from "node:assert/strict";
import { test } from "node:test";
import { boltSpec, inStrikeLane, planHurt, planTouch, rollStrike, strikeReach } from "./combat-run.ts";
import { JOBS } from "../content.ts";
import { PLAYER_KNOCK_X } from "../feel.ts";

test("rollStrike stays in the 85–115% band and never zero", () => {
  assert.equal(rollStrike(10, () => 0), 9);
  assert.equal(rollStrike(10, () => 1), 12);
  assert.equal(rollStrike(1, () => 0), 1);
});

test("planHurt knocks a live slug and skips knock on a kill", () => {
  const live = planHurt({ kind: "dewslug", hp: 28, dmg: 10, playerX: 0, mobX: 40, rng: () => 0.5 });
  assert.equal(live.dead, false);
  assert.ok(live.knock && live.knock.vx > 0);
  const kill = planHurt({ kind: "dewslug", hp: 4, dmg: 20, playerX: 0, mobX: 40, rng: () => 0.5 });
  assert.equal(kill.dead, true);
  assert.equal(kill.knock, null);
});

test("planTouch uses contact floor and throws the player away from the mob", () => {
  assert.equal(planTouch({ kind: "dewslug", def: 10, playerX: 100, mobX: 40, invuln: 1, dead: false }), null);
  const hit = planTouch({ kind: "nettle", def: 10, playerX: 100, mobX: 40, invuln: 0, dead: false });
  assert.ok(hit);
  assert.equal(hit!.dmg, 24);
  assert.equal(hit!.knock.vx, PLAYER_KNOCK_X);
});

test("weaver and ranger strikes have a lane even when content reach is 0", () => {
  assert.ok(strikeReach(JOBS.weaver.attack) >= 200);
  assert.ok(strikeReach(JOBS.ranger.attack) >= 200);
  assert.equal(strikeReach(JOBS.guardian.attack), 70);
});

test("a slug in front of the guardian is in the lane", () => {
  assert.equal(
    inStrikeLane({ playerX: 100, playerY: 400, facing: 1, mobX: 150, mobY: 400, hitW: 54, reach: 70 }),
    true,
  );
  assert.equal(
    inStrikeLane({ playerX: 100, playerY: 400, facing: 1, mobX: 400, mobY: 400, hitW: 54, reach: 70 }),
    false,
  );
});

test("mage and archer fire visible bolts; fighter does not", () => {
  const orb = boltSpec(JOBS.weaver.attack);
  const volley = boltSpec(JOBS.weaver.skill);
  assert.equal(orb?.key, "orb");
  assert.equal(volley?.shots, 3);
  assert.equal(boltSpec(JOBS.ranger.attack)?.key, "arrow");
  assert.equal(boltSpec(JOBS.guardian.attack), null);
});
