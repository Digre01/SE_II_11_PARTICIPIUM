const { devices } = require('@playwright/test');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  // tests are in this directory
  testDir: '.',
  timeout: 60 * 1000,
  retries: 0,
  use: {
    // Base URL can be overridden with PW_BASE_URL environment variable
    baseURL: process.env.PW_BASE_URL || 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    actionTimeout: 15 * 1000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  workers: 1
};

