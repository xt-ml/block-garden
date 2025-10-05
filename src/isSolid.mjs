// Check if a position is solid
export function isSolid({ tileSize, world, worldHeight, worldWidth, x, y }) {
  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);

  if (tileX < 0 || tileX >= worldWidth || tileY < 0 || tileY >= worldHeight) {
    return true;
  }

  const tile = world.getTile(tileX, tileY);

  return tile && tile.solid;
}
