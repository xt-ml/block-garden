import { test, chromium } from "@playwright/test";

import { konamiCode } from "../src/misc/konamiCode.mjs";

import {
  appUrl,
  getRunId,
  TIME_MINUTES_TEN,
  TIME_SECONDS_ONE,
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
    viewport: null,
    recordVideo: { dir: `e2e-results/${runId}` },
  });
  page = await context.newPage();
});

test.afterAll(async () => {
  await page.close();
  await browser.close();
});

test("Check Dig for Gold", async () => {
  test.setTimeout(TIME_MINUTES_TEN);

  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await waitForSpriteGarden(page);

  // Unlock additional functionality
  for (const key of konamiCode) {
    await page.keyboard.press(key);
  }

  await page.getByRole("button", { name: "📝 Open" }).click();
  await page.getByTitle("Sprite Garden - Gold -").click();

  await page.getByText("🎒 Inventory").click();
  await page.getByRole("button", { name: "🟡" }).click();

  // Poll for gold
  let currentGold = 0;
  const targetGold = 5;
  const start = Date.now();

  while (Date.now() - start < TIME_MINUTES_TEN - TIME_SECONDS_ONE * 10) {
    try {
      const btn = await page.getByRole("button", { name: "🟡" }).first();
      const text = await btn.textContent();

      currentGold = parseInt((text ?? "").trim().split("🟡")[1] ?? "", 10);

      if (!isNaN(currentGold)) {
        // console.info("Gold:", currentGold);
      }

      if (!isNaN(currentGold) && currentGold >= targetGold) {
        console.info(`Reached ${targetGold} gold.`);

        // Screenshot just before finishing test
        await page.screenshot({
          path: `e2e-results/${runId}/${runId}-target-gold-achieved.png`,
        });

        return;
      }
    } catch {
      // silent retry
    }

    await page.waitForTimeout(1000);
  }

  throw new Error(
    `Timed out waiting for gold. Gold amount dug before timeout: ${currentGold}`,
  );
});
