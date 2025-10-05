import { updateState } from "./state.mjs";

export function harvestCrop({ cropTile, tiles, world, x, y }) {
  const harvestMap = {
    [tiles.WHEAT.id]: "WHEAT",
    [tiles.CARROT.id]: "CARROT",
    [tiles.MUSHROOM.id]: "MUSHROOM",
    [tiles.CACTUS.id]: "CACTUS",
    [tiles.WALNUT.id]: "WALNUT",
  };

  const seedType = harvestMap[cropTile.id];
  if (seedType) {
    // Give player 2-4 seeds when harvesting simple crops
    const seedsGained = 2 + Math.floor(Math.random() * 3);

    updateState("seedInventory", (inv) => ({
      ...inv,
      [seedType]: inv[seedType] + seedsGained,
    }));

    // Remove crop from world
    world.setTile(x, y, tiles.AIR);

    console.log(
      `Harvested simple ${seedType} crop, gained ${seedsGained} seeds`,
    );
  }
}
