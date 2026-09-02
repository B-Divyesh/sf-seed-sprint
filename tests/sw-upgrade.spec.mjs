import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { expect, test } from '@playwright/test';

const legacyWorker = `
const CACHE_NAME = 'seed-sprint-v1';
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add('/')).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});`;

test('@claim:pwa-update an old cache-first install activates the repaired worker and loads current HTML', async ({ browser }) => {
  const repairedWorker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  let release = 'old';
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.url === '/sw.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.setHeader('Service-Worker-Allowed', '/');
      response.end(release === 'old' ? legacyWorker : repairedWorker);
      return;
    }
    if (request.url === '/manifest.webmanifest') {
      response.setHeader('Content-Type', 'application/manifest+json');
      response.end('{}');
      return;
    }
    if (request.url?.endsWith('.svg')) response.setHeader('Content-Type', 'image/svg+xml');
    if (request.url?.endsWith('.webp')) response.setHeader('Content-Type', 'image/webp');
    if (request.url === '/' || request.headers.accept?.includes('text/html')) {
      response.setHeader('Content-Type', 'text/html');
      response.end(`<!doctype html><html><body><main data-release="${release}">${release}</main></body></html>`);
      return;
    }
    response.end('fixture');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Upgrade fixture server did not start');
  const origin = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-release]')).toHaveText('old');
    expect(await page.evaluate(() => caches.keys())).toContain('seed-sprint-v1');

    release = 'new';
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error('Legacy worker was not registered');
      const changed = new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      await registration.update();
      await Promise.race([changed, new Promise((_, reject) => setTimeout(() => reject(new Error('Worker did not activate')), 5_000))]);
    });
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(['seed-sprint-v3']);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-release]')).toHaveText('new');
  } finally {
    await context.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('static deployment maps AVIF files to image/avif', async () => {
  const config = JSON.parse(await readFile(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'));
  expect(config.mimeTypes['.avif']).toBe('image/avif');
});

test('built route shells publish their own canonical, Open Graph, and Twitter metadata', async () => {
  const expected = {
    demo: 'Demo — Seed Sprint',
    play: 'Play — Seed Sprint',
    result: 'Shared result — Seed Sprint',
    privacy: 'Privacy — Seed Sprint',
    terms: 'Terms — Seed Sprint'
  };
  for (const [route, title] of Object.entries(expected)) {
    const html = await readFile(new URL(`../dist/${route}.html`, import.meta.url), 'utf8');
    expect(html).toContain(`<title>${title}</title>`);
    expect(html).toContain(`rel="canonical" href="https://seed-sprint.sociobot.in/${route}"`);
    expect(html).toContain(`property="og:title" content="${title}"`);
    expect(html).toContain(`property="og:url" content="https://seed-sprint.sociobot.in/${route}"`);
    expect(html).toMatch(/name="twitter:title" content="[^"]+"/);
  }
});

test('the static 404 shell retains navigation, legal links, and route metadata', async () => {
  const html = await readFile(new URL('../public/404.html', import.meta.url), 'utf8');
  for (const expected of ['name="description"', 'rel="canonical"', 'property="og:title"', 'name="twitter:title"', 'rel="apple-touch-icon"', 'href="/privacy"', 'href="/terms"', 'Built by Param Factory', 'Version 1.0.1']) expect(html).toContain(expected);
});
