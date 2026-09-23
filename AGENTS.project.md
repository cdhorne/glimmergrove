# Glimmergrove — project instructions

This file is the project brief. Platform sandbox rules stay in `AGENTS.md`.
Detail lives in `docs/agent-context/`. Read only what the task needs.

## What this is

A playable 2D side-scrolling action RPG slice. React owns chrome. Phaser
owns the canvas. Auth and the database are off. Progress is `localStorage`.

The product name is Glimmergrove. The *world* is a generic RPG canvas:
Town, Field, Alley, Boss Room; Fighter, Mage, Archer; Slime, Mushroom,
Wasp, Brute, Boss. Flavour is a later pass, not a load-bearing layer.

## Orientation

| Path | Owns |
|---|---|
| `src/components/` | Title, job pick, HUD, bag, yard, touch overlay |
| `src/game/content.ts` | Jobs, maps, monsters, drops — data only |
| `src/game/skin.ts` | Kind → texture / scale / tint. Asset filenames stay put |
| `src/game/feel.ts` `motion.ts` `combat.ts` `mobs.ts` | Phaser-free rules + thin adapters |
| `src/game/scenes/WorldScene.ts` | Phaser adapter: apply plans, draw sprites |
| `src/game/world/` | Travel, piles, HUD present, extra kinds |
| `src/game/save.ts` | Device-local save (`glimmergrove-save-v1`) |
| `public/game/` | Sheets and skies. Do not rename to match labels |

IDs (`haven`, `dewpath`, `guardian`, `dewslug`, …) are stable slugs.
Player-facing strings live on `name` / `title` / `blurb` / `label`.

## Commands

```bash
npm test
npm run typecheck
npm run dev
```

`npm test` is the product gate. Add a new `src/game/**/*.test.ts` to the
`test` script in `package.json` when you add one.

## Invariants

- New game rules are **pure functions over data**. The scene applies the
  result. Do not grow `WorldScene` with another `this.foo =` field if the
  value can live in a plan object.
- Do not add a new `installX(WorldScene)` prototype wrap. `installPiles`
  and `installSolids` are legacy seams; fold work into called functions.
- Phaser imports stay in `scenes/`, `createGame.ts`, and existing adapters
  (`motion.ts`, `install*.ts`). Rules modules stay Phaser-free.
- Content IDs do not change without a save migrate. Labels may change.
- Asset keys (`dewslug-idle`, `haven-sky`, `herbalist-idle`) do not change
  to match labels. Route through `skin.ts`.
- Auth stays off unless the ask names accounts.

## Route

- Layout and data flow → `docs/agent-context/architecture.md`
- JS / TS conventions → `docs/agent-context/style.md`
- Labels vs slugs vs sheets → `docs/agent-context/content.md`
- Economy demo → `ECONOMY.md`
- World call graph → `src/game/world/BOUNDS.md`
