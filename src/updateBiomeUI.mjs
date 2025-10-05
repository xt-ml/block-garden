import { getBiome } from "./getBiome.mjs";

export function updateBiomeUI(
  biomeEl,
  player,
  biomes,
  tileSize,
  worldWidth,
  worldSeed,
) {
  const playerTileX = Math.floor(player.get().x / tileSize);

  if (playerTileX >= 0 && playerTileX < worldWidth) {
    const biome = getBiome(playerTileX, biomes, worldSeed.get());

    biomeEl.textContent = biome.name;
  }
}
