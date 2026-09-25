import * as Phaser from "phaser";
import { MONSTERS, type ItemDef, type MonsterKind } from "../content";
import { chipGeom, chipOpen, glimBurstCount } from "../world/combat-run";

export type ChipMob = Phaser.Physics.Arcade.Sprite & {
  kind: MonsterKind;
  hp: number;
  maxHp: number;
  chipT: number;
};

export function dropChip(mob: ChipMob) {
  const chip = mob.getData("chip") as Phaser.GameObjects.Graphics | undefined;
  chip?.destroy();
  mob.setData("chip", undefined);
}

export function drawMobChip(mob: ChipMob) {
  const g = mob.getData("chip") as Phaser.GameObjects.Graphics | undefined;
  if (!g) return;
  g.clear();
  if (!chipOpen(mob.chipT, mob.hp, mob.maxHp)) return;
  const def = MONSTERS[mob.kind];
  const geom = chipGeom(def.display, def.hitH);
  const x = mob.x - geom.w / 2;
  const y = mob.y - geom.lift;
  const pct = Math.max(0, Math.min(1, mob.hp / mob.maxHp));
  g.fillStyle(0x121814, 0.78);
  g.fillRoundedRect(x, y, geom.w, geom.h, 2);
  g.fillStyle(pct > 0.35 ? 0xc45c4a : 0xa33b2c, 1);
  g.fillRoundedRect(x, y, Math.max(2, geom.w * pct), geom.h, 2);
}

export function popNumber(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  tone: "hit" | "crit" | "hurt" | "good",
) {
  const pal: Record<string, { fill: string; stroke: string; size: string }> = {
    hit: { fill: "#fff6d8", stroke: "#121814", size: "26px" },
    crit: { fill: "#f0c14b", stroke: "#3a2208", size: "32px" },
    hurt: { fill: "#f2b4a8", stroke: "#3a1410", size: "22px" },
    good: { fill: "#c5e0c0", stroke: "#121814", size: "20px" },
  };
  const style = pal[tone] ?? pal.hit;
  const t = scene.add
    .text(x, y, text, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: style.size,
      color: style.fill,
      fontStyle: "bold",
      stroke: style.stroke,
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(40)
    .setScale(0.7);
  scene.tweens.add({ targets: t, y: y - 46, duration: 740, ease: "Cubic.easeOut" });
  scene.tweens.add({ targets: t, scale: 1.12, duration: 140, ease: "Back.easeOut" });
  scene.tweens.add({
    targets: t,
    alpha: 0,
    duration: 260,
    delay: 460,
    onComplete: () => t.destroy(),
  });
}

export function flashFx(scene: Phaser.Scene, x: number, y: number, facing: number) {
  if (!scene.textures.exists("slash")) return;
  const fx = scene.add.sprite(x, y, "slash").setDisplaySize(56, 56).setFlipX(facing < 0).setDepth(12);
  if (scene.anims.exists("slash")) fx.play("slash");
  scene.time.delayedCall(280, () => fx.destroy());
}

export function spawnGlims(
  scene: Phaser.Scene,
  drops: Phaser.Physics.Arcade.Group,
  solids: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  n: number,
  tex: (key: string) => string,
) {
  const count = glimBurstCount(n);
  for (let i = 0; i < count; i++) {
    const key = scene.textures.exists("glim") ? "glim" : tex("orb");
    const d = drops.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null;
    if (!d) continue;
    d.setActive(true).setVisible(true).setDisplaySize(22, 22).setDepth(10);
    d.setData("glims", Math.max(1, Math.round(n / count)));
    const body = d.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(true);
    body.setGravityY(900);
    body.setVelocity((Math.random() - 0.5) * 160, -180 - Math.random() * 80);
    body.setBounce(0.35, 0.2);
    scene.physics.add.collider(d, solids);
    if (scene.anims.exists("glim")) d.play("glim");
  }
}

export function spawnItem(
  scene: Phaser.Scene,
  drops: Phaser.Physics.Arcade.Group,
  solids: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  item: ItemDef,
  tex: (key: string) => string,
) {
  const d = drops.get(x, y, tex("glim")) as Phaser.Physics.Arcade.Sprite | null;
  if (!d) return;
  d.setActive(true).setVisible(true).setDisplaySize(26, 26).setTint(0xc8d2c4).setDepth(10);
  d.setData("item", item);
  const body = d.body as Phaser.Physics.Arcade.Body;
  body.enable = true;
  body.setAllowGravity(true);
  body.setGravityY(900);
  body.setVelocity(40, -220);
  scene.physics.add.collider(d, solids);
}
