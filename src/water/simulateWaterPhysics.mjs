import { applyWaterToWorld } from "./applyWaterToWorld.mjs";
import { flowWater } from "./flowWater.mjs";
import { initWaterLevels } from "./initWaterLevels.mjs";

export function simulateWaterPhysics({
  world,
  worldWidth,
  worldHeight,
  tiles,
  tileSize,
  iterations = 20,
}) {
  let waterLevels = initWaterLevels(
    world,
    worldWidth,
    worldHeight,
    tiles,
    tileSize,
  );

  // Run water simulation iterations
  for (let iter = 0; iter < iterations; iter++) {
    const newWaterLevels = [...waterLevels.map((col) => [...col])];

    let hasChanged = false;

    // Process each column from bottom to top
    for (let x = 0; x < worldWidth; x++) {
      for (let y = worldHeight - 1; y >= 0; y--) {
        if (waterLevels[x][y] > 0) {
          hasChanged =
            flowWater(
              x,
              y,
              waterLevels,
              newWaterLevels,
              worldWidth,
              worldHeight,
            ) || hasChanged;
        }
      }
    }

    waterLevels = newWaterLevels;

    // Stop early if water has settled
    if (!hasChanged) {
      break;
    }
  }

  // Apply final water levels to world
  applyWaterToWorld(world, waterLevels, worldWidth, worldHeight, tiles);
}
