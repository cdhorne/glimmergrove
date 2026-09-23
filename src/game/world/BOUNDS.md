# World module bounds

| Module | Called from | Must not be called from |
|---|---|---|
| `economy.ts` | yard-panel, harvest, tests | combat, input, feel, Phaser update |
| `world/harvest.ts` | WorldScene, present, tests | React combat swing |
| `world/kinds.ts` | `createGame` once | scene `update` |
| `yard-panel.tsx` | `PlayView` only | WorldScene |

WorldScene is the Maple loop. Harvest and footing (`landsOn`) are called from the scene, not prototype wraps.
