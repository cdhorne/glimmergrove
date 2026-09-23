/** Wires justUse heal + canUse onto WorldScene without editing the scene file. */
import { JOBS } from "./content";
import { gameBus } from "./bus";
import { sfxPlay } from "./audio";
import type { ActionFrame } from "./input";

type SceneLike = {
  jobId: keyof typeof JOBS;
  save: { hp: number; mp: number };
  player: { x: number; y: number };
  prompt: string | null;
  time: { delayedCall: (ms: number, fn: () => void) => void };
  persist: () => void;
  popNumber?: (x: number, y: number, text: string, tone: string) => void;
  maxHp: () => number;
  updatePlayer: (dt: number, a: ActionFrame, time: number) => void;
  updateInteract: (dt: number, a: ActionFrame) => void;
  emitHud: () => void;
};

export function installUse(SceneCls: { prototype: Record<string, unknown> }) {
  const proto = SceneCls.prototype as SceneLike;

  const prevPlayer = proto.updatePlayer;
  proto.updatePlayer = function updatePlayerUse(dt, a, time) {
    prevPlayer.call(this, dt, a, time);
    if (a.justUse) tryUse(this);
  };

  const prevInteract = proto.updateInteract;
  proto.updateInteract = function updateInteractUse(dt, a) {
    const keep = this.prompt;
    prevInteract.call(this, dt, a);
    if (keep?.startsWith("Used") || keep === "Nothing to use") this.prompt = keep;
  };

  const prevHud = proto.emitHud;
  proto.emitHud = function emitHudUse() {
    const emit = gameBus.emit.bind(gameBus);
    gameBus.emit = (event: string, ...args: unknown[]) => {
      if (event === "hud" && args[0] && typeof args[0] === "object") {
        const snap = args[0] as { canUse?: boolean; skillCost?: number };
        const max = this.maxHp();
        snap.canUse = max > 0 && this.save.hp / max <= 0.4;
        snap.skillCost = JOBS[this.jobId].skillCost;
      }
      return emit(event, ...args);
    };
    try {
      prevHud.call(this);
    } finally {
      gameBus.emit = emit;
    }
  };
}

function tryUse(scene: SceneLike) {
  const max = scene.maxHp();
  if (scene.save.hp >= max) {
    scene.prompt = "Nothing to use";
    scene.time.delayedCall(900, () => {
      if (scene.prompt === "Nothing to use") scene.prompt = null;
    });
    return;
  }
  const heal = Math.max(18, Math.round(max * 0.28));
  const before = scene.save.hp;
  scene.save.hp = Math.min(max, scene.save.hp + heal);
  const gained = Math.round(scene.save.hp - before);
  scene.prompt = `Used · +${gained} HP`;
  scene.popNumber?.(scene.player.x, scene.player.y - 48, `+${gained}`, "hit");
  sfxPlay.pickup();
  scene.persist();
  scene.time.delayedCall(1200, () => {
    if (scene.prompt?.startsWith("Used")) scene.prompt = null;
  });
}
