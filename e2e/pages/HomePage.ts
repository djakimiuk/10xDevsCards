import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import BasePage from "./BasePage";

/**
 * LoginPage page object for testing the login page
 */
export default class LoginPage extends BasePage {
  // Define locators for elements on the page
  readonly pageTitle: Locator;
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    // Pass the page and the URL to the base class
    super(page, "/auth/login");

    // Initialize locators
    this.pageTitle = page.locator("title");
    this.loginForm = page.locator("form");
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-test-id="login-error"]');
    this.forgotPasswordLink = page.locator('a[href="/auth/forgot-password"]');
    this.registerLink = page.locator('a[href="/auth/register"]');
  }

  /**
   * Override waitForPageLoad to check for specific elements on this page
   */
  async waitForPageLoad() {
    await this.loginForm.waitFor();
    await super.waitForPageLoad();
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Check if the page title is correct
   */
  async expectPageTitle(expectedTitle: string) {
    await expect(this.pageTitle).toHaveText(expectedTitle);
  }

  /**
   * Check if the login form is displayed
   */
  async expectLoginFormVisible() {
    await expect(this.loginForm).toBeVisible();
  }

  /**
   * Navigate to register page
   */
  async goToRegister() {
    await this.registerLink.click();
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Debug method to log all links on the page
   */
  async debugLinks() {
    // Log the HTML structure to help debug navigation issues
    const html = await this.page.content();
    console.log("HTML Structure:", html.substring(0, 500) + "...");

    // Log all links with their text and href
    const allLinks = await this.page.locator("a").all();
    for (let i = 0; i < allLinks.length; i++) {
      const text = await allLinks[i].textContent();
      const href = await allLinks[i].getAttribute("href");
      console.log(`Link ${i}: Text="${text}", href="${href}"`);
    }
  }
}
