import { writeFile } from "fs/promises";
import path from "path";

import { readBarcodes } from "zxing-wasm";

export const appUrl = "http://localhost:8080";

export const TIME_SECONDS_ONE = 1000;
export const TIME_MINUTES_FIVE = 5 * 60 * TIME_SECONDS_ONE;
export const TIME_MINUTES_TEN = TIME_MINUTES_FIVE * 2;

export function getRunId() {
  const d = new Date();

  return [
    d.toISOString().slice(0, 19).replace(/[:T]/g, "-"),
    Math.random().toString(16).slice(2, 8),
  ].join("_");
}

// Wait for <sprite-garden> 'loading' event with isLoading false and pkg present
export async function waitForSpriteGarden(page) {
  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const sprite = document.querySelector("sprite-garden");
      if (!sprite) {
        reject(new Error("<sprite-garden> element not found"));

        return;
      }

      const timeoutId = setTimeout(() => {
        sprite.removeEventListener("sprite-garden-load", onLoading);

        reject(
          new Error(
            'Timed out waiting for "sprite-garden-load" event with expected details from <sprite-garden>',
          ),
        );
      }, 5000);

      function onLoading(event) {
        const detail = event.detail;

        if (
          detail &&
          detail.isLoading === false &&
          detail.pkg &&
          detail.error === null
        ) {
          clearTimeout(timeoutId);

          sprite.removeEventListener("sprite-garden-load", onLoading);

          resolve();
        }
      }

      sprite.addEventListener("sprite-garden-load", onLoading);
    });
  });
}

export async function saveImageDataToPng(page, data, width, height, filePath) {
  // Use browser context to convert ImageData to PNG
  const pngBase64 = await page.evaluate(
    async ({ data: pixelData, width, height }) => {
      // Create canvas in browser context
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      // Create ImageData and put it on canvas
      const imgData = new ImageData(
        new Uint8ClampedArray(pixelData),
        width,
        height,
      );

      ctx.putImageData(imgData, 0, 0);

      // Convert to blob and then to base64
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(",")[1];

            resolve(base64);
          };

          reader.readAsDataURL(blob);
        }, "image/png");
      });
    },
    { data, width, height },
  );

  if (pngBase64) {
    await writeFile(filePath, pngBase64, "base64");

    console.log(`💾 Saved debug image to ${filePath}`);
  }
}

export async function decodeQRCode(page, runId) {
  // Get QR code info and canvas region from the game
  const qrInfo = await page.evaluate(() => {
    const sprite = document.querySelector("sprite-garden");
    const canvas = sprite.shadowRoot.querySelector("#canvas");

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    // Get the QR code result from the API
    const qrResult = globalThis?.spriteGarden?.demo?.qrCodeAPI?.result;
    if (!qrResult) {
      throw new Error("QR code result not found - demo may not have run");
    }

    // Get the current camera position
    const camera = globalThis?.spriteGarden?.state?.camera?.get?.();
    if (!camera) {
      throw new Error("Camera state not found");
    }

    // Get configuration
    const config = globalThis?.spriteGarden?.config;
    const TILE_SIZE = config?.TILE_SIZE?.get?.() || 8;

    console.log(
      `QR Code: ${qrResult.width}x${qrResult.height} modules at world (${qrResult.x}, ${qrResult.y})`,
    );

    console.log(`Camera position: (${camera.x}, ${camera.y}) pixels`);

    // Convert QR code world tile coordinates to world pixel coordinates
    const qrWorldPixelX = qrResult.x * TILE_SIZE;
    const qrWorldPixelY = qrResult.y * TILE_SIZE;
    const qrWorldPixelWidth = qrResult.width * TILE_SIZE;
    const qrWorldPixelHeight = qrResult.height * TILE_SIZE;

    // Convert world pixel coordinates to screen pixel coordinates using camera
    const qrScreenX = qrWorldPixelX - camera.x;
    const qrScreenY = qrWorldPixelY - camera.y;

    console.log(
      `QR Code in world pixels: (${qrWorldPixelX}, ${qrWorldPixelY}) size ${qrWorldPixelWidth}x${qrWorldPixelHeight}`,
    );

    console.log(`QR Code on screen: (${qrScreenX}, ${qrScreenY})`);

    // Add padding to capture zone
    const padding = 0 * TILE_SIZE;
    const startX = Math.max(0, qrScreenX - padding);
    const startY = Math.max(0, qrScreenY - padding);

    const endX = Math.min(
      canvas.width,
      qrScreenX + qrWorldPixelWidth + padding,
    );

    const endY = Math.min(
      canvas.height,
      qrScreenY + qrWorldPixelHeight + padding,
    );

    const captureWidth = endX - startX;
    const captureHeight = endY - startY;

    console.log(
      `Capturing region: (${startX}, ${startY}) to (${endX}, ${endY}) = ${captureWidth}x${captureHeight}`,
    );

    // First, extract the canvas region
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(
      startX,
      startY,
      captureWidth,
      captureHeight,
    );

    // Create a new image with padding for the quiet zone using browser canvas
    const quietZonePadding = 2 * TILE_SIZE; // 1 tile of white padding on each side
    const finalWidth = captureWidth + quietZonePadding * 2;
    const finalHeight = captureHeight + quietZonePadding * 2;

    // Create an off-screen canvas to handle the composition properly
    const offscreenCanvas = new OffscreenCanvas(finalWidth, finalHeight);
    const offscreenCtx = offscreenCanvas.getContext("2d");

    // Disable image smoothing for pixel-perfect rendering
    offscreenCtx.imageSmoothingEnabled = false;

    // Fill the entire canvas with black background
    offscreenCtx.fillStyle = "#000000";
    offscreenCtx.fillRect(0, 0, finalWidth, finalHeight);

    // Create a temporary canvas to convert ImageData to an image we can draw
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = captureWidth;
    tempCanvas.height = captureHeight;

    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.putImageData(imageData, 0, 0);

    // Draw the temp canvas onto the offscreen canvas at the padded position using integer coordinates
    // Use Math.round to ensure pixel-perfect alignment
    offscreenCtx.drawImage(
      tempCanvas,
      Math.round(quietZonePadding),
      Math.round(quietZonePadding),
      captureWidth,
      captureHeight,
    );

    // Get the result as ImageData
    const finalImageData = offscreenCtx.getImageData(
      0,
      0,
      finalWidth,
      finalHeight,
    );

    // // Convert to pure black and white (#000 and #fff)
    // // Use a simple threshold: if luminance > 128, make it white, else black
    // const data = finalImageData.data;
    // for (let i = 0; i < data.length; i += 4) {
    //   // Calculate luminance using standard formula
    //   const r = data[i];
    //   const g = data[i + 1];
    //   const b = data[i + 2];
    //   const luminance = (r * 299 + g * 587 + b * 114) / 1000;

    //   // Set to pure black or white
    //   const color = luminance > 128 ? 255 : 0;
    //   data[i] = color;
    //   data[i + 1] = color;
    //   data[i + 2] = color;
    //   // Keep alpha as-is
    // }

    return {
      data: Array.from(finalImageData.data),
      width: finalImageData.width,
      height: finalImageData.height,
      capturedRegion: {
        startX,
        startY,
        width: captureWidth,
        height: captureHeight,
      },
      qrBounds: {
        x: qrResult.x,
        y: qrResult.y,
        width: qrResult.width,
        height: qrResult.height,
      },
    };
  });

  const canvasData = qrInfo;

  console.log(
    `📸 Captured QR region: ${canvasData.width}x${canvasData.height} pixels at (${canvasData.capturedRegion.startX}, ${canvasData.capturedRegion.startY})`,
  );

  console.log(
    `🎯 QR code bounds: ${canvasData.qrBounds.width}x${canvasData.qrBounds.height} modules at (${canvasData.qrBounds.x}, ${canvasData.qrBounds.y})`,
  );

  // Save the raw canvas data for debugging
  const rawCanvasPath = path.join(
    process.cwd(),
    `e2e-results/${runId}/${runId}-canvas-raw.png`,
  );

  await saveImageDataToPng(
    page,
    canvasData.data,
    canvasData.width,
    canvasData.height,
    rawCanvasPath,
  );

  // Use zxing-wasm to decode the QR code directly from the canvas
  const luminanceSource = {
    data: new Uint8ClampedArray(canvasData.data),
    height: canvasData.height,
    width: canvasData.width,
  };

  const readerOptions = {
    formats: ["QRCode"],
    binarizer: "LocalAverage",
    characterSet: "Unknown",
    downscaleFactor: 3,
    downscaleThreshold: 500,
    eanAddOnSymbol: "Ignore",
    isPure: false,
    maxNumberOfSymbols: 255,
    minLineCount: 2,
    returnErrors: false,
    textMode: "HRI",
    tryCode39ExtendedMode: false,
    tryDenoise: false,
    tryDownscale: false,
    tryHarder: true,
    tryInvert: true,
    tryRotate: false,
  };

  try {
    const results = await readBarcodes(luminanceSource, readerOptions);
    if (results && results.length > 0) {
      console.log(
        `✅ Found ${results.length} QR code${results.length ? "s" : ""}`,
      );

      const decodedUrl = results[0].text;
      console.log(`🔍 Decoded QR code: ${decodedUrl}`);

      return decodedUrl;
    } else {
      console.warn("⚠️ No QR codes found in canvas");

      return null;
    }
  } catch (error) {
    console.error("❌ Failed to decode QR code:", error);
    return null;
  }
}
