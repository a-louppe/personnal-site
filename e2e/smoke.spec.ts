import { expect, test } from '@playwright/test';

test('prerendered home has the right title and h1, with no console problems', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || (msg.type() === 'warning' && text.startsWith('NG0'))) {
      problems.push(`[${msg.type()}] ${text}`);
    }
  });
  page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`));

  await page.goto('/');
  await expect(page).toHaveTitle('Personal site');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Personal site');
  await page.waitForLoadState('networkidle');

  expect(problems).toEqual([]);
});
