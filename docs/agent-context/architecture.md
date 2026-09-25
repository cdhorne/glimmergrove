# Architecture

Two trees, one save.

```
React chrome                         Phaser world
src/components/*                     src/game/scenes/WorldScene.ts
  title / jobs / HUD / bag / yard      platforms, player, mobs, portals
  touch overlay                        BootScene slices sheets
        \                               /
         store.ts  ↔→  gameBus  ↔→  present.ts
                         save.ts
```

`createGame` boots Phaser into a host node PlayView owns. The scene emits
`hud` snapshots. React never imports Phaser at the top level (dynamic
import in PlayView) so the title screen can render without the engine.

## Data flow

1. `content.ts` is the table of jobs, maps, monsters, items.
2. `world/kinds.ts` registers extra kinds and Field slots once at boot.
3. `save.ts` is the durable blob. Scene mutates it; React reads a copy
   after `saved`.
4. Pure modules (`feel`, `combat`, `mobs`, `economy`, `world/rules`,
   `world/travel`, `world/combat-run`, `world/harvest`) take numbers and
   return plans.
5. `WorldScene` applies those plans to Arcade bodies and sprites.

Prototype `installX(WorldScene)` wraps are gone. New work is a function
the scene calls, same as `applyPlayerMotion`, `planHurt`, `grantHarvest`.

## Persistence

| Key | What |
|---|---|
| `glimmergrove-save-v1` | Character + economy |
| `glimmergrove-controls-v1` | Move style: ghost / well / flick |

Save slugs (`job`, `map`, `wardenDown`, `heartwoodOpen`, `glims`) are
stable. HUD may label `glims` however it likes.

## Auth / DB

Off. Do not import `@/lib/db` or stand up login for this slice.
