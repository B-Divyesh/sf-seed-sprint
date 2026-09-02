import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function solveDemo(page: Page): Promise<void> {
  const tileCount = await page.locator('[data-tile]').count();
  for (let index = 0; index < tileCount; index += 1) {
    const tile = page.locator('[data-tile]').nth(index);
    const classes = await tile.getAttribute('class');
    const rotation = Number(classes?.match(/\br([0-3])\b/)?.[1] ?? 0);
    for (let turn = 0; turn < (4 - rotation) % 4; turn += 1) await tile.click();
  }
}

test('@claim:complete-board the demo reaches a result card', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await solveDemo(page);
  await expect(page.getByText('Connected', { exact: true })).toBeVisible();
  await expect(page.locator('.result-stamp strong')).toContainText(/\d:\d{2}/);
  await expect(page.getByRole('button', { name: 'Copy result' })).toBeVisible();
});

test('@claim:restart-state reset restores the sample board', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  const first = page.locator('[data-tile]').first();
  await first.click();
  await expect(page.locator('[data-turns]')).toHaveText('12');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('[data-turns]')).toHaveText('11');
  await expect(page.locator('[data-status]')).toContainText('route tiles connected');
});

test('@claim:progress-reload progress stays on this device', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-tile]').first().click();
  await page.getByRole('button', { name: 'Remove timer' }).click();
  await expect(page.locator('[data-turns]')).toHaveText('12');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-turns]')).toHaveText('12');
  await expect(page.getByRole('button', { name: 'Use timer' })).toHaveAttribute('aria-pressed', 'true');
});

test('@claim:demo-isolation demo uses only its own storage namespace', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-tile]').first().click();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.length).toBeGreaterThan(0);
  expect(keys.every((key) => key.startsWith('demo:'))).toBe(true);
  await page.getByRole('link', { name: 'Start for real' }).click();
  expect(await page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith('demo:')))).toBe(false);
});

test('@claim:five-minute-limit a timed round ends at five minutes', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-tile]').first().click();
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.evaluate(() => {
    const key = 'demo:session:SPROUT-7';
    const session = JSON.parse(localStorage.getItem(key)!);
    session.elapsed = 299.8;
    session.status = 'playing';
    session.assist = false;
    localStorage.setItem(key, JSON.stringify(session));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Time ended', { exact: true })).toBeVisible();
});

test('@claim:keyboard-controls keyboard controls rotate and pause', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  const first = page.locator('[data-tile]').first();
  await first.focus();
  const before = await first.getAttribute('class');
  await page.keyboard.press('r');
  await expect(first).not.toHaveAttribute('class', before!);
  await page.keyboard.press('p');
  await expect(page.getByText('Game paused', { exact: true })).toBeVisible();
  await page.keyboard.press('p');
  await expect(page.getByText('Game paused', { exact: true })).not.toBeVisible();
});

test('@claim:privacy-local game flow sends requests only to its own origin', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-tile]').first().click();
  await page.getByRole('button', { name: 'Copy same-board link' }).click();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:offline-reload works offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Connect every seed to the sprout');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Connect every seed to the sprout');
  await context.close();
});

test('landing page passes structure and automated accessibility checks', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('Seed Sprint — play a daily signal puzzle');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  // @axe-core/playwright accepts the same runtime Page. Its broad peer range can
  // install a newer declaration than the worker-pinned Playwright browser.
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('mobile layout fits 390px and keeps game targets usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  const box = await page.locator('[data-tile]').first().boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test('play screen and instructions pass automated accessibility checks', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  expect((await new AxeBuilder({ page: page as never }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect((await new AxeBuilder({ page: page as never }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Close instructions' }).click();
  await expect(page.getByRole('button', { name: 'How to play' })).toBeFocused();
});

test('privacy, terms, result, and missing routes render one heading', async ({ page }) => {
  for (const route of ['/privacy', '/terms', '/result?seed=SPROUT-7&status=won&time=94&turns=32', '/missing-board']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
  }
});
