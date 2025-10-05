import { render } from "./render.mjs";

import { updateBiomeUI } from "./updateBiomeUI.mjs";
import { updateCrops } from "./updateCrops.mjs";
import { updateDepthUI } from "./updateDepthUI.mjs";
import { updatePlayer } from "./updatePlayer.mjs";
import { updateWaterPhysics } from "./waterPhysics.mjs";

const canvas = globalThis.document.getElementById("canvas");

// Game loop
export function gameLoop(
  gThis,
  worldSeed,
  biomes,
  surfaceLevel,
  friction,
  gravity,
  maxFallSpeed,
  tileSize,
  tiles,
  worldHeight,
  worldWidth,
  growthTimers,
  plantStructures,
  waterPhysicsQueue,
  world,
  camera,
  player,
  viewMode,
  fogMode,
  isFogScaled,
  fogScale,
  exploredMap,
  gameTime,
  biomeEl,
  depthEl,
) {
  updatePlayer(
    gThis,
    friction,
    gravity,
    maxFallSpeed,
    tileSize,
    worldHeight,
    worldWidth,
    world,
    camera,
    player,
  );

  updateCrops(
    growthTimers,
    plantStructures,
    tiles,
    world,
    worldHeight,
    worldWidth,
  );

  updateWaterPhysics({
    world,
    waterPhysicsQueue,
    worldWidth,
    tiles,
    worldHeight,
  });

  render(
    canvas,
    player,
    camera,
    tiles,
    tileSize,
    viewMode,
    world,
    worldHeight,
    worldWidth,
    fogMode,
    isFogScaled,
    fogScale,
    exploredMap,
  );

  updateBiomeUI(biomeEl, player, biomes, tileSize, worldWidth, worldSeed);
  updateDepthUI(depthEl, player, surfaceLevel, tileSize);

  // Increment game time every frame (we store seconds as fractional)
  gameTime.set(gameTime.get() + 1 / 60);

  requestAnimationFrame(() =>
    gameLoop(
      gThis,
      worldSeed,
      biomes,
      surfaceLevel,
      friction,
      gravity,
      maxFallSpeed,
      tileSize,
      tiles,
      worldHeight,
      worldWidth,
      growthTimers,
      plantStructures,
      waterPhysicsQueue,
      world,
      camera,
      player,
      viewMode,
      fogMode,
      isFogScaled,
      fogScale,
      exploredMap,
      gameTime,
      biomeEl,
      depthEl,
    ),
  );
}
