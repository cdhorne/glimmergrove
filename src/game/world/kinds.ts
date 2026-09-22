/**
 * Extra kinds and Dewpath slots. Call once from createGame (registerKinds).
 * Do not import from combat or feel. Mutates MAPS/MONSTERS at boot.
 */
import { MAPS, MONSTERS } from "../content";

const EXTRA_STATS = {
  bloom: {
    hp: 48,
    atk: 10,
    exp: 16,
    glims: 4,
    speed: 36,
    display: 86,
    bodyW: 44,
    bodyH: 34,
    hitW: 62,
    hitH: 50,
    knockback: 0.8,
    mass: 1.15,
    blockPierce: false,
  },
  stump: {
    hp: 44,
    atk: 9,
    exp: 16,
    glims: 5,
    speed: 18,
    display: 72,
    bodyW: 34,
    bodyH: 38,
    hitW: 50,
    hitH: 52,
    knockback: 0.4,
    mass: 1.6,
    blockPierce: false,
  },
  bramble: {
    hp: 96,
    atk: 15,
    exp: 32,
    glims: 14,
    speed: 46,
    display: 110,
    bodyW: 52,
    bodyH: 64,
    hitW: 72,
    hitH: 78,
    knockback: 0.7,
    mass: 1.85,
    blockPierce: true,
  },
};

const EXTRA_SLOTS: { x: number; y: number; kind: string; when?: "bloom" }[] = [
  { x: 620, y: 468, kind: "stump" },
  { x: 900, y: 378, kind: "bloom", when: "bloom" },
  { x: 1120, y: 468, kind: "bloom", when: "bloom" },
  { x: 1860, y: 468, kind: "bramble" },
  { x: 2460, y: 468, kind: "bramble" },
];

let registered = false;

export function registerKinds() {
  if (registered) return;
  registered = true;
  Object.assign(MONSTERS, EXTRA_STATS);
  const dew = MAPS.dewpath;
  const have = new Set(dew.monsters.map((s) => `${s.kind}:${s.x}`));
  for (const s of EXTRA_SLOTS) {
    if (have.has(`${s.kind}:${s.x}`)) continue;
    dew.monsters.push(s as (typeof dew.monsters)[number]);
  }
  const heart = MAPS.heartwood;
  if (!heart.monsters.some((s) => s.kind === "bramble")) {
    heart.monsters.push({ x: 720, y: 468, kind: "bramble" as (typeof heart.monsters)[number]["kind"] });
    heart.monsters.push({ x: 1480, y: 468, kind: "bramble" as (typeof heart.monsters)[number]["kind"] });
  }
}
