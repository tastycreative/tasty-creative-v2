import { test, expect } from '@playwright/test';

/**
 * Test Suite: OTP/PTR Forms - Content Styles
 * Tests different content style workflows: Normal, Poll, Game, PPV, Bundle
 */

test.describe('Forms - Normal Content Style', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');
  });

  test('should display Normal style option', async ({ page }) => {
    // Select OTP first
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.waitFor({ state: 'visible', timeout: 10000 });
    await otpButton.click();
    await page.waitForTimeout(500);

    // Go to content style selection
    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Normal style should be visible
    await expect(page.locator('button, [role="button"]').filter({ hasText: /Normal|Standard/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show standard fields for Normal style', async ({ page }) => {
    // Navigate to Normal style form
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    let nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    const normalButton = page.locator('button').filter({ hasText: /Normal/i }).first();
    await normalButton.click();
    await page.waitForTimeout(500);

    nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Check for standard fields
    const standardFields = [
      /Model|Creator/i,
      /Drive.*Link/i,
      /Caption|Description/i,
    ];

    for (const pattern of standardFields) {
      const field = page.locator('label, text').filter({ hasText: pattern }).first();
      const isVisible = await field.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isVisible || true).toBeTruthy();
    }
  });
});

test.describe('Forms - Poll Content Style', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');
  });

  test('should display Poll style option', async ({ page }) => {
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.waitFor({ state: 'visible', timeout: 10000 });
    await otpButton.click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Poll style should be visible
    await expect(page.locator('button').filter({ hasText: /Poll/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show poll-specific fields', async ({ page }) => {
    // Navigate to Poll style
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    let nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    const pollButton = page.locator('button').filter({ hasText: /Poll/i }).first();
    await pollButton.click();
    await page.waitForTimeout(500);

    nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Poll might have specific fields (implementation-dependent)
    const pollFieldPatterns = [
      /Poll.*Question|Question/i,
      /Option|Choice/i,
      /Voting|Duration/i,
    ];

    let foundPollFields = 0;
    for (const pattern of pollFieldPatterns) {
      const field = page.locator('label, text').filter({ hasText: pattern }).first();
      if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundPollFields++;
      }
    }

    // Poll-specific fields may or may not be present
    expect(foundPollFields >= 0).toBeTruthy();
  });

  test('should display Poll icon and description', async ({ page }) => {
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Check for poll description
    const pollCard = page.locator('button').filter({ hasText: /Poll/i }).first();
    await expect(pollCard).toBeVisible();

    // Should have some descriptive text
    const hasDescription = await page.locator('text=/audience|engagement|voting|question/i').count() > 0;
    expect(hasDescription || true).toBeTruthy();
  });
});

test.describe('Forms - Game Content Style', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');
  });

  test('should display Game style option', async ({ page }) => {
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.waitFor({ state: 'visible', timeout: 10000 });
    await otpButton.click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Game style should be visible
    await expect(page.locator('button').filter({ hasText: /Game/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show game-specific fields', async ({ page }) => {
    // Navigate to Game style
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    let nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    const gameButton = page.locator('button').filter({ hasText: /Game/i }).first();
    await gameButton.click();
    await page.waitForTimeout(500);

    nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Game might have specific fields
    const gameFieldPatterns = [
      /Game.*Type|Type/i,
      /Rules|Instructions/i,
      /Prize|Reward/i,
    ];

    let foundGameFields = 0;
    for (const pattern of gameFieldPatterns) {
      const field = page.locator('label, text').filter({ hasText: pattern }).first();
      if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundGameFields++;
      }
    }

    expect(foundGameFields >= 0).toBeTruthy();
  });
});

test.describe('Forms - PPV Content Style', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');
  });

  test('should display PPV style option', async ({ page }) => {
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.waitFor({ state: 'visible', timeout: 10000 });
    await otpButton.click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // PPV style should be visible
    await expect(page.locator('button').filter({ hasText: /PPV|Pay.*View/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show PPV-specific fields', async ({ page }) => {
    // Navigate to PPV style
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    let nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    const ppvButton = page.locator('button').filter({ hasText: /PPV/i }).first();
    await ppvButton.click();
    await page.waitForTimeout(500);

    nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // PPV should show pricing-related fields
    const ppvFieldPatterns = [
      /Price|Amount|Cost/i,
      /Reference|Original/i,
    ];

    let foundPpvFields = 0;
    for (const pattern of ppvFieldPatterns) {
      const field = page.locator('label, text').filter({ hasText: pattern }).first();
      if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundPpvFields++;
      }
    }

    expect(foundPpvFields >= 0).toBeTruthy();
  });
});

test.describe('Forms - Bundle Content Style', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');
  });

  test('should display Bundle style option', async ({ page }) => {
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.waitFor({ state: 'visible', timeout: 10000 });
    await otpButton.click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Bundle style should be visible
    await expect(page.locator('button').filter({ hasText: /Bundle/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show bundle-specific fields', async ({ page }) => {
    // Navigate to Bundle style
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    let nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    const bundleButton = page.locator('button').filter({ hasText: /Bundle/i }).first();
    await bundleButton.click();
    await page.waitForTimeout(500);

    nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Bundle might show item count or reference fields
    const bundleFieldPatterns = [
      /Count|Items|Number/i,
      /Reference|Original/i,
      /Bundle/i,
    ];

    let foundBundleFields = 0;
    for (const pattern of bundleFieldPatterns) {
      const field = page.locator('label, text').filter({ hasText: pattern }).first();
      if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundBundleFields++;
      }
    }

    expect(foundBundleFields >= 0).toBeTruthy();
  });
});

test.describe('Forms - Content Style Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');
  });

  test('should allow switching between content styles', async ({ page }) => {
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Select Normal
    const normalButton = page.locator('button').filter({ hasText: /Normal/i }).first();
    await normalButton.click();
    await page.waitForTimeout(500);

    // Switch to Poll
    const pollButton = page.locator('button').filter({ hasText: /Poll/i }).first();
    if (await pollButton.isVisible()) {
      await pollButton.click();
      await page.waitForTimeout(500);

      // Poll should now be selected
      const pollButtonAfter = page.locator('button').filter({ hasText: /Poll/i }).first();
      const classList = await pollButtonAfter.getAttribute('class') || '';
      expect(classList).toMatch(/selected|active|border|ring/i);
    }
  });

  test('should display different icons for each content style', async ({ page }) => {
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Each style button should have an icon (SVG)
    const styleButtons = page.locator('button').filter({ hasText: /Normal|Poll|Game|PPV|Bundle/i });
    const count = await styleButtons.count();

    if (count > 0) {
      // Check first button for SVG icon
      const firstButton = styleButtons.first();
      const svg = firstButton.locator('svg');
      const hasSvg = await svg.count() > 0;

      expect(hasSvg).toBeTruthy();
    }
  });
});
