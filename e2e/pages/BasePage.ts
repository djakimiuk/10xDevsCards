import { Page, Locator, expect } from "@playwright/test";

/**
 * Base Page Object Model class that all page objects should extend
 */
export default abstract class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  /**
   * Navigate to the page
   */
  async goto() {
    // Playwright automatycznie doda baseURL z konfiguracji
    await this.page.goto(this.url);
  }

  /**
   * Wait for the page to be loaded
   * Override in specific page classes
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Take a screenshot of the current state
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `./screenshots/${name}.png` });
  }

  /**
   * Helper to fill a form field
   */
  async fillField(locator: Locator, value: string) {
    await locator.fill(value);
  }

  /**
   * Helper to click a button or link
   */
  async clickElement(locator: Locator) {
    await locator.click();
  }

  /**
   * Check if an element is visible
   */
  async isVisible(locator: Locator) {
    return await locator.isVisible();
  }

  /**
   * Assert text content of an element
   */
  async expectTextContent(locator: Locator, text: string) {
    await expect(locator).toContainText(text);
  }
}
