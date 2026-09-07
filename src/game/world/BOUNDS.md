# World module bounds

| Module | Called from | Must not be called from |
|---|---|---|
| `economy.ts` | yard-panel, piles, tests | combat, input, feel, Phaser update |
| `world/piles.ts` | `world/install.ts`, tests | React, combat swing |
| `world/kinds.ts` | `createGame` once | scene `update` |
| `world/install.ts` | `createGame` next to `installMotion` | anywhere else |
| `yard-panel.tsx` | `PlayView` only | WorldScene |

WorldScene stays the Maple loop. Piles attach through the prototype install, same as motion.
