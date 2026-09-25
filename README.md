# Glimmergrove

A 2D side-scrolling action RPG slice. Jump, hit, portal. No auto-battle.

Town → Field → Alley / Boss Room. Three jobs: Fighter, Mage, Archer.
Progress saves in the browser.

The setting is a placeholder canvas. Labels are generic on purpose so a
real world can land later without a rewrite. Slugs and asset keys stay
put — see `docs/agent-context/content.md`.

## Stack

| Layer | What |
|---|---|
| Shell | React 19 + TanStack Start (Vite) |
| Game canvas | Phaser 3 (Arcade physics) |
| UI state | Zustand |
| Styling | Tailwind v4 |
| Save | `localStorage` (`glimmergrove-save-v1`) |
| Auth / DB | Off — single-player, device-local |

React owns title, job select, HUD, bag, pause, and the on-screen pad.
Phaser owns platforms, player, mobs, projectiles, portals.

```
src/
  components/          React chrome
  game/
    content.ts         Jobs, maps, monsters, drops (labels live here)
    skin.ts            Kind → sheet / tint / scale
    input.ts           Keyboard + touch → one action frame
    save.ts            Load / write local save
    createGame.ts      Phaser.Game config (960×540, FIT scale)
    scenes/
      BootScene.ts     Texture slice + anims
      WorldScene.ts    Adapter: apply plans, draw sprites
  routes/              TanStack file routes
public/game/           Sprites, skies, platforms
```

Agent brief: `AGENTS.project.md`. Architecture / style / content:
`docs/agent-context/`.

## Play it

[cdhorne.github.io/glimmergrove](https://cdhorne.github.io/glimmergrove/)

Desktop: `A/D` move · `W` / Space jump · `J` attack · `K` skill · `E` talk · `I` bag

Phone: on-screen buttons after you enter play. Landscape is nicer.

Walk into glowing rings to change maps. Field → Boss Room unlocks after
enough kills.

## Run it

```bash
npm install
npm run dev
```

```bash
npm test
npm run typecheck
npm run build
```

## Status

Playable demo slice. Next useful work is more maps, job identity, combat
juice — and eventually a setting that replaces these labels.
