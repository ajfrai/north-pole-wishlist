import { test, expect } from '@playwright/test';

test.describe('Sign-in Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show sign-in page when no user is selected', async ({ page }) => {
    await page.goto('/');

    // Check that sign-in page is visible
    await expect(page.getByText('Who are you?')).toBeVisible();
    await expect(page.getByText('Select your name')).toBeVisible();

    // Check that the dropdown exists
    await expect(page.locator('select')).toBeVisible();
  });

  test('should allow selecting an existing user', async ({ page }) => {
    await page.goto('/');

    // Select a user from dropdown
    await page.locator('select').selectOption('Megan');

    // Should be redirected to home page
    await expect(page.getByText('Family Wishlists')).toBeVisible();
    await expect(page.getByText('Hi, Megan')).toBeVisible();
  });

  test('should allow adding a new person', async ({ page }) => {
    await page.goto('/');

    // Click "Add New Person" button
    await page.getByRole('button', { name: /add new person/i }).click();

    // Fill in the name
    await page.getByPlaceholder('e.g. Sarah').fill('TestUser');

    // Submit the form
    await page.getByRole('button', { name: /continue/i }).click();

    // Should be signed in as the new user
    await expect(page.getByText('Hi, TestUser')).toBeVisible();
    await expect(page.getByText('Family Wishlists')).toBeVisible();
  });

  test('should persist user selection in localStorage', async ({ page }) => {
    await page.goto('/');

    // Sign in as a user
    await page.locator('select').selectOption('Erin');
    await expect(page.getByText('Hi, Erin')).toBeVisible();

    // Reload the page
    await page.reload();

    // User should still be signed in
    await expect(page.getByText('Hi, Erin')).toBeVisible();
  });

  test('should allow signing out', async ({ page }) => {
    await page.goto('/');
    await page.locator('select').selectOption('Megan');

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Should be back at sign-in page
    await expect(page.getByText('Who are you?')).toBeVisible();
  });

  test('should prevent accessing app without signing in', async ({ page }) => {
    await page.goto('/');

    // Should not see the main app content
    await expect(page.getByText('Family Wishlists')).not.toBeVisible();

    // Should only see sign-in page
    await expect(page.getByText('Who are you?')).toBeVisible();
  });
});
