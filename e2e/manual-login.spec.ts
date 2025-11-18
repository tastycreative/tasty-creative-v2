import { test } from '@playwright/test';

/**
 * Manual Login Helper
 * This test opens the app and pauses for manual Google login
 * Steps:
 * 1. Browser will open at homepage
 * 2. Click "Sign In" button
 * 3. Click "Sign in with Google"
 * 4. Complete Google OAuth login manually
 * 5. Navigate to /forms page
 * 6. Test your forms manually
 */

test('manual Google login and forms testing', async ({ page }) => {
  // Start at homepage
  await page.goto('/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Pause here - you can now:
  // 1. Click "Sign In" button in top right
  // 2. Click "Sign in with Google"
  // 3. Complete Google login
  // 4. Once logged in, manually navigate to /forms
  // 5. Test the forms page
  // 6. Click Resume button when done
  await page.pause();

  // After you're done testing, the test will complete
});
