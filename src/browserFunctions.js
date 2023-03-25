import { sleep } from "./utils/sleep.js";

/**
 *
 * @param {import('puppeteer').Page} page
 * @param {string?} selector
 * @returns {Buffer}
 */
export const takeScreenshot = async (page, selector = "body") => {
  // const page = await browser.newPage();

  const element = await page.$(selector);

  const screenshotBuffer = await element.screenshot();

  return screenshotBuffer;
};

/**
 *
 * @param {import('puppeteer').Page} page
 * @param {string} username
 * @param {string} password
 * @returns {Promise<import('puppeteer').Page>}
 */
export const login = async (page, username, password) => {
  console.log("Going to login page...");
  await page.goto("https://railgallery.ru/login.php");

  console.log("Waiting for login form...");
  await page.waitForSelector("#username");

  console.log("Filling username field...");
  await page.focus("#username");
  await page.keyboard.type(username);

  console.log("Filling password field...");
  await page.focus("#password");
  await page.keyboard.type(password);

  console.log("Clicking login button...");
  await page.$eval("#loginbtn", (el) => el.click());
  await page.waitForNavigation();

  return page;
};

/**
 * @param {import('puppeteer').Page} page
 * @param {string} photoId
 * @returns {Promise<Buffer>}
 **/
export const likePhotoAndReturnScreenshot = async (page, photoId) => {
  const url = `https://railgallery.ru/photo/${photoId}/`;
  await page.goto(url);

  try {
    await page.waitForSelector(".vote_btn", {
      timeout: 5000,
    });
  } catch (e) {
    return null;
  }

  const likeButton = await page.$(".vote_btn");

  if (!likeButton) {
    return null;
  }

  if (
    !(await page.$eval(".vote_btn", (el) => el.classList.contains("voted")))
  ) {
    await page.$eval(".vote_btn", (el) => el.click());
    await sleep(1000);
  }

  return takeScreenshot(page);
};

/**
 *
 * @param {import('puppeteer').Page} page
 * @returns {Promise<number>}
 */
export const getLatestPhotoId = async (page) => {
  await page.goto("https://railgallery.ru/update.php?time=72");
  await page.waitForSelector('.p20p .pb_photo a[href^="/photo/"]');
  const latestPhotoIdUrl = await page.$eval(
    '.p20p .pb_photo a[href^="/photo/"]',
    (el) => el.getAttribute("href")
  );

  const numberRegex = /(\d+)/;

  const numberMatch = numberRegex.exec(latestPhotoIdUrl);
  if (!numberMatch) {
    return -1;
  }

  return parseInt(numberMatch[0]);
};
