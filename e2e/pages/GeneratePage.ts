import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import BasePage from "./BasePage";

export default class GeneratePage extends BasePage {
  constructor(page: Page) {
    super(page, "/generate");
  }

  // Locators
  get sourceTextInput() {
    return this.page.locator('[data-test-id="source-text-input"]');
  }

  get generateButton() {
    return this.page.locator('[data-test-id="generate-button"]');
  }

  get characterCount() {
    return this.page.locator('[data-test-id="character-count"]');
  }

  get sourceTextError() {
    return this.page.locator('[data-test-id="source-text-error"]');
  }

  get generationLoading() {
    return this.page.locator('[data-test-id="generation-loading"]');
  }

  get generationError() {
    return this.page.locator('[data-test-id="generation-error"]');
  }

  get candidatesGrid() {
    return this.page.locator('[data-test-id="candidates-grid"]');
  }

  candidateCard(id: string) {
    return this.page.locator(`[data-test-id="candidate-card-${id}"]`);
  }

  candidateAcceptButton(id: string) {
    return this.page.locator(`[data-test-id="candidate-accept-button-${id}"]`);
  }

  candidateRejectButton(id: string) {
    return this.page.locator(`[data-test-id="candidate-reject-button-${id}"]`);
  }

  candidateEditButton(id: string) {
    return this.page.locator(`[data-test-id="candidate-edit-button-${id}"]`);
  }

  get saveAllButton() {
    return this.page.locator('[data-test-id="save-all-button"]');
  }

  get saveAcceptedButton() {
    return this.page.locator('[data-test-id="save-accepted-button"]');
  }

  // Actions
  async enterSourceText(text: string) {
    await this.sourceTextInput.fill(text);
  }

  async clickGenerate() {
    await this.generateButton.click();
  }

  async generateFlashcards(text: string) {
    await this.enterSourceText(text);
    await this.clickGenerate();
  }

  async acceptCandidate(id: string) {
    await this.candidateAcceptButton(id).click();
  }

  async rejectCandidate(id: string) {
    await this.candidateRejectButton(id).click();
    // Confirm rejection in the dialog
    await this.page.locator('[data-test-id="reject-confirm-button"]').click();
  }

  async saveAcceptedFlashcards() {
    await this.saveAcceptedButton.click();
  }

  async saveAllFlashcards() {
    await this.saveAllButton.click();
  }

  // Assertions
  async expectCandidatesVisible() {
    await expect(this.candidatesGrid).toBeVisible({ timeout: 30000 });
  }

  async expectGenerationLoading() {
    await expect(this.generationLoading).toBeVisible();
  }

  async expectSourceTextError() {
    await expect(this.sourceTextError).toBeVisible();
  }

  async waitForGenerationComplete() {
    // Wait for loading to disappear with extended timeout
    await expect(this.generationLoading).not.toBeVisible({ timeout: 60000 });
    // And make sure candidates are visible or error is shown
    await this.page.waitForSelector('[data-test-id="candidates-grid"], [data-test-id="generation-error"]', {
      timeout: 30000,
    });
  }
}
