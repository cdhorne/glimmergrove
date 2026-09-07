const keys = new Set<string>();
const injected = new Set<string>();

export const touch = {
  moveX: 0,
  moveY: 0,
  jump: false,
  attack: false,
  skill: false,
  skill2: false,
  skill3: false,
  interact: false,
  down: false,
  potion: false,
};

const prev = {
  jump: false,
  attack: false,
  skill: false,
  skill2: false,
  skill3: false,
  interact: false,
  inventory: false,
  pause: false,
  potion: false,
};

export type ActionFrame = {
  moveX: number;
  moveY: number;
  jumpHeld: boolean;
  downHeld: boolean;
  interactHeld: boolean;
  justJump: boolean;
  justAttack: boolean;
  justSkill: boolean;
  justSkill2: boolean;
  justSkill3: boolean;
  justInteract: boolean;
  justInventory: boolean;
  justPause: boolean;
  justPotion: boolean;
};

function held(code: string) {
  return keys.has(code) || injected.has(code);
}

function deadzone(v: number, z = 0.22) {
  if (Math.abs(v) < z) return 0;
  const s = Math.sign(v);
  return s * Math.min(1, (Math.abs(v) - z) / (1 - z));
}

function sampleGamepad() {
  const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
  let moveX = 0;
  let moveY = 0;
  let jump = false;
  let attack = false;
  let skill = false;
  let skill2 = false;
  let skill3 = false;
  let interact = false;
  let down = false;
  let inventory = false;
  let pause = false;
  let potion = false;
  for (const pad of pads) {
    if (!pad) continue;
    const ax = pad.axes;
    moveX += deadzone(ax[0] ?? 0);
    moveY += deadzone(ax[1] ?? 0);
    const b = pad.buttons;
    const press = (i: number) => Boolean(b[i]?.pressed);
    // Standard mapping: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 8 select, 9 start, 12–15 dpad
    jump = jump || press(0);
    attack = attack || press(2) || press(5);
    skill = skill || press(3);
    skill2 = skill2 || press(1);
    skill3 = skill3 || press(4);
    interact = interact || press(1) && !press(3);
    down = down || press(13) || (ax[1] ?? 0) > 0.55;
    inventory = inventory || press(8);
    pause = pause || press(9);
    potion = potion || press(6);
    if (press(14)) moveX -= 1;
    if (press(15)) moveX += 1;
    if (press(12)) moveY -= 1;
  }
  return {
    moveX: Math.max(-1, Math.min(1, moveX)),
    moveY: Math.max(-1, Math.min(1, moveY)),
    jump,
    attack,
    skill,
    skill2,
    skill3,
    interact,
    down,
    inventory,
    pause,
    potion,
  };
}

export function sampleActions(): ActionFrame {
  const pad = sampleGamepad();
  const left = held("KeyA") || held("ArrowLeft") || touch.moveX < -0.3 || pad.moveX < -0.3;
  const right = held("KeyD") || held("ArrowRight") || touch.moveX > 0.3 || pad.moveX > 0.3;
  let moveX = 0;
  if (left) moveX -= 1;
  if (right) moveX += 1;
  if (!left && !right) {
    moveX = Math.abs(touch.moveX) >= Math.abs(pad.moveX) ? touch.moveX : pad.moveX;
  }
  moveX = Math.max(-1, Math.min(1, moveX));

  const moveY = Math.max(-1, Math.min(1, touch.moveY + pad.moveY + (held("KeyW") || held("ArrowUp") ? -1 : 0)));

  const jumpHeld = held("Space") || held("KeyW") || held("ArrowUp") || touch.jump || pad.jump;
  const downHeld = held("KeyS") || held("ArrowDown") || touch.down || pad.down;
  const attackHeld = held("KeyJ") || held("KeyZ") || touch.attack || pad.attack;
  const skillHeld = held("KeyK") || held("KeyX") || touch.skill || pad.skill;
  const skill2Held = held("KeyL") || held("KeyC") || touch.skill2 || pad.skill2;
  const skill3Held = held("KeyU") || held("KeyV") || touch.skill3 || pad.skill3;
  const interactHeld = held("KeyE") || touch.interact || pad.interact;
  const invHeld = held("KeyI") || held("Tab") || pad.inventory;
  const pauseHeld = held("Escape") || held("KeyP") || pad.pause;
  const potionHeld = held("KeyH") || held("Digit1") || touch.potion || pad.potion;

  const frame: ActionFrame = {
    moveX,
    moveY,
    jumpHeld,
    downHeld,
    interactHeld,
    justJump: jumpHeld && !prev.jump,
    justAttack: attackHeld && !prev.attack,
    justSkill: skillHeld && !prev.skill,
    justSkill2: skill2Held && !prev.skill2,
    justSkill3: skill3Held && !prev.skill3,
    justInteract: interactHeld && !prev.interact,
    justInventory: invHeld && !prev.inventory,
    justPause: pauseHeld && !prev.pause,
    justPotion: potionHeld && !prev.potion,
  };

  prev.jump = jumpHeld;
  prev.attack = attackHeld;
  prev.skill = skillHeld;
  prev.skill2 = skill2Held;
  prev.skill3 = skill3Held;
  prev.interact = interactHeld;
  prev.inventory = invHeld;
  prev.pause = pauseHeld;
  prev.potion = potionHeld;
  return frame;
}

export function setKeys(codes: string[]) {
  injected.clear();
  for (const c of codes) injected.add(c);
}

const GAME_CODES = new Set([
  "Space",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyU",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyE",
  "KeyI",
  "KeyP",
  "KeyH",
  "Digit1",
  "Tab",
]);

function onDown(e: KeyboardEvent) {
  if (GAME_CODES.has(e.code)) e.preventDefault();
  keys.add(e.code);
}

function onUp(e: KeyboardEvent) {
  keys.delete(e.code);
}

function onBlur() {
  keys.clear();
}

export function bindWindow() {
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) keys.clear();
  });
  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
  };
}
