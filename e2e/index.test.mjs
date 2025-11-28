import { test, expect, chromium } from "@playwright/test";

import { appUrl, getRunId, waitForSpriteGarden } from "./shared/index.mjs";

let browser;
let page;
let runId;

test.beforeAll(async () => {
  browser = await chromium.launch();
  runId = getRunId();

  // Enable video recording
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    recordVideo: { dir: `e2e-results/${runId}` },
  });

  page = await context.newPage();
});

test.afterAll(async () => {
  await page.close();
  await browser.close();
});

test("Check Selectors", async () => {
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await waitForSpriteGarden(page);

  const selectors = ["sprite-garden >>> #canvas"];
  for (const selector of selectors) {
    await expect(page.locator(selector)).toBeVisible({ timeout: 8000 });
  }
});
