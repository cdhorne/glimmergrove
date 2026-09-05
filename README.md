# Glimmergrove

A hands-on 2D side-scrolling action RPG. Original world and jobs, Maple-inspired
platforming: jump the ledges, hunt, portal between maps. No auto-battle.

Built as a playable slice: town (Haven) → Dewpath hunting grounds → Heartwood
warden. Three jobs — Guardian, Weaver, Ranger. Progress saves in the browser.

This is **not** MapleStory. Names, maps, monsters, and art are original.

## Stack

| Layer | What |
|---|---|
| Shell | React 19 + TanStack Start (Vite) |
| Game canvas | Phaser 3 (Arcade physics) |
| UI state | Zustand |
| Styling | Tailwind v4 |
| Save | `localStorage` (`glimmergrove-save-v1`) |
| Auth / DB | Off — single-player, device-local |

The React tree owns title, job select, HUD, bag, pause, and the on-screen
touch pad. Phaser owns the world: platforms, player, mobs, projectiles, portals.

```
src/
  components/          React chrome (title, jobs, HUD, touch)
  game/
    content.ts         Jobs, maps, monsters, drops
    input.ts           Keyboard + touch → one action frame
    save.ts            Load / write local save
    createGame.ts      Phaser.Game config (960×540, FIT scale)
    scenes/
      BootScene.ts     Texture slice + anims
      WorldScene.ts    Movement, combat, portals, death
  routes/              TanStack file routes
public/game/           Sprites, skies, platforms
```

## Play it

[cdhorne.github.io/glimmergrove](https://cdhorne.github.io/glimmergrove/) — GitHub Pages, no install.

Desktop: `A/D` move · `W` / Space jump · `J` attack · `K` skill · `E` talk · `I` bag

Phone: on-screen buttons after you enter the grove. Landscape is nicer.

Walk into glowing rings to change maps. Dewpath → Heartwood unlocks after enough
kills.

## Run it

```bash
npm install
npm run dev
```

Typecheck / production build:

```bash
npm run typecheck
npm run build
```

## Status

Playable demo slice, not an MMO. Worth iterating: more maps, job identity,
combat juice, and the feedback pile from first playtests.
