import { asset } from "@/lib/asset";

export type SheetSpec = {
  key: string;
  url: string;
  frame: number;
  frames?: number;
  image?: boolean;
};

export const SHEETS: SheetSpec[] = [
  { key: "guardian-idle", url: asset("/game/sprites/guardian-idle.png"), frame: 192, frames: 4 },
  { key: "guardian-run", url: asset("/game/sprites/guardian-run.png"), frame: 192, frames: 4 },
  { key: "guardian-attack", url: asset("/game/sprites/guardian-attack.png"), frame: 192, frames: 4 },
  { key: "weaver-idle", url: asset("/game/sprites/weaver-idle.png"), frame: 192, frames: 4 },
  { key: "weaver-run", url: asset("/game/sprites/weaver-run.png"), frame: 192, frames: 4 },
  { key: "weaver-attack", url: asset("/game/sprites/weaver-attack.png"), frame: 192, frames: 4 },
  { key: "ranger-idle", url: asset("/game/sprites/ranger-idle.png"), frame: 192, frames: 4 },
  { key: "ranger-run", url: asset("/game/sprites/ranger-run.png"), frame: 192, frames: 4 },
  { key: "ranger-attack", url: asset("/game/sprites/ranger-attack.png"), frame: 192, frames: 4 },
  { key: "dewslug-idle", url: asset("/game/sprites/dewslug-idle.png"), frame: 160, frames: 4 },
  { key: "dewslug-walk", url: asset("/game/sprites/dewslug-walk.png"), frame: 160, frames: 4 },
  { key: "capling-idle", url: asset("/game/sprites/capling-idle.png"), frame: 160, frames: 4 },
  { key: "capling-walk", url: asset("/game/sprites/capling-walk.png"), frame: 160, frames: 4 },
  { key: "warden-idle", url: asset("/game/sprites/warden-idle.png"), frame: 256, frames: 4 },
  { key: "arrow", url: asset("/game/sprites/arrow.png"), frame: 128, frames: 4 },
  { key: "orb", url: asset("/game/sprites/orb.png"), frame: 128, frames: 4 },
  { key: "slash", url: asset("/game/sprites/slash.png"), frame: 128, frames: 4 },
  { key: "glim", url: asset("/game/sprites/glim.png"), frame: 96, frames: 4 },
  { key: "herbalist-idle", url: asset("/game/sprites/herbalist-idle.png"), frame: 192, frames: 4 },
  { key: "portal", url: asset("/game/sprites/portal.png"), frame: 256, image: true },
];

export const IMAGES = [
  { key: "haven-sky", url: asset("/game/map/haven-sky.jpg") },
  { key: "dewpath-sky", url: asset("/game/map/dewpath-sky.jpg") },
  { key: "heartwood-sky", url: asset("/game/map/heartwood-sky.jpg") },
  { key: "grass", url: asset("/game/map/grass.png") },
  { key: "wood", url: asset("/game/map/wood.png") },
];
