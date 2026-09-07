const keys = new Set<string>();
const injected = new Set<string>();

export const SKILL_SLOTS = 4;

export const touch = {
  moveX: 0,
  moveY: 0,
  jump: false,
  attack: false,
  skills: [false, false, false, false] as boolean[],
  interact: false,
  potion: false,
  down: false,
};

const prev = {
  jump: false,
  attack: false,
  skills: [false, false, false, false],
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
  justSkills: boolean[];
  justInteract: boolean;
  justInventory: boolean;
  justPause: boolean;
  justPotion: boolean;
};

function held(code: string) {
  return keys.has(code) || injected.has(code);
}

const GAMEPAD_DEAD = 0.25;

function rescaleAxis(v: number) {
  const a = Math.abs(v);
  if (a < GAMEPAD_DEAD) return 0;
  const signed = v < 0 ? -1 : 1;
  return signed * Math.min(1, (a - GAMEPAD_DEAD) / (1 - GAMEPAD_DEAD));
}

function sampleGamepad() {
  const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
  let moveX = 0;
  let moveY = 0;
  const buttons = {
    jump: false,
    attack: false,
    skills: [false, false, false, false],
    interact: false,
    inventory: false,
    pause: false,
    potion: false,
    down: false,
  };
  for (const pad of pads) {
    if (!pad) continue;
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    moveX += rescaleAxis(ax);
    moveY += rescaleAxis(ay);
    const b = pad.buttons;
    const on = (i: number) => Boolean(b[i]?.pressed);
    if (on(14)) moveX -= 1;
    if (on(15)) moveX += 1;
    if (on(13)) buttons.down = true;
    buttons.jump = buttons.jump || on(0);
    buttons.attack = buttons.attack || on(2);
    buttons.skills[0] = buttons.skills[0] || on(3);
    buttons.skills[1] = buttons.skills[1] || on(5);
    buttons.skills[2] = buttons.skills[2] || on(4);
    buttons.skills[3] = buttons.skills[3] || on(7);
    buttons.potion = buttons.potion || on(1);
    buttons.pause = buttons.pause || on(9);
    buttons.inventory = buttons.inventory || on(8);
  }
  return {
    moveX: Math.max(-1, Math.min(1, moveX)),
    moveY: Math.max(-1, Math.min(1, moveY)),
    buttons,
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
    moveX = Math.abs(touch.moveX) > Math.abs(pad.moveX) ? touch.moveX : pad.moveX;
  }
  moveX = Math.max(-1, Math.min(1, moveX));

  const moveY = Math.abs(touch.moveY) > Math.abs(pad.moveY) ? touch.moveY : pad.moveY;

  const jumpHeld = held("Space") || held("KeyW") || held("ArrowUp") || touch.jump || pad.buttons.jump;
  const downHeld =
    held("KeyS") || held("ArrowDown") || touch.down || moveY > 0.55 || pad.buttons.down;
  const attackHeld = held("KeyJ") || held("KeyZ") || touch.attack || pad.buttons.attack;
  const skillHeld = [
    held("KeyK") || held("Digit1") || held("KeyX") || Boolean(touch.skills[0]) || pad.buttons.skills[0],
    held("Digit2") || Boolean(touch.skills[1]) || pad.buttons.skills[1],
    held("Digit3") || Boolean(touch.skills[2]) || pad.buttons.skills[2],
    held("Digit4") || Boolean(touch.skills[3]) || pad.buttons.skills[3],
  ];
  const interactHeld = held("KeyE") || touch.interact;
  const invHeld = held("KeyI") || held("Tab") || pad.buttons.inventory;
  const pauseHeld = held("Escape") || held("KeyP") || pad.buttons.pause;
  const potionHeld = held("KeyQ") || held("KeyH") || touch.potion || pad.buttons.potion;

  const justSkills = skillHeld.map((v, i) => v && !prev.skills[i]);

  const frame: ActionFrame = {
    moveX,
    moveY,
    jumpHeld,
    downHeld,
    interactHeld,
    justJump: jumpHeld && !prev.jump,
    justAttack: attackHeld && !prev.attack,
    justSkill: justSkills[0] ?? false,
    justSkills,
    justInteract: interactHeld && !prev.interact,
    justInventory: invHeld && !prev.inventory,
    justPause: pauseHeld && !prev.pause,
    justPotion: potionHeld && !prev.potion,
  };

  prev.jump = jumpHeld;
  prev.attack = attackHeld;
  prev.skills = skillHeld;
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
  "KeyZ",
  "KeyX",
  "KeyE",
  "KeyI",
  "KeyP",
  "KeyQ",
  "KeyH",
  "Tab",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
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
