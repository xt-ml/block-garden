export function createSpring(
  world,
  x,
  surfaceY,
  worldWidth,
  worldHeight,
  tiles,
  tileSize,
) {
  // Create a small water source
  const y = surfaceY;
  if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
    const tile = world.getTile(x, y);
    if (tile === tiles.AIR || (tile && !tile.solid)) {
      world.setTile(x, y, tiles.WATER);
    }
  }
}
