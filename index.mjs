import { initGame } from "./src/initGame.mjs";

const gThis = globalThis;
const doc = gThis.document;

// Start the game
doc.addEventListener("DOMContentLoaded", async function () {
  await initGame(gThis, doc, doc.getElementById("canvas"));
});
