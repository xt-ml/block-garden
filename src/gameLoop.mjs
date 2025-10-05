import { render } from "./render.mjs";
import { updateBiomeUI } from "./updateBiomeUI.mjs";
import { updateCrops } from "./updateCrops.mjs";
import { updateDepthUI } from "./updateDepthUI.mjs";
import { updatePlayer } from "./updatePlayer.mjs";
import { updateWaterPhysics } from "./waterPhysics.mjs";

const canvas = globalThis.document.getElementById("canvas");

// Fixed timestep configuration
const TARGET_FPS = 50;
const FIXED_TIMESTEP = 1000 / TARGET_FPS; // 16.67ms per update
const MAX_UPDATES_PER_FRAME = 20; // Prevent spiral

let lastFrameTime = performance.now();
let accumulatedTime = 0;

// Store previous state for interpolation
const previousState = {
  player: { x: 0, y: 0 },
  camera: { x: 0, y: 0 },
};

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
  const currentTime = performance.now();
  const frameTime = Math.min(currentTime - lastFrameTime, 250); // Cap at 250ms (4 FPS minimum)
  lastFrameTime = currentTime;

  accumulatedTime += frameTime;

  // Fixed timestep updates - run physics at consistent rate
  let updates = 0;
  while (accumulatedTime >= FIXED_TIMESTEP && updates < MAX_UPDATES_PER_FRAME) {
    // Store previous state before update
    const currentPlayer = player.get();
    const currentCamera = camera.get();
    previousState.player.x = currentPlayer.x;
    previousState.player.y = currentPlayer.y;
    previousState.camera.x = currentCamera.x;
    previousState.camera.y = currentCamera.y;

    // Update game logic at fixed timestep
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

    updateBiomeUI(biomeEl, player, biomes, tileSize, worldWidth, worldSeed);
    updateDepthUI(depthEl, player, surfaceLevel, tileSize);

    // Advance game time
    gameTime.set(gameTime.get() + FIXED_TIMESTEP / 1000);

    accumulatedTime -= FIXED_TIMESTEP;
    updates++;
  }

  // Calculate interpolation factor for smooth rendering
  const interpolation = accumulatedTime / FIXED_TIMESTEP;

  // Render with interpolation for smooth visuals
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
    previousState,
    interpolation,
  );

  // Continue game loop
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
