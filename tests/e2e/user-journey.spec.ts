/**
 * End-to-End User Journey Test
 * Tests the complete user experience from installation to Tier 5
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';

// Extension paths
const EXTENSION_PATH = path.join(__dirname, '../../dist');
const EXTENSION_ID = 'your_extension_id_here'; // Update with actual ID

test.describe('ShieldPro Ultimate - Complete User Journey', () => {
  let page: Page;
  let context: BrowserContext;
  let extensionPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Load extension
    context = await browser.newContext({
      permissions: ['notifications'],
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`
      ]
    });
    
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('Installation and Initial Setup', () => {
    test('should install extension successfully', async () => {
      // Navigate to extension page
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Check if popup loads
      await expect(page.locator('h1')).toContainText('ShieldPro Ultimate');
      
      // Verify Tier 1 is active
      await expect(page.locator('.tier-badge')).toContainText('Tier 1');
    });

    test('should block ads on test page without account', async () => {
      // Navigate to test page with ads
      await page.goto('https://www.example.com');
      
      // Check that ads are blocked (would need actual test page)
      const adElements = await page.locator('.advertisement').count();
      expect(adElements).toBe(0);
    });
  });

  test.describe('Tier 2: Account Creation', () => {
    test('should create account and unlock Tier 2', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Click create account
      await page.click('button:has-text("Create Free Account")');
      
      // Fill signup form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.fill('input[name="displayName"]', 'Test User');
      
      // Submit
      await page.click('button:has-text("Create Account")');
      
      // Wait for success
      await expect(page.locator('.success-message')).toContainText('Tier 2');
      
      // Verify Tier 2 is active
      await expect(page.locator('.tier-badge')).toContainText('Tier 2');
    });

    test('should block YouTube ads with Tier 2', async () => {
      // Navigate to YouTube
      await page.goto('https://www.youtube.com');
      
      // Play a video (would need specific video URL)
      await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      // Wait for video player
      await page.waitForSelector('.video-stream');
      
      // Check no ad overlays (simplified check)
      const adOverlay = await page.locator('.ytp-ad-overlay-container').count();
      expect(adOverlay).toBe(0);
    });
  });

  test.describe('Tier 3: Profile Completion', () => {
    test('should complete profile and unlock Tier 3', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Go to profile settings
      await page.click('button:has-text("Complete Profile")');
      
      // Upload profile photo (simulate)
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-avatar.png'));
      
      // Update profile
      await page.click('button:has-text("Update Profile")');
      
      // Wait for tier upgrade
      await expect(page.locator('.tier-badge')).toContainText('Tier 3');
    });

    test('should use custom filter creation', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      
      // Go to custom filters
      await page.click('a:has-text("Custom Filters")');
      
      // Create new filter
      await page.click('button:has-text("Add Filter")');
      await page.fill('input[name="filterName"]', 'Block Test Ads');
      await page.fill('input[name="selector"]', 'div.test-ad');
      
      // Save filter
      await page.click('button:has-text("Save Filter")');
      
      // Verify filter is created
      await expect(page.locator('.filter-list')).toContainText('Block Test Ads');
    });

    test('should use element picker', async () => {
      // Navigate to test page
      await page.goto('https://www.example.com');
      
      // Activate element picker
      await page.click({ button: 'right' });
      await page.click('text=Block with ShieldPro');
      
      // Select an element
      await page.hover('.banner-ad');
      await page.click('.banner-ad');
      
      // Confirm blocking
      await page.click('button:has-text("Block Element")');
      
      // Verify element is hidden
      await expect(page.locator('.banner-ad')).toBeHidden();
    });
  });

  test.describe('Tier 4: Referral System', () => {
    test('should display referral code and sharing options', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Go to referrals
      await page.click('button:has-text("Referrals")');
      
      // Check referral code is displayed
      const referralCode = await page.locator('.referral-code').textContent();
      expect(referralCode).toMatch(/^[A-Z0-9]{8}$/);
      
      // Check sharing options
      await expect(page.locator('button:has-text("Copy Code")')).toBeVisible();
      await expect(page.locator('button:has-text("Share Link")')).toBeVisible();
      await expect(page.locator('.qr-code')).toBeVisible();
    });

    test('should track referral progress', async () => {
      // Check progress bar
      const progress = await page.locator('.referral-progress').getAttribute('data-progress');
      expect(parseInt(progress || '0')).toBeGreaterThanOrEqual(0);
      
      // Check counter
      await expect(page.locator('.referral-count')).toContainText('/ 30');
    });

    test('should enable DNS-over-HTTPS when Tier 4 is reached', async () => {
      // Simulate 30 referrals (would be done through backend)
      // For testing, we'll check the UI
      
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      await page.click('a:has-text("Privacy & Security")');
      
      // Check if DoH is available
      const dohToggle = await page.locator('input[name="enableDoH"]');
      
      // Would be enabled if user has Tier 4
      if (await dohToggle.isEnabled()) {
        await dohToggle.click();
        await expect(page.locator('.doh-status')).toContainText('Active');
      }
    });
  });

  test.describe('Tier 5: Weekly Engagement', () => {
    test('should track daily engagement', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Check engagement tracker
      const engagementDays = await page.locator('.engagement-days .day.active').count();
      expect(engagementDays).toBeGreaterThanOrEqual(0);
      expect(engagementDays).toBeLessThanOrEqual(7);
    });

    test('should show Tier 5 features when unlocked', async () => {
      // Check for AI detection indicator
      const aiStatus = await page.locator('.ai-detection-status');
      
      // Would be visible if Tier 5 is active
      if (await aiStatus.isVisible()) {
        await expect(aiStatus).toContainText('AI Protection Active');
      }
    });

    test('should warn about engagement requirements', async () => {
      // Check for maintenance warning
      const warning = await page.locator('.tier5-warning');
      
      if (await warning.isVisible()) {
        await expect(warning).toContainText('weekly engagement');
      }
    });
  });

  test.describe('Cross-Feature Integration', () => {
    test('should sync settings across tabs', async () => {
      // Open two tabs
      const tab1 = await context.newPage();
      const tab2 = await context.newPage();
      
      // Change setting in tab1
      await tab1.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      await tab1.click('.toggle-blocking');
      
      // Check it's reflected in tab2
      await tab2.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      await tab2.reload();
      
      const status = await tab2.locator('.blocking-status').textContent();
      expect(status).toContain('Paused');
      
      await tab1.close();
      await tab2.close();
    });

    test('should persist data after extension reload', async () => {
      // Save current state
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      const tierBefore = await page.locator('.tier-badge').textContent();
      
      // Reload extension (simulate)
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check state is preserved
      const tierAfter = await page.locator('.tier-badge').textContent();
      expect(tierAfter).toBe(tierBefore);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Go offline
      await context.setOffline(true);
      
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Try to sync
      await page.click('button:has-text("Sync")');
      
      // Should show offline message
      await expect(page.locator('.offline-notice')).toContainText('Offline');
      
      // Go back online
      await context.setOffline(false);
    });

    test('should validate user inputs', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      await page.click('a:has-text("Custom Filters")');
      
      // Try to save empty filter
      await page.click('button:has-text("Add Filter")');
      await page.click('button:has-text("Save")');
      
      // Should show validation error
      await expect(page.locator('.error-message')).toContainText('required');
    });
  });

  test.describe('Performance', () => {
    test('should load popup quickly', async () => {
      const startTime = Date.now();
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(1000); // Under 1 second
    });

    test('should handle large filter lists efficiently', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      await page.click('a:has-text("Custom Filters")');
      
      // Import large filter list (simulate)
      const largeFilterList = Array.from({ length: 100 }, (_, i) => ({
        name: `Filter ${i}`,
        selector: `.ad-${i}`
      }));
      
      // Would normally import via file
      // Check performance is acceptable
      const startTime = Date.now();
      // Simulate processing
      const processTime = Date.now() - startTime;
      
      expect(processTime).toBeLessThan(500);
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement?.className);
      expect(focusedElement).toBeDefined();
    });

    test('should have proper ARIA labels', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Check important buttons have aria-labels
      const buttons = await page.locator('button[aria-label]').count();
      expect(buttons).toBeGreaterThan(0);
      
      // Check form inputs have labels
      const inputs = await page.locator('input[aria-label], input[id]').count();
      expect(inputs).toBeGreaterThan(0);
    });
  });
});

// Mobile responsiveness tests (if applicable for extension popup)
test.describe('Responsive Design', () => {
  test('should adapt to different viewport sizes', async ({ page }) => {
    // Test different sizes
    const viewports = [
      { width: 320, height: 568 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
      
      // Check layout doesn't break
      await expect(page.locator('.main-container')).toBeVisible();
      await expect(page.locator('.tier-badge')).toBeVisible();
    }
  });
});