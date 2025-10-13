import { WATER_FLOW_RATE, WATER_SETTLE_THRESHOLD } from "./index.mjs";

export function flowWater(
  x,
  y,
  waterLevels,
  newWaterLevels,
  worldWidth,
  worldHeight,
) {
  let hasFlowed = false;
  const currentWater = waterLevels[x][y];

  if (currentWater <= 0) return false;

  // First, try to flow downward (gravity)
  if (y + 1 < worldHeight && waterLevels[x][y + 1] >= 0) {
    const below = waterLevels[x][y + 1];
    if (below < 1.0) {
      // Space below to flow into
      const flowAmount = Math.min(currentWater * WATER_FLOW_RATE, 1.0 - below);
      if (flowAmount > WATER_SETTLE_THRESHOLD) {
        newWaterLevels[x][y] -= flowAmount;
        newWaterLevels[x][y + 1] += flowAmount;
        hasFlowed = true;
      }
    }
  }

  // Then try to flow horizontally to lower areas
  const directions = [
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 }, // Right
  ];

  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && nx < worldWidth && ny >= 0 && ny < worldHeight) {
      const neighborWater = waterLevels[nx][ny];

      // Can only flow to non-solid tiles
      if (neighborWater >= 0) {
        const waterDiff = newWaterLevels[x][y] - neighborWater;
        if (waterDiff > WATER_SETTLE_THRESHOLD) {
          const flowAmount = Math.min(
            waterDiff * WATER_FLOW_RATE * 0.5,
            newWaterLevels[x][y] * 0.25,
          );
          if (flowAmount > 0.01) {
            newWaterLevels[x][y] -= flowAmount;
            newWaterLevels[nx][ny] += flowAmount;
            hasFlowed = true;
          }
        }
      }
    }
  }

  // Ensure water levels stay within bounds
  newWaterLevels[x][y] = Math.max(0, Math.min(1.0, newWaterLevels[x][y]));

  return hasFlowed;
}
