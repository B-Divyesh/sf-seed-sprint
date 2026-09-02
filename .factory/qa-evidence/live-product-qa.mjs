import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const base = 'https://seed-sprint.sociobot.in';
const evidence = {
  startedAt: new Date().toISOString(),
  assertions: [],
  requests: [],
  console: [],
  pageErrors: [],
  axe: {},
};

function check(name, pass, detail) {
  evidence.assertions.push({ name, pass: Boolean(pass), detail });
}

async function axe(page, name) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = result.violations.filter((item) => ['serious', 'critical'].includes(item.impact));
  evidence.axe[name] = result.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.length }));
  check(`axe ${name} has no serious/critical findings`, serious.length === 0, serious);
}

function observe(page) {
  page.on('request', (request) => evidence.requests.push({ method: request.method(), type: request.resourceType(), url: request.url() }));
  page.on('console', (message) => evidence.console.push({ type: message.type(), text: message.text(), url: page.url() }));
  page.on('pageerror', (error) => evidence.pageErrors.push({ error: String(error), url: page.url() }));
}

async function boardSignature(page) {
  return page.locator('[data-tile]').evaluateAll((tiles) => tiles.map((tile) => ({
    index: tile.getAttribute('data-tile'),
    className: tile.className,
    label: tile.getAttribute('aria-label'),
  })));
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  observe(page);

  const response = await page.goto(base, { waitUntil: 'networkidle' });
  evidence.rootResponse = { status: response.status(), headers: await response.allHeaders() };
  check('live root returns 200', response.status() === 200, response.status());
  await axe(page, 'desktop landing');

  await page.evaluate(() => document.activeElement?.blur());
  const focusOrder = [];
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('Tab');
    focusOrder.push(await page.evaluate(() => {
      const node = document.activeElement;
      const style = getComputedStyle(node);
      return {
        tag: node?.tagName,
        text: node?.textContent?.trim(),
        href: node?.getAttribute?.('href'),
        outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      };
    }));
  }
  evidence.focusOrder = focusOrder;
  check('keyboard focus is visibly styled', focusOrder.every((item) => item.outline && !item.outline.startsWith('0px')), focusOrder);

  await page.getByRole('button', { name: 'How to play' }).click();
  check('instructions dialog takes focus', (await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Close instructions', await page.evaluate(() => document.activeElement?.outerHTML));
  await axe(page, 'instructions dialog');
  await page.keyboard.press('Escape');
  check('closing instructions restores trigger focus', await page.getByRole('button', { name: 'How to play' }).evaluate((node) => node === document.activeElement), null);

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.getByRole('heading', { level: 1, name: 'Connect every seed to the sprout' }).waitFor();
  check('one-click demo is already active', (await page.locator('[data-timer]').textContent()).trim() !== '5:00', await page.locator('[data-timer]').textContent());
  check('demo banner is persistent and complete', await page.getByLabel('Demo mode').isVisible(), await page.getByLabel('Demo mode').innerText());
  check('demo starts with documented 11 turns', (await page.locator('[data-turns]').textContent()).trim() === '11', await page.locator('[data-turns]').textContent());
  const demoKeysBefore = await page.evaluate(() => Object.keys(localStorage));
  check('demo storage is isolated', demoKeysBefore.length === 0 || demoKeysBefore.every((key) => key.startsWith('demo:')), demoKeysBefore);
  await axe(page, 'desktop demo active');

  const firstTile = page.locator('[data-tile]').first();
  await firstTile.focus();
  const classBeforeR = await firstTile.getAttribute('class');
  await page.keyboard.press('r');
  check('R rotates focused tile', (await firstTile.getAttribute('class')) !== classBeforeR, { before: classBeforeR, after: await firstTile.getAttribute('class') });
  await page.keyboard.press('p');
  check('P pauses active game', await page.getByText('Game paused', { exact: true }).isVisible(), null);
  await page.keyboard.press('p');
  check('P resumes paused game', !(await page.getByText('Game paused', { exact: true }).isVisible()), null);
  await page.getByRole('button', { name: 'Remove timer' }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  check('assist setting persists across reload', await page.getByRole('button', { name: 'Use timer' }).isVisible(), await page.locator('[data-timer]').textContent());
  check('progress persists across reload', (await page.locator('[data-turns]').textContent()).trim() === '12', await page.locator('[data-turns]').textContent());
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  check('Reset demo restores sample turn count', (await page.locator('[data-turns]').textContent()).trim() === '11', await page.locator('[data-turns]').textContent());
  await page.getByRole('link', { name: 'Start for real' }).click();
  check('leaving demo discards demo data', !(await page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith('demo:')))), await page.evaluate(() => Object.keys(localStorage)));

  await page.getByRole('link', { name: 'Play today’s board' }).click();
  check('daily title state waits before starting clock', await page.getByRole('button', { name: 'Start five-minute board' }).isVisible(), await page.locator('[data-timer]').textContent());
  await page.getByRole('button', { name: 'Start five-minute board' }).click();
  check('daily play becomes active', await page.getByRole('button', { name: 'Pause' }).isEnabled(), null);
  const dailySeed = (await page.locator('.run-notes strong').first().textContent()).trim();
  evidence.dailySeed = dailySeed;
  const initialBoard = await boardSignature(page);

  await page.getByRole('button', { name: 'Copy same-board link' }).click();
  const roomLink = await page.evaluate(() => navigator.clipboard.readText());
  evidence.roomLink = roomLink;
  check('same-board action copies a seed and room link', roomLink.includes(`/play?seed=${encodeURIComponent(dailySeed)}&room=`), roomLink);
  const friend = await context.newPage();
  observe(friend);
  await friend.goto(roomLink, { waitUntil: 'domcontentloaded' });
  check('friend link opens the identical initial board', JSON.stringify(await boardSignature(friend)) === JSON.stringify(initialBoard), { initial: initialBoard, friend: await boardSignature(friend) });
  check('friend link names the room', (await friend.locator('.eyebrow').first().textContent()).startsWith('Room '), await friend.locator('.eyebrow').first().textContent());
  await friend.close();

  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const frameStats = await page.evaluate(() => new Promise((resolve) => {
    const stamps = [];
    const started = performance.now();
    function frame(now) {
      stamps.push(now);
      if (now - started < 2000) requestAnimationFrame(frame);
      else {
        const intervals = stamps.slice(1).map((stamp, index) => stamp - stamps[index]);
        const duration = (stamps.at(-1) - stamps[0]) / 1000;
        resolve({ frames: stamps.length, duration, fps: (stamps.length - 1) / duration, maxInterval: Math.max(...intervals), meanInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length });
      }
    }
    requestAnimationFrame(frame);
  }));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  evidence.frameStats4xCpu = frameStats;
  check('live active play sustains at least 55 fps under 4x CPU', frameStats.fps >= 55, frameStats);

  const tileIndexes = await page.locator('[data-tile]').evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('data-tile')));
  for (const index of tileIndexes) {
    const tile = page.locator(`[data-tile="${index}"]`);
    const className = await tile.getAttribute('class');
    const rotation = Number(className.match(/\br([0-3])\b/)?.[1] ?? 0);
    for (let turn = 0; turn < (4 - rotation) % 4; turn += 1) await tile.click();
  }
  check('scripted daily run reaches real win screen', await page.getByText('Connected', { exact: true }).isVisible(), await page.locator('[data-status]').textContent());
  await page.screenshot({ path: '.factory/qa-evidence/live-end-win-desktop.png' });
  await axe(page, 'desktop win screen');
  await page.getByRole('button', { name: 'Copy result' }).click();
  const resultText = await page.evaluate(() => navigator.clipboard.readText());
  evidence.resultText = resultText;
  check('result is spoiler-safe and links to summary', resultText.includes('/result?') && !resultText.toLowerCase().includes('row '), resultText);
  const resultLink = resultText.split('\n').find((line) => line.startsWith(base));
  const resultPage = await context.newPage();
  observe(resultPage);
  await resultPage.goto(resultLink, { waitUntil: 'domcontentloaded' });
  check('shared result renders its end summary', await resultPage.getByRole('heading', { level: 1, name: 'This board was connected' }).isVisible(), await resultPage.locator('main').innerText());
  check('shared result hides board layout', (await resultPage.locator('[data-tile]').count()) === 0, await resultPage.locator('main').innerText());
  await resultPage.close();

  await page.getByRole('button', { name: 'Play again' }).click();
  check('restart returns to idle with zero turns', await page.getByRole('button', { name: 'Start five-minute board' }).isVisible() && (await page.locator('[data-turns]').textContent()).trim() === '0', { timer: await page.locator('[data-timer]').textContent(), turns: await page.locator('[data-turns]').textContent() });
  check('restart resets timer to five minutes', (await page.locator('[data-timer]').textContent()).trim() === '5:00', await page.locator('[data-timer]').textContent());

  await page.goto(`${base}/play?seed=QA-LOSS`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start five-minute board' }).click();
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.evaluate(() => {
    const key = 'daily:session:QA-LOSS';
    const session = JSON.parse(localStorage.getItem(key));
    session.elapsed = 299.9;
    session.status = 'playing';
    session.assist = false;
    localStorage.setItem(key, JSON.stringify(session));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByText('Time ended', { exact: true }).waitFor();
  check('five-minute boundary reaches loss screen', await page.getByText('Time ended', { exact: true }).isVisible(), await page.locator('[data-status]').textContent());
  await page.screenshot({ path: '.factory/qa-evidence/live-end-loss-desktop.png' });

  await page.goto(`${base}/result?seed=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&status=won&time=bogus&turns=-9`, { waitUntil: 'domcontentloaded' });
  evidence.invalidResultText = await page.locator('main').innerText();
  check('malicious shared seed is rendered as text, not markup', (await page.locator('main img').count()) === 0 && evidence.invalidResultText.toLowerCase().includes('<img src=x onerror=alert(1)>'), evidence.invalidResultText);
  check('malformed result numbers recover to valid values', !evidence.invalidResultText.includes('NaN') && !evidence.invalidResultText.includes('-9 turns'), evidence.invalidResultText);
  await axe(page, 'invalid shared result');

  const nonSameOrigin = evidence.requests.filter((request) => new URL(request.url).origin !== base);
  check('full gameplay flow makes only same-origin requests', nonSameOrigin.length === 0, nonSameOrigin);
  check('full gameplay flow has no page errors', evidence.pageErrors.length === 0, evidence.pageErrors);
  check('full gameplay flow has no console errors', evidence.console.filter((item) => item.type === 'error').length === 0, evidence.console);
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobile = await mobileContext.newPage();
  observe(mobile);
  await mobile.goto(base, { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: '.factory/qa-evidence/live-first-screen-mobile.png' });
  const mobileLayout = await mobile.evaluate(() => {
    const interactives = [...document.querySelectorAll('a[href], button:not([disabled])')]
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      })
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return { text: node.textContent?.trim(), width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom };
      });
    const board = document.querySelector('.game-column')?.getBoundingClientRect();
    return {
      innerWidth,
      innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      board: board?.toJSON(),
      interactives,
      undersized: interactives.filter((item) => item.width < 44 || item.height < 44),
    };
  });
  evidence.mobileLayout = mobileLayout;
  check('390px landing has no horizontal overflow', mobileLayout.scrollWidth <= 390, mobileLayout);
  check('all mobile links and buttons meet 44px touch target', mobileLayout.undersized.length === 0, mobileLayout.undersized);
  await axe(mobile, 'mobile landing');
  await mobile.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
  const mobileTiles = await mobile.locator('[data-tile]').evaluateAll((tiles) => tiles.map((tile) => tile.getBoundingClientRect().toJSON()));
  evidence.mobileTileMin = { width: Math.min(...mobileTiles.map((tile) => tile.width)), height: Math.min(...mobileTiles.map((tile) => tile.height)) };
  check('mobile game tiles meet 44px touch target', evidence.mobileTileMin.width >= 44 && evidence.mobileTileMin.height >= 44, evidence.mobileTileMin);
  await mobile.screenshot({ path: '.factory/qa-evidence/live-demo-mobile.png', fullPage: true });
  await axe(mobile, 'mobile demo');
  await mobileContext.close();

  const reduceContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const reduce = await reduceContext.newPage();
  observe(reduce);
  await reduce.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
  const reducedStyle = await reduce.locator('.pipe').first().evaluate((node) => ({
    transitionDuration: getComputedStyle(node).transitionDuration,
    animationDuration: getComputedStyle(node).animationDuration,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  evidence.reducedMotion = reducedStyle;
  check('reduced motion makes transitions effectively instant', reducedStyle.transitionDuration === '1e-05s' || reducedStyle.transitionDuration === '0.00001s', reducedStyle);
  await reduceContext.close();

  const offlineContext = await browser.newContext();
  const offline = await offlineContext.newPage();
  observe(offline);
  await offline.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
  const sw = await offline.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return {
      active: registration.active?.scriptURL,
      waiting: registration.waiting?.scriptURL ?? null,
      installing: registration.installing?.scriptURL ?? null,
      caches: await caches.keys(),
    };
  });
  evidence.serviceWorker = sw;
  check('service worker installs and update check completes', sw.active === `${base}/sw.js` && sw.caches.includes('seed-sprint-v1'), sw);
  await offline.reload({ waitUntil: 'domcontentloaded' });
  await offlineContext.setOffline(true);
  await offline.reload({ waitUntil: 'domcontentloaded' });
  check('PWA reloads demo while offline', await offline.getByRole('heading', { level: 1, name: 'Connect every seed to the sprout' }).isVisible(), await offline.locator('main').innerText());
  await offlineContext.close();

  evidence.finishedAt = new Date().toISOString();
  evidence.passCount = evidence.assertions.filter((item) => item.pass).length;
  evidence.failCount = evidence.assertions.filter((item) => !item.pass).length;
  fs.writeFileSync('.factory/qa-evidence/live-product-qa.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ passCount: evidence.passCount, failCount: evidence.failCount, dailySeed: evidence.dailySeed, frameStats4xCpu: evidence.frameStats4xCpu, mobileLayout: evidence.mobileLayout, mobileTileMin: evidence.mobileTileMin, reducedMotion: evidence.reducedMotion, serviceWorker: evidence.serviceWorker, invalidResultText: evidence.invalidResultText, axe: evidence.axe }, null, 2));
  if (evidence.failCount > 0) process.exitCode = 1;
} catch (error) {
  evidence.finishedAt = new Date().toISOString();
  evidence.fatalError = { message: String(error), stack: error?.stack };
  evidence.passCount = evidence.assertions.filter((item) => item.pass).length;
  evidence.failCount = evidence.assertions.filter((item) => !item.pass).length;
  fs.writeFileSync('.factory/qa-evidence/live-product-qa.json', JSON.stringify(evidence, null, 2));
  throw error;
} finally {
  await browser.close();
}
