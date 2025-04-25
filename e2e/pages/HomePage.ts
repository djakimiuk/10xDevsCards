import { Page, Locator } from "@playwright/test";
import BasePage from "./BasePage";

/**
 * HomePage page object for testing the home page
 */
export default class HomePage extends BasePage {
  // Define locators for elements on the page
  readonly title: Locator;
  readonly navLinks: Locator;

  constructor(page: Page) {
    // Pass the page and the URL to the base class
    super(page, "/");

    // Initialize locators
    this.title = page.locator("h1");
    this.navLinks = page.locator("nav a");
  }

  /**
   * Override waitForPageLoad to check for specific elements on this page
   */
  async waitForPageLoad() {
    await this.title.waitFor();
    await super.waitForPageLoad();
  }

  /**
   * Get all navigation links
   */
  async getNavLinks() {
    return await this.navLinks.all();
  }

  /**
   * Check if the page title is correct
   */
  async expectPageTitle(expectedTitle: string) {
    await this.expectTextContent(this.title, expectedTitle);
  }

  /**
   * Navigate to a page via the navigation menu
   */
  async navigateTo(linkText: string) {
    const links = await this.getNavLinks();
    for (const link of links) {
      if ((await link.textContent()) === linkText) {
        await this.clickElement(link);
        break;
      }
    }
  }
}
