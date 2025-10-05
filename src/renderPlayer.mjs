// Render player
export function renderPlayer(ctx, camera, player) {
  const currentPlayer = player.get();
  const currentCamera = camera.get();

  const screenX = currentPlayer.x - currentCamera.x;
  const screenY = currentPlayer.y - currentCamera.y;

  if (ctx) {
    ctx.fillStyle = currentPlayer.color;
    ctx.fillRect(screenX, screenY, currentPlayer.width, currentPlayer.height);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX, screenY, currentPlayer.width, currentPlayer.height);

    // Eyes
    ctx.fillStyle = "#000000";
    ctx.fillRect(screenX + 1, screenY + 1, 1, 1);
    ctx.fillRect(screenX + 4, screenY + 1, 1, 1);
  }
}
