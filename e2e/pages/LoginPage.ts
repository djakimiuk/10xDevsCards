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

    // Wait for either error message or redirect
    await Promise.race([
      this.errorAlert.waitFor({ state: "visible", timeout: 10000 }),
      this.page.waitForURL(/\/generate$/, { timeout: 10000 }),
    ]);
  }

  async waitForPageLoad() {
    await super.waitForPageLoad();
    await Promise.all([
      this.emailInput.waitFor({ state: "visible", timeout: 10000 }),
      this.passwordInput.waitFor({ state: "visible", timeout: 10000 }),
      this.submitButton.waitFor({ state: "visible", timeout: 10000 }),
    ]);
  }

  // Assertions
  async expectLoginError() {
    await expect(this.errorAlert).toBeVisible({ timeout: 10000 });
    const errorText = await this.errorAlert.textContent();
    expect(errorText).toBeTruthy();
  }

  async expectRegistrationSuccess() {
    await expect(this.registrationSuccessAlert).toBeVisible();
  }

  async expectRedirectAfterLogin() {
    // Checking that we're redirected away from login page
    await expect(this.emailInput).not.toBeVisible({ timeout: 5000 });
  }
}
