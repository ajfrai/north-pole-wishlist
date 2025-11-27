import { test, expect } from '@playwright/test';

test.describe('Gift Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage and sign in
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('select').selectOption('Megan');
    await expect(page.getByText('Hi, Megan')).toBeVisible();
  });

  test('should display user\'s wishlist', async ({ page }) => {
    // Click on Megan's list
    await page.getByText('Megan', { exact: true }).click();

    // Should show the wishlist page
    await expect(page.getByText('Megan\'s Wishlist')).toBeVisible();
    await expect(page.getByText(/add a gift idea/i)).toBeVisible();
  });

  test('should add a new gift item', async ({ page }) => {
    // Navigate to Megan's list
    await page.getByText('Megan', { exact: true }).click();

    // Fill in the gift form
    await page.getByPlaceholder(/gift name/i).fill('Test Gift');
    await page.getByPlaceholder(/store/i).fill('Amazon');
    await page.getByPlaceholder(/price/i).fill('$25');
    await page.getByPlaceholder(/link/i).fill('https://amazon.com/test');
    await page.getByPlaceholder(/notes/i).fill('Size: Medium');

    // Check Black Friday Deal
    await page.getByText('Black Friday Deal').click();

    // Submit the form
    await page.getByRole('button', { name: /add gift/i }).click();

    // Should show the new gift in the list
    await expect(page.getByText('Test Gift')).toBeVisible();
    await expect(page.getByText('Amazon')).toBeVisible();
    await expect(page.getByText('$25')).toBeVisible();
    await expect(page.getByText('Black Friday')).toBeVisible();
    await expect(page.getByText('Size: Medium')).toBeVisible();
  });

  test('should show celebratory snowflakes after adding a gift', async ({ page }) => {
    await page.getByText('Megan', { exact: true }).click();

    // Add a gift
    await page.getByPlaceholder(/gift name/i).fill('Celebration Gift');
    await page.getByRole('button', { name: /add gift/i }).click();

    // Snowflakes should be visible (check for the snowflake container)
    const snowflakes = page.locator('.snowflake').first();
    await expect(snowflakes).toBeVisible({ timeout: 1000 });
  });

  test('should allow deleting a gift (owner only)', async ({ page }) => {
    await page.getByText('Megan', { exact: true }).click();

    // Add a gift to delete
    await page.getByPlaceholder(/gift name/i).fill('Gift to Delete');
    await page.getByRole('button', { name: /add gift/i }).click();

    // Hover over the item to reveal delete button
    const giftItem = page.locator('text=Gift to Delete').locator('..');
    await giftItem.hover();

    // Click delete button
    await giftItem.locator('button[title="Remove Item"]').click();

    // Gift should be removed
    await expect(page.getByText('Gift to Delete')).not.toBeVisible();
  });

  test('should allow editing a gift in dev mode', async ({ page }) => {
    // Navigate with dev mode
    await page.goto('/?dev=true');
    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    // Add a gift to edit
    await page.getByPlaceholder(/gift name/i).fill('Gift to Edit');
    await page.getByPlaceholder(/store/i).fill('Target');
    await page.getByRole('button', { name: /add gift/i }).click();

    // Hover to reveal edit button
    const giftItem = page.locator('text=Gift to Edit').locator('..');
    await giftItem.hover();

    // Click edit button
    await giftItem.locator('button[title="Edit Item"]').click();

    // Edit form should be visible
    await expect(page.getByText('Editing Item')).toBeVisible();

    // Change the name
    const nameInput = page.locator('input[placeholder="Gift Name"]');
    await nameInput.clear();
    await nameInput.fill('Edited Gift Name');

    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click();

    // Should show the updated name
    await expect(page.getByText('Edited Gift Name')).toBeVisible();
    await expect(page.getByText('Gift to Edit')).not.toBeVisible();
  });

  test('should not show edit button in normal mode', async ({ page }) => {
    await page.getByText('Megan', { exact: true }).click();

    // Add a gift
    await page.getByPlaceholder(/gift name/i).fill('Normal Mode Gift');
    await page.getByRole('button', { name: /add gift/i }).click();

    // Hover over the item
    const giftItem = page.locator('text=Normal Mode Gift').locator('..');
    await giftItem.hover();

    // Edit button should not exist (dev mode only)
    await expect(giftItem.locator('button[title="Edit Item"]')).not.toBeVisible();
  });

  test('should handle multiple gift items', async ({ page }) => {
    await page.getByText('Megan', { exact: true }).click();

    // Add multiple gifts
    const gifts = ['Gift 1', 'Gift 2', 'Gift 3'];

    for (const gift of gifts) {
      await page.getByPlaceholder(/gift name/i).fill(gift);
      await page.getByRole('button', { name: /add gift/i }).click();
      await expect(page.getByText(gift)).toBeVisible();
    }

    // All gifts should be visible
    for (const gift of gifts) {
      await expect(page.getByText(gift)).toBeVisible();
    }
  });

  test('should mark items as urgent', async ({ page }) => {
    await page.getByText('Megan', { exact: true }).click();

    // Add an urgent gift
    await page.getByPlaceholder(/gift name/i).fill('Urgent Gift');
    await page.getByText('Time Sensitive').click();
    await page.getByRole('button', { name: /add gift/i }).click();

    // Should show urgent badge
    await expect(page.getByText('Urgent')).toBeVisible();
  });
});
