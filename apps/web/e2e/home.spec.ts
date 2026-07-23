import { expect, test } from '@playwright/test';

test('homepage loads and links to search', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /building trust in real estate/i })).toBeVisible();
  await page.getByRole('link', { name: /search properties/i }).click();
  await expect(page).toHaveURL(/\/search$/);
});

// Validates middleware.ts end to end, not just its unit-level logic —
// an unauthenticated visitor must never reach a role-gated route group.
test('an unauthenticated visitor is redirected away from a protected route', async ({ page }) => {
  await page.goto('/crm');
  await expect(page).toHaveURL(/\/login/);
});
