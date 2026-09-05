const keys = new Set<string>();
const injected = new Set<string>();

export const touch = {
  moveX: 0,
  jump: false,
  attack: false,
  skill: false,
  interact: false,
  down: false,
};

const prev = {
  jump: false,
  attack: false,
  skill: false,
  interact: false,
  inventory: false,
  pause: false,
};

export type ActionFrame = {
  moveX: number;
  jumpHeld: boolean;
  downHeld: boolean;
  interactHeld: boolean;
  justJump: boolean;
  justAttack: boolean;
  justSkill: boolean;
  justInteract: boolean;
  justInventory: boolean;
  justPause: boolean;
};

function held(code: string) {
  return keys.has(code) || injected.has(code);
}

export function sampleActions(): ActionFrame {
  const left = held("KeyA") || held("ArrowLeft") || touch.moveX < -0.3;
  const right = held("KeyD") || held("ArrowRight") || touch.moveX > 0.3;
  let moveX = 0;
  if (left) moveX -= 1;
  if (right) moveX += 1;
  if (!left && !right) moveX = touch.moveX;
  moveX = Math.max(-1, Math.min(1, moveX));

  const jumpHeld = held("Space") || held("KeyW") || held("ArrowUp") || touch.jump;
  const downHeld = held("KeyS") || held("ArrowDown") || touch.down;
  const attackHeld = held("KeyJ") || held("KeyZ") || touch.attack;
  const skillHeld = held("KeyK") || held("KeyX") || touch.skill;
  const interactHeld = held("KeyE") || touch.interact;
  const invHeld = held("KeyI") || held("Tab");
  const pauseHeld = held("Escape") || held("KeyP");

  const frame: ActionFrame = {
    moveX,
    jumpHeld,
    downHeld,
    interactHeld,
    justJump: jumpHeld && !prev.jump,
    justAttack: attackHeld && !prev.attack,
    justSkill: skillHeld && !prev.skill,
    justInteract: interactHeld && !prev.interact,
    justInventory: invHeld && !prev.inventory,
    justPause: pauseHeld && !prev.pause,
  };

  prev.jump = jumpHeld;
  prev.attack = attackHeld;
  prev.skill = skillHeld;
  prev.interact = interactHeld;
  prev.inventory = invHeld;
  prev.pause = pauseHeld;
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
