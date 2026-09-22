# Economy + live loot

Loads eat. Dumps (the Dewpath gap) are free pull downhill. Cover is a store. Water is an outcome, not a pile.

- Corpses drop **Feed** (slimes, caplings, blooms) or **Bulk** (stumps) into a bag of 12.
- A mob or a missed jump into the gap increments `lostThisRun.pitFeed` and does not bag.
- Wren opens the **Yard**: deposit bag → stocks, build digester / cover, run digester (3 Feed → 1 gas, clears some stock), turn the season.
- `tickSeason`: leftover Feed ≥ 6 sets `flags.bloom`. Bloom slots on Dewpath enable. Cover or zero pit-loss keeps `waterOk`.

No tile placement. Flags only skin existing MS spawn slots.

## Live vs parked

See `src/game/tempo.ts`.

Live (WorldScene, combat, input): move, jump, attack, skill, overlap-collect, toast, beam, drip.
Parked (Yard sheet): attune, buy-node, deposit, salvage.

Kills run `planKill`: fragments always, a piece only when rarity hits and it is not worse than the worn slot. Pieces sit on `economy.tray` until Wren. Board clusters open from attuned aspects.
