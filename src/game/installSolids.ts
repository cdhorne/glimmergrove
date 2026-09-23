/** Player and mobs share landsOn. Floors always; one-ways only from above. */
import * as Phaser from "phaser";
import { landsOn } from "./feel";
import type { MonsterKind } from "./content";

type SceneLike = {
  player: Phaser.Physics.Arcade.Sprite;
  solids: Phaser.Physics.Arcade.StaticGroup;
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  skipOneWay: number;
  spawnMob: (kind: MonsterKind, x: number, y: number) => Phaser.Physics.Arcade.Sprite;
  platformProcess: (plat: Phaser.GameObjects.TileSprite) => boolean;
};

function landsOnPlat(
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody,
  plat: Phaser.GameObjects.GameObject,
  skip: boolean,
) {
  const platBody = plat.body as Phaser.Physics.Arcade.StaticBody | undefined;
  if (!platBody) return true;
  return landsOn(
    Boolean(plat.getData("oneWay")),
    skip,
    body.velocity?.y ?? 0,
    body.bottom,
    platBody.top,
  );
}

export function installSolids(SceneCls: { prototype: Record<string, unknown> }) {
  const proto = SceneCls.prototype as SceneLike;

  proto.platformProcess = function platformProcessLands(plat) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return landsOnPlat(body, plat, this.skipOneWay > 0);
  };

  const prevSpawn = proto.spawnMob;
  proto.spawnMob = function spawnMobLands(kind, x, y) {
    const mob = prevSpawn.call(this, kind, x, y);
    const world = this.physics.world;
    for (const col of world.colliders.getActive()) {
      const hitsMob = col.object1 === mob || col.object2 === mob;
      const hitsSolids = col.object1 === this.solids || col.object2 === this.solids;
      if (!hitsMob || !hitsSolids) continue;
      col.setProcessCallback((a, b) => {
        const plat = (a === mob ? b : a) as Phaser.GameObjects.GameObject;
        const body = mob.body as Phaser.Physics.Arcade.Body;
        return landsOnPlat(body, plat, false);
      }, this);
    }
    return mob;
  };
}
