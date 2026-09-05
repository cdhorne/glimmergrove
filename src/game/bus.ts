type Handler = (...args: unknown[]) => void;

class Bus {
  private map = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler) {
    let set = this.map.get(event);
    if (!set) {
      set = new Set();
      this.map.set(event, set);
    }
    set.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Handler) {
    this.map.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]) {
    this.map.get(event)?.forEach((h) => h(...args));
  }
}

export const gameBus = new Bus();

export type HudSnap = {
  name: string;
  job: string;
  map: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  next: number;
  level: number;
  glims: number;
  kills: number;
  attackName: string;
  skillName: string;
  skillCd: number;
  skillMax: number;
  prompt: string | null;
  dead: boolean;
  paused: boolean;
};
