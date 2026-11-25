import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec sirv apps/site/dist/site/browser --port ${PORT} --single --quiet`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
  },
});
