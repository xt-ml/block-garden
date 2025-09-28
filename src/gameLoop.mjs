import { configSignals, stateSignals } from "./state.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { render } from "./render.mjs";
import { updateCrops } from "./updateCrops.mjs";
import { updatePlayer } from "./updatePlayer.mjs";
import { updateUI } from "./updateUI.mjs";

const canvas = globalThis.document?.getElementById("canvas");

// Game loop
export function gameLoop(
  gThis,
  FRICTION,
  GRAVITY,
  MAX_FALL_SPEED,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
) {
  updatePlayer(
    gThis,
    FRICTION,
    GRAVITY,
    MAX_FALL_SPEED,
    TILE_SIZE,
    WORLD_HEIGHT,
    WORLD_WIDTH,
  );

  updateCrops(
    getCurrentGameState(stateSignals, configSignals),
    gThis.spriteGarden,
  );

  render(canvas);

  updateUI(gThis.document, getCurrentGameState(stateSignals, configSignals));

  // Increment game time every frame (we store seconds as fractional)
  stateSignals.gameTime.set(stateSignals.gameTime.get() + 1 / 60);

  requestAnimationFrame(() =>
    gameLoop(
      gThis,
      FRICTION,
      GRAVITY,
      MAX_FALL_SPEED,
      TILE_SIZE,
      WORLD_HEIGHT,
      WORLD_WIDTH,
    ),
  );
}
