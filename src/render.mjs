import { renderPlayer } from "./renderPlayer.mjs";

// Render world
export function render(
  canvas,
  player,
  camera,
  tiles,
  tileSize,
  viewMode,
  world,
  worldHeight,
  worldWidth,
  fogMode,
  isFogScaled,
  fogScale,
  exploredMap,
) {
  const currentCamera = camera.get();
  const currentWorld = world.get();

  const ctx = canvas?.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const tilesX = Math.ceil(canvas?.width / tileSize) + 1;
  const tilesY = Math.ceil(canvas?.height / tileSize) + 1;

  const startX = Math.floor(currentCamera.x / tileSize);
  const startY = Math.floor(currentCamera.y / tileSize);

  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      const worldX = startX + x;
      const worldY = startY + y;

      if (
        worldX >= 0 &&
        worldX < worldWidth &&
        worldY >= 0 &&
        worldY < worldHeight
      ) {
        const tile = currentWorld.getTile(worldX, worldY);

        // skip empty tiles
        if (!tile || tile === tiles.AIR) continue;

        let color = tile.color;

        if (viewMode.get() === "xray") {
          if (tile === tiles.COAL) color = "#FFFF00";
          else if (tile === tiles.IRON) color = "#FF6600";
          else if (tile === tiles.GOLD) color = "#FFD700";
          else if (tile === tiles.LAVA) color = "#FF0000";
          else if (!tile.solid) color = tile.color;
          else color = "rgba(100,100,100,0.3)";
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x * tileSize - (currentCamera.x % tileSize)),
          Math.round(y * tileSize - (currentCamera.y % tileSize)),
          tileSize,
          tileSize,
        );
      }
    }
  }

  renderPlayer(ctx, camera, player);

  // update fog map based on player position
  const isFogEnabled = fogMode.get() === "fog";

  if (isFogEnabled) {
    exploredMap.updateFromPlayer(player, tileSize);
  }

  // Render map fog overlay if enabled
  if (isFogEnabled && ctx && canvas) {
    if (isFogScaled.get()) {
      exploredMap.renderScaled(ctx, canvas, tileSize, camera, fogScale.get());
      return;
    }

    const { velocityX, velocityY } = player.get();
    if (velocityX > 0 || velocityY > 0) {
      isFogScaled.set(true);
    }

    exploredMap.render(ctx, canvas, tileSize, camera);
  }
}
