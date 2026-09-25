import assert from "node:assert/strict";
import { test } from "node:test";
import {
  boltSpec,
  chipGeom,
  chipOpen,
  glimBurstCount,
  inStrikeLane,
  planBoltTouch,
  planHurt,
  planTouch,
  rollCrit,
  rollStrike,
  shakePixels,
  strikeReach,
} from "./combat-run.ts";
import { JOBS } from "../content.ts";
import { PLAYER_KNOCK_X } from "../feel.ts";

test("rollStrike stays in the 85-115% band and never zero", () => {
  assert.equal(rollStrike(10, () => 0), 9);
  assert.equal(rollStrike(10, () => 1), 12);
  assert.equal(rollStrike(1, () => 0), 1);
});

test("crits only below the 12% line", () => {
  assert.equal(rollCrit(() => 0.11), true);
  assert.equal(rollCrit(() => 0.12), false);
});

test("planHurt knocks a live slug and skips knock on a kill", () => {
  const live = planHurt({ kind: "dewslug", hp: 28, dmg: 10, playerX: 0, mobX: 40, rng: () => 0.5, critRng: () => 1 });
  assert.equal(live.dead, false);
  assert.equal(live.crit, false);
  assert.equal(live.tone, "hit");
  assert.ok(live.knock && live.knock.vx > 0);
  assert.ok(live.chipT > 0);
  const kill = planHurt({ kind: "dewslug", hp: 4, dmg: 20, playerX: 0, mobX: 40, rng: () => 0.5, critRng: () => 1 });
  assert.equal(kill.dead, true);
  assert.equal(kill.knock, null);
});

test("planTouch uses contact floor and throws the player away from the mob", () => {
  assert.equal(planTouch({ kind: "dewslug", def: 10, playerX: 100, mobX: 40, invuln: 1, dead: false }), null);
  const hit = planTouch({ kind: "nettle", def: 10, playerX: 100, mobX: 40, invuln: 0, dead: false });
  assert.ok(hit);
  assert.equal(hit.dmg, 24);
  assert.equal(hit.knock.vx, PLAYER_KNOCK_X);
  assert.equal(hit.trauma, 0.4);
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
  assert.equal(orb && orb.key, "orb");
  assert.equal(volley && volley.shots, 3);
  assert.equal(boltSpec(JOBS.ranger.attack) && boltSpec(JOBS.ranger.attack).key, "arrow");
  assert.equal(boltSpec(JOBS.guardian.attack), null);
});

test("bolts skip a body they already tagged, fall off, and stop on a blocker", () => {
  const first = planBoltTouch({ hitIds: [], uid: 1, base: 10, falloff: 0.2, pierce: 2, blockPierce: false });
  assert.deepEqual(first, { hitIds: [1], dmg: 10, stop: false });
  const again = planBoltTouch({ hitIds: [1], uid: 1, base: 10, falloff: 0.2, pierce: 2, blockPierce: false });
  assert.equal(again, null);
  const second = planBoltTouch({ hitIds: [1], uid: 2, base: 10, falloff: 0.2, pierce: 2, blockPierce: false });
  assert.equal(second && second.dmg, 8);
  assert.equal(second && second.stop, true);
  const boss = planBoltTouch({ hitIds: [], uid: 9, base: 10, falloff: 0, pierce: 6, blockPierce: true });
  assert.equal(boss && boss.stop, true);
});

test("chip stays up while hurt or below max, and scales with display", () => {
  assert.equal(chipOpen(0, 28, 28), false);
  assert.equal(chipOpen(1, 28, 28), true);
  assert.equal(chipOpen(0, 10, 28), true);
  assert.equal(chipGeom(168, 132).w, 72);
  assert.equal(chipGeom(70, 42).w, 40);
  assert.equal(glimBurstCount(6), 1);
  assert.equal(glimBurstCount(80), 5);
  assert.equal(shakePixels(1), 7);
  assert.equal(shakePixels(0), 0);
});
