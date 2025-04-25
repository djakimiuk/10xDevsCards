import { test, expect } from "@playwright/test";
import HomePage from "./pages/HomePage";

test.describe("Home Page", () => {
  test("should load the home page correctly", async ({ page }) => {
    // Create a new instance of the HomePage page object
    const homePage = new HomePage(page);

    // Navigate to the home page
    await homePage.goto();

    // Wait for the page to load
    await homePage.waitForPageLoad();

    // Take a screenshot for visual comparison
    await expect(page).toHaveScreenshot("home-page.png");
  });

  test("should have the correct title", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Example of checking the title - adjust based on your actual content
    await homePage.expectPageTitle("10x Devs Cards");
  });

  test("should have navigation links", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Check if navigation links exist
    const navLinks = await homePage.getNavLinks();
    expect(navLinks.length).toBeGreaterThan(0);
  });
});
