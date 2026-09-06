import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const base = 'https://seed-sprint.sociobot.in';
const output = {};
const errors = [];

async function solveByTouch(page) {
  const count = await page.locator('[data-tile]').count();
  for (let index = 0; index < count; index += 1) {
    const tile = page.locator('[data-tile]').nth(index);
    const classes = await tile.getAttribute('class');
    const rotation = Number(classes?.match(/\br([0-3])\b/)?.[1] ?? 0);
    for (let turn = 0; turn < (4 - rotation) % 4; turn += 1) await tile.tap();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(String(error)));

  await page.goto(`${base}/play?seed=REVIEW5-PHONE-WIN`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start five-minute board' }).tap();
  await solveByTouch(page);
  await page.getByText('Connected', { exact: true }).waitFor();
  output.win = {
    status: (await page.locator('[data-status]').textContent()).trim(),
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    clientWidth: await page.evaluate(() => document.documentElement.clientWidth)
  };
  assert.equal(output.win.scrollWidth, output.win.clientWidth);
  const winButton = page.getByRole('button', { name: 'Play again' });
  output.winTarget = await winButton.boundingBox();
  assert.ok(output.winTarget.width >= 44 && output.winTarget.height >= 44);
  await page.screenshot({ path: '.factory/review-5-evidence/end-win-phone.png', fullPage: true });
  await winButton.tap();
  output.winReset = {
    timer: (await page.locator('[data-timer]').textContent()).trim(),
    turns: (await page.locator('[data-turns]').textContent()).trim(),
    startVisible: await page.getByRole('button', { name: 'Start five-minute board' }).isVisible()
  };
  assert.deepEqual(output.winReset, { timer: '5:00', turns: '0', startVisible: true });

  await page.goto(`${base}/play?seed=REVIEW5-PHONE-LOSS`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start five-minute board' }).tap();
  await page.getByRole('button', { name: 'Pause' }).tap();
  await page.evaluate(() => {
    const key = 'daily:session:REVIEW5-PHONE-LOSS';
    const session = JSON.parse(localStorage.getItem(key));
    session.elapsed = 299.8;
    session.status = 'playing';
    session.assist = false;
    localStorage.setItem(key, JSON.stringify(session));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByText('Time ended', { exact: true }).waitFor();
  output.loss = {
    status: (await page.locator('[data-status]').textContent()).trim(),
    timer: (await page.locator('.result-stamp strong').textContent()).trim(),
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    clientWidth: await page.evaluate(() => document.documentElement.clientWidth)
  };
  assert.equal(output.loss.timer, '5:00');
  assert.equal(output.loss.scrollWidth, output.loss.clientWidth);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async text => { window.__lossResult = text; } }
    });
  });
  await page.getByRole('button', { name: 'Copy result' }).tap();
  const lossResultText = await page.evaluate(() => window.__lossResult);
  const lossResultUrl = new URL(lossResultText.trim().split('\n').at(-1));
  assert.deepEqual([...lossResultUrl.searchParams.keys()].sort(), ['seed', 'status', 'time', 'turns']);
  assert.equal(lossResultUrl.searchParams.get('status'), 'lost');
  const resultPage = await context.newPage();
  await resultPage.goto(lossResultUrl.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await resultPage.getByRole('heading', { level: 1 }).textContent(), 'This board beat the clock');
  assert.equal(await resultPage.locator('[data-tile]').count(), 0);
  output.lossResult = { url: lossResultUrl.href, heading: 'This board beat the clock', layoutTiles: 0 };
  await resultPage.close();
  const lossButton = page.getByRole('button', { name: 'Play again' });
  output.lossTarget = await lossButton.boundingBox();
  assert.ok(output.lossTarget.width >= 44 && output.lossTarget.height >= 44);
  await page.screenshot({ path: '.factory/review-5-evidence/end-loss-phone.png', fullPage: true });
  await lossButton.tap();
  output.lossReset = {
    timer: (await page.locator('[data-timer]').textContent()).trim(),
    turns: (await page.locator('[data-turns]').textContent()).trim(),
    startVisible: await page.getByRole('button', { name: 'Start five-minute board' }).isVisible()
  };
  assert.deepEqual(output.lossReset, { timer: '5:00', turns: '0', startVisible: true });
  assert.deepEqual(errors, []);
  await context.close();
} finally {
  await browser.close();
}

output.errors = errors;
fs.writeFileSync('.factory/review-5-evidence/phone-loop.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
