import { test, expect, chromium } from "@playwright/test";

import { konamiCode } from "../src/misc/konamiCode.mjs";
import { getRandomInt } from "../src/util/getRandomInt.mjs";

import {
  appUrl,
  decodeQRCode,
  getRunId,
  TIME_MINUTES_FIVE,
  waitForSpriteGarden,
} from "./shared/index.mjs";

let browser;
let page;
let runId;

test.beforeAll(async () => {
  browser = await chromium.launch();
  runId = getRunId();

  // Enable video recording
  const context = await browser.newContext({
    recordVideo: { dir: `e2e-results/${runId}` },
    viewport: null,
  });

  page = await context.newPage();
});

test.afterAll(async () => {
  await page.close();
  await browser.close();
});

test("Check QRCode write to and read from canvas", async () => {
  test.setTimeout(TIME_MINUTES_FIVE);
  const testUrl = `${appUrl}/?seed=${getRandomInt(1, 9999)}`;

  await page.goto(testUrl, { waitUntil: "domcontentloaded" });
  await waitForSpriteGarden(page);

  // Unlock additional functionality (Konami code)
  for (const key of konamiCode) {
    await page.keyboard.press(key);
  }

  // jump
  await page.waitForTimeout(1000);
  await page.keyboard.press("w");
  await page.waitForTimeout(1000);

  // farm for a potential tree
  await page.keyboard.down("f");
  // enable extra breaking
  await page.keyboard.press("e");
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press("r");
    await page.waitForTimeout(150);
  }
  await page.keyboard.up("f");
  // disable extra breaking
  await page.keyboard.press("e");

  await page.waitForTimeout(1000);

  // break right and farm
  await page.keyboard.down("d");
  for (let index = 0; index < 25; index++) {
    await page.keyboard.press("r");
    await page.waitForTimeout(50);
    await page.keyboard.press("f");
  }
  await page.keyboard.up("d");

  // move right
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press("d");
    await page.waitForTimeout(50);
  }

  await page.waitForTimeout(1000);

  // break the next few blocks down
  for (let index = 0; index < 20; index++) {
    await page.keyboard.press("r");
    await page.waitForTimeout(150);
  }

  // // Open examples dialog
  // await page.getByRole("button", { name: "📝 Open" }).click();

  // // Click on QRCode example
  // await page.getByTitle("Sprite Garden - QRCode -").click();

  // Run the demo directly, so we can pass arguments
  await page.evaluate(
    async ({ appUrl, testUrl }) => {
      const { demo } = await import(`${appUrl}/src/api/examples/QRCode.mjs`);

      await demo(testUrl, "snow", "fog");
    },
    { appUrl, testUrl },
  );

  // wait for one second
  await page.waitForTimeout(1000);

  // Screenshot before QR reading
  await page.screenshot({
    path: `e2e-results/${runId}/${runId}-qrcode-rendered.png`,
  });

  // Verify canvas has content
  const canvasHasContent = await page.evaluate(async () => {
    const canvas = document
      .querySelector("sprite-garden")
      .shadowRoot.querySelector("#canvas");

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Check if canvas has any non-transparent pixels
    let hasContent = false;
    for (let i = 3; i < imageData.data.length; i += 4) {
      // Check alpha channel
      if (imageData.data[i] > 0) {
        hasContent = true;

        break;
      }
    }

    return hasContent;
  });

  expect(canvasHasContent).toBe(true);

  console.log("✅ QRCode writes to canvas");

  // Get the expected URL that was encoded in the QR code
  const expectedUrl = await page.evaluate(() => {
    const qrApi = globalThis?.spriteGarden?.demo?.qrCodeAPI;
    return qrApi?.url;
  });

  if (!expectedUrl) {
    throw new Error("Could not retrieve expected URL from API");
  }

  console.log(`📋 Expected URL: ${expectedUrl}`);

  // Decode QR code directly from canvas
  const decodedData = await decodeQRCode(page, runId);

  expect(decodedData).toBeTruthy();

  // Verify it's a valid URL
  expect(decodedData).toMatch(/^https?:\/\//);

  // Verify the decoded URL matches the expected URL
  expect(decodedData).toBe(expectedUrl);

  console.log(
    `✅ QRCode successfully decoded and matches expected URL: ${decodedData}`,
  );

  // Screenshot after successful QR reading
  await page.screenshot({
    path: `e2e-results/${runId}/${runId}-qrcode-success.png`,
  });
});
