# Economy demo slice

Loads eat. Dumps (the Field gap) are free pull downhill. Cover is a store. Water is an outcome, not a pile.

- Corpses drop **Feed** (slime, mushroom, flower, wasp) or **Bulk** (stump, bramble, brute) into a bag of 12.
- A mob or a missed jump into the gap increments `lostThisRun.gapFeed` and does not bag.
- The Town NPC opens the **Yard**: deposit bag → stocks, build digester / cover, run digester (3 Feed → 1 gas, clears some stock), turn the season.
- `tickSeason`: leftover Feed ≥ 6 sets `flags.bloom`. Bloom slots on Field enable. Cover or zero gap-loss keeps `waterOk`.

No tile placement. Flags only skin existing spawn slots.
