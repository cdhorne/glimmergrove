/** Kind → sheet key, scale, tint. Asset filenames do not follow labels. */

const SHEET: Record<string, string> = {
  bloom: "dewslug",
  stump: "capling",
  nettle: "capling",
  bramble: "warden",
  gorecap: "warden",
};

const LOOK: Record<string, { scale: number; tint?: number }> = {
  dewslug: { scale: 0.4 },
  capling: { scale: 0.4 },
  warden: { scale: 0.5 },
  bloom: { scale: 0.52, tint: 0x7ecf8a },
  stump: { scale: 0.48, tint: 0x8a6a48 },
  bramble: { scale: 0.36, tint: 0x3d5c3a },
  nettle: { scale: 0.34, tint: 0xc45c4a },
  gorecap: { scale: 0.4, tint: 0x6a3040 },
};

export const NPC_SHEET = "herbalist-idle";
export const BOSS_KIND = "warden";

export function skinFor(kind: string): string {
  return SHEET[kind] ?? kind;
}

export function skinLook(kind: string): { scale: number; tint?: number } {
  return LOOK[kind] ?? { scale: 0.4 };
}

export function isBossKind(kind: string) {
  return kind === BOSS_KIND;
}
