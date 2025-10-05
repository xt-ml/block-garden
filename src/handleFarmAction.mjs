import { updateState } from "./state.mjs";

import { harvestCrop } from "./harvestCrop.mjs";
import { plantSeed } from "./plantSeed.mjs";

function harvestMaturePlant({
  growthTimers,
  plantStructures,
  structure,
  structureKey,
  tiles,
  world,
  worldHeight,
  worldWidth,
}) {
  if (structure.blocks) {
    structure.blocks.forEach((block) => {
      if (
        block.x >= 0 &&
        block.x < worldWidth &&
        block.y >= 0 &&
        block.y < worldHeight
      ) {
        world.setTile(block.x, block.y, tiles.AIR);
      }
    });
  }

  // Give seeds when harvesting mature plant
  if (structure.seedType) {
    // 1-3 seeds
    const seedsGained = 1 + Math.floor(Math.random() * 3);

    updateState("seedInventory", (inv) => ({
      ...inv,
      [structure.seedType]: inv[structure.seedType] + seedsGained,
    }));

    console.log(
      `Harvested mature ${structure.seedType}, gained ${seedsGained} seeds`,
    );
  }

  // Remove the plant structure and any associated timers
  const currentStructures = plantStructures.get();
  const updatedStructures = { ...currentStructures };
  const updatedTimers = { ...growthTimers.get() };

  delete updatedStructures[structureKey];
  delete updatedTimers[structureKey];

  plantStructures.set(updatedStructures);
  growthTimers.set(updatedTimers);
}

export function handleFarmAction({
  growthTimers,
  plantStructures,
  player,
  seedInventory,
  selectedSeedType,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
}) {
  const playerTileX = Math.floor((player.x + player.width / 2) / tileSize);
  const playerTileY = Math.floor((player.y + player.height / 2) / tileSize);

  // Check multiple positions for farming actions
  const farmingPositions = [];

  // If player is moving horizontally, check in front of player
  if (player.lastDirection !== 0) {
    const dx = player.lastDirection > 0 ? 1 : -1;

    farmingPositions.push({
      x: playerTileX + dx,
      y: playerTileY, // Same level as player
    });

    farmingPositions.push({
      x: playerTileX + dx,
      y: playerTileY + 1, // One below player level
    });
  }

  // Always check directly below the player
  farmingPositions.push({
    x: playerTileX,
    y: playerTileY + 1,
  });

  // Also check the tile the player is standing on
  farmingPositions.push({
    x: playerTileX,
    y: playerTileY,
  });

  // Try each position until we find something to farm
  for (const pos of farmingPositions) {
    const { x: targetX, y: targetY } = pos;

    if (
      targetX < 0 ||
      targetX >= worldWidth ||
      targetY < 0 ||
      targetY >= worldHeight
    ) {
      continue;
    }

    const currentTile = world.getTile(targetX, targetY);

    // Check if this position is part of a mature plant structure
    let harvestableStructure = null;
    let structureKey = null;

    const currentStructures = plantStructures.get();
    // Look for mature plant structures that contain this tile
    for (const [key, structure] of Object.entries(currentStructures)) {
      if (structure.mature && structure.blocks) {
        // Check if any block in the structure matches our target position
        const matchingBlock = structure.blocks.find(
          (block) => block.x === targetX && block.y === targetY,
        );

        if (matchingBlock) {
          harvestableStructure = structure;
          structureKey = key;

          break;
        }
      }
    }

    // If we found a mature plant structure, harvest it
    if (harvestableStructure && structureKey) {
      harvestMaturePlant({
        growthTimers,
        plantStructures,
        structure: harvestableStructure,
        structureKey,
        tiles,
        world,
        worldHeight,
        worldWidth,
      });

      // Exit after successful harvest
      return;
    }
    // Check for simple crops (fallback for any remaining simple crop tiles)
    else if (currentTile && currentTile.crop) {
      harvestCrop({
        cropTile: currentTile,
        tiles,
        world,
        x: targetX,
        y: targetY,
      });

      // Exit after successful harvest
      return;
    }
    // Plant seeds if the tile is empty and we have seeds selected
    else if (
      currentTile === tiles.AIR &&
      selectedSeedType &&
      seedInventory[selectedSeedType] > 0
    ) {
      plantSeed({
        growthTimers,
        plantStructures,
        seedInventory,
        seedType: selectedSeedType,
        tiles,
        world,
        x: targetX,
        y: targetY,
      });

      // Exit after successful planting
      return;
    }
  }
}
