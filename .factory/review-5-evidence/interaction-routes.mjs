import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const base = 'https://seed-sprint.sociobot.in';
const browser = await chromium.launch({ headless: true });
const output = { links: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.skip-link').focus();
  assert.equal(await page.locator('.skip-link').evaluate(node => node === document.activeElement), true);
  await page.keyboard.press('Enter');
  output.skipLink = await page.evaluate(() => ({
    hash: location.hash,
    activeTag: document.activeElement?.tagName,
    activeWithinMain: document.querySelector('main')?.contains(document.activeElement),
    scrollY
  }));
  assert.equal(output.skipLink.hash, '#main');
  assert.equal(output.skipLink.activeWithinMain, true);

  await page.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
  const firstTile = page.locator('[data-tile]').first();
  await firstTile.focus();
  const before = await firstTile.getAttribute('class');
  await page.keyboard.press('Enter');
  const afterEnter = await firstTile.getAttribute('class');
  await page.keyboard.press('Space');
  const afterSpace = await firstTile.getAttribute('class');
  assert.notEqual(afterEnter, before);
  assert.notEqual(afterSpace, afterEnter);
  output.nativeKeyboard = { before, afterEnter, afterSpace };

  await page.goto(`${base}/play?seed=REVIEW5-VISIBILITY`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start five-minute board' }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  output.visibilityPause = {
    resumeVisible: await page.getByRole('button', { name: 'Resume board' }).isVisible(),
    pauseDialogVisible: await page.getByText('Game paused', { exact: true }).isVisible()
  };
  assert.deepEqual(output.visibilityPause, { resumeVisible: true, pauseDialogVisible: true });

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForTimeout(100);
  output.routeFocus = {
    demo: await page.evaluate(() => ({ path: location.pathname, active: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim() }))
  };
  assert.deepEqual(output.routeFocus.demo, { path: '/demo', active: 'H1', text: 'Connect every seed to the sprout' });
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(100);
  output.routeFocus.back = await page.evaluate(() => ({ path: location.pathname, active: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim() }));
  assert.deepEqual(output.routeFocus.back, { path: '/', active: 'H1', text: 'Race the same signal puzzle' });
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(100);
  output.routeFocus.forward = await page.evaluate(() => ({ path: location.pathname, active: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim() }));
  assert.deepEqual(output.routeFocus.forward, { path: '/demo', active: 'H1', text: 'Connect every seed to the sprout' });

  const routes = ['/', '/demo', '/play', '/privacy', '/terms', '/result?seed=LINK-5&status=won&time=94&turns=32', '/missing-review-5-links'];
  for (const route of routes) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => ({
      text: node.textContent?.replace(/\s+/g, ' ').trim(),
      href: node.href,
      rel: node.rel
    })));
    const checked = [];
    for (const link of links) {
      const url = new URL(link.href);
      if (url.origin !== base) {
        assert.equal(link.text, 'Built by Param Factory (external site)');
        assert.match(link.rel, /noreferrer/);
        checked.push({ ...link, checked: false, reason: 'outside product scope' });
      } else if (url.hash && url.pathname === new URL(page.url()).pathname && url.search === new URL(page.url()).search) {
        checked.push({ ...link, checked: true, inPage: true });
      } else {
        const result = await context.request.get(link.href);
        assert.equal(result.status(), 200);
        checked.push({ ...link, checked: true, status: result.status() });
      }
    }
    output.links.push({ route, documentStatus: response.status(), links: checked });
  }

  const headers = await context.request.get(base);
  output.securityHeaders = Object.fromEntries(['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy'].map(name => [name, headers.headers()[name]]));
  assert.match(output.securityHeaders['content-security-policy'], /connect-src 'self'/);
  assert.match(output.securityHeaders['content-security-policy'], /frame-ancestors 'none'/);
  assert.equal(output.securityHeaders['x-content-type-options'], 'nosniff');
  await context.close();
} finally {
  await browser.close();
}

fs.writeFileSync('.factory/review-5-evidence/interaction-routes.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify({ skipLink: output.skipLink, routeFocus: output.routeFocus, routeCount: output.links.length, securityHeaders: output.securityHeaders }, null, 2));
