import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium-extension',
      use: { 
        ...devices['Desktop Chrome'],
        // Load extension from built directory
        launchOptions: {
          args: [
            `--disable-extensions-except=${process.cwd()}/dist`,
            `--load-extension=${process.cwd()}/dist`,
            '--no-sandbox'
          ],
          headless: false // Extensions don't work in headless mode
        }
      },
    },
    {
      name: 'edge-extension',
      use: { 
        ...devices['Desktop Edge'],
        launchOptions: {
          args: [
            `--disable-extensions-except=${process.cwd()}/dist`,
            `--load-extension=${process.cwd()}/dist`,
            '--no-sandbox'
          ],
          headless: false
        }
      },
    }
  ],

  webServer: {
    command: 'npx http-server ./tests/fixtures -p 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
});