import { expToNext, type ItemDef, type JobId, type MapId } from "./content";

const KEY = "glimmergrove-save-v1";
const SAVE_VERSION = 1;

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
  };
}

function migrate(raw: SaveData): SaveData {
  const base = defaultSave(raw.job ?? "guardian", raw.name ?? "Rowan");
  return { ...base, ...raw, version: SAVE_VERSION };
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
