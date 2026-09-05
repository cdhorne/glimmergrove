export type SheetSpec = {
  key: string;
  url: string;
  frame: number;
  frames?: number;
  image?: boolean;
};

export const SHEETS: SheetSpec[] = [
  { key: "guardian-idle", url: "/game/sprites/guardian-idle.png", frame: 192, frames: 4 },
  { key: "guardian-run", url: "/game/sprites/guardian-run.png", frame: 192, frames: 4 },
  { key: "guardian-attack", url: "/game/sprites/guardian-attack.png", frame: 192, frames: 4 },
  { key: "weaver-idle", url: "/game/sprites/weaver-idle.png", frame: 192, frames: 4 },
  { key: "weaver-run", url: "/game/sprites/weaver-run.png", frame: 192, frames: 4 },
  { key: "weaver-attack", url: "/game/sprites/weaver-attack.png", frame: 192, frames: 4 },
  { key: "ranger-idle", url: "/game/sprites/ranger-idle.png", frame: 192, frames: 4 },
  { key: "ranger-run", url: "/game/sprites/ranger-run.png", frame: 192, frames: 4 },
  { key: "ranger-attack", url: "/game/sprites/ranger-attack.png", frame: 192, frames: 4 },
  { key: "dewslug-idle", url: "/game/sprites/dewslug-idle.png", frame: 160, frames: 4 },
  { key: "dewslug-walk", url: "/game/sprites/dewslug-walk.png", frame: 160, frames: 4 },
  { key: "capling-idle", url: "/game/sprites/capling-idle.png", frame: 160, frames: 4 },
  { key: "capling-walk", url: "/game/sprites/capling-walk.png", frame: 160, frames: 4 },
  { key: "warden-idle", url: "/game/sprites/warden-idle.png", frame: 256, frames: 4 },
  { key: "arrow", url: "/game/sprites/arrow.png", frame: 128, frames: 4 },
  { key: "orb", url: "/game/sprites/orb.png", frame: 128, frames: 4 },
  { key: "slash", url: "/game/sprites/slash.png", frame: 128, frames: 4 },
  { key: "glim", url: "/game/sprites/glim.png", frame: 96, frames: 4 },
  { key: "herbalist-idle", url: "/game/sprites/herbalist-idle.png", frame: 192, frames: 4 },
  { key: "portal", url: "/game/sprites/portal.png", frame: 256, image: true },
];

export const IMAGES = [
  { key: "haven-sky", url: "/game/map/haven-sky.jpg" },
  { key: "dewpath-sky", url: "/game/map/dewpath-sky.jpg" },
  { key: "heartwood-sky", url: "/game/map/heartwood-sky.jpg" },
  { key: "grass", url: "/game/map/grass.png" },
  { key: "wood", url: "/game/map/wood.png" },
];
