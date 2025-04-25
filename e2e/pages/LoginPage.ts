import { Page, expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page, "/auth/login");
  }

  // Locators
  get emailInput() {
    return this.page.locator('[data-test-id="login-email-input"]');
  }

  get passwordInput() {
    return this.page.locator('[data-test-id="login-password-input"]');
  }

  get submitButton() {
    return this.page.locator('[data-test-id="login-submit-button"]');
  }

  get errorAlert() {
    return this.page.locator('[data-test-id="login-error-alert"]');
  }

  get registrationSuccessAlert() {
    return this.page.locator('[data-test-id="registration-success-alert"]');
  }

  get registerLink() {
    return this.page.locator('[data-test-id="register-link"]');
  }

  get forgotPasswordLink() {
    return this.page.locator('[data-test-id="forgot-password-link"]');
  }

  // Actions
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForPageLoad() {
    await super.waitForPageLoad();
    await this.emailInput.waitFor({ state: "visible" });
  }

  // Assertions
  async expectLoginError() {
    await expect(this.errorAlert).toBeVisible();
  }

  async expectRegistrationSuccess() {
    await expect(this.registrationSuccessAlert).toBeVisible();
  }

  async expectRedirectAfterLogin() {
    // Checking that we're redirected away from login page
    await expect(this.emailInput).not.toBeVisible({ timeout: 5000 });
  }
}
