import { MAPS, type MapId } from "../content";
import { keepWorldPrompt, portalLocked } from "./rules";
import type { ActionFrame } from "../input";

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
    if (!keep) prompt = "E  Rest with Wren";
    if (a.justInteract) rest = true;
  }

  let onPortal = false;
  for (const p of map.portals) {
    if (Math.abs(s.playerX - p.x) >= 100) continue;
    onPortal = true;
    const locked = portalLocked(s.kills, p.requireKills, s.heartwoodOpen);
    interact = { type: "portal", to: p.to, require: p.requireKills };
    if (!keep) {
      prompt = locked ? `Locked · hunt ${p.requireKills! - s.kills} more` : `Walk in  ·  ${p.label}`;
    }
    if (!locked && s.portalLock <= 0) {
      portalDwell += dt;
      if (a.interactHeld || a.justInteract || portalDwell > 0.28) enter = p.to;
    }
  }
  if (!onPortal) portalDwell = 0;

  if (s.mapId === "dewpath" && s.playerX > 780 && s.playerX < 940 && !keep && !prompt) {
    prompt = "Jump the mist gap";
  }

  return { prompt, interact, portalDwell, enter, rest };
}

export function pitDeath(mapId: MapId, x: number, y: number, bodyY: number, gameH: number) {
  if (y > gameH + 40) return true;
  const map = MAPS[mapId];
  return map.pits.some((pit) => x > pit.x && x < pit.x + pit.w && bodyY > 500);
}
