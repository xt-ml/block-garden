export function applyWaterToWorld(
  world,
  waterLevels,
  worldWidth,
  worldHeight,
  tiles,
) {
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
