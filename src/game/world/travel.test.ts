import assert from "node:assert/strict";
import { test } from "node:test";
import { pitDeath, tickTravel } from "./travel.ts";

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

test("haven stinglane portal is unlocked and dwell-enters", () => {
  const first = tickTravel(
    {
      mapId: "haven",
      playerX: 380,
      kills: 0,
      heartwoodOpen: false,
      prompt: null,
      portalLock: 0,
      portalDwell: 0,
    },
    0.3,
    idle,
  );
  assert.equal(first.interact?.to, "stinglane");
  assert.equal(first.enter, "stinglane");
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

test("pit and fall are deaths; floor is not", () => {
  assert.equal(pitDeath("haven", 200, 200, 200, 540), false);
  assert.equal(pitDeath("haven", 200, 600, 200, 540), true);
  assert.equal(pitDeath("dewpath", 980, 400, 510, 540), true);
});
