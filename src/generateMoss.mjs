import { configSignals } from "./state.mjs";

// Add moss to cave surfaces
export function addMossToCaves(world, WORLD_WIDTH, WORLD_HEIGHT, TILES) {
  for (let x = 1; x < WORLD_WIDTH - 1; x++) {
    for (let y = 1; y < WORLD_HEIGHT - 1; y++) {

      // Only add moss to air tiles that are adjacent to stone/dirt walls
      if (world.getTile(x, y) === TILES.AIR) {
        // Check if there's a solid block adjacent (walls, ceiling, or floor)
        const hasAdjacentSolid = [
          world.getTile(x - 1, y), // left
          world.getTile(x + 1, y), // right
          world.getTile(x, y - 1), // above
          world.getTile(x, y + 1), // below
        ].some((tile) => tile && tile.solid);

        // Only place moss 50% and only in underground areas
        if (
          hasAdjacentSolid &&
          y > configSignals.SURFACE_LEVEL.get() + 5 &&
          Math.random() < 0.5
        ) {
          world.setTile(x, y, TILES.MOSS);
        }
      }
    }
  }
}
