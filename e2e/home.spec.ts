import { test, expect } from "@playwright/test";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";

test.describe("Login page tests", () => {
  let loginPage: LoginPage;

  // Setup before each test
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForPageLoad();
  });

  test("should load the login page", async ({ page }) => {
    // Verify the page loaded successfully
    await expect(page).toHaveURL(/.*localhost:3000\/auth\/login/);
  });

  test("should have the correct page title", async () => {
    // Verify the page title matches the expected format
    await loginPage.expectPageTitle("Login");
  });

  test("should have login form elements", async () => {
    // Verify that form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should have navigation links", async () => {
    // Check that register and forgot password links exist
    await expect(loginPage.registerLink).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();

    // Verify the href attributes
    const registerHref = await loginPage.registerLink.getAttribute("href");
    expect(registerHref).toBe("/auth/register");

    const forgotPasswordHref = await loginPage.forgotPasswordLink.getAttribute("href");
    expect(forgotPasswordHref).toBe("/auth/forgot-password");
  });

  test("should display the homepage", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectPageTitle("10xDevsCards");
  });
});
