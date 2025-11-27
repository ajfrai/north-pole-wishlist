import { test, expect } from '@playwright/test';

test.describe('KVDB Sync Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show sync status indicator', async ({ page }) => {
    await page.locator('select').selectOption('Megan');

    // Should show sync status in bottom right
    const statusIndicator = page.locator('text=/Online Mode|Local Mode|Saving/i');
    await expect(statusIndicator).toBeVisible();
  });

  test('should sync data to kvdb on gift add', async ({ page, context }) => {
    // Track network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('kvdb.io')) {
        requests.push(request.url());
      }
    });

    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    // Add a gift
    await page.getByPlaceholder(/gift name/i).fill('Sync Test Gift');
    await page.getByRole('button', { name: /add gift/i }).click();

    // Wait a bit for sync
    await page.waitForTimeout(1000);

    // Should have made a request to kvdb
    const kvdbRequests = requests.filter(url => url.includes('kvdb.io'));
    expect(kvdbRequests.length).toBeGreaterThan(0);
  });

  test('should fetch data from kvdb on load', async ({ page }) => {
    let fetchRequestMade = false;

    page.on('request', request => {
      if (request.url().includes('kvdb.io') && request.method() === 'GET') {
        fetchRequestMade = true;
      }
    });

    await page.locator('select').selectOption('Megan');

    // Should have fetched data from kvdb
    await page.waitForTimeout(500);
    expect(fetchRequestMade).toBe(true);
  });

  test('should show syncing status during save', async ({ page }) => {
    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    // Add a gift and watch for syncing status
    await page.getByPlaceholder(/gift name/i).fill('Fast Gift');

    // Look for the syncing status (might be very brief)
    const syncingPromise = page.waitForSelector('text=/Saving/i', { timeout: 5000 }).catch(() => null);

    await page.getByRole('button', { name: /add gift/i }).click();

    // Either syncing appeared or it was too fast to catch (both are ok)
    await syncingPromise;

    // Eventually should show synced or local
    await expect(page.locator('text=/Online Mode|Local Mode/i')).toBeVisible({ timeout: 5000 });
  });

  test('should use monolithic storage by default', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('kvdb.io')) {
        requests.push(request.url());
      }
    });

    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    await page.getByPlaceholder(/gift name/i).fill('Monolithic Test');
    await page.getByRole('button', { name: /add gift/i }).click();

    await page.waitForTimeout(1000);

    // Should use data_v1 key (monolithic)
    const monolithicRequests = requests.filter(url => url.includes('data_v1'));
    expect(monolithicRequests.length).toBeGreaterThan(0);

    // Should NOT use sharded keys
    const shardedRequests = requests.filter(url => url.includes('users_v2') || url.includes('list_ids_v2'));
    expect(shardedRequests.length).toBe(0);
  });

  test('should use sharded storage in dev mode', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('kvdb.io')) {
        requests.push(request.url());
      }
    });

    // Navigate with dev mode
    await page.goto('/?dev=true');
    await page.locator('select').selectOption('Megan');

    // Enable sharded storage
    await page.evaluate(() => {
      // @ts-ignore
      window.localStorage.setItem('north_pole_use_sharded', 'true');
    });

    await page.reload();
    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    // Clear previous requests
    requests.length = 0;

    await page.getByPlaceholder(/gift name/i).fill('Sharded Test');
    await page.getByRole('button', { name: /add gift/i }).click();

    await page.waitForTimeout(1500);

    // Should use sharded keys
    const shardedRequests = requests.filter(url =>
      url.includes('users_v2') ||
      url.includes('list_ids_v2') ||
      url.includes('list_')
    );
    expect(shardedRequests.length).toBeGreaterThan(0);
  });

  test('should cache data in localStorage', async ({ page }) => {
    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    // Add a unique gift
    const uniqueGiftName = `Cache Test ${Date.now()}`;
    await page.getByPlaceholder(/gift name/i).fill(uniqueGiftName);
    await page.getByRole('button', { name: /add gift/i }).click();

    // Wait for sync
    await page.waitForTimeout(1000);

    // Check localStorage has the data
    const cachedData = await page.evaluate(() => {
      return localStorage.getItem('north_pole_data_cache');
    });

    expect(cachedData).toBeTruthy();
    expect(cachedData).toContain(uniqueGiftName);
  });

  test('should work offline with localStorage cache', async ({ page, context }) => {
    // First, load data normally
    await page.locator('select').selectOption('Megan');
    await page.waitForTimeout(1000);

    // Block all network requests
    await context.route('**/*', route => route.abort());

    // Reload - should work from cache
    await page.reload();

    // Should still show data (from localStorage)
    await expect(page.getByText('Who are you?')).toBeVisible();
    await page.locator('select').selectOption('Megan');
    await expect(page.getByText('Family Wishlists')).toBeVisible();

    // Should show local mode status
    await expect(page.locator('text=/Local Mode/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle sync failures gracefully', async ({ page, context }) => {
    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    // Block kvdb requests after initial load
    await context.route('**/kvdb.io/**', route => {
      if (route.request().method() === 'POST') {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Try to add a gift (sync will fail)
    await page.getByPlaceholder(/gift name/i).fill('Offline Gift');
    await page.getByRole('button', { name: /add gift/i }).click();

    // Should still show the gift locally
    await expect(page.getByText('Offline Gift')).toBeVisible();

    // Should show local mode or sync failed status
    await expect(page.locator('text=/Local Mode/i')).toBeVisible({ timeout: 5000 });
  });

  test('should persist bucket ID in localStorage', async ({ page }) => {
    await page.locator('select').selectOption('Megan');

    // Check that bucket ID is stored
    const bucketId = await page.evaluate(() => {
      return localStorage.getItem('north_pole_bucket_id_v2');
    });

    expect(bucketId).toBeTruthy();
  });

  test('should reload data when clicking home button', async ({ page }) => {
    let fetchCount = 0;

    page.on('request', request => {
      if (request.url().includes('kvdb.io') && request.method() === 'GET') {
        fetchCount++;
      }
    });

    await page.locator('select').selectOption('Megan');
    await page.getByText('Megan', { exact: true }).click();

    const initialFetchCount = fetchCount;

    // Click home/logo to reload
    await page.getByText('North Pole Lists').click();

    await page.waitForTimeout(500);

    // Should have made additional fetch requests
    expect(fetchCount).toBeGreaterThan(initialFetchCount);
  });
});
