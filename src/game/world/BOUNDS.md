# World module bounds

| Module | Called from | Must not be called from |
|---|---|
| `economy.ts` | yard-panel, harvest, tests | combat, input, feel, Phaser update |
| `world/harvest.ts` | WorldScene, present, tests | React combat swing |
| `world/kinds.ts` | `createGame` once | scene `update` |
| `skin.ts` | harvest, WorldScene, tests | feel / input |
| `yard-panel.tsx` | `PlayView` only | WorldScene |

`WorldScene` is the Phaser adapter. Harvest and footing (`landsOn`) are
called from the scene. Looks go through `skin.ts`. Do not add an
`installX` prototype wrap.
