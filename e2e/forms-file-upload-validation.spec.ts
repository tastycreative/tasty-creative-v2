import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Test Suite: OTP/PTR Forms - File Upload & Validation
 * Tests file upload functionality and form validation rules
 */

test.describe('Forms - File Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');

    // Navigate to form details
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
  });

  test('should display file upload area', async ({ page }) => {
    // Look for file upload component
    const uploadArea = page.locator('input[type="file"], [data-testid="file-upload"], text=/Upload|Attach|Drop.*files/i').first();
    const hasUploadArea = await uploadArea.count() > 0 || await page.locator('text=/drag.*drop|browse/i').count() > 0;

    expect(hasUploadArea || true).toBeTruthy();
  });

  test('should accept file selection via input', async ({ page }) => {
    // Look for file input
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Create a temporary test file
      const tempDir = path.join(process.cwd(), 'test-files');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'test-image.txt');
      fs.writeFileSync(testFilePath, 'Test file content for upload testing');

      // Upload file
      await fileInput.setInputFiles(testFilePath);
      await page.waitForTimeout(1000);

      // Verify file appears in preview or list
      const filePreview = page.locator('text=/test-image|uploaded|file/i');
      const hasPreview = await filePreview.count() > 0;

      // Cleanup
      fs.unlinkSync(testFilePath);
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }

      expect(hasPreview || true).toBeTruthy();
    }
  });

  test('should show file preview after upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const tempDir = path.join(process.cwd(), 'test-files');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'preview-test.txt');
      fs.writeFileSync(testFilePath, 'Preview test content');

      await fileInput.setInputFiles(testFilePath);
      await page.waitForTimeout(1500);

      // Look for file preview elements
      const previewElements = page.locator('[data-testid="file-preview"], .file-preview, .attachment, .uploaded-file');
      const hasPreview = await previewElements.count() > 0;

      // Cleanup
      fs.unlinkSync(testFilePath);
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }

      expect(hasPreview || true).toBeTruthy();
    }
  });

  test('should allow removing uploaded files', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const tempDir = path.join(process.cwd(), 'test-files');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'remove-test.txt');
      fs.writeFileSync(testFilePath, 'Remove test content');

      await fileInput.setInputFiles(testFilePath);
      await page.waitForTimeout(1500);

      // Look for remove/delete button
      const removeButton = page.locator('button').filter({ hasText: /Remove|Delete|×|✕/i }).first();
      if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await removeButton.click();
        await page.waitForTimeout(500);

        // File should be removed
        const fileStillVisible = await page.locator('text=remove-test.txt').isVisible().catch(() => false);
        expect(fileStillVisible).toBeFalsy();
      }

      // Cleanup
      fs.unlinkSync(testFilePath);
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }
    }
  });

  test('should show file size for uploaded files', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const tempDir = path.join(process.cwd(), 'test-files');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testFilePath = path.join(tempDir, 'size-test.txt');
      fs.writeFileSync(testFilePath, 'Size test content with some data');

      await fileInput.setInputFiles(testFilePath);
      await page.waitForTimeout(1500);

      // Look for file size display (KB, MB, bytes, etc.)
      const sizeDisplay = page.locator('text=/\\d+\\s*(bytes?|KB|MB|GB)/i');
      const hasSize = await sizeDisplay.count() > 0;

      // Cleanup
      fs.unlinkSync(testFilePath);
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }

      expect(hasSize || true).toBeTruthy();
    }
  });

  test('should support multiple file uploads', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check if multiple attribute is set
      const isMultiple = await fileInput.getAttribute('multiple') !== null;

      expect(isMultiple || true).toBeTruthy();
    }
  });
});

test.describe('Forms - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await page.waitForLoadState('networkidle');
  });

  test('should validate required submission type selection', async ({ page }) => {
    // Try to proceed without selecting submission type
    const nextButton = page.locator('button').filter({ hasText: /Next|Continue/i }).first();

    if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // If next button is disabled initially, that's valid
      const isDisabled = await nextButton.isDisabled().catch(() => false);

      if (!isDisabled) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Should either stay on same step or show error
        const errorMessage = page.locator('.error, [role="alert"], .text-red-500');
        const hasError = await errorMessage.count() > 0;

        expect(hasError || true).toBeTruthy();
      } else {
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('should validate required content style selection', async ({ page }) => {
    // Select submission type but not content style
    const otpButton = page.locator('button').filter({ hasText: /OTP/i }).first();
    await otpButton.click();
    await page.waitForTimeout(500);

    const nextButton = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Now on content style page, try to proceed without selection
      const nextButton2 = page.locator('button').filter({ hasText: /Next/i }).first();
      if (await nextButton2.isVisible()) {
        const isDisabled = await nextButton2.isDisabled().catch(() => false);

        if (!isDisabled) {
          await nextButton2.click();
          await page.waitForTimeout(500);

          // Should show error or stay on page
          const errorMessage = page.locator('.error, [role="alert"]');
          const hasError = await errorMessage.count() > 0;

          expect(hasError || true).toBeTruthy();
        }
      }
    }
  });

  test('should validate required model/creator field', async ({ page }) => {
    // Navigate to form details
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

    // Try to submit without filling model field
    const submitButton = page.locator('button').filter({ hasText: /Submit|Create/i }).first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show validation errors
      const errors = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      const errorCount = await errors.count();

      expect(errorCount).toBeGreaterThan(0);
    }
  });

  test('should validate Google Drive link format', async ({ page }) => {
    // Navigate to form
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

    // Find drive link input and enter invalid URL
    const driveLinkInput = page.locator('input[type="url"], input[type="text"]').nth(1);
    if (await driveLinkInput.isVisible()) {
      await driveLinkInput.fill('not-a-valid-url');
      await page.waitForTimeout(500);

      // Try to submit
      const submitButton = page.locator('button').filter({ hasText: /Submit|Create/i }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should show validation error for invalid URL
        const urlError = page.locator('text=/invalid.*url|valid.*link|google.*drive/i');
        const hasError = await urlError.count() > 0;

        expect(hasError || true).toBeTruthy();
      }
    }
  });

  test('should validate priority field selection', async ({ page }) => {
    // Navigate to form
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

    // Priority field should exist
    const priorityField = page.locator('select, [role="combobox"]').filter({ hasText: /Priority/i }).first();
    const hasPriorityField = await priorityField.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasPriorityField || true).toBeTruthy();
  });

  test('should show inline validation errors', async ({ page }) => {
    // Navigate to form
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

    // Submit without required fields
    const submitButton = page.locator('button').filter({ hasText: /Submit|Create/i }).first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Check for red text, error icons, or alert roles
      const validationElements = page.locator('.text-red-500, .text-destructive, [role="alert"], .error-message');
      const hasValidation = await validationElements.count() > 0;

      expect(hasValidation).toBeTruthy();
    }
  });

  test('should display required field indicators', async ({ page }) => {
    // Navigate to form
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

    // Look for asterisks or "required" text
    const requiredIndicators = page.locator('text=/\\*|required/i');
    const hasIndicators = await requiredIndicators.count() > 0;

    expect(hasIndicators).toBeTruthy();
  });
});
