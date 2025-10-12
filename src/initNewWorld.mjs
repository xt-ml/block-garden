import { gameConfig, gameState } from "./state.mjs";
import { generateWorld } from "./generateWorld.mjs";
import { initializeFog } from "./fogMap.mjs";
import { registerTreeStructures } from "./registerTreeStructures.mjs";

// Utility functions
export function initNewWorld({
  biomes,
  gameTime,
  growthTimers,
  plantStructures,
  player,
  seedInventory,
  surfaceLevel,
  tiles,
  tileSize,
  worldSeed,
  worldHeight,
  worldWidth,
  newSeed = null,
}) {
  let currentWorldSeed;

  if (newSeed !== null) {
    worldSeed.set(newSeed.toString());
    currentWorldSeed = newSeed;
  } else {
    currentWorldSeed = worldSeed.get();
  }

  const currentWorld = generateWorld({
    biomes,
    surfaceLevel,
    tiles,
    tileSize,
    worldSeed: currentWorldSeed,
    worldHeight,
    worldWidth,
  });

  // Reset game state
  growthTimers.set({});
  gameTime.set(0);
  plantStructures.set(
    registerTreeStructures(currentWorld, worldWidth, worldHeight, tiles),
  );

  // set seed inventory
  seedInventory.set({
    WHEAT: 1,
    CARROT: 1,
    MUSHROOM: 1,
    CACTUS: 1,
    WALNUT: 1,
    BERRY_BUSH: 1,
    BAMBOO: 1,
    SUNFLOWER: 1,
    CORN: 1,
    PINE_TREE: 1,
    WILLOW_TREE: 1,
    FERN: 1,
  });

  gameState.exploredMap = initializeFog({
    fog: null,
    isFogScaled: gameConfig.isFogScaled,
    worldHeight,
    worldWidth,
    exploredMap: gameState.exploredMap,
  });

  // Find a good spawn location
  let spawnX = Math.floor(worldWidth / 2);
  let spawnY = Math.floor(surfaceLevel - 5);

  for (let x = spawnX - 25; x < spawnX + 25; x++) {
    for (let y = spawnY - 5; y < spawnY + 5; y++) {
      if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        // Check if current position is air and the tile below is solid
        if (
          currentWorld.getTile(tileX, tileY) === tiles.AIR &&
          tileY + 1 < worldHeight &&
          currentWorld.getTile(tileX, tileY + 1) &&
          currentWorld.getTile(tileX, tileY + 1).solid // Check the solid property directly
        ) {
          // Also ensure there's enough vertical clearance (2-3 tiles high)
          let hasVerticalClearance = true;

          for (let checkY = tileY - 2; checkY <= tileY; checkY++) {
            if (
              checkY >= 0 &&
              currentWorld.getTile(tileX, checkY) !== tiles.AIR
            ) {
              hasVerticalClearance = false;

              break;
            }
          }

          if (hasVerticalClearance) {
            const updatedPlayer = {
              ...player.get(),
              x: x * tileSize,
              y: y * tileSize,
              velocityX: 0,
              velocityY: 0,
              lastDirection: 0,
            };

            player.set(updatedPlayer);
          }
        }
      }
    }
  }

  return currentWorld;
}
