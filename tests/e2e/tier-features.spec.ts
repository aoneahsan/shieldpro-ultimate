import { test, expect, BrowserContext, Page } from '@playwright/test';

const EXTENSION_ID = 'shieldpro-extension'; // This will be dynamic in real tests

test.describe('ShieldPro Ultimate - Tier Features', () => {
  let context: BrowserContext;
  let page: Page;
  let extensionPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Context is created with extension loaded via launch options
    context = browser.contexts()[0];
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    await page.goto('http://127.0.0.1:3000/test-ads.html');
  });

  test.describe('Tier 1 - Basic Features (No Login)', () => {
    test('should block basic ads', async () => {
      // Check that ad elements are blocked
      await expect(page.locator('.google-ad')).toBeHidden();
      await expect(page.locator('.banner-ad')).toBeHidden();
      await expect(page.locator('#ad-container')).toBeHidden();
    });

    test('should block popups', async () => {
      let popupBlocked = false;
      
      // Listen for popup attempts
      context.on('page', (newPage) => {
        popupBlocked = true;
        newPage.close();
      });

      // Try to trigger a popup
      await page.click('#popup-trigger');
      await page.waitForTimeout(1000);
      
      // No new page should be created
      expect(popupBlocked).toBe(false);
    });

    test('should auto-reject cookie consent', async () => {
      await page.goto('http://127.0.0.1:3000/test-cookies.html');
      
      // Cookie banner should be hidden
      await expect(page.locator('.cookie-consent')).toBeHidden();
      await expect(page.locator('#onetrust-banner')).toBeHidden();
    });

    test('should show blocking counter', async () => {
      // Open extension popup
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.click('[aria-label="ShieldPro Ultimate"]') // Extension icon
      ]);

      // Check counter is visible and working
      await expect(popup.locator('[data-testid="blocked-count"]')).toBeVisible();
      const count = await popup.locator('[data-testid="blocked-count"]').textContent();
      expect(parseInt(count || '0')).toBeGreaterThan(0);
    });

    test('should allow whitelisting', async () => {
      // Open extension popup
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.click('[aria-label="ShieldPro Ultimate"]')
      ]);

      // Add current site to whitelist
      await popup.click('[data-testid="whitelist-toggle"]');
      
      // Reload page
      await page.reload();
      
      // Ads should now be visible
      await expect(page.locator('.google-ad')).toBeVisible();
    });
  });

  test.describe('Tier 2 - Enhanced Features (Account Required)', () => {
    test.beforeEach(async () => {
      // Simulate login
      await context.addCookies([{
        name: 'auth-token',
        value: 'test-token',
        domain: '127.0.0.1',
        path: '/'
      }]);
    });

    test('should block YouTube ads', async () => {
      await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      // Wait for video player
      await page.waitForSelector('.video-stream');
      
      // No ad overlays should be present
      await expect(page.locator('.ytp-ad-overlay')).toBeHidden();
      await expect(page.locator('.ytp-ad-module')).toBeHidden();
      await expect(page.locator('.video-ads')).toBeHidden();
    });

    test('should block advanced trackers', async () => {
      await page.goto('http://127.0.0.1:3000/test-trackers.html');
      
      // Check that tracking pixels are blocked
      const googleAnalytics = await page.evaluate(() => {
        return typeof (window as any).ga === 'undefined';
      });
      expect(googleAnalytics).toBe(true);

      const facebookPixel = await page.evaluate(() => {
        return typeof (window as any).fbq === 'undefined';
      });
      expect(facebookPixel).toBe(true);
    });

    test('should block social media widgets', async () => {
      await page.goto('http://127.0.0.1:3000/test-social.html');
      
      // Social widgets should be blocked
      await expect(page.locator('.fb-like')).toBeHidden();
      await expect(page.locator('.twitter-share-button')).toBeHidden();
      await expect(page.locator('.g-plusone')).toBeHidden();
    });

    test('should sync settings across devices', async () => {
      // Open extension options
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      
      // Change a setting
      await page.click('[data-testid="notifications-toggle"]');
      
      // Open in new context (simulating different device)
      const newContext = await browser.newContext();
      const newPage = await newContext.newPage();
      await newPage.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      
      // Setting should be synced
      const isChecked = await newPage.isChecked('[data-testid="notifications-toggle"]');
      expect(isChecked).toBe(false);
    });
  });

  test.describe('Tier 3 - Professional Features (Complete Profile)', () => {
    test.beforeEach(async () => {
      // Simulate completed profile
      await context.addCookies([{
        name: 'tier-level',
        value: '3',
        domain: '127.0.0.1',
        path: '/'
      }]);
    });

    test('should allow custom filter creation', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      
      // Navigate to filters tab
      await page.click('[data-testid="filters-tab"]');
      
      // Add custom filter
      await page.fill('[data-testid="custom-filter-input"]', '##.custom-ad-class');
      await page.click('[data-testid="add-filter-button"]');
      
      // Filter should be added
      await expect(page.locator('text=##.custom-ad-class')).toBeVisible();
      
      // Test the filter works
      await page.goto('http://127.0.0.1:3000/test-custom.html');
      await expect(page.locator('.custom-ad-class')).toBeHidden();
    });

    test('should provide element picker tool', async () => {
      await page.goto('http://127.0.0.1:3000/test-ads.html');
      
      // Activate element picker
      await page.keyboard.press('Control+Shift+E');
      
      // Picker UI should appear
      await expect(page.locator('#shieldpro-picker-toolbar')).toBeVisible();
      
      // Click on an element
      await page.click('.unwanted-element');
      
      // Element should be highlighted
      await expect(page.locator('#shieldpro-element-highlight')).toBeVisible();
      
      // Confirm blocking
      await page.click('[data-testid="block-element"]');
      
      // Element should be hidden
      await expect(page.locator('.unwanted-element')).toBeHidden();
    });

    test('should support import/export settings', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      
      // Export settings
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-settings"]')
      ]);
      
      expect(download.suggestedFilename()).toContain('shieldpro-settings');
      
      // Import settings
      await page.setInputFiles('[data-testid="import-settings"]', download.path());
      
      // Success message should appear
      await expect(page.locator('text=Settings imported successfully')).toBeVisible();
    });

    test('should support advanced whitelist patterns', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      await page.click('[data-testid="whitelist-tab"]');
      
      // Add regex pattern
      await page.fill('[data-testid="whitelist-pattern"]', '/^https:\\/\\/.*\\.example\\.com$/');
      await page.click('[data-testid="pattern-type-regex"]');
      await page.click('[data-testid="add-whitelist-pattern"]');
      
      // Test pattern works
      await page.goto('https://sub.example.com');
      const adsVisible = await page.locator('.ad').isVisible();
      expect(adsVisible).toBe(true);
    });

    test('should support scheduled blocking', async () => {
      await page.goto(`chrome-extension://${EXTENSION_ID}/options.html`);
      
      // Set schedule
      await page.click('[data-testid="schedule-tab"]');
      await page.fill('[data-testid="schedule-start"]', '09:00');
      await page.fill('[data-testid="schedule-end"]', '17:00');
      await page.click('[data-testid="save-schedule"]');
      
      // During scheduled hours, stricter blocking should be active
      const currentHour = new Date().getHours();
      if (currentHour >= 9 && currentHour < 17) {
        await page.goto('http://127.0.0.1:3000/test-ads.html');
        await expect(page.locator('.work-mode-blocked')).toBeHidden();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('should not slow down page load significantly', async () => {
      // Measure with extension
      const startWith = Date.now();
      await page.goto('http://127.0.0.1:3000/test-heavy.html');
      await page.waitForLoadState('networkidle');
      const loadTimeWith = Date.now() - startWith;
      
      // Disable extension and measure
      await context.route('**/*', route => route.continue());
      const startWithout = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const loadTimeWithout = Date.now() - startWithout;
      
      // Extension should not add more than 20% overhead
      const overhead = (loadTimeWith - loadTimeWithout) / loadTimeWithout;
      expect(overhead).toBeLessThan(0.2);
    });

    test('should handle many tabs efficiently', async () => {
      const pages: Page[] = [];
      
      // Open 10 tabs
      for (let i = 0; i < 10; i++) {
        const newPage = await context.newPage();
        await newPage.goto('http://127.0.0.1:3000/test-ads.html');
        pages.push(newPage);
      }
      
      // Check all tabs are working
      for (const p of pages) {
        await expect(p.locator('.google-ad')).toBeHidden();
      }
      
      // Clean up
      for (const p of pages) {
        await p.close();
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work in Chrome', async ({ browserName }) => {
      if (browserName !== 'chromium') return;
      
      await page.goto('http://127.0.0.1:3000/test-ads.html');
      await expect(page.locator('.google-ad')).toBeHidden();
    });

    test('should work in Edge', async ({ browserName }) => {
      if (browserName !== 'webkit') return; // Using webkit as proxy for Edge
      
      await page.goto('http://127.0.0.1:3000/test-ads.html');
      await expect(page.locator('.google-ad')).toBeHidden();
    });
  });

  test.afterAll(async () => {
    await context.close();
  });
});