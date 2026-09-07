# Economy demo slice

Loads eat. Dumps (the Dewpath gap) are free pull downhill. Cover is a store. Water is an outcome, not a pile.

- Corpses drop **Feed** (slimes, caplings, blooms) or **Bulk** (stumps) into a bag of 12.
- A mob or a missed jump into the gap increments `lostThisRun.pitFeed` and does not bag.
- Wren opens the **Yard**: deposit bag → stocks, build digester / cover, run digester (3 Feed → 1 gas, clears some stock), turn the season.
- `tickSeason`: leftover Feed ≥ 6 sets `flags.bloom`. Bloom slots on Dewpath enable. Cover or zero pit-loss keeps `waterOk`.

No tile placement. Flags only skin existing MS spawn slots.
