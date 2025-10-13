export function createLake(
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
