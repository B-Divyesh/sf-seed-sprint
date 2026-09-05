import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://seed-sprint.sociobot.in';
const evidenceDir = '/work/repo/.factory/verification-5-evidence';
const results = [];
const requests = [];
const consoleErrors = [];
const pageErrors = [];
const axes = {};
const routeChecks = [];

function record(name, detail = true) {
  results.push({ name, pass: true, detail });
}

async function check(name, action) {
  try {
    const detail = await action();
    record(name, detail ?? true);
  } catch (error) {
    results.push({ name, pass: false, detail: String(error?.stack || error) });
  }
}

function observe(page) {
  page.on('request', request => requests.push(request.url()));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push({ url: page.url(), text: message.text() });
  });
  page.on('pageerror', error => pageErrors.push({ url: page.url(), text: String(error) }));
}

async function axe(page, name) {
  const scan = await new AxeBuilder({ page }).analyze();
  axes[name] = scan.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.length }));
  assert.deepEqual(scan.violations, []);
  return { violations: 0 };
}

async function solve(page) {
  const count = await page.locator('[data-tile]').count();
  for (let index = 0; index < count; index += 1) {
    const tile = page.locator('[data-tile]').nth(index);
    const classes = await tile.getAttribute('class');
    const rotation = Number(classes?.match(/\br([0-3])\b/)?.[1] ?? 0);
    for (let turn = 0; turn < (4 - rotation) % 4; turn += 1) await tile.click();
  }
}

async function installClipboardCapture(page) {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async text => { window.__copiedText = text; } }
    });
  });
}

function routeFacts(page) {
  return page.evaluate(() => ({
    title: document.title,
    h1: [...document.querySelectorAll('h1')].map(node => node.textContent?.trim()),
    main: document.querySelectorAll('main').length,
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    ogUrl: document.querySelector('meta[property="og:url"]')?.content,
    description: document.querySelector('meta[name="description"]')?.content
  }));
}

const browser = await chromium.launch({ headless: true });
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktop = await desktopContext.newPage();
  observe(desktop);

  await check('desktop first screen states job, audience, first action, facts, and shows game', async () => {
    const response = await desktop.goto(base, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    const facts = await desktop.evaluate(() => {
      const game = document.querySelector('.game-column').getBoundingClientRect();
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim(),
        lede: document.querySelector('.lede')?.textContent?.trim(),
        action: document.querySelector('.hero-actions a')?.textContent?.trim(),
        outcome: document.querySelector('.hero-actions span')?.textContent?.trim(),
        plainFacts: [...document.querySelectorAll('.plain-facts li')].map(node => node.textContent?.trim()),
        gameTop: game.top,
        viewportHeight: innerHeight,
        scrollY
      };
    });
    assert.equal(facts.h1, 'Race the same signal puzzle');
    assert.match(facts.lede, /puzzle friends/i);
    assert.equal(facts.action, 'Try it with sample data');
    assert.match(facts.outcome, /partly solved/i);
    assert.deepEqual(facts.plainFacts, ['Free to play', 'Works offline after your first visit', 'Progress stays on this device']);
    assert.ok(facts.gameTop < facts.viewportHeight);
    await desktop.screenshot({ path: `${evidenceDir}/first-screen-desktop.png` });
    return facts;
  });

  await check('desktop landing has zero Axe violations', () => axe(desktop, 'desktop landing'));

  await check('instructions dialog manages keyboard focus', async () => {
    const trigger = desktop.getByRole('button', { name: 'Show instructions' });
    await trigger.focus();
    await desktop.keyboard.press('Enter');
    assert.equal(await desktop.getByRole('dialog').isVisible(), true);
    assert.equal(await desktop.getByRole('button', { name: 'Close instructions' }).evaluate(node => node === document.activeElement), true);
    await axe(desktop, 'instructions dialog');
    await desktop.keyboard.press('Escape');
    assert.equal(await trigger.evaluate(node => node === document.activeElement), true);
    return { openedWithEnter: true, closedWithEscape: true, focusReturned: true };
  });

  await check('one-click demo opens populated sample with persistent label', async () => {
    await desktop.getByRole('link', { name: 'Try it with sample data' }).click();
    assert.equal(new URL(desktop.url()).pathname, '/demo');
    const state = {
      timer: (await desktop.locator('[data-timer]').textContent()).trim(),
      turns: (await desktop.locator('[data-turns]').textContent()).trim(),
      status: (await desktop.locator('[data-status]').textContent()).trim(),
      banner: (await desktop.getByLabel('Demo mode').innerText()).replace(/\s+/g, ' ').trim()
    };
    assert.match(state.timer, /^4:1[78]$/);
    assert.equal(state.turns, '11');
    assert.match(state.status, /\d+ of \d+ route tiles connected/);
    assert.match(state.banner, /Demo.*sample board, nothing is saved.*Reset demo.*Start for real/i);
    await desktop.screenshot({ path: `${evidenceDir}/demo-populated-desktop.png`, fullPage: true });
    return state;
  });

  await check('live keyboard controls move, rotate, pause, and resume', async () => {
    const indexes = await desktop.locator('[data-tile]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.tile)));
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -6, ArrowDown: 6 };
    const outcomes = {};
    for (const [key, delta] of Object.entries(moves)) {
      const candidate = indexes.find(index => {
        let next = index + delta;
        while (next >= 0 && next < 36 && !indexes.includes(next)) next += delta;
        return next >= 0 && next < 36 && (Math.abs(delta) === 6 || Math.floor(next / 6) === Math.floor(index / 6));
      });
      assert.notEqual(candidate, undefined);
      await desktop.locator(`[data-tile="${candidate}"]`).focus();
      await desktop.keyboard.press(key);
      const active = await desktop.evaluate(() => Number(document.activeElement?.dataset?.tile));
      assert.notEqual(active, candidate);
      outcomes[key] = { from: candidate, to: active };
    }
    const tile = desktop.locator('[data-tile]').first();
    await tile.focus();
    const before = await tile.getAttribute('class');
    await desktop.keyboard.press('r');
    assert.notEqual(await tile.getAttribute('class'), before);
    await desktop.keyboard.press('p');
    assert.equal(await desktop.getByText('Game paused', { exact: true }).isVisible(), true);
    await desktop.keyboard.press('p');
    assert.equal(await desktop.getByText('Game paused', { exact: true }).isVisible(), false);
    return outcomes;
  });

  await check('sample reaches real win and result link hides board layout', async () => {
    await desktop.getByRole('button', { name: 'Reset demo' }).first().click();
    await installClipboardCapture(desktop);
    await solve(desktop);
    assert.equal(await desktop.getByText('Connected', { exact: true }).isVisible(), true);
    assert.equal(await desktop.getByLabel('Demo mode').isVisible(), true);
    const status = (await desktop.locator('[data-status]').textContent()).trim();
    await desktop.screenshot({ path: `${evidenceDir}/sample-win-desktop.png` });
    await axe(desktop, 'sample win');
    await desktop.getByRole('button', { name: 'Copy result' }).click();
    const copied = await desktop.evaluate(() => window.__copiedText);
    const resultUrl = new URL(copied.trim().split('\n').at(-1));
    assert.equal(resultUrl.pathname, '/result');
    assert.deepEqual([...resultUrl.searchParams.keys()].sort(), ['seed', 'status', 'time', 'turns']);
    const resultPage = await desktopContext.newPage();
    observe(resultPage);
    await resultPage.goto(resultUrl.href, { waitUntil: 'domcontentloaded' });
    assert.equal(await resultPage.getByRole('heading', { level: 1 }).textContent(), 'This board was connected');
    assert.equal(await resultPage.locator('[data-tile]').count(), 0);
    await axe(resultPage, 'shared result');
    await resultPage.close();
    return { status, fields: [...resultUrl.searchParams.keys()].sort(), layoutTilesInResult: 0 };
  });

  await check('demo reset restores sample and leaves real daily session unchanged', async () => {
    await desktop.getByRole('button', { name: 'Reset demo' }).first().click();
    assert.match((await desktop.locator('[data-timer]').textContent()).trim(), /^4:1[78]$/);
    assert.equal((await desktop.locator('[data-turns]').textContent()).trim(), '11');
    await desktop.getByRole('link', { name: 'Start for real' }).click();
    assert.equal(new URL(desktop.url()).pathname, '/play');
    await desktop.getByRole('button', { name: 'Start five-minute board' }).click();
    await desktop.locator('[data-tile]').first().click();
    await desktop.getByRole('button', { name: 'Pause' }).click();
    const daily = await desktop.evaluate(() => {
      const key = Object.keys(localStorage).find(item => item.startsWith('daily:session:'));
      return { key, value: key ? localStorage.getItem(key) : null };
    });
    assert.ok(daily.key && daily.value);
    await desktop.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
    await desktop.locator('[data-tile]').first().click();
    await desktop.getByRole('button', { name: 'Reset demo' }).first().click();
    assert.equal(await desktop.evaluate(({ key }) => localStorage.getItem(key), daily), daily.value);
    await desktop.locator('[data-tile]').first().click();
    await desktop.getByRole('link', { name: 'Start for real' }).click();
    assert.equal(new URL(desktop.url()).pathname, '/play');
    const after = await desktop.evaluate(({ key }) => ({ value: localStorage.getItem(key), demoKeys: Object.keys(localStorage).filter(item => item.startsWith('demo:')) }), daily);
    assert.equal(after.value, daily.value);
    assert.deepEqual(after.demoKeys, []);
    return { dailyKey: daily.key, preserved: true, demoKeysAfterExit: after.demoKeys };
  });

  await check('daily board completes, shares, and Play again fully resets', async () => {
    await desktop.getByRole('button', { name: 'Resume board' }).click();
    await installClipboardCapture(desktop);
    await solve(desktop);
    assert.equal(await desktop.getByText('Connected', { exact: true }).isVisible(), true);
    const status = (await desktop.locator('[data-status]').textContent()).trim();
    const boardCode = (await desktop.locator('.run-notes strong').first().textContent()).trim();
    await desktop.screenshot({ path: `${evidenceDir}/daily-win-desktop.png` });
    await desktop.getByRole('button', { name: 'Copy result' }).click();
    const resultText = await desktop.evaluate(() => window.__copiedText);
    assert.match(resultText, /\/result\?/);
    assert.doesNotMatch(resultText, /tile|rotation|layout/i);
    await desktop.getByRole('button', { name: 'Play again' }).click();
    assert.equal((await desktop.locator('[data-timer]').textContent()).trim(), '5:00');
    assert.equal((await desktop.locator('[data-turns]').textContent()).trim(), '0');
    assert.equal(await desktop.getByRole('button', { name: 'Start five-minute board' }).isVisible(), true);
    assert.equal(await desktop.getByRole('button', { name: 'Remove timer' }).getAttribute('aria-pressed'), 'false');
    return { boardCode, endStatus: status, restartTimer: '5:00', restartTurns: 0 };
  });

  await check('clipboard denial exposes selectable fixed board and result links', async () => {
    await desktop.goto(`${base}/play?seed=VERIFY5-COPY`, { waitUntil: 'domcontentloaded' });
    await desktop.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
      document.execCommand = () => false;
    });
    await desktop.getByRole('button', { name: 'Copy board link' }).click();
    const boardLink = await desktop.locator('[data-same-board-link]').inputValue();
    assert.equal(new URL(boardLink).searchParams.get('seed'), 'VERIFY5-COPY');
    assert.equal(await desktop.locator('[data-same-board-link]').evaluate(node => node === document.activeElement), true);
    await desktop.getByRole('button', { name: 'Start five-minute board' }).click();
    await solve(desktop);
    await desktop.getByRole('button', { name: 'Copy result' }).click();
    const resultLink = await desktop.locator('[data-shared-result-link]').inputValue();
    assert.equal(new URL(resultLink).pathname, '/result');
    assert.equal(await desktop.locator('[data-shared-result-link]').evaluate(node => node === document.activeElement), true);
    return { boardLink, resultLink };
  });

  await check('independent clients open the same fixed board and keep the room on reload', async () => {
    const firstContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const secondContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const first = await firstContext.newPage();
    const second = await secondContext.newPage();
    observe(first);
    observe(second);
    await first.goto(`${base}/play?seed=VERIFY5-ROOM`, { waitUntil: 'domcontentloaded' });
    await installClipboardCapture(first);
    const signature = await first.locator('[data-tile]').evaluateAll(nodes => nodes.map(node => `${node.className}|${node.getAttribute('aria-label')}`));
    await first.getByRole('button', { name: 'Copy board link' }).click();
    const roomLink = await first.evaluate(() => window.__copiedText);
    await second.goto(roomLink, { waitUntil: 'domcontentloaded' });
    const friendSignature = await second.locator('[data-tile]').evaluateAll(nodes => nodes.map(node => `${node.className}|${node.getAttribute('aria-label')}`));
    assert.deepEqual(friendSignature, signature);
    const room = (await second.locator('.play-heading .eyebrow').textContent()).trim();
    assert.match(room, /^Room [A-Z0-9]+$/);
    await second.reload({ waitUntil: 'domcontentloaded' });
    assert.equal((await second.locator('.play-heading .eyebrow').textContent()).trim(), room);
    assert.deepEqual(await second.locator('[data-tile]').evaluateAll(nodes => nodes.map(node => `${node.className}|${node.getAttribute('aria-label')}`)), signature);
    await firstContext.close();
    await secondContext.close();
    return { roomLink, room, independentContexts: 2, boardSignaturesMatch: true, reloadKeepsRoom: true };
  });

  await check('five-minute boundary reaches actual loss screen', async () => {
    await desktop.goto(`${base}/play?seed=VERIFY5-LOSS`, { waitUntil: 'domcontentloaded' });
    await desktop.getByRole('button', { name: 'Start five-minute board' }).click();
    await desktop.getByRole('button', { name: 'Pause' }).click();
    await desktop.evaluate(() => {
      const key = 'daily:session:VERIFY5-LOSS';
      const session = JSON.parse(localStorage.getItem(key));
      session.elapsed = 299.8;
      session.status = 'playing';
      session.assist = false;
      localStorage.setItem(key, JSON.stringify(session));
    });
    await desktop.reload({ waitUntil: 'domcontentloaded' });
    await desktop.getByText('Time ended', { exact: true }).waitFor();
    assert.equal((await desktop.locator('[data-status]').textContent()).trim(), 'Time ended. Restart this board to try again.');
    await desktop.screenshot({ path: `${evidenceDir}/loss-desktop.png` });
    return { timer: (await desktop.locator('.result-stamp strong').textContent()).trim(), turns: (await desktop.locator('[data-turns]').textContent()).trim() };
  });

  await check('invalid result and invalid saved session recover safely', async () => {
    await desktop.goto(`${base}/result?seed=%3Cbad%3E&status=won&time=bogus&turns=-9`, { waitUntil: 'domcontentloaded' });
    assert.equal(await desktop.getByRole('heading', { level: 1 }).textContent(), 'This result link is incomplete');
    assert.equal(await desktop.getByText(/NaN|-9 turns/).count(), 0);
    await desktop.goto(`${base}/play?seed=VERIFY5-INVALID`, { waitUntil: 'domcontentloaded' });
    await desktop.evaluate(() => localStorage.setItem('daily:session:VERIFY5-INVALID', JSON.stringify({ rotations: Array(36).fill(null), elapsed: -1, turns: -9, status: 'playing', assist: false })));
    await desktop.reload({ waitUntil: 'domcontentloaded' });
    assert.equal((await desktop.locator('[data-timer]').textContent()).trim(), '5:00');
    assert.equal((await desktop.locator('[data-turns]').textContent()).trim(), '0');
    assert.equal(await desktop.evaluate(() => localStorage.getItem('daily:session:VERIFY5-INVALID')), null);
    return { malformedResultRejected: true, invalidSessionRemoved: true };
  });

  await check('assist setting and progress survive reload', async () => {
    await desktop.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
    await desktop.getByRole('button', { name: 'Remove timer' }).click();
    await desktop.locator('[data-tile]').first().click();
    await desktop.reload({ waitUntil: 'domcontentloaded' });
    assert.equal((await desktop.locator('[data-timer]').textContent()).trim(), 'No limit');
    assert.equal((await desktop.locator('[data-turns]').textContent()).trim(), '12');
    return { timer: 'No limit', turns: 12 };
  });

  await check('live active board sustains at least 45 fps', async () => {
    const fps = await desktop.evaluate(() => new Promise(resolve => {
      let frames = 0;
      const start = performance.now();
      const frame = now => {
        frames += 1;
        if (now - start >= 2000) resolve(frames * 1000 / (now - start));
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }));
    assert.ok(fps >= 45, `measured ${fps}`);
    return { fps };
  });

  await check('live 14-result history retains newest, removes oldest, supports view, replay, clear', async () => {
    const historyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await historyContext.newPage();
    observe(page);
    const seeds = Array.from({ length: 15 }, (_, index) => `LIVE5-${String(index + 1).padStart(2, '0')}`);
    for (const [index, seed] of seeds.entries()) {
      await page.goto(`${base}/play?seed=${seed}`, { waitUntil: 'domcontentloaded' });
      const target = Number(await page.locator('[data-tile]').first().getAttribute('data-tile'));
      const length = await page.locator('.tile').count();
      await page.evaluate(({ seed, target, length, elapsed }) => {
        const rotations = Array(length).fill(0);
        rotations[target] = 3;
        localStorage.setItem(`daily:session:${seed}`, JSON.stringify({ rotations, elapsed, turns: 7, status: 'playing', assist: false }));
      }, { seed, target, length, elapsed: index + 1 });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator(`[data-tile="${target}"]`).click();
      assert.equal(await page.getByText('Connected', { exact: true }).isVisible(), true);
    }
    await page.goto(`${base}/play?seed=${seeds.at(-1)}`, { waitUntil: 'domcontentloaded' });
    const recent = page.getByRole('region', { name: 'Recent results' });
    const listed = await recent.locator('.recent-list strong').allTextContents();
    assert.deepEqual(listed, [...seeds.slice(1)].reverse());
    assert.equal(await recent.getByText(seeds[0], { exact: true }).count(), 0);
    await page.screenshot({ path: `${evidenceDir}/recent-14-desktop.png`, fullPage: true });
    await recent.getByRole('link', { name: 'View result' }).first().click();
    assert.equal(new URL(page.url()).pathname, '/result');
    await page.goto(`${base}/play?seed=${seeds.at(-1)}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('region', { name: 'Recent results' }).getByRole('link', { name: 'Replay' }).first().click();
    assert.equal(new URL(page.url()).searchParams.get('seed'), seeds.at(-1));
    await page.goto(`${base}/play?seed=${seeds.at(-1)}`, { waitUntil: 'domcontentloaded' });
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Clear recent results' }).click();
    assert.equal(await page.getByText('Finished boards will appear here.').isVisible(), true);
    await historyContext.close();
    return { count: listed.length, newest: listed[0], oldestRetained: listed.at(-1), removed: seeds[0], view: true, replay: true, clear: true };
  });

  await check('routes have correct status, titles, structure, metadata, legal content, and designed 404', async () => {
    const routes = [
      ['/', 200, 'Seed Sprint — play a daily signal puzzle'],
      ['/demo', 200, 'Demo — Seed Sprint'],
      ['/play', 200, 'Play — Seed Sprint'],
      ['/privacy', 200, 'Privacy — Seed Sprint'],
      ['/terms', 200, 'Terms — Seed Sprint'],
      ['/result?seed=ROUTE-5&status=won&time=94&turns=32', 200, 'Shared result — Seed Sprint'],
      ['/missing-verify-5', 404, 'Page not found — Seed Sprint']
    ];
    for (const [route, status, title] of routes) {
      const response = await desktop.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
      const facts = await routeFacts(desktop);
      assert.equal(response.status(), status);
      assert.equal(facts.title, title);
      assert.equal(facts.h1.length, 1);
      assert.equal(facts.main, 1);
      assert.equal(facts.lang, 'en');
      assert.ok(facts.description && facts.description.length <= 155);
      assert.ok(facts.canonical?.startsWith(base));
      assert.equal(facts.ogUrl, facts.canonical);
      routeChecks.push({ route, status, ...facts });
      await axe(desktop, route === '/missing-verify-5' ? 'designed 404' : route);
    }
    assert.match(await desktop.locator('main').innerText(), /This board link does not exist.*Return to today’s puzzle/s);
    return routeChecks;
  });

  await check('internal links are valid and external link is safely marked', async () => {
    await desktop.goto(base, { waitUntil: 'domcontentloaded' });
    const links = await desktop.locator('a[href]').evaluateAll(nodes => nodes.map(node => ({ href: node.href, rel: node.rel, text: node.textContent?.replace(/\s+/g, ' ').trim() })));
    const internal = [...new Set(links.map(link => link.href).filter(href => new URL(href).origin === base))];
    const status = [];
    for (const href of internal) {
      const response = await desktopContext.request.get(href);
      status.push({ href, status: response.status() });
      assert.equal(response.status(), 200);
    }
    const external = links.filter(link => new URL(link.href).origin !== base);
    assert.deepEqual(external.map(link => ({ text: link.text, rel: link.rel })), [{ text: 'Built by Param Factory (external site)', rel: 'noreferrer' }]);
    return { internal: status, externalMarkedWithoutCrossScopeFetch: external };
  });

  await desktopContext.close();

  await check('phone first screen shows job, audience, action, and game without overflow', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    observe(page);
    await page.goto(base, { waitUntil: 'networkidle' });
    const layout = await page.evaluate(() => {
      const game = document.querySelector('.game-column').getBoundingClientRect();
      const interactives = [...document.querySelectorAll('a[href], button:not([disabled])')].filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map(node => {
        const rect = node.getBoundingClientRect();
        return { text: node.textContent?.replace(/\s+/g, ' ').trim(), width: rect.width, height: rect.height };
      });
      return {
        h1: document.querySelector('h1')?.textContent?.trim(),
        lede: document.querySelector('.lede')?.textContent?.trim(),
        action: document.querySelector('.hero-actions a')?.textContent?.trim(),
        gameTop: game.top,
        viewportHeight: innerHeight,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        undersized: interactives.filter(item => item.width < 44 || item.height < 44)
      };
    });
    assert.equal(layout.h1, 'Race the same signal puzzle');
    assert.match(layout.lede, /puzzle friends/i);
    assert.equal(layout.action, 'Try it with sample data');
    assert.ok(layout.gameTop < layout.viewportHeight);
    assert.equal(layout.scrollWidth, layout.clientWidth);
    assert.deepEqual(layout.undersized, []);
    await page.screenshot({ path: `${evidenceDir}/first-screen-phone.png` });
    await page.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
    const tile = page.locator('[data-tile]').first();
    const before = await tile.getAttribute('class');
    await tile.tap();
    assert.notEqual(await tile.getAttribute('class'), before);
    const box = await tile.boundingBox();
    assert.ok(box.width >= 44 && box.height >= 44);
    await page.screenshot({ path: `${evidenceDir}/demo-phone.png`, fullPage: true });
    await axe(page, 'phone demo');
    await context.close();
    return { ...layout, tile: box, touchRotated: true };
  });

  await check('200 percent zoom equivalent keeps content without horizontal overflow', async () => {
    const context = await browser.newContext({ viewport: { width: 640, height: 900 } });
    const page = await context.newPage();
    observe(page);
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, h1: document.querySelector('h1')?.textContent?.trim() }));
    assert.ok(dimensions.scroll <= dimensions.client);
    assert.equal(dimensions.h1, 'Race the same signal puzzle');
    await context.close();
    return dimensions;
  });

  await check('reduced motion removes visible transition and smooth scrolling', async () => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    observe(page);
    await page.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
    const styles = await page.locator('.pipe').first().evaluate(node => ({ transition: getComputedStyle(node).transitionDuration, animation: getComputedStyle(node).animationDuration, scroll: getComputedStyle(document.documentElement).scrollBehavior }));
    assert.ok(['0s', '1e-05s', '0.00001s'].includes(styles.transition));
    assert.ok(['0s', '1e-05s', '0.00001s'].includes(styles.animation));
    assert.equal(styles.scroll, 'auto');
    await context.close();
    return styles;
  });

  await check('service worker installs and demo reloads offline', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    observe(page);
    await page.goto(`${base}/demo`, { waitUntil: 'domcontentloaded' });
    const serviceWorker = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return { active: registration.active?.scriptURL, caches: await caches.keys() };
    });
    assert.equal(serviceWorker.active, `${base}/sw.js`);
    assert.deepEqual(serviceWorker.caches, ['seed-sprint-v3']);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), 'Connect every seed to the sprout');
    await context.close();
    return { ...serviceWorker, offlineReload: true };
  });

  await check('live requests stay same-origin with no unexpected console or page errors', async () => {
    const foreign = [...new Set(requests.map(url => new URL(url).origin).filter(origin => origin !== base))];
    const expected404 = consoleErrors.filter(item => item.url.endsWith('/missing-verify-5') && item.text.includes('404'));
    const unexpectedConsole = consoleErrors.filter(item => !expected404.includes(item));
    assert.deepEqual(foreign, []);
    assert.deepEqual(unexpectedConsole, []);
    assert.deepEqual(pageErrors, []);
    return { requestCount: requests.length, origins: [base], expected404, unexpectedConsole, pageErrors };
  });
} finally {
  await browser.close();
}

const output = {
  startedAt: new Date().toISOString(),
  liveUrl: base,
  passCount: results.filter(item => item.pass).length,
  failCount: results.filter(item => !item.pass).length,
  results,
  routes: routeChecks,
  axe: axes,
  requestOrigins: [...new Set(requests.map(url => new URL(url).origin))],
  consoleErrors,
  pageErrors
};
fs.writeFileSync(`${evidenceDir}/live-check.json`, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ passCount: output.passCount, failCount: output.failCount, failed: results.filter(item => !item.pass), requestOrigins: output.requestOrigins, consoleErrors, pageErrors }, null, 2));
if (output.failCount) process.exitCode = 1;
