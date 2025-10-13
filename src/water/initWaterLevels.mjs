import { isSolid } from "../util/isSolid.mjs";

export function initWaterLevels(
  world,
  worldWidth,
  worldHeight,
  tiles,
  tileSize,
) {
  // Log entry point
  if (!world || typeof world.getTile !== "function") {
    console.error("initWaterLevels: Invalid world object", {
      hasWorld: !!world,
      worldWidth,
      worldHeight,
    });

    // Return safe fallback
    const emptyLevels = [];
    for (let x = 0; x < worldWidth; x++) {
      emptyLevels[x] = new Array(worldHeight).fill(0);
    }

    return emptyLevels;
  }

  const waterLevels = [];

  for (let x = 0; x < worldWidth; x++) {
    waterLevels[x] = [];

    for (let y = 0; y < worldHeight; y++) {
      // Initialize water levels based on existing water tiles
      if (world.getTile(x, y) === tiles.WATER) {
        waterLevels[x][y] = 1.0; // Full water level
      } else if (
        !isSolid({
          tileSize,
          world,
          worldHeight,
          worldWidth,
          x,
          y,
        })
      ) {
        waterLevels[x][y] = 0; // Air can hold water
      } else {
        waterLevels[x][y] = -1; // Solid blocks can't hold water
      }
    }
  }

  return waterLevels;
}
