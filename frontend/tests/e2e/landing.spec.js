import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Grow with VEGGIE affiliate network/i })).toBeVisible();
});
