import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Takes a screenshot of an element with the specified ID
 */
export async function takeElementScreenshot(
  url: string,
  elementId: string,
  outputPath: string,
  options = {
    width: 1200,
    height: 1200,
    deviceScaleFactor: 2,
    timeout: 30000,
  }
) {
  let browser = null;

  try {
    // Launch a headless browser
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    // Create a new page
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: options.width,
      height: options.height,
      deviceScaleFactor: options.deviceScaleFactor,
    });

    // Navigate to the URL
    console.log(`Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: options.timeout,
    });

    // Wait for the element to be rendered
    console.log(`Waiting for element #${elementId}...`);
    await page.waitForSelector(`#${elementId}`, { timeout: options.timeout });

    // Get the element
    const element = await page.$(`#${elementId}`);

    if (!element) {
      throw new Error(`Element with ID #${elementId} not found`);
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Take screenshot
    console.log(`Taking screenshot of #${elementId}...`);
    await element.screenshot({
      path: outputPath,
      omitBackground: false,
      type: 'png',
    });

    console.log(`Screenshot saved to ${outputPath}`);

    // Close browser
    await browser.close();
    browser = null;

    return { success: true, path: outputPath };
  } catch (error) {
    console.error('Error taking screenshot:', error);

    // Make sure to close the browser if it's still open
    if (browser) {
      await browser.close();
    }

    throw error;
  }
}
