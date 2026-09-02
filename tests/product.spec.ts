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

async function captureClipboard(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => { (window as Window & { copiedText?: string }).copiedText = text; } }
    });
  });
}

async function copiedText(page: Page): Promise<string> {
  return page.evaluate(() => (window as Window & { copiedText?: string }).copiedText || '');
}

test('@claim:complete-board the demo reaches a result card', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await solveDemo(page);
  await expect(page.getByText('Connected', { exact: true })).toBeVisible();
  await expect(page.locator('.result-stamp strong')).toContainText(/\d:\d{2}/);
  await expect(page.getByRole('button', { name: 'Copy result' })).toBeVisible();
});

test('@claim:free-play a player can start a board without an account or payment', async ({ page }) => {
  await page.goto('/play?seed=FREE-PLAY', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start five-minute board' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeEnabled();
  await expect(page.getByText(/sign in|create account|payment|purchase/i)).toHaveCount(0);
});

test('@claim:share-result copied result links contain only a spoiler-safe result summary', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await captureClipboard(page);
  await solveDemo(page);
  await page.getByRole('button', { name: 'Copy result' }).click();
  const text = await copiedText(page);
  const resultUrl = new URL(text.trim().split('\n').at(-1)!);
  expect(resultUrl.pathname).toBe('/result');
  expect([...resultUrl.searchParams.keys()].sort()).toEqual(['seed', 'status', 'time', 'turns']);
  expect(text).not.toMatch(/tile|rotation|mask|layout/i);
});

test('clipboard denial exposes the generated result link as selectable recovery', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
    document.execCommand = () => false;
  });
  await solveDemo(page);
  await page.getByRole('button', { name: 'Copy result' }).click();
  const recovery = page.locator('[data-share-fallback]');
  const field = page.locator('[data-shared-result-link]');
  await expect(recovery).toBeVisible();
  await expect(field).toHaveValue(/\/result\?seed=SPROUT-7&status=won&time=\d+&turns=\d+/);
  await expect(field).toBeFocused();
  expect(await page.locator('.route-announcer').textContent()).toContain('result link is ready');
});

test('@claim:same-board-link a copied room link opens the identical board for a friend', async ({ page }) => {
  await page.goto('/play?seed=ROOM-TEST', { waitUntil: 'domcontentloaded' });
  await captureClipboard(page);
  const signature = await page.locator('[data-tile]').evaluateAll((tiles) => tiles.map((tile) => `${tile.className}|${tile.getAttribute('aria-label')}`));
  await page.getByRole('button', { name: 'Copy same-board link' }).click();
  const url = await copiedText(page);
  expect(url).toMatch(/\/play\?seed=ROOM-TEST&room=[A-Z0-9]+$/);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.play-heading .eyebrow')).toHaveText(/Room [A-Z0-9]+/);
  expect(await page.locator('[data-tile]').evaluateAll((tiles) => tiles.map((tile) => `${tile.className}|${tile.getAttribute('aria-label')}`))).toEqual(signature);
});

test('@claim:no-social-services play has no account, chat, lobby, or endless-feed step', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Connect every seed to the sprout');
  await expect(page.locator('input, textarea, [contenteditable="true"]')).toHaveCount(0);
  await expect(page.getByText(/account|chat|lobby|feed/i)).toHaveCount(0);
});

test('@claim:shared-link-fields a result link records seed, result, time, and turns', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await captureClipboard(page);
  await solveDemo(page);
  await page.getByRole('button', { name: 'Copy result' }).click();
  const resultUrl = new URL((await copiedText(page)).trim().split('\n').at(-1)!);
  expect(resultUrl.searchParams.get('seed')).toBe('SPROUT-7');
  expect(resultUrl.searchParams.get('status')).toBe('won');
  expect(Number(resultUrl.searchParams.get('time'))).toBeGreaterThanOrEqual(0);
  expect(Number(resultUrl.searchParams.get('turns'))).toBeGreaterThan(0);
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

test('@claim:assist-mode assist mode removes the timer and stays on this device', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Remove timer' }).click();
  await expect(page.locator('[data-timer]')).toHaveText('No limit');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-timer]')).toHaveText('No limit');
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

test('play again resets the result state, board, turns, and visible timer', async ({ page }) => {
  await page.goto('/play?seed=RESET-TIMER', { waitUntil: 'domcontentloaded' });
  const originalBoard = await page.locator('.tile').evaluateAll((tiles) => tiles.map((tile) => tile.className));
  const rotations = originalBoard.map((classes) => Number(classes.match(/\br([0-3])\b/)?.[1] ?? 0));
  await page.evaluate((savedRotations) => {
    const key = 'daily:session:RESET-TIMER';
    const session = { rotations: savedRotations, elapsed: 5, turns: 27, status: 'won', assist: false };
    localStorage.setItem(key, JSON.stringify(session));
  }, rotations);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Connected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('button', { name: 'Start five-minute board' })).toBeVisible();
  await expect(page.locator('[data-timer]')).toHaveText('5:00');
  await expect(page.locator('[data-turns]')).toHaveText('0');
  expect(await page.locator('.tile').evaluateAll((tiles) => tiles.map((tile) => tile.className))).toEqual(originalBoard);
  await expect(page.getByRole('button', { name: 'Remove timer' })).toHaveAttribute('aria-pressed', 'false');
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

test('@claim:frame-rate the active board renders at least 55 frames per second in Chromium', async ({ page }) => {
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  const fps = await page.evaluate(() => new Promise<number>((resolve) => {
    let frames = 0;
    const started = performance.now();
    const sample = (now: number) => {
      frames += 1;
      if (now - started >= 1_000) resolve(frames * 1_000 / (now - started));
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(fps).toBeGreaterThanOrEqual(55);
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
  const linkBoxes = await page.locator('a').evaluateAll((links) => links.map((link) => {
    const rect = link.getBoundingClientRect();
    return { label: link.getAttribute('aria-label') || link.textContent?.trim(), width: rect.width, height: rect.height };
  }).filter((link) => link.width > 0 && link.height > 0));
  for (const link of linkBoxes) {
    expect(link.width, `${link.label} width`).toBeGreaterThanOrEqual(44);
    expect(link.height, `${link.label} height`).toBeGreaterThanOrEqual(44);
  }
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

test('malformed shared-result values are rejected with a safe recovery screen', async ({ page }) => {
  await page.goto('/result?seed=%3Cbad%3E&status=won&time=bogus&turns=-9', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This result link is incomplete');
  await expect(page.getByText(/NaN|-9 turns/)).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Play today’s board' })).toBeVisible();
});
