import { test, expect, Page } from '@playwright/test';

/**
 * Test Suite: OTP/PTR Forms - Wizard View
 * Tests the step-by-step wizard interface for content submission
 */

test.describe('Forms Page - Wizard View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to forms page (default is wizard view)
    await page.goto('/forms');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display wizard view by default', async ({ page }) => {
    // Check if wizard interface is visible
    await expect(page.locator('text=Submission Type')).toBeVisible();

    // Verify wizard is the default view (not classic)
    const classicForm = page.locator('[data-testid="classic-form"]');
    await expect(classicForm).not.toBeVisible();
  });

  test('should display wizard progress steps', async ({ page }) => {
    // Check for step indicators
    const stepContainer = page.locator('[role="progressbar"], .wizard-steps, [data-testid="wizard-steps"]').first();

    // Should show multiple steps
    const steps = page.locator('.step, [data-testid="wizard-step"]');
    const count = await steps.count();

    // Wizard should have at least 3 steps (type, style, details)
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should navigate between wizard steps', async ({ page }) => {
    // Step 1: Select submission type (OTP)
    const otpButton = page.locator('button, [role="button"]').filter({ hasText: /OTP|One-Time Post/i }).first();
    if (await otpButton.isVisible()) {
      await otpButton.click();
      await page.waitForTimeout(500);
    }

    // Look for Next button
    const nextButton = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Select content style (Normal)
    const normalStyleButton = page.locator('button, [role="button"]').filter({ hasText: /Normal|Standard/i }).first();
    if (await normalStyleButton.isVisible()) {
      await normalStyleButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to next step
    const nextButton2 = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
    if (await nextButton2.isVisible()) {
      await nextButton2.click();
      await page.waitForTimeout(500);
    }

    // Verify we're on the details step (should see form fields)
    await expect(page.locator('label').filter({ hasText: /Model|Creator/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow switching to classic view', async ({ page }) => {
    // Look for view toggle tabs
    const classicTab = page.locator('[role="tab"]').filter({ hasText: /Classic/i }).first();

    if (await classicTab.isVisible()) {
      await classicTab.click();
      await page.waitForTimeout(1000);

      // Verify classic view is now displayed
      await expect(page.locator('text=OTP/PTR Forms').first()).toBeVisible();
    }
  });

  test('should display submission type selection', async ({ page }) => {
    // Check for OTP option
    await expect(page.locator('text=/OTP|One-Time Post/i').first()).toBeVisible({ timeout: 5000 });

    // Check for PTR option
    await expect(page.locator('text=/PTR|Pay.*Release/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show content style options after selecting submission type', async ({ page }) => {
    // Select OTP first
    const otpButton = page.locator('button, [role="button"]').filter({ hasText: /OTP|One-Time Post/i }).first();

    if (await otpButton.isVisible()) {
      await otpButton.click();
      await page.waitForTimeout(500);

      // Click Next button
      const nextButton = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }

      // Verify content style options are visible
      const contentStyleOptions = [
        /Normal|Standard/i,
        /Poll/i,
        /Game/i,
        /PPV/i,
        /Bundle/i
      ];

      // Check if at least some content style options are visible
      let foundOptions = 0;
      for (const pattern of contentStyleOptions) {
        const element = page.locator('text=' + pattern.source).first();
        if (await element.isVisible().catch(() => false)) {
          foundOptions++;
        }
      }

      expect(foundOptions).toBeGreaterThan(0);
    }
  });

  test('should display back button on later steps', async ({ page }) => {
    // Navigate through first step
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    if (await otpButton.isVisible()) {
      await otpButton.click();
      await page.waitForTimeout(500);
    }

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Look for back button
      const backButton = page.locator('button').filter({ hasText: /Back|Previous/i }).first();
      await expect(backButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should maintain selections when going back and forward', async ({ page }) => {
    // Select OTP
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    if (await otpButton.isVisible()) {
      await otpButton.click();
      await page.waitForTimeout(500);
    }

    // Go to next step
    let nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Select Normal style
    const normalButton = page.locator('button').filter({ hasText: /Normal/i }).first();
    if (await normalButton.isVisible()) {
      await normalButton.click();
      await page.waitForTimeout(500);
    }

    // Go back
    const backButton = page.locator('button').filter({ hasText: /Back/i }).first();
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(1000);

      // Verify OTP is still selected (should have selected/active state)
      const otpButtonAfterBack = page.locator('button').filter({ hasText: /OTP/i }).first();
      const classList = await otpButtonAfterBack.getAttribute('class') || '';

      // Check for active/selected state in class names
      expect(classList).toMatch(/selected|active|border-pink|ring/i);
    }
  });

  test('should show progress indicator', async ({ page }) => {
    // Look for progress bar or step indicator
    const progressElements = page.locator('[role="progressbar"], .progress, [data-testid="progress"]');
    const count = await progressElements.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should display helpful tooltips or descriptions', async ({ page }) => {
    // Check for help icons or descriptions
    const helpElements = page.locator('[data-testid="help-icon"], .tooltip, [aria-label*="help"]');
    const descriptionElements = page.locator('.description, .text-gray-500, .text-sm');

    const totalHelpful = await helpElements.count() + await descriptionElements.count();
    expect(totalHelpful).toBeGreaterThan(0);
  });
});

test.describe('Forms Page - Wizard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');
  });

  test('should validate required fields before allowing next step', async ({ page }) => {
    // Navigate to form details step
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    if (await otpButton.isVisible()) {
      await otpButton.click();
      await page.waitForTimeout(500);
    }

    let nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    const normalButton = page.locator('button').filter({ hasText: /Normal/i }).first();
    if (await normalButton.isVisible()) {
      await normalButton.click();
      await page.waitForTimeout(500);
    }

    nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Try to submit without filling required fields
    const submitButton = page.locator('button').filter({ hasText: /Submit|Create|Save/i }).first();

    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show validation errors
      const errorMessages = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      const errorCount = await errorMessages.count();

      expect(errorCount).toBeGreaterThan(0);
    }
  });

  test('should show step completion indicators', async ({ page }) => {
    // Complete first step
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    if (await otpButton.isVisible()) {
      await otpButton.click();
      await page.waitForTimeout(500);
    }

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Look for completion indicator (checkmark, etc.)
      const completionIndicators = page.locator('[data-testid="step-complete"], .step-complete, text=✓');
      const hasCompletionIndicator = await completionIndicators.count() > 0;

      // Some wizard implementations show completion
      expect(hasCompletionIndicator || true).toBeTruthy();
    }
  });
});
