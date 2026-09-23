import {
  KEY_BIND,
  PAD_BIND,
  emptyTouch,
  mergeDevice,
  padPressed,
  type InputDevice,
  type TouchState,
} from "./scheme";

const keys = new Set<string>();
const injected = new Set<string>();

export const touch: TouchState = emptyTouch();

const prev = {
  jump: false,
  attack: false,
  skill: false,
  skill2: false,
  skill3: false,
  interact: false,
  inventory: false,
  pause: false,
  use: false,
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
  justUse: boolean;
};

let device: InputDevice = "touch";
const deviceListeners = new Set<() => void>();

export function getDevice() {
  return device;
}

export function subscribeDevice(fn: () => void) {
  deviceListeners.add(fn);
  return () => deviceListeners.delete(fn);
}

function noteDevice(source: InputDevice, active: boolean) {
  const next = mergeDevice(device, source, active);
  if (next === device) return;
  device = next;
  if (next !== "touch") resetTouch();
  deviceListeners.forEach((fn) => fn());
}

export function resetTouch() {
  Object.assign(touch, emptyTouch());
}

function held(code: string) {
  return keys.has(code) || injected.has(code);
}

function anyHeld(codes: readonly string[]) {
  return codes.some(held);
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
  let use = false;
  let live = false;
  for (const pad of pads) {
    if (!pad) continue;
    live = true;
    const ax = pad.axes;
    moveX += deadzone(ax[0] ?? 0);
    moveY += deadzone(ax[1] ?? 0);
    const b = pad.buttons;
    jump = jump || padPressed(b, PAD_BIND.jump);
    attack = attack || padPressed(b, PAD_BIND.attack);
    skill = skill || padPressed(b, PAD_BIND.skill);
    skill2 = skill2 || padPressed(b, PAD_BIND.skill2);
    interact = interact || padPressed(b, PAD_BIND.interact);
    down = down || padPressed(b, PAD_BIND.down) || (ax[1] ?? 0) > 0.55;
    inventory = inventory || padPressed(b, PAD_BIND.inventory);
    pause = pause || padPressed(b, PAD_BIND.pause);
    use = use || padPressed(b, PAD_BIND.use);
    if (padPressed(b, PAD_BIND.dpadLeft)) moveX -= 1;
    if (padPressed(b, PAD_BIND.dpadRight)) moveX += 1;
    if (padPressed(b, PAD_BIND.dpadUp)) moveY -= 1;
  }
  return {
    live,
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
    use,
  };
}

export function sampleActions(): ActionFrame {
  const pad = sampleGamepad();
  const keyLeft = anyHeld(KEY_BIND.left);
  const keyRight = anyHeld(KEY_BIND.right);
  const keyJump = anyHeld(KEY_BIND.jump);
  const keyDown = anyHeld(KEY_BIND.down);
  const keyAttack = anyHeld(KEY_BIND.attack);
  const keySkill = anyHeld(KEY_BIND.skill);
  const keySkill2 = anyHeld(KEY_BIND.skill2);
  const keySkill3 = anyHeld(KEY_BIND.skill3);
  const keyInteract = anyHeld(KEY_BIND.interact);
  const keyInv = anyHeld(KEY_BIND.inventory);
  const keyPause = anyHeld(KEY_BIND.pause);
  const keyUse = anyHeld(KEY_BIND.use);
  const keyMove = keyLeft || keyRight || keyDown || anyHeld(KEY_BIND.up);

  if (pad.live && (pad.jump || pad.attack || pad.skill || pad.interact || pad.use || Math.abs(pad.moveX) > 0.2)) {
    noteDevice("gamepad", true);
  } else if (keyJump || keyAttack || keySkill || keyInteract || keyUse || keyMove || keyPause || keyInv) {
    noteDevice("keyboard", true);
  } else if (touch.jump || touch.attack || touch.skill || touch.interact || touch.use || Math.abs(touch.moveX) > 0.2) {
    noteDevice("touch", true);
  }

  const left = keyLeft || touch.moveX < -0.3 || pad.moveX < -0.3;
  const right = keyRight || touch.moveX > 0.3 || pad.moveX > 0.3;
  let moveX = 0;
  if (left) moveX -= 1;
  if (right) moveX += 1;
  if (!left && !right) {
    moveX = Math.abs(touch.moveX) >= Math.abs(pad.moveX) ? touch.moveX : pad.moveX;
  }
  moveX = Math.max(-1, Math.min(1, moveX));

  const moveY = Math.max(-1, Math.min(1, touch.moveY + pad.moveY + (anyHeld(KEY_BIND.up) ? -1 : 0)));

  const jumpHeld = keyJump || touch.jump || pad.jump;
  const downHeld = keyDown || touch.down || pad.down;
  const attackHeld = keyAttack || touch.attack || pad.attack;
  const skillHeld = keySkill || touch.skill || pad.skill;
  const skill2Held = keySkill2 || touch.skill2 || pad.skill2;
  const skill3Held = keySkill3 || touch.skill3 || pad.skill3;
  const interactHeld = keyInteract || touch.interact || pad.interact;
  const invHeld = keyInv || pad.inventory;
  const pauseHeld = keyPause || pad.pause;
  const useHeld = keyUse || touch.use || pad.use;

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
    justUse: useHeld && !prev.use,
  };

  prev.jump = jumpHeld;
  prev.attack = attackHeld;
  prev.skill = skillHeld;
  prev.skill2 = skill2Held;
  prev.skill3 = skill3Held;
  prev.interact = interactHeld;
  prev.inventory = invHeld;
  prev.pause = pauseHeld;
  prev.use = useHeld;
  return frame;
}

export function setKeys(codes: string[]) {
  injected.clear();
  for (const c of codes) injected.add(c);
}

const GAME_CODES = new Set<string>(Object.values(KEY_BIND).flat());

function onDown(e: KeyboardEvent) {
  if (GAME_CODES.has(e.code)) e.preventDefault();
  keys.add(e.code);
  noteDevice("keyboard", GAME_CODES.has(e.code));
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
  window.addEventListener("gamepadconnected", () => noteDevice("gamepad", true));
  window.addEventListener("gamepaddisconnected", () => {
    const still = typeof navigator !== "undefined" && navigator.getGamepads?.().some(Boolean);
    if (!still) {
      const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
      noteDevice(coarse ? "touch" : "keyboard", true);
    }
  });
  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
  };
}
