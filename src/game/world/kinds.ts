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
    blockPierce: false,
  },
};

const EXTRA_SLOTS: { x: number; y: number; kind: string; when?: "bloom" }[] = [
  { x: 620, y: 468, kind: "stump" },
  { x: 900, y: 378, kind: "bloom", when: "bloom" },
  { x: 1120, y: 468, kind: "bloom", when: "bloom" },
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
}
