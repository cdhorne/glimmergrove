import { create } from "zustand";
import type { JobId } from "./content";
import type { HudSnap } from "./bus";
import { loadSave, type SaveData } from "./save";
import { loadMoveStyle, type MoveStyle } from "./scheme";

export type Screen = "title" | "create" | "play";

const STYLE_KEY = "glimmergrove-controls-v1";

function readStyle(): MoveStyle {
  try {
    return loadMoveStyle(localStorage.getItem(STYLE_KEY));
  } catch {
    return "ghost";
  }
}

type GameUI = {
  screen: Screen;
  job: JobId;
  name: string;
  paused: boolean;
  bagOpen: boolean;
  yardOpen: boolean;
  hud: HudSnap | null;
  save: SaveData | null;
  moveStyle: MoveStyle;
  setScreen: (s: Screen) => void;
  setJob: (j: JobId) => void;
  setName: (n: string) => void;
  setPaused: (v: boolean) => void;
  setBagOpen: (v: boolean) => void;
  setYardOpen: (v: boolean) => void;
  setHud: (h: HudSnap) => void;
  setMoveStyle: (s: MoveStyle) => void;
  refreshSave: () => void;
};

export const useGameUI = create<GameUI>((set) => ({
  screen: "title",
  job: "guardian",
  name: "Rowan",
  paused: false,
  bagOpen: false,
  yardOpen: false,
  hud: null,
  save: null,
  moveStyle: readStyle(),
  setScreen: (screen) => set({ screen }),
  setJob: (job) => set({ job }),
  setName: (name) => set({ name }),
  setPaused: (paused) => set({ paused }),
  setBagOpen: (bagOpen) => set({ bagOpen }),
  setYardOpen: (yardOpen) => set({ yardOpen }),
  setHud: (hud) => set({ hud }),
  setMoveStyle: (moveStyle) => {
    try {
      localStorage.setItem(STYLE_KEY, moveStyle);
    } catch {
      /* ignore */
    }
    set({ moveStyle });
  },
  refreshSave: () => set({ save: loadSave() }),
}));
