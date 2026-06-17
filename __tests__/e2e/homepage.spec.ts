import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the hero section with correct headline', async ({ page }) => {
    await page.goto('/');
    
    const headline = page.getByText('LESS SCREEN TIME. MORE CREATIVE TIME.');
    await expect(headline).toBeVisible();
  });

  test('should have Shop Now CTA that navigates to shop page', async ({ page }) => {
    await page.goto('/');
    
    const shopNowButton = page.getByRole('link', { name: /shop now/i });
    await expect(shopNowButton).toBeVisible();
    await shopNowButton.click();
    
    await expect(page).toHaveURL('/shop');
  });

  test('should have Birthday Packages CTA that navigates correctly', async ({ page }) => {
    await page.goto('/');
    
    const birthdayButton = page.getByRole('link', { name: /birthday packages/i });
    await expect(birthdayButton).toBeVisible();
    await birthdayButton.click();
    
    await expect(page).toHaveURL('/birthday-packages');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const headline = page.getByText('LESS SCREEN TIME. MORE CREATIVE TIME.');
    await expect(headline).toBeVisible();
  });
});
