import { Page } from 'puppeteer';

export async function typeWithRandomDelay(page: Page, selector: string, text: string) {
  await page.focus(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay: Math.floor(Math.random() * 100) + 50 });
  }
}
