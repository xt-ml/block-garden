import { effect } from "../deps/signal.mjs";

import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

export function setupEffects({
  breakMode,
  doc,
  fogMode,
  gameTime,
  materialsInventory,
  seedInventory,
  selectedMaterialType,
  selectedSeedType,
  totalSeeds,
  viewMode,
  worldSeed,
}) {
  // Set up reactive effects for UI updates
  effect(() => {
    // Auto-update inventory display when materials or seeds change
    updateInventoryDisplay({
      doc: doc,
      materialsInventory: materialsInventory.get(),
      seedInventory: seedInventory.get(),
    });
  });

  effect(() => {
    const seedInput = doc.getElementById("worldSeedInput");

    if (seedInput && !seedInput.value) {
      const currentSeedDisplay = doc.getElementById("currentSeed");
      const currentWorldSeed = worldSeed.get();

      if (currentSeedDisplay && currentWorldSeed) {
        seedInput.value = currentWorldSeed;
        currentSeedDisplay.textContent = currentWorldSeed;

        return;
      }

      const randomSeed = getRandomSeed();

      seedInput.value = randomSeed;
      currentSeedDisplay.textContent = randomSeed;
    }
  });

  effect(() => {
    // Auto-update gameState
    const currentGameTime = gameTime.get();
    const gameTimeEl = doc.getElementById("gameTime");
    if (gameTimeEl) {
      gameTimeEl.textContent = Math.floor(currentGameTime);
    }
  });

  effect(() => {
    // Auto-update viewMode
    const currentViewMode = viewMode.get();

    const viewModeTextEl = doc.getElementById("viewModeText");
    if (viewModeTextEl) {
      viewModeTextEl.textContent =
        currentViewMode === "normal" ? "View Normal" : "View X-Ray";
    }
  });

  effect(() => {
    // Auto-update fogMode
    const currentFogMode = fogMode.get();

    const fogModeTextEl = doc.getElementById("fogModeText");
    if (fogModeTextEl) {
      fogModeTextEl.textContent = currentFogMode === "fog" ? "Fog" : "Clear";
    }
  });

  effect(() => {
    // Auto-update breakMode
    const currentBreakMode = breakMode.get();

    const breakModeTextEl = doc.getElementById("breakModeText");
    if (breakModeTextEl) {
      breakModeTextEl.textContent =
        currentBreakMode === "regular" ? "Dig Regular" : "Dig Extra";
    }
  });

  effect(() => {
    // Auto-update total seeds display
    const currentTotalSeeds = totalSeeds.get();

    const seedCountEl = doc.getElementById("seedCount");
    if (seedCountEl) {
      seedCountEl.textContent = currentTotalSeeds;
    }
  });

  effect(() => {
    // Auto-update selected seed display
    const selectedSeed = selectedSeedType.get();

    const selectedSeedEl = doc.getElementById("selectedSeed");
    if (selectedSeedEl) {
      selectedSeedEl.textContent = selectedSeed || "None";
    }
  });

  effect(() => {
    // Auto-update selected material display
    const selectedMaterial = selectedMaterialType.get();

    const selectedMaterialEl = doc.getElementById("selectedMaterial");
    if (selectedMaterialEl) {
      selectedMaterialEl.textContent = selectedMaterial || "None";
    }
  });
}
