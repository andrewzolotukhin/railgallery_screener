import puppeteer from "puppeteer";
import { resolve, join } from "path";
import { fileURLToPath } from "url";
import { writeFile } from "fs/promises";

import { config } from "../config.js";
import { readState, writeState } from "../stateUtils.js";
import {
  likePhotoAndReturnScreenshot,
  login,
  getLatestPhotoId,
} from "../browserFunctions.js";

const screenshotsFolderPath = resolve(
  fileURLToPath(import.meta.url),
  "../../../screenshots"
);

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox"],
  defaultViewport: {
    width: 1920,
    height: 1080,
  },
});

const page = await browser.newPage();

console.log("Logging in...");

await login(page, config.username, config.password);

let lastKnownPhotoId, lastProcessedPhotoId;
let iteration = 0;

console.log("Starting to make screenshots...");

do {
  const state = await readState();
  lastKnownPhotoId = state.lastKnownPhotoId;
  lastProcessedPhotoId = state.lastProcessedPhotoId;

  console.log(
    `Downloading ${lastProcessedPhotoId}/${lastKnownPhotoId} (left ${
      lastKnownPhotoId - lastProcessedPhotoId
    })`
  );

  if (iteration % 10 === 0) {
    // fetch latest photo ids only once in 10 iterations
    const latestPhotoId = await getLatestPhotoId(page);

    if (latestPhotoId > lastKnownPhotoId) {
      lastKnownPhotoId = latestPhotoId;
      await writeState({
        ...state,
        lastKnownPhotoId: latestPhotoId,
        lastProcessedPhotoId,
      });
    }
    iteration++;
    continue;
  }

  const screenshot = await likePhotoAndReturnScreenshot(
    page,
    lastProcessedPhotoId + 1
  );

  if (Buffer.isBuffer(screenshot)) {
    await writeFile(
      join(screenshotsFolderPath, `screenshot_${lastProcessedPhotoId + 1}.png`),
      screenshot
    );
  } else {
    console.log(`No photo for ${lastKnownPhotoId + 1}`);
  }
  lastProcessedPhotoId++;

  await writeState({
    ...state,
    lastKnownPhotoId,
    lastProcessedPhotoId,
  });
  iteration++;
} while (lastKnownPhotoId > lastProcessedPhotoId);

await page.close();
await browser.close();
