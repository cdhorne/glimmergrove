/**
 * Live vs parked. Scene, combat, input, and feel may only call Live verbs.
 * Yard / bag sheets call Parked verbs. MMO treats paused as false.
 */

export const LIVE = [
  "move",
  "jump",
  "attack",
  "skill",
  "overlap-collect",
  "toast",
  "beam",
  "drip",
] as const;

export const PARKED = ["attune", "buy-node", "deposit", "salvage", "compare-sheet"] as const;

export type LiveVerb = (typeof LIVE)[number];
export type ParkedVerb = (typeof PARKED)[number];

export function isLiveVerb(verb: string): verb is LiveVerb {
  return (LIVE as readonly string[]).includes(verb);
}

export function isParkedVerb(verb: string): verb is ParkedVerb {
  return (PARKED as readonly string[]).includes(verb);
}
