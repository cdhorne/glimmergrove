import { create } from "zustand";
import type { JobId } from "./content";
import type { HudSnap } from "./bus";
import { loadSave, type SaveData } from "./save";

export type Screen = "title" | "create" | "play";

type GameUI = {
  screen: Screen;
  job: JobId;
  name: string;
  paused: boolean;
  bagOpen: boolean;
  bagTab: "equip" | "pack" | "vials";
  hud: HudSnap | null;
  save: SaveData | null;
  setScreen: (s: Screen) => void;
  setJob: (j: JobId) => void;
  setName: (n: string) => void;
  setPaused: (v: boolean) => void;
  setBagOpen: (v: boolean) => void;
  setBagTab: (t: GameUI["bagTab"]) => void;
  setHud: (h: HudSnap) => void;
  refreshSave: () => void;
};

export const useGameUI = create<GameUI>((set) => ({
  screen: "title",
  job: "guardian",
  name: "Rowan",
  paused: false,
  bagOpen: false,
  bagTab: "equip",
  hud: null,
  save: null,
  setScreen: (screen) => set({ screen }),
  setJob: (job) => set({ job }),
  setName: (name) => set({ name }),
  setPaused: (paused) => set({ paused }),
  setBagOpen: (bagOpen) => set({ bagOpen }),
  setBagTab: (bagTab) => set({ bagTab }),
  setHud: (hud) => set({ hud }),
  refreshSave: () => set({ save: loadSave() }),
}));
