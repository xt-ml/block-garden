// Update inventory display
export function updateInventoryDisplay({
  doc,
  materialsInventory,
  seedInventory,
}) {
  const seedTypes = ["wheat", "carrot", "mushroom", "cactus", "walnut"];
  const materialTypes = [
    "dirt",
    "stone",
    "wood",
    "sand",
    "clay",
    "coal",
    "iron",
    "gold",
  ];

  // Update seed counts
  seedTypes.forEach((seedType) => {
    const el = doc?.getElementById(`${seedType}Count`);
    try {
      if (el) {
        el.textContent = seedInventory[seedType.toUpperCase()];
      }
    } catch (e) {}
  });

  // Update material counts
  materialTypes.forEach((materialType) => {
    const el = doc?.getElementById(`${materialType}Count`);
    try {
      if (el) {
        el.textContent = materialsInventory[materialType.toUpperCase()];
      }
    } catch (e) {}
  });
}
