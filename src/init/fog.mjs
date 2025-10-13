import { FogMap } from "../map/fog.mjs";

// Initialize fog
export function initFog({
  fog,
  worldWidth,
  worldHeight,
  isFogScaled,
  exploredMap,
}) {
  isFogScaled.set(false);

  let fogMap = new FogMap(worldWidth, worldHeight);

  // Convert existing explored map if it exists
  const existingMap = fog ?? exploredMap;
  if (existingMap && Object.keys(existingMap).length > 0) {
    fogMap = FogMap.fromObject(existingMap, worldWidth, worldHeight);
  }

  //return optimized fog instance
  return fogMap;
}
