import { stateSignals } from "./state.mjs";

// Update explored map based on player position
export function updateMapFog(TILE_SIZE) {
  const player = stateSignals.player.get();
  const exploredMap = stateSignals.exploredMap?.get() || {};

  const FOG_REVEAL_RADIUS = 15;

  // Calculate player's tile position
  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

  let mapUpdated = false;
  const newExploredMap = { ...exploredMap };

  // Reveal tiles in a circle around the player
  for (let dx = -FOG_REVEAL_RADIUS; dx <= FOG_REVEAL_RADIUS; dx++) {
    for (let dy = -FOG_REVEAL_RADIUS; dy <= FOG_REVEAL_RADIUS; dy++) {
      const tileX = playerTileX + dx;
      const tileY = playerTileY + dy;

      // Check if within circular radius
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= FOG_REVEAL_RADIUS) {
        const key = `${tileX},${tileY}`;

        if (!newExploredMap[key]) {
          newExploredMap[key] = true;
          mapUpdated = true;
        }
      }
    }
  }

  // Only update state if something changed
  if (mapUpdated) {
    stateSignals.exploredMap.set(newExploredMap);
  }
}

// Render map fog overlay
export function renderMapFog(
  ctx,
  canvas,
  TILE_SIZE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  camera,
) {
  if (!ctx || !canvas) return;

  const exploredMap = stateSignals.exploredMap?.get() || {};

  const tilesX = Math.ceil(canvas.width / TILE_SIZE) + 1;
  const tilesY = Math.ceil(canvas.height / TILE_SIZE) + 1;
  const startX = Math.floor(camera.x / TILE_SIZE);
  const startY = Math.floor(camera.y / TILE_SIZE);
  const cameraOffsetX = camera.x % TILE_SIZE;
  const cameraOffsetY = camera.y % TILE_SIZE;

  ctx.fillStyle = "#000000";

  // Process tiles in the same order as the batched version to avoid hatching
  for (let x = 0; x < tilesX; x++) {
    const worldX = startX + x;
    if (worldX < 0 || worldX >= WORLD_WIDTH) continue;

    const screenX = Math.round(x * TILE_SIZE - cameraOffsetX);

    for (let y = 0; y < tilesY; y++) {
      const worldY = startY + y;
      if (worldY < 0 || worldY >= WORLD_HEIGHT) continue;

      // Check explored map directly
      if (!exploredMap[`${worldX},${worldY}`]) {
        const screenY = Math.round(y * TILE_SIZE - cameraOffsetY);
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// Scaled fog for performance
export function renderMapFogScaled(
  ctx,
  canvas,
  TILE_SIZE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  camera,
  FOG_SCALE = 2,
) {
  if (!ctx || !canvas) return;

  const exploredMap = stateSignals.exploredMap?.get() || {};

  // Render fog at scaled up for better performance
  const blockSize = TILE_SIZE * FOG_SCALE;

  // Calculate how many fog blocks we need to cover the screen
  const blocksX = Math.ceil(canvas.width / blockSize) + 1;
  const blocksY = Math.ceil(canvas.height / blockSize) + 1;

  // Find the starting world coordinate in terms of fog blocks
  const startBlockX = Math.floor(camera.x / blockSize);
  const startBlockY = Math.floor(camera.y / blockSize);

  // Camera offset for fog blocks
  const cameraOffsetX = camera.x % blockSize;
  const cameraOffsetY = camera.y % blockSize;

  ctx.fillStyle = "#000000";

  // Process each fog block
  for (let blockX = 0; blockX < blocksX; blockX++) {
    const worldBlockX = startBlockX + blockX;
    const screenX = Math.round(blockX * blockSize - cameraOffsetX);

    for (let blockY = 0; blockY < blocksY; blockY++) {
      const worldBlockY = startBlockY + blockY;
      const screenY = Math.round(blockY * blockSize - cameraOffsetY);

      // Check if this entire block should be fogged
      // A block is fogged if ALL tiles in it are unexplored
      let shouldFog = true;

      // Check each tile in this fog block
      for (let dx = 0; dx < FOG_SCALE && shouldFog; dx++) {
        for (let dy = 0; dy < FOG_SCALE && shouldFog; dy++) {
          const tileX = worldBlockX * FOG_SCALE + dx;
          const tileY = worldBlockY * FOG_SCALE + dy;

          // If tile is within world bounds and is explored, don't fog this block
          if (
            tileX >= 0 &&
            tileX < WORLD_WIDTH &&
            tileY >= 0 &&
            tileY < WORLD_HEIGHT &&
            exploredMap[`${tileX},${tileY}`]
          ) {
            shouldFog = false;
          }
        }
      }

      // Draw fog block if needed
      if (shouldFog) {
        ctx.fillRect(screenX, screenY, blockSize, blockSize);
      }
    }
  }
}

// Reset map fog (useful for new worlds)
export function resetMapFog() {
  stateSignals.exploredMap?.set({});
}
