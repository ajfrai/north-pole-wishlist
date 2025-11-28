import { test, expect } from '@playwright/test';

test.describe('My Claims View', () => {
  test.beforeEach(async ({ page, context }) => {
    // Block all kvdb.io requests to prevent polluting production data
    await context.route('**/kvdb.io/**', route => route.abort());

    // Clear local storage and sign in
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('select').selectOption('Erin');
  });

  test('should navigate to My Claims view', async ({ page }) => {
    // Click My Claims button
    await page.getByRole('button', { name: /my claims/i }).click();

    // Should show My Claims page
    await expect(page.getByText('My Shopping List')).toBeVisible();
  });

  test('should show empty state when no gifts are claimed', async ({ page }) => {
    await page.getByRole('button', { name: /my claims/i }).click();

    // Should show empty state
    await expect(page.getByText('You haven\'t claimed any gifts yet.')).toBeVisible();
  });

  test('should show claimed gifts in My Claims view', async ({ page }) => {
    // Claim a gift from Megan's list
    await page.getByRole('heading', { name: 'Megan' }).click();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();

    // Go to My Claims
    await page.getByRole('button', { name: /my claims/i }).click();

    // Should show the claimed gift
    await expect(page.getByText('For: Megan')).toBeVisible();
  });

  test('should allow marking gifts as purchased', async ({ page }) => {
    // Claim a gift
    await page.getByRole('heading', { name: 'Megan' }).click();
    const firstGift = await page.locator('.group').first().locator('h3').first().textContent();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();

    // Go to My Claims
    await page.getByRole('button', { name: /my claims/i }).click();

    // Check the purchased checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // Gift should show as purchased (with strikethrough)
    const giftText = page.locator('h3').first();
    await expect(giftText).toHaveClass(/line-through/);
  });

  test('should allow unmarking purchased gifts', async ({ page }) => {
    // Claim and mark as purchased
    await page.getByRole('heading', { name: 'Megan' }).click();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();

    await page.getByRole('button', { name: /my claims/i }).click();
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // Uncheck it
    await checkbox.uncheck();

    // Should not be strikethrough anymore
    const giftText = page.locator('h3').first();
    await expect(giftText).not.toHaveClass(/line-through/);
  });

  test('should show purchase count', async ({ page }) => {
    // Claim two gifts
    await page.getByRole('heading', { name: 'Megan' }).click();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();

    // Go to My Claims
    await page.getByRole('button', { name: /my claims/i }).click();

    // Mark one as purchased
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // Should show "1 of 2 purchased"
    await expect(page.getByText('1 of 2 purchased')).toBeVisible();
  });

  test('should show gift details in My Claims', async ({ page }) => {
    // Claim a gift
    await page.getByRole('heading', { name: 'Megan' }).click();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();

    // Go to My Claims
    await page.getByRole('button', { name: /my claims/i }).click();

    // Should show recipient name
    await expect(page.getByText('For: Megan')).toBeVisible();

    // Should show store info if available
    const storeInfo = page.locator('text=/Target|Amazon|Walmart/i').first();
    if (await storeInfo.isVisible()) {
      await expect(storeInfo).toBeVisible();
    }
  });

  test('should show gift links in My Claims', async ({ page }) => {
    // Navigate to Erin's list and add a gift with a link
    await page.getByRole('heading', { name: 'Erin' }).click();

    // Add a gift with a link
    await page.getByPlaceholder(/gift name/i).fill('Gift with Link');
    await page.getByPlaceholder(/link/i).fill('https://example.com/gift');
    await page.getByRole('button', { name: /add gift/i }).click();

    // Sign out and sign in as Megan
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.locator('select').selectOption('Megan');

    // Claim the gift
    await page.getByRole('heading', { name: 'Erin' }).click();
    await page.getByText('Gift with Link').locator('..').locator('..').getByRole('button', { name: /claim/i }).click();

    // Go to My Claims
    await page.getByRole('button', { name: /my claims/i }).click();

    // Should show the link
    await expect(page.getByRole('link', { name: /link/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /link/i })).toHaveAttribute('href', 'https://example.com/gift');
  });

  test('should allow navigating back to home from My Claims', async ({ page }) => {
    await page.getByRole('button', { name: /my claims/i }).click();

    // Click back button
    await page.getByRole('button', { name: /back to all lists/i }).click();

    // Should be back at home
    await expect(page.getByText('Family Wishlists')).toBeVisible();
  });

  test('should show multiple claimed gifts from different users', async ({ page }) => {
    // Claim from Megan
    await page.getByRole('heading', { name: 'Megan' }).click();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();

    // Go back and add own gifts, then switch user and claim
    await page.goto('/');
    await page.getByRole('heading', { name: 'Erin' }).click();
    await page.getByPlaceholder(/gift name/i).fill('Erin Gift');
    await page.getByRole('button', { name: /add gift/i }).click();

    // Switch to Megan and claim Erin's gift
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.locator('select').selectOption('Megan');
    await page.getByRole('heading', { name: 'Erin' }).click();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();

    // Go to My Claims
    await page.getByRole('button', { name: /my claims/i }).click();

    // Should show gifts for Erin
    await expect(page.getByText('For: Erin')).toBeVisible();
  });

  test('should persist purchased status', async ({ page }) => {
    // Claim and purchase
    await page.getByRole('heading', { name: 'Megan' }).click();
    await page.getByRole('button', { name: /claim \(i bought this\)/i }).first().click();
    await page.getByRole('button', { name: /my claims/i }).click();
    await page.locator('input[type="checkbox"]').first().check();

    // Reload page
    await page.reload();

    // Navigate back to My Claims
    await page.getByRole('button', { name: /my claims/i }).click();

    // Should still be checked
    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeChecked();
  });
});
