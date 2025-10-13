import { updateState } from "../state/state.mjs";

// Helper function to get tile from material type
function getTileFromMaterial(materialType, tiles) {
  const materialToTile = {
    DIRT: tiles.DIRT,
    STONE: tiles.STONE,
    WOOD: tiles.TREE_TRUNK,
    SAND: tiles.SAND,
    CLAY: tiles.CLAY,
    COAL: tiles.COAL,
    IRON: tiles.IRON,
    GOLD: tiles.GOLD,
  };

  return materialToTile[materialType] || null;
}

export function handlePlaceBlock({
  key,
  materialsInventory,
  player,
  selectedMaterialType,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
}) {
  if (!selectedMaterialType) {
    console.log("No material selected for placement");
    return;
  }

  if (materialsInventory[selectedMaterialType] <= 0) {
    console.log(`No ${selectedMaterialType} available to place`);
    return;
  }

  const playerTileX = Math.floor((player.x + player.width / 2) / tileSize);
  const playerTileY = Math.floor((player.y + player.height / 2) / tileSize);

  let targetX, targetY;

  // Determine placement position based on key pressed
  switch (key.toLowerCase()) {
    case "u": // Top left
      targetX = playerTileX - 1;
      targetY = playerTileY - 1;
      break;
    case "i": // Top
      targetX = playerTileX;
      targetY = playerTileY - 1;
      break;
    case "o": // Top right
      targetX = playerTileX + 1;
      targetY = playerTileY - 1;
      break;
    case "j": // Left
      targetX = playerTileX - 1;
      targetY = playerTileY;
      break;
    case "l": // Right
      targetX = playerTileX + 1;
      targetY = playerTileY;
      break;
    case "m": // Bottom Left
      targetX = playerTileX - 1;
      targetY = playerTileY + 1;
      break;
    case ",": // Bottom
      targetX = playerTileX;
      targetY = playerTileY + 1;
      break;
    case ".": // Bottom Right
      targetX = playerTileX + 1;
      targetY = playerTileY + 1;
      break;
    default:
      console.log(`Invalid placement key: ${key}`);
      return;
  }

  // Check if placement position is valid
  if (
    targetX < 0 ||
    targetX >= worldWidth ||
    targetY < 0 ||
    targetY >= worldHeight
  ) {
    console.log(
      `Cannot place block outside world bounds at (${targetX}, ${targetY})`,
    );
    return;
  }

  // Check if the target position is already occupied by a solid block
  const currentTile = world.getTile(targetX, targetY);
  if (currentTile && currentTile !== tiles.AIR && currentTile.solid) {
    console.log(
      `Cannot place block at (${targetX}, ${targetY}) - position occupied`,
    );
    return;
  }

  // Get the tile to place
  const tileToPlace = getTileFromMaterial(selectedMaterialType, tiles);
  if (!tileToPlace) {
    console.log(`Invalid material type: ${selectedMaterialType}`);
    return;
  }

  // Place the block
  world.setTile(targetX, targetY, tileToPlace);

  // Remove one unit from materials inventory
  updateState("materialsInventory", (inv) => ({
    ...inv,
    [selectedMaterialType]: inv[selectedMaterialType] - 1,
  }));

  console.log(
    `Placed ${selectedMaterialType} at (${targetX}, ${targetY}), ${
      materialsInventory[selectedMaterialType] - 1
    } remaining`,
  );
}
