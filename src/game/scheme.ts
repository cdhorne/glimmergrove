/** Device-agnostic control scheme. No Phaser, no DOM. */

export type MoveStyle = "ghost" | "well" | "flick";
export type InputDevice = "touch" | "keyboard" | "gamepad";

export const HOLD_SKILL_MS = 220;
export const FLICK_PX = 36;
export const FLICK_MS = 280;
export const MIN_TARGET_PX = 44;

export const KEY_BIND = {
  jump: ["Space"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  up: ["KeyW", "ArrowUp"],
  down: ["KeyS", "ArrowDown"],
  attack: ["KeyJ", "KeyZ"],
  skill: ["KeyK", "KeyX"],
  skill2: ["KeyL", "KeyC"],
  skill3: ["KeyU", "KeyV"],
  interact: ["KeyE"],
  inventory: ["KeyI", "Tab"],
  pause: ["Escape", "KeyP"],
  use: ["KeyH", "Digit1"],
} as const;

/** Standard gamepad indices. B is interact only. */
export const PAD_BIND = {
  jump: 0,
  attack: [2, 5],
  skill: 3,
  interact: 1,
  skill2: 4,
  use: 6,
  inventory: 8,
  pause: 9,
  down: 13,
  dpadLeft: 14,
  dpadRight: 15,
  dpadUp: 12,
} as const;

export type VerbMask = {
  interact: boolean;
  skill: boolean;
  use: boolean;
};

export type HudVerbs = {
  prompt?: string | null;
  mp?: number;
  skillCost?: number;
  skillCd?: number;
  hp?: number;
  maxHp?: number;
  canUse?: boolean;
};

export function resolveVerbs(hud: HudVerbs | null | undefined): VerbMask {
  const h = hud ?? {};
  const mp = h.mp ?? 0;
  const cost = h.skillCost ?? 0;
  const cd = h.skillCd ?? 0;
  return {
    interact: Boolean(h.prompt),
    skill: cd <= 0.05 && (cost <= 0 || mp >= cost),
    use: h.canUse === true || (h.maxHp != null && h.maxHp > 0 && (h.hp ?? h.maxHp) / h.maxHp <= 0.4),
  };
}

export function resolveHoldRelease(heldMs: number, threshold = HOLD_SKILL_MS): "attack" | "skill" | "none" {
  if (heldMs <= 0) return "none";
  return heldMs >= threshold ? "skill" : "attack";
}

export type FlickResult = { justJump: boolean; downHeld: boolean };

export function mapFlick(dx: number, dy: number, heldMs: number, minPx = FLICK_PX, maxMs = FLICK_MS): FlickResult | null {
  if (heldMs > maxMs) return null;
  const mag = Math.hypot(dx, dy);
  if (mag < minPx) return null;
  if (Math.abs(dy) < Math.abs(dx)) return null;
  return { justJump: dy < 0, downHeld: dy > 0 };
}

export function mergeDevice(prev: InputDevice, source: InputDevice, active: boolean): InputDevice {
  if (!active) return prev;
  return source;
}

export function shouldShowOverlay(device: InputDevice, pointerCoarse: boolean): boolean {
  if (device === "gamepad") return false;
  if (device === "keyboard" && !pointerCoarse) return false;
  return device === "touch" || pointerCoarse;
}

export function padPressed(buttons: Array<{ pressed?: boolean } | undefined>, index: number | readonly number[]): boolean {
  const idxs = typeof index === "number" ? [index] : index;
  return idxs.some((i) => Boolean(buttons[i]?.pressed));
}

export function emptyTouch() {
  return {
    moveX: 0,
    moveY: 0,
    jump: false,
    attack: false,
    skill: false,
    skill2: false,
    skill3: false,
    interact: false,
    down: false,
    use: false,
  };
}

export type TouchState = ReturnType<typeof emptyTouch>;

export function loadMoveStyle(raw: string | null): MoveStyle {
  if (raw === "well" || raw === "flick" || raw === "ghost") return raw;
  return "ghost";
}
