export const GAME_W = 960;
export const GAME_H = 540;

export type JobId = "guardian" | "weaver" | "ranger";
export type MapId = "haven" | "dewpath" | "heartwood";
export type ItemSlot = "weapon" | "armor" | "acc";

export type Strike = {
  shape: "melee" | "orb" | "arrow";
  reach: number;
  /** How many bodies this strike may touch before it is absorbed. 1 = stop on first. */
  pierce: number;
  /** Damage multiplier lost per extra target (0.2 → 80% on the second). */
  falloff: number;
  shots: number;
};

export type JobDef = {
  id: JobId;
  name: string;
  title: string;
  blurb: string;
  color: string;
  hp: number;
  mp: number;
  atk: number;
  def: number;
  speed: number;
  attackCd: number;
  skillCd: number;
  skillCost: number;
  skillName: string;
  attackName: string;
  attack: Strike;
  skill: Strike;
};

export const JOBS: Record<JobId, JobDef> = {
  guardian: {
    id: "guardian",
    name: "Guardian",
    title: "Oak-sworn vanguard",
    blurb: "Close steel. High health. A spinning leaf-cleave when you need space.",
    color: "#6b8f71",
    hp: 128,
    mp: 36,
    atk: 16,
    def: 10,
    speed: 210,
    attackCd: 0.32,
    skillCd: 5.2,
    skillCost: 14,
    skillName: "Oakspin",
    attackName: "Sprout Slash",
    attack: { shape: "melee", reach: 70, pierce: 3, falloff: 0, shots: 1 },
    skill: { shape: "melee", reach: 108, pierce: 6, falloff: 0, shots: 1 },
  },
  weaver: {
    id: "weaver",
    name: "Weaver",
    title: "Dewlight channeler",
    blurb: "Long-range orbs. Fragile, sharp. Cascade splits three shots across a lane.",
    color: "#5b8ea8",
    hp: 84,
    mp: 92,
    atk: 20,
    def: 4,
    speed: 190,
    attackCd: 0.42,
    skillCd: 4.6,
    skillCost: 18,
    skillName: "Cascade",
    attackName: "Dewbolt",
    attack: { shape: "orb", reach: 0, pierce: 1, falloff: 0, shots: 1 },
    skill: { shape: "orb", reach: 0, pierce: 1, falloff: 0, shots: 3 },
  },
  ranger: {
    id: "ranger",
    name: "Ranger",
    title: "Canopy hunter",
    blurb: "Needles from mid-range. Fast on the ground. Fan Volley covers a cone.",
    color: "#b56a48",
    hp: 96,
    mp: 54,
    atk: 17,
    def: 6,
    speed: 240,
    attackCd: 0.36,
    skillCd: 4.8,
    skillCost: 16,
    skillName: "Fan Volley",
    attackName: "Needleshot",
    attack: { shape: "arrow", reach: 0, pierce: 1, falloff: 0, shots: 1 },
    skill: { shape: "arrow", reach: 0, pierce: 2, falloff: 0.2, shots: 3 },
  },
};


export type PlatformDef = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "grass" | "wood";
  oneWay?: boolean;
};

export type PortalDef = {
  x: number;
  y: number;
  to: MapId;
  label: string;
  requireKills?: number;
};

export type MonsterSpawn = {
  x: number;
  y: number;
  kind: "dewslug" | "capling" | "warden";
};

export type MapDef = {
  id: MapId;
  name: string;
  width: number;
  sky: string;
  spawn: { x: number; y: number };
  platforms: PlatformDef[];
  pits: { x: number; w: number }[];
  portals: PortalDef[];
  npc?: { x: number; y: number };
  monsters: MonsterSpawn[];
};

const GROUND_Y = 468;
const GROUND_H = 72;

function ground(width: number): PlatformDef {
  return { x: 0, y: GROUND_Y, w: width, h: GROUND_H, kind: "grass" };
}

export const MAPS: Record<MapId, MapDef> = {
  haven: {
    id: "haven",
    name: "Glimmergrove",
    width: 2400,
    sky: "haven-sky",
    spawn: { x: 220, y: 360 },
    platforms: [
      ground(2400),
      { x: 540, y: 360, w: 220, h: 28, kind: "wood", oneWay: true },
      { x: 980, y: 300, w: 180, h: 28, kind: "wood", oneWay: true },
      { x: 1500, y: 380, w: 260, h: 28, kind: "wood", oneWay: true },
    ],
    pits: [],
    portals: [{ x: 2080, y: GROUND_Y, to: "dewpath", label: "Dewpath" }],
    npc: { x: 620, y: GROUND_Y },
    monsters: [],
  },
  dewpath: {
    id: "dewpath",
    name: "Dewpath",
    width: 3400,
    sky: "dewpath-sky",
    spawn: { x: 280, y: 360 },
    platforms: [
      { x: 0, y: GROUND_Y, w: 920, h: GROUND_H, kind: "grass" },
      { x: 1180, y: GROUND_Y, w: 2220, h: GROUND_H, kind: "grass" },
      { x: 860, y: 360, w: 200, h: 26, kind: "wood", oneWay: true },
      { x: 1040, y: 270, w: 180, h: 26, kind: "wood", oneWay: true },
      { x: 1600, y: 340, w: 240, h: 26, kind: "wood", oneWay: true },
      { x: 2100, y: 300, w: 200, h: 26, kind: "wood", oneWay: true },
      { x: 2580, y: 360, w: 280, h: 26, kind: "wood", oneWay: true },
    ],
    pits: [{ x: 920, w: 260 }],
    portals: [
      { x: 80, y: GROUND_Y, to: "haven", label: "Grove" },
      { x: 3120, y: GROUND_Y, to: "heartwood", label: "Heartwood", requireKills: 8 },
    ],
    monsters: [
      { x: 520, y: GROUND_Y, kind: "dewslug" },
      { x: 740, y: GROUND_Y, kind: "dewslug" },
      { x: 1400, y: GROUND_Y, kind: "capling" },
      { x: 1680, y: 340, kind: "dewslug" },
      { x: 1980, y: GROUND_Y, kind: "capling" },
      { x: 2320, y: GROUND_Y, kind: "dewslug" },
      { x: 2640, y: 360, kind: "capling" },
      { x: 2880, y: GROUND_Y, kind: "capling" },
    ],
  },
  heartwood: {
    id: "heartwood",
    name: "Heartwood",
    width: 2000,
    sky: "heartwood-sky",
    spawn: { x: 280, y: 360 },
    platforms: [
      ground(2000),
      { x: 620, y: 340, w: 200, h: 26, kind: "wood", oneWay: true },
      { x: 1180, y: 300, w: 220, h: 26, kind: "wood", oneWay: true },
      { x: 1560, y: 360, w: 180, h: 26, kind: "wood", oneWay: true },
    ],
    pits: [],
    portals: [{ x: 80, y: GROUND_Y, to: "dewpath", label: "Dewpath" }],
    monsters: [{ x: 1180, y: GROUND_Y, kind: "warden" }],
  },
};

export type ItemDef = {
  id: string;
  name: string;
  slot: ItemSlot;
  atk: number;
  def: number;
};

const DROP_POOL: ItemDef[] = [
  { id: "sprout-blade", name: "Sprout Blade", slot: "weapon", atk: 4, def: 0 },
  { id: "reed-bow", name: "Reed Bow", slot: "weapon", atk: 5, def: 0 },
  { id: "dew-rod", name: "Dew Rod", slot: "weapon", atk: 6, def: 0 },
  { id: "moss-vest", name: "Moss Vest", slot: "armor", atk: 0, def: 3 },
  { id: "bark-mail", name: "Bark Mail", slot: "armor", atk: 0, def: 5 },
  { id: "seed-charm", name: "Seed Charm", slot: "acc", atk: 2, def: 1 },
  { id: "amber-pin", name: "Amber Pin", slot: "acc", atk: 3, def: 0 },
];

export function rollDrop(isBoss: boolean): ItemDef | null {
  const chance = isBoss ? 0.85 : 0.22;
  if (Math.random() > chance) return null;
  const item = DROP_POOL[Math.floor(Math.random() * DROP_POOL.length)]!;
  const bonus = isBoss ? 3 : Math.random() < 0.3 ? 2 : 0;
  return { ...item, id: `${item.id}-${Math.floor(Math.random() * 9999)}`, atk: item.atk + bonus, def: item.def + (bonus ? 1 : 0) };
}

export function expToNext(level: number) {
  return Math.round(36 + level * 28);
}

export type MonsterKind = "dewslug" | "capling" | "warden";

export const MONSTERS: Record<
  MonsterKind,
  {
    hp: number;
    atk: number;
    exp: number;
    glims: number;
    speed: number;
    display: number;
    bodyW: number;
    bodyH: number;
    hitW: number;
    hitH: number;
    knockback: number;
    blockPierce: boolean;
  }
> = {
  dewslug: {
    hp: 28,
    atk: 8,
    exp: 14,
    glims: 6,
    speed: 42,
    display: 70,
    bodyW: 36,
    bodyH: 28,
    hitW: 54,
    hitH: 42,
    knockback: 1,
    blockPierce: false,
  },
  capling: {
    hp: 38,
    atk: 11,
    exp: 18,
    glims: 8,
    speed: 58,
    display: 78,
    bodyW: 30,
    bodyH: 40,
    hitW: 46,
    hitH: 58,
    knockback: 1,
    blockPierce: false,
  },
  warden: {
    hp: 240,
    atk: 16,
    exp: 180,
    glims: 80,
    speed: 40,
    display: 168,
    bodyW: 90,
    bodyH: 110,
    hitW: 118,
    hitH: 132,
    knockback: 0,
    blockPierce: true,
  },
};

