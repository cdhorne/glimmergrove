import { JOBS, MAPS, expToNext, type JobId, type MapId } from "../content";
import { gameBus } from "../bus";
import { canShowUse } from "./rules";
import type { SaveData } from "../save";

export function hudSnap(opts: {
  save: SaveData;
  jobId: JobId;
  mapId: MapId;
  skillCd: number;
  prompt: string | null;
  dead: boolean;
  paused: boolean;
  maxHp: number;
  maxMp: number;
}) {
  const job = JOBS[opts.jobId];
  return {
    name: opts.save.name,
    job: job.name,
    map: MAPS[opts.mapId].name,
    hp: Math.max(0, opts.save.hp),
    maxHp: opts.maxHp,
    mp: Math.max(0, opts.save.mp),
    maxMp: opts.maxMp,
    exp: opts.save.exp,
    next: expToNext(opts.save.level),
    level: opts.save.level,
    glims: opts.save.glims,
    kills: opts.save.kills,
    attackName: job.attackName,
    skillName: job.skillName,
    skillCd: opts.skillCd,
    skillMax: job.skillCd,
    prompt: opts.prompt,
    canUse: canShowUse(opts.save.hp, opts.maxHp),
    skillCost: job.skillCost,
    dead: opts.dead,
    paused: opts.paused,
    bagFeed: 0,
    bagBulk: 0,
    waterOk: true,
    bloom: 0,
  };
}

export function emitWorldHud(opts: Parameters<typeof hudSnap>[0]) {
  gameBus.emit("hud", hudSnap(opts));
}
