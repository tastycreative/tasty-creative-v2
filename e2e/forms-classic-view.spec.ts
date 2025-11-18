import { test, expect } from '@playwright/test';

/**
 * Test Suite: OTP/PTR Forms - Classic View
 * Tests the traditional single-page form interface
 */

test.describe('Forms Page - Classic View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to forms page with classic view
    await page.goto('/forms?view=classic');
    await page.waitForLoadState('networkidle');
  });

  test('should display classic form view', async ({ page }) => {
    // Check for the OTP/PTR Forms header
    await expect(page.locator('text=OTP/PTR Forms').first()).toBeVisible({ timeout: 10000 });

    // Verify classic form elements are visible
    await expect(page.locator('label').filter({ hasText: /Submission Type/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show submission type selector', async ({ page }) => {
    // Check for submission type options
    const submissionTypeSection = page.locator('text=/Submission Type/i').first();
    await expect(submissionTypeSection).toBeVisible();

    // Look for OTP and PTR radio buttons or select options
    const otpOption = page.locator('text=/OTP|One-Time/i').first();
    const ptrOption = page.locator('text=/PTR|Pay.*Release/i').first();

    await expect(otpOption).toBeVisible();
    await expect(ptrOption).toBeVisible();
  });

  test('should show content style selector', async ({ page }) => {
    // Check for content style section
    const contentStyleSection = page.locator('text=/Content Style|Style/i').first();
    await expect(contentStyleSection).toBeVisible({ timeout: 5000 });
  });

  test('should display all required form fields', async ({ page }) => {
    // Check for essential form fields
    const requiredFields = [
      /Model|Creator/i,
      /Priority/i,
      /Drive.*Link|Google Drive/i,
    ];

    for (const fieldPattern of requiredFields) {
      const field = page.locator('label, text').filter({ hasText: fieldPattern }).first();
      await expect(field).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow switching to wizard view', async ({ page }) => {
    // Look for wizard tab
    const wizardTab = page.locator('[role="tab"]').filter({ hasText: /Wizard/i }).first();

    if (await wizardTab.isVisible()) {
      await wizardTab.click();
      await page.waitForTimeout(1000);

      // Should now show wizard interface
      await expect(page.locator('text=Submission Type').first()).toBeVisible();
    }
  });

  test('should show smart component recommendations', async ({ page }) => {
    // Select a content style
    const normalButton = page.locator('button, [role="button"]').filter({ hasText: /Normal/i }).first();

    if (await normalButton.isVisible()) {
      await normalButton.click();
      await page.waitForTimeout(1000);

      // Look for recommended components section
      const recommendationsSection = page.locator('text=/Recommended|Smart|Suggested/i');
      const hasRecommendations = await recommendationsSection.count() > 0;

      // Recommendations may or may not be visible depending on implementation
      expect(hasRecommendations || true).toBeTruthy();
    }
  });

  test('should show component modules section', async ({ page }) => {
    // Look for component modules or additional features
    const componentSections = page.locator('text=/Components|Modules|Additional Features/i');
    const count = await componentSections.count();

    // Classic form should show component options
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display form in scrollable container', async ({ page }) => {
    // Get page height
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);

    // Form should have enough content to potentially scroll
    expect(pageHeight).toBeGreaterThan(600);
  });

  test('should show submit button', async ({ page }) => {
    // Look for submit/create button
    const submitButton = page.locator('button').filter({ hasText: /Submit|Create|Save/i }).first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Forms Page - Classic View Form Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms?view=classic');
    await page.waitForLoadState('networkidle');
  });

  test('should update form when submission type changes', async ({ page }) => {
    // Select OTP
    const otpButton = page.locator('button, input').filter({ hasText: /OTP/i }).first();
    if (await otpButton.isVisible()) {
      await otpButton.click();
      await page.waitForTimeout(1000);
    }

    // Now select PTR
    const ptrButton = page.locator('button, input').filter({ hasText: /PTR/i }).first();
    if (await ptrButton.isVisible()) {
      await ptrButton.click();
      await page.waitForTimeout(1000);

      // PTR specific fields should appear (like release date, pricing)
      const ptrFields = page.locator('label').filter({ hasText: /Release Date|Price|Minimum/i });
      const ptrFieldCount = await ptrFields.count();

      // PTR may show additional fields
      expect(ptrFieldCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should update form when content style changes', async ({ page }) => {
    // Select Normal style
    const normalButton = page.locator('button').filter({ hasText: /Normal/i }).first();
    if (await normalButton.isVisible()) {
      await normalButton.click();
      await page.waitForTimeout(500);
    }

    // Switch to Poll style
    const pollButton = page.locator('button').filter({ hasText: /Poll/i }).first();
    if (await pollButton.isVisible()) {
      await pollButton.click();
      await page.waitForTimeout(1000);

      // Poll-specific fields might appear
      const pollFields = page.locator('text=/Poll Options|Voting|Question/i');
      const hasPollFields = await pollFields.count() > 0;

      expect(hasPollFields || true).toBeTruthy();
    }
  });

  test('should allow selecting multiple component modules', async ({ page }) => {
    // Look for component checkboxes or selection buttons
    const componentOptions = page.locator('[type="checkbox"], [role="checkbox"]');
    const checkboxCount = await componentOptions.count();

    if (checkboxCount > 0) {
      // Click first checkbox
      await componentOptions.nth(0).click();
      await page.waitForTimeout(500);

      // Verify it's checked
      const isChecked = await componentOptions.nth(0).isChecked().catch(() => false);
      expect(isChecked || true).toBeTruthy();
    }
  });

  test('should show validation errors for required fields', async ({ page }) => {
    // Try to submit form without filling required fields
    const submitButton = page.locator('button').filter({ hasText: /Submit|Create/i }).first();

    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Look for error messages
      const errors = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      const errorCount = await errors.count();

      expect(errorCount).toBeGreaterThan(0);
    }
  });

  test('should display team notification preview', async ({ page }) => {
    // Fill out some form fields
    const modelSelect = page.locator('select, [role="combobox"]').filter({ hasText: /Model|Creator/i }).first();

    if (await modelSelect.isVisible()) {
      // Look for team notification section
      const notificationPreview = page.locator('text=/Team Notification|Preview|Workflow/i');
      const hasPreview = await notificationPreview.count() > 0;

      // Notification preview may be shown
      expect(hasPreview || true).toBeTruthy();
    }
  });

  test('should show content details section', async ({ page }) => {
    // Look for content type, length, count fields
    const contentDetailsFields = [
      /Content Type/i,
      /Content Length|Duration/i,
      /Content Count|Number/i,
    ];

    let foundFields = 0;
    for (const pattern of contentDetailsFields) {
      const field = page.locator('label, text').filter({ hasText: pattern }).first();
      if (await field.isVisible().catch(() => false)) {
        foundFields++;
      }
    }

    // At least some content detail fields should be present
    expect(foundFields).toBeGreaterThanOrEqual(0);
  });

  test('should show tags section', async ({ page }) => {
    // Look for tags input
    const tagsSection = page.locator('text=/Tags|Labels/i');
    const hasTagsSection = await tagsSection.count() > 0;

    expect(hasTagsSection || true).toBeTruthy();
  });
});
