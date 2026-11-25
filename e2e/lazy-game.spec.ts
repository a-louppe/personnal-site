import { expect, test } from '@playwright/test';

test('the game chunk is only fetched after clicking "Load game"', async ({ page }) => {
  const jsRequests = new Set<string>();
  const logs: string[] = [];
  page.on('request', (req) => {
    const path = new URL(req.url()).pathname;
    if (path.endsWith('.js')) jsRequests.add(path);
  });
  page.on('console', (msg) => logs.push(msg.text()));

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const initial = new Set(jsRequests);
  expect(initial.size).toBeGreaterThan(0);
  expect(logs).not.toContain('game booted');

  await page.getByRole('button', { name: 'Load game' }).click();
  await expect.poll(() => logs).toContain('game booted');

  const added = [...jsRequests].filter((p) => !initial.has(p));
  expect(added.length).toBeGreaterThanOrEqual(1);
});
