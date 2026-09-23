# Style

Match Pelaggio / Fathom: modules of functions, typed inputs, typed
outputs. Do not grow a Phaser class with domain logic.

## Do

```ts
export function planHurt(input: HurtIn): HurtPlan { /* numbers in, plan out */ }

// scene
const plan = planHurt({ kind: mob.kind, hp: mob.hp, dmg, playerX, mobX });
mob.hp = plan.hp;
if (plan.knock) body.setVelocity(plan.knock.vx, plan.knock.vy);
```

- Named exports. One idea per file.
- Phaser-free modules for anything that can be unit-tested with
  `node --test` + `--experimental-strip-types`.
- Relative imports may use a `.ts` suffix (existing world modules do).
- Comments name invariants, not syntax.
- Keep `WorldScene` methods short: sample input, call a helper, apply.

## Do not

- `installX(Scene)` that assigns `proto.foo = function () { prev.call(this) }`.
- Bind soup (`this.foo = this.foo.bind(this)`).
- New domain fields on the scene when a plan object would do.
- Import Phaser from `content.ts`, `feel.ts`, `economy.ts`, `rules.ts`.
- Rename asset files to match a label change.

## Tests

Colocate `foo.test.ts` next to `foo.ts`. Table tests for numbers. If a
rule cannot run without a `Phaser.Scene`, the rule is in the wrong file.

## Scene leftover

`WorldScene` is still a class because Phaser scenes are classes. Treat it
as an adapter, not the design center. When a method grows past ~40 lines
of rules, extract a plan helper first.
