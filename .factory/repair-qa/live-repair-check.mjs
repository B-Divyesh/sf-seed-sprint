import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'https://seed-sprint.sociobot.in';
const browser = await chromium.launch({ headless: true });
const errors = [];
const origins = new Set();

async function solve(page) {
  const tileCount = await page.locator('[data-tile]').count();
  for (let index = 0; index < tileCount; index += 1) {
    const tile = page.locator('[data-tile]').nth(index);
    const classes = await tile.getAttribute('class');
    const rotation = Number(classes?.match(/\br([0-3])\b/)?.[1] ?? 0);
    for (let turn = 0; turn < (4 - rotation) % 4; turn += 1) await tile.click();
  }
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
page.on('request', (request) => origins.add(new URL(request.url()).origin));

await page.goto(`${base}/play?seed=LIVE-REPAIR`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
  document.execCommand = () => false;
});
await page.getByRole('button', { name: 'Copy same-board link' }).click();
const recoveryUrl = new URL(await page.locator('[data-same-board-link]').inputValue());
assert.equal(recoveryUrl.searchParams.get('seed'), 'LIVE-REPAIR');
assert.match(recoveryUrl.searchParams.get('room') || '', /^[A-Z0-9]+$/);
assert.equal(await page.locator('[data-same-board-link]').evaluate((element) => element === document.activeElement), true);

await page.evaluate(() => localStorage.setItem('daily:session:LIVE-REPAIR', JSON.stringify({
  rotations: Array(36).fill(null), elapsed: -100, turns: -9, status: 'playing', assist: false
})));
await page.reload({ waitUntil: 'domcontentloaded' });
assert.equal(await page.locator('[data-timer]').textContent(), '5:00');
assert.equal(await page.locator('[data-turns]').textContent(), '0');
await page.getByRole('button', { name: 'Start five-minute board' }).click();
await solve(page);
assert.equal(await page.getByText('Connected', { exact: true }).isVisible(), true);
await page.getByRole('button', { name: 'Play again' }).click();
assert.equal(await page.locator('[data-timer]').textContent(), '5:00');
assert.equal(await page.locator('[data-turns]').textContent(), '0');
assert.equal(await page.getByRole('button', { name: 'Start five-minute board' }).isVisible(), true);

await page.goto(`${base}/result?seed=%3Cbad%3E&status=won&time=bogus&turns=-9`, { waitUntil: 'domcontentloaded' });
assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), 'This result link is incomplete');

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobile.newPage();
await mobilePage.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
const mobileMetrics = await mobilePage.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
assert.ok(mobileMetrics.scrollWidth <= mobileMetrics.width);
for (const box of await mobilePage.locator('a:visible, button:visible').evaluateAll((elements) => elements.map((element) => {
  const rect = element.getBoundingClientRect();
  return { name: element.textContent?.trim(), width: rect.width, height: rect.height };
}))) {
  assert.ok(box.width >= 44, `${box.name} width ${box.width}`);
  assert.ok(box.height >= 44, `${box.name} height ${box.height}`);
}
await mobile.close();

const offline = await browser.newContext();
const offlinePage = await offline.newPage();
await offlinePage.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
await offlinePage.evaluate(() => navigator.serviceWorker.ready);
await offlinePage.reload({ waitUntil: 'domcontentloaded' });
const caches = await offlinePage.evaluate(() => globalThis.caches.keys());
assert.deepEqual(caches, ['seed-sprint-v2']);
await offline.setOffline(true);
await offlinePage.reload({ waitUntil: 'domcontentloaded' });
assert.equal(await offlinePage.getByRole('heading', { level: 1 }).textContent(), 'Connect every seed to the sprout');
await offline.close();

assert.deepEqual([...origins], [base]);
assert.deepEqual(errors, []);
console.log(JSON.stringify({
  clipboardRecovery: String(recoveryUrl),
  invalidSessionReset: true,
  realEndScreenAndRestart: true,
  invalidResultRejected: true,
  mobile: mobileMetrics,
  serviceWorkerCaches: caches,
  offlineReload: true,
  requestOrigins: [...origins],
  consoleErrors: errors
}, null, 2));

await context.close();
await browser.close();
