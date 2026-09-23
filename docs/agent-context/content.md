# Content canvas

Flavour is a skin. Mechanics and slugs stay generic so a later setting
can drop in without a rewrite.

## Jobs (slug → label)

| Slug | Label | Role |
|---|---|---|
| `guardian` | Fighter | melee, more HP |
| `weaver` | Mage | orb, more MP |
| `ranger` | Archer | arrow, more speed |

Sheets stay `guardian-idle.png` and friends. Portraits too.

## Maps

| Slug | Label | Role |
|---|---|---|
| `haven` | Town | rest NPC, no hunt |
| `dewpath` | Field | hunt + pit |
| `stinglane` | Alley | denser hunt |
| `heartwood` | Boss Room | gated by kills |

Skies stay `haven-sky.jpg` etc.

## Monsters

| Slug | Label | Sheet |
|---|---|---|
| `dewslug` | Slime | `dewslug-*` |
| `capling` | Mushroom | `capling-*` |
| `nettle` | Wasp | capling + tint |
| `gorecap` | Brute | warden + tint |
| `warden` | Boss | `warden-idle` |
| `bloom` | Flower | dewslug + tint |
| `stump` | Stump | capling + tint |
| `bramble` | Bramble | warden + tint |

`skin.ts` is the only place that knows sheet + tint + scale. `piles.ts`
`skinFor` delegates to it.

## Currency and verbs

Save field is `glims`. UI may say gold. Verbs are attack, skill, jump,
interact, use. Do not name potions, dew, or grove-only rites in input.

## Adding a setting later

1. Change `name` / `title` / `blurb` / `label` in `content.ts`.
2. Optionally swap files under `public/game/` **keeping the same keys**.
3. Leave slugs and save keys alone.
