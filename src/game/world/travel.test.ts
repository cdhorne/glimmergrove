import assert from "node:assert/strict";
import { test } from "node:test";
import { gapDeath, solidUnder, tickTravel } from "./travel.ts";

const idle = {
  moveX: 0,
  moveY: 0,
  jumpHeld: false,
  downHeld: false,
  interactHeld: false,
  justJump: false,
  justAttack: false,
  justSkill: false,
  justSkill2: false,
  justSkill3: false,
  justInteract: false,
  justInventory: false,
  justPause: false,
  justUse: false,
};

test("standing on a portal does not suck you through", () => {
  const idleNear = tickTravel(
    {
      mapId: "haven",
      playerX: 80,
      kills: 0,
      heartwoodOpen: false,
      prompt: null,
      portalLock: 0,
      portalDwell: 1,
    },
    0.3,
    idle,
  );
  assert.equal(idleNear.interact && idleNear.interact.to, "stinglane");
  assert.equal(idleNear.enter, undefined);
});

test("interact enters stinglane from the west gate", () => {
  const go = tickTravel(
    {
      mapId: "haven",
      playerX: 80,
      kills: 0,
      heartwoodOpen: false,
      prompt: null,
      portalLock: 0,
      portalDwell: 0,
    },
    0.016,
    { ...idle, justInteract: true },
  );
  assert.equal(go.enter, "stinglane");
});

test("spawn is not inside the stinglane gate", () => {
  const spawn = tickTravel(
    {
      mapId: "haven",
      playerX: 220,
      kills: 0,
      heartwoodOpen: false,
      prompt: null,
      portalLock: 0,
      portalDwell: 1,
    },
    0.3,
    { ...idle, justInteract: true },
  );
  assert.equal(spawn.interact, null);
  assert.equal(spawn.enter, undefined);
});

test("heartwood stays locked until kills or flag", () => {
  const locked = tickTravel(
    {
      mapId: "dewpath",
      playerX: 3120,
      kills: 2,
      heartwoodOpen: false,
      prompt: null,
      portalLock: 0,
      portalDwell: 1,
    },
    0.1,
    { ...idle, justInteract: true },
  );
  assert.match(locked.prompt ?? "", /Locked/);
  assert.equal(locked.enter, undefined);
});

test("gap and fall are deaths; floor is not", () => {
  assert.equal(gapDeath("haven", 200, 200, 200, 540), false);
  assert.equal(gapDeath("haven", 200, 600, 200, 540), true);
  assert.equal(gapDeath("dewpath", 980, 400, 510, 540), true);
});

test("solidUnder treats haven spawn dirt as ground and skips one-ways", () => {
  assert.equal(solidUnder("haven", 200), true);
});
