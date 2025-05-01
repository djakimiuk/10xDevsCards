import { Page } from "@playwright/test";
import BasePage from "./BasePage";

/**
 * Reprezentuje stronę autoryzacji
 */
export default class AuthPage extends BasePage {
  // URL strony
  readonly url = "/auth/login";

  // Selektory elementów
  readonly emailInputSelector = 'input[type="email"]';
  readonly passwordInputSelector = 'input[type="password"]';
  readonly submitButtonSelector = 'button[type="submit"]';
  readonly registerLinkSelector = 'a[href*="register"]';
  readonly forgotPasswordLinkSelector = 'a[href*="forgot-password"]';
  readonly errorMessageSelector = '[role="alert"]';

  // Metody dostępu do elementów
  get emailInput() {
    return this.page.locator(this.emailInputSelector);
  }

  get passwordInput() {
    return this.page.locator(this.passwordInputSelector);
  }

  get submitButton() {
    return this.page.locator(this.submitButtonSelector);
  }

  get registerLink() {
    return this.page.locator(this.registerLinkSelector);
  }

  get forgotPasswordLink() {
    return this.page.locator(this.forgotPasswordLinkSelector);
  }

  get errorMessage() {
    return this.page.locator(this.errorMessageSelector);
  }

  /**
   * Loguje użytkownika używając podanych danych
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Sprawdza, czy formularz logowania jest widoczny
   */
  async isLoginFormVisible() {
    await this.emailInput.isVisible();
    await this.passwordInput.isVisible();
    await this.submitButton.isVisible();
    return true;
  }

  /**
   * Oczekuje na pojawienie się komunikatu o błędzie logowania
   */
  async expectLoginError() {
    await this.errorMessage.waitFor({ state: "visible" });
    return this.errorMessage;
  }

  /**
   * Czeka na załadowanie strony
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.emailInput.waitFor({ state: "visible" });
  }
}
