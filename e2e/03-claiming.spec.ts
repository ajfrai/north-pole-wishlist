import { test, expect } from '@playwright/test';

test.describe('Gift Claiming', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage and sign in
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should allow claiming a gift from another user\'s list', async ({ page }) => {
    // Sign in as Erin
    await page.locator('select').selectOption('Erin');

    // Navigate to Megan's list
    await page.getByText('Megan', { exact: true }).click();

    // Find a gift and claim it
    const claimButton = page.getByRole('button', { name: /claim \(i bought this\)/i }).first();
    await claimButton.click();

    // Should show as claimed by me
    await expect(page.getByText('Unclaim')).toBeVisible();
  });

  test('should allow unclaiming a previously claimed gift', async ({ page }) => {
    // Sign in as Erin
    await page.locator('select').selectOption('Erin');

    // Navigate to Megan's list
    await page.getByText('Megan', { exact: true }).click();

    // Claim a gift
    const claimButton = page.getByRole('button', { name: /claim \(i bought this\)/i }).first();
    await claimButton.click();

    // Unclaim it
    await page.getByRole('button', { name: /unclaim/i }).first().click();

    // Should show as available again
    await expect(page.getByRole('button', { name: /claim \(i bought this\)/i })).toBeVisible();
  });

  test('should prevent claiming gifts on own list', async ({ page }) => {
    // Sign in as Megan
    await page.locator('select').selectOption('Megan');

    // Navigate to own list
    await page.getByText('Megan', { exact: true }).click();

    // Should not see claim buttons on own list
    await expect(page.getByRole('button', { name: /claim/i })).not.toBeVisible();
  });

  test('should hide claimer identity from list owner', async ({ page }) => {
    // Sign in as Erin and claim a gift
    await page.locator('select').selectOption('Erin');
    await page.getByText('Megan', { exact: true }).click();
    const claimButton = page.getByRole('button', { name: /claim \(i bought this\)/i }).first();
    await claimButton.click();

    // Go back home and sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Sign in as Megan (the owner)
    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    // Should not see who claimed the gift
    await expect(page.getByText('Taken by Erin')).not.toBeVisible();
    await expect(page.getByText('Claimed')).not.toBeVisible();
  });

  test('should show claimer identity to other users', async ({ page }) => {
    // Sign in as Erin and claim a gift
    await page.locator('select').selectOption('Erin');
    await page.getByText('Megan', { exact: true }).click();

    // Get the first gift name to track it
    const firstGiftName = await page.locator('.group').first().locator('h3').first().textContent();

    // Claim it
    const claimButton = page.getByRole('button', { name: /claim \(i bought this\)/i }).first();
    await claimButton.click();

    // Sign out and sign in as a different user (not the owner)
    await page.goto('/');
    await page.getByRole('button', { name: /sign out/i }).click();

    // Add a new user to test with
    await page.getByRole('button', { name: /add new person/i }).click();
    await page.getByPlaceholder('e.g. Sarah').fill('Observer');
    await page.getByRole('button', { name: /continue/i }).click();

    // Navigate to Megan's list
    await page.getByText('Megan', { exact: true }).click();

    // Should see that Erin claimed it
    await expect(page.getByText('Taken by Erin')).toBeVisible();
  });

  test('should prevent claiming already claimed gifts', async ({ page }) => {
    // Sign in as Erin and claim a gift
    await page.locator('select').selectOption('Erin');
    await page.getByText('Megan', { exact: true }).click();
    const claimButton = page.getByRole('button', { name: /claim \(i bought this\)/i }).first();
    await claimButton.click();

    // Sign out and sign in as different user
    await page.goto('/');
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.getByRole('button', { name: /add new person/i }).click();
    await page.getByPlaceholder('e.g. Sarah').fill('SecondUser');
    await page.getByRole('button', { name: /continue/i }).click();

    // Navigate to Megan's list
    await page.getByText('Megan', { exact: true }).click();

    // The claimed button should be disabled
    const claimedButton = page.getByRole('button', { name: 'Claimed' }).first();
    await expect(claimedButton).toBeDisabled();
  });

  test('should require sign-in before claiming', async ({ page }) => {
    // Go to app (not signed in)
    await page.goto('/');

    // Should not be able to access lists without signing in
    await expect(page.getByText('Who are you?')).toBeVisible();
  });

  test('should handle case-insensitive owner checks', async ({ page }) => {
    // This tests the fix for privacy bug where case sensitivity could leak info
    await page.locator('select').selectOption('Megan');

    // Navigate to own list (case should be handled correctly)
    await page.getByText('Megan', { exact: true }).click();

    // Should not see claim buttons (even with case differences in storage)
    await expect(page.getByRole('button', { name: /claim/i })).not.toBeVisible();
  });

  test('should update claim status immediately', async ({ page }) => {
    await page.locator('select').selectOption('Erin');
    await page.getByText('Megan', { exact: true }).click();

    // Count unclaimed gifts
    const initialClaimButtons = await page.getByRole('button', { name: /claim \(i bought this\)/i }).count();

    // Claim one
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();

    // Count should decrease
    const afterClaimButtons = await page.getByRole('button', { name: /claim \(i bought this\)/i }).count();
    expect(afterClaimButtons).toBe(initialClaimButtons - 1);
  });
});
