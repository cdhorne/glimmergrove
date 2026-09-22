import { expToNext, type ItemDef, type JobId, type MapId } from "./content";
import { defaultEconomy, type EconomyState } from "./economy";

const KEY = "glimmergrove-save-v1";
const SAVE_VERSION = 3;

export type SaveData = {
  version: number;
  name: string;
  job: JobId;
  level: number;
  exp: number;
  hp: number;
  mp: number;
  glims: number;
  map: MapId;
  x: number;
  y: number;
  kills: number;
  inventory: ItemDef[];
  equipped: { weapon?: ItemDef; armor?: ItemDef; acc?: ItemDef };
  heartwoodOpen: boolean;
  wardenDown: boolean;
  economy: EconomyState;
};

export function defaultSave(job: JobId, name: string): SaveData {
  return {
    version: SAVE_VERSION,
    name: name.trim() || "Rowan",
    job,
    level: 1,
    exp: 0,
    hp: 0,
    mp: 0,
    glims: 0,
    map: "haven",
    x: 220,
    y: 360,
    kills: 0,
    inventory: [],
    equipped: {},
    heartwoodOpen: false,
    wardenDown: false,
    economy: defaultEconomy(),
  };
}

function migrate(raw: SaveData): SaveData {
  const base = defaultSave(raw.job ?? "guardian", raw.name ?? "Rowan");
  const economy = { ...base.economy, ...(raw.economy ?? {}) };
  economy.tray = economy.tray ?? base.economy.tray;
  economy.loadout = economy.loadout ?? base.economy.loadout;
  economy.board = economy.board ?? base.economy.board;
  return { ...base, ...raw, economy, version: SAVE_VERSION };
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData) {
  try {
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(`${KEY}-bak`, prev);
    localStorage.setItem(KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  } catch {
    /* private mode / quota */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function nextExp(save: SaveData) {
  return expToNext(save.level);
}
