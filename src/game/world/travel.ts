import { MAPS, type MapId } from "../content.ts";
import { keepWorldPrompt, portalLocked } from "./rules.ts";
import type { ActionFrame } from "../input.ts";

export const PORTAL_NEAR = 72;

export type TravelState = {
  mapId: MapId;
  playerX: number;
  kills: number;
  heartwoodOpen: boolean;
  prompt: string | null;
  portalLock: number;
  portalDwell: number;
};

export type TravelTick = {
  prompt: string | null;
  interact: { type: "npc" | "portal"; to?: MapId; require?: number } | null;
  portalDwell: number;
  enter?: MapId;
  rest?: boolean;
};

export function tickTravel(s: TravelState, dt: number, a: ActionFrame): TravelTick {
  const map = MAPS[s.mapId];
  const keep = keepWorldPrompt(s.prompt);
  let prompt = keep ? s.prompt : null;
  let interact: TravelTick["interact"] = null;
  let portalDwell = s.portalDwell;
  let enter: MapId | undefined;
  let rest = false;

  if (map.npc && Math.abs(s.playerX - map.npc.x) < 100) {
    interact = { type: "npc" };
    if (!keep) prompt = "E  Rest";
    if (a.justInteract) rest = true;
  }

  let onPortal = false;
  for (const p of map.portals) {
    if (Math.abs(s.playerX - p.x) >= PORTAL_NEAR) continue;
    onPortal = true;
    const locked = portalLocked(s.kills, p.requireKills, s.heartwoodOpen);
    interact = { type: "portal", to: p.to, require: p.requireKills };
    if (!keep) {
      prompt = locked ? `Locked · hunt ${p.requireKills! - s.kills} more` : `E  Enter  ·  ${p.label}`;
    }
    if (!locked && s.portalLock <= 0 && (a.justInteract || a.interactHeld)) {
      enter = p.to;
    }
  }
  if (!onPortal) portalDwell = 0;
  else portalDwell += dt;

  if (s.mapId === "dewpath" && s.playerX > 780 && s.playerX < 940 && !keep && !prompt) {
    prompt = "Jump the gap";
  }

  return { prompt, interact, portalDwell, enter, rest };
}

export function inGap(mapId: MapId, x: number, y: number, bodyY: number, gameH: number, fallBelow = 40) {
  if (y > gameH + fallBelow) return true;
  const map = MAPS[mapId];
  return map.gaps.some((gap) => x > gap.x && x < gap.x + gap.w && bodyY > 500);
}

export function gapDeath(mapId: MapId, x: number, y: number, bodyY: number, gameH: number) {
  return inGap(mapId, x, y, bodyY, gameH, 40);
}

export function solidUnder(mapId: MapId, x: number) {
  return MAPS[mapId].platforms.some((p) => !p.oneWay && x >= p.x && x <= p.x + p.w);
}
