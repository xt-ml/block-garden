import { createLake } from "./createLake.mjs";
import { createRiver } from "./createRiver.mjs";
import { createSpring } from "./createSpring.mjs";

import { initNoise, waterNoise } from "../util/noise.mjs";

export function generateWaterSources({
  world,
  heights,
  worldWidth,
  worldHeight,
  surfaceLevel,
  tiles,
  seed,
  tileSize,
}) {
  if (!world || typeof world.getTile !== "function") {
    console.error("generateWaterSources: Invalid world object at entry", {
      hasWorld: !!world,
      worldType: typeof world,
      worldWidth,
      worldHeight,
    });

    return;
  }

  initNoise(seed);

  for (let x = 0; x < worldWidth; x++) {
    const surfaceHeight = heights[x];
    const waterNoiseValue = waterNoise(x, parseInt(seed) + 2000);

    // Generate water sources based on terrain
    if (waterNoiseValue > 0.4) {
      // High water noise indicates good spot for water
      // Create lakes in low-lying areas
      if (surfaceHeight < surfaceLevel - 3) {
        const lakeSize = Math.floor((waterNoiseValue - 0.4) * 15) + 3;
        createLake(
          world,
          x,
          surfaceHeight,
          lakeSize,
          worldWidth,
          worldHeight,
          tiles,
        );
      }
      // Create springs in higher elevations
      else if (waterNoiseValue > 0.7 && surfaceHeight > surfaceLevel + 5) {
        createSpring(
          world,
          x,
          surfaceHeight,
          worldWidth,
          worldHeight,
          tiles,
          tileSize,
        );
      }
    }

    // Generate rivers in valleys
    const riverNoise = waterNoise(x, parseInt(seed) + 2500);
    if (riverNoise > 0.6) {
      const leftHeight = x > 0 ? heights[x - 1] : surfaceHeight;
      const rightHeight = x < worldWidth - 1 ? heights[x + 1] : surfaceHeight;

      // If this is a valley (lower than neighbors), create a river
      if (surfaceHeight < leftHeight - 2 && surfaceHeight < rightHeight - 2) {
        createRiver(world, x, surfaceHeight, worldWidth, worldHeight, tiles);
      }
    }
  }
}
