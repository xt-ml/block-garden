import { waterPhysicsConfig } from "./state.mjs";
import { waterNoise, initializeNoise } from "./noise.mjs";
import { isSolid } from "./isSolid.mjs";

// Water physics constants
const WATER_FLOW_RATE = 0.3; // How fast water flows between tiles
const WATER_SETTLE_THRESHOLD = 0.1; // Minimum water level difference to trigger flow
const MAX_WATER_ITERATIONS = 50; // Prevent infinite loops
const WATER_SOURCE_CHANCE = 0.02; // Chance for a tile to be a water source

// Configuration helper functions
function setWaterPhysicsUpdateRate(framesPerUpdate) {
  waterPhysicsConfig.updateInterval = framesPerUpdate;
}

function setWaterPhysicsIntensity(maxIterations) {
  waterPhysicsConfig.maxIterationsPerUpdate = maxIterations;
}

export function simulateWaterPhysics({
  world,
  worldWidth,
  worldHeight,
  tiles,
  tileSize,
  iterations = 20,
}) {
  let waterLevels = initializeWaterLevels(
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
              world,
              worldWidth,
              worldHeight,
              tiles,
            ) || hasChanged;
        }
      }
    }

    waterLevels = newWaterLevels;

    // Stop early if water has settled
    if (!hasChanged) break;
  }

  // Apply final water levels to world
  applyWaterToWorld(world, waterLevels, worldWidth, worldHeight, tiles);
}

function initializeWaterLevels(
  world,
  worldWidth,
  worldHeight,
  tiles,
  tileSize,
) {
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

function flowWater(
  x,
  y,
  waterLevels,
  newWaterLevels,
  world,
  worldWidth,
  worldHeight,
  tiles,
) {
  let hasFlowed = false;
  const currentWater = waterLevels[x][y];

  if (currentWater <= 0) return false;

  // First, try to flow downward (gravity)
  if (y + 1 < worldHeight && waterLevels[x][y + 1] >= 0) {
    const below = waterLevels[x][y + 1];
    if (below < 1.0) {
      // Space below to flow into
      const flowAmount = Math.min(currentWater * WATER_FLOW_RATE, 1.0 - below);
      if (flowAmount > WATER_SETTLE_THRESHOLD) {
        newWaterLevels[x][y] -= flowAmount;
        newWaterLevels[x][y + 1] += flowAmount;
        hasFlowed = true;
      }
    }
  }

  // Then try to flow horizontally to lower areas
  const directions = [
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 }, // Right
  ];

  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && nx < worldWidth && ny >= 0 && ny < worldHeight) {
      const neighborWater = waterLevels[nx][ny];

      // Can only flow to non-solid tiles
      if (neighborWater >= 0) {
        const waterDiff = newWaterLevels[x][y] - neighborWater;
        if (waterDiff > WATER_SETTLE_THRESHOLD) {
          const flowAmount = Math.min(
            waterDiff * WATER_FLOW_RATE * 0.5,
            newWaterLevels[x][y] * 0.25,
          );
          if (flowAmount > 0.01) {
            newWaterLevels[x][y] -= flowAmount;
            newWaterLevels[nx][ny] += flowAmount;
            hasFlowed = true;
          }
        }
      }
    }
  }

  // Ensure water levels stay within bounds
  newWaterLevels[x][y] = Math.max(0, Math.min(1.0, newWaterLevels[x][y]));

  return hasFlowed;
}

function applyWaterToWorld(world, waterLevels, worldWidth, worldHeight, tiles) {
  for (let x = 0; x < worldWidth; x++) {
    for (let y = 0; y < worldHeight; y++) {
      if (waterLevels[x][y] > 0.3) {
        // Threshold for visible water
        // Only place water in air tiles
        if (
          world.getTile(x, y) === tiles.AIR ||
          world.getTile(x, y) === tiles.WATER
        ) {
          world.setTile(x, y, tiles.WATER);
        }
      } else if (
        world.getTile(x, y) === tiles.WATER &&
        waterLevels[x][y] <= 0.1
      ) {
        // Remove water that has drained away
        world.setTile(x, y, tiles.AIR);
      }
    }
  }
}

export function generateWaterSources({
  world,
  heights,
  worldWidth,
  worldHeight,
  surfaceLevel,
  tiles,
  seed,
}) {
  initializeNoise(seed);

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
        createSpring(world, x, surfaceHeight, worldWidth, worldHeight, tiles);
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

function createLake(
  world,
  centerX,
  surfaceY,
  size,
  worldWidth,
  worldHeight,
  tiles,
) {
  const radius = Math.floor(size / 2);

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = 0; dy <= Math.floor(size * 0.3); dy++) {
      const x = centerX + dx;
      const y = surfaceY + dy + 1;

      if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
        const distance = Math.sqrt(dx * dx + dy * dy * 2); // Flatten vertically
        if (distance <= radius) {
          // Clear out space for lake
          if (world.getTile(x, y) !== tiles.BEDROCK) {
            world.setTile(x, y, tiles.WATER);
          }
        }
      }
    }
  }
}

function createSpring(world, x, surfaceY, worldWidth, worldHeight, tiles) {
  // Create a small water source
  const y = surfaceY;
  if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
    if (world.getTile(x, y) === tiles.AIR || !isSolid(x, y)) {
      world.setTile(x, y, tiles.WATER);
    }
  }
}

function createRiver(world, x, surfaceY, worldWidth, worldHeight, tiles) {
  // Create a shallow river
  const riverY = surfaceY + 1;
  if (x >= 0 && x < worldWidth && riverY >= 0 && riverY < worldHeight) {
    if (world.getTile(x, riverY) !== tiles.BEDROCK) {
      world.setTile(x, riverY, tiles.WATER);
    }

    // Add a bit of depth
    const riverY2 = surfaceY + 2;
    if (riverY2 < worldHeight && Math.random() < 0.7) {
      if (world.getTile(x, riverY2) !== tiles.BEDROCK) {
        world.setTile(x, riverY2, tiles.WATER);
      }
    }
  }
}

// Track water changes during gameplay
export function markWaterRegionDirty({
  x,
  y,
  radius = 5,
  queue,
  worldWidth,
  worldHeight,
}) {
  const currentQueue = queue.get();
  // Add all tiles in radius to the dirty queue
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const checkX = x + dx;
      const checkY = y + dy;

      if (
        checkX >= 0 &&
        checkX < worldWidth &&
        checkY >= 0 &&
        checkY < worldHeight
      ) {
        currentQueue.add(`${checkX},${checkY}`);
      }
    }
  }
}

// Runtime water physics update
export function updateWaterPhysics({
  worldWidth,
  tiles,
  worldHeight,
  waterPhysicsQueue,
  world,
}) {
  const currentQueue = waterPhysicsQueue.get();
  const currentWorld = world.get();

  // Skip if no regions need updating
  if (currentQueue.size === 0) return;

  // Only run periodically to save CPU
  waterPhysicsConfig.frameCounter++;

  if (waterPhysicsConfig.frameCounter < waterPhysicsConfig.updateInterval) {
    return;
  }

  waterPhysicsConfig.frameCounter = 0;

  let worldChanged = false;
  const processedTiles = new Set();
  const newQueue = new Set();

  // Process a limited number of tiles per update
  let processed = 0;

  // Process max 50 tiles per update
  const maxToProcess = Math.min(currentQueue.size, 50);

  for (const key of currentQueue) {
    if (processed >= maxToProcess) {
      // Keep remaining tiles for next update
      newQueue.add(key);
      continue;
    }

    const [x, y] = key.split(",").map(Number);
    processed++;

    // Check if this tile has water that should flow
    const tile = currentWorld.getTile(x, y);
    if (tile === tiles.WATER) {
      // Check for lava interaction first
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ];

      let touchesLava = false;
      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < worldWidth &&
          neighbor.y >= 0 &&
          neighbor.y < worldHeight
        ) {
          if (currentWorld.getTile(neighbor.x, neighbor.y) === tiles.LAVA) {
            touchesLava = true;

            break;
          }
        }
      }

      if (touchesLava) {
        // Water + Lava = Bedrock
        currentWorld.setTile(x, y, tiles.BEDROCK);

        worldChanged = true;

        // Check neighbors for more water that might interact
        for (const neighbor of neighbors) {
          if (
            neighbor.x >= 0 &&
            neighbor.x < worldWidth &&
            neighbor.y >= 0 &&
            neighbor.y < worldHeight
          ) {
            newQueue.add(`${neighbor.x},${neighbor.y}`);
          }
        }
        continue;
      }

      // Try to flow water downward
      if (y + 1 < worldHeight) {
        const below = currentWorld.getTile(x, y + 1);

        if (below === tiles.AIR) {
          // Water flows down into air
          currentWorld.setTile(x, y, tiles.AIR);
          currentWorld.setTile(x, y + 1, tiles.WATER);
          worldChanged = true;

          // Add the new water position and surrounding tiles to check next
          newQueue.add(`${x},${y + 1}`);
          newQueue.add(`${x - 1},${y + 1}`);
          newQueue.add(`${x + 1},${y + 1}`);
          newQueue.add(`${x},${y + 2}`);
        } else if (below === tiles.LAVA) {
          // Water falling onto lava becomes bedrock
          currentWorld.setTile(x, y, tiles.AIR);
          currentWorld.setTile(x, y + 1, tiles.BEDROCK);

          worldChanged = true;
        } else if (below && below.solid) {
          // Water can't flow down, try sideways
          const leftEmpty =
            x > 0 && currentWorld.getTile(x - 1, y) === tiles.AIR;
          const rightEmpty =
            x < worldWidth - 1 && currentWorld.getTile(x + 1, y) === tiles.AIR;

          // Check if water can flow sideways and down
          const leftCanFall =
            leftEmpty &&
            y + 1 < worldHeight &&
            currentWorld.getTile(x - 1, y + 1) === tiles.AIR;

          const rightCanFall =
            rightEmpty &&
            y + 1 < worldHeight &&
            currentWorld.getTile(x + 1, y + 1) === tiles.AIR;

          if (leftCanFall || rightCanFall) {
            // Prefer flowing to a side where water can continue falling
            let flowDirection = 0;

            if (leftCanFall && rightCanFall) {
              flowDirection = Math.random() < 0.5 ? -1 : 1;
            } else if (leftCanFall) {
              flowDirection = -1;
            } else {
              flowDirection = 1;
            }

            const newX = x + flowDirection;
            currentWorld.setTile(x, y, tiles.AIR);
            currentWorld.setTile(newX, y, tiles.WATER);

            worldChanged = true;

            newQueue.add(`${newX},${y}`);
            newQueue.add(`${newX},${y + 1}`);
          } else if (leftEmpty || rightEmpty) {
            // Flow sideways even if can't fall (spread on flat surface)
            // Only flow with reduced probability to prevent infinite spreading
            if (Math.random() < 0.3) {
              let flowDirection = 0;

              if (leftEmpty && rightEmpty) {
                flowDirection = Math.random() < 0.5 ? -1 : 1;
              } else if (leftEmpty) {
                flowDirection = -1;
              } else {
                flowDirection = 1;
              }

              const newX = x + flowDirection;

              // Check if the destination has solid ground beneath it
              if (y + 1 < worldHeight) {
                const belowDest = currentWorld.getTile(newX, y + 1);
                if (belowDest && belowDest.solid) {
                  currentWorld.setTile(x, y, tiles.AIR);
                  currentWorld.setTile(newX, y, tiles.WATER);

                  worldChanged = true;

                  newQueue.add(`${newX},${y}`);
                }
              }
            }
          }
        }
      }
    }
  }

  // Update the queue with remaining tiles
  waterPhysicsQueue.set(newQueue);
}
