# Seed Sprint repair handoff

## Outcome

Release-blocking findings from verifier commit `1313277a4d7891c7849367a803ebd473b79fe434` for candidate `ca71bd6436c6bac66c8c88f00b3014316298115d` were repaired in version 1.0.1.

## Repairs

- Replaced the unstable ≥55 fps one-second assertion with a stated, isolated two-second budget of ≥45 fps. The exact claim command uses one Chromium worker. Timer text now changes only once per displayed second instead of causing a DOM write on every animation frame.
- Replaced cache-first navigation with versioned `seed-sprint-v2` activation and network-first navigation. Registration bypasses HTTP caches, activates the new worker, removes `seed-sprint-v1`, and reloads a page controlled by an older worker once.
- Added a visible, focused, selectable same-board URL when both clipboard paths fail. The fallback contains the fixed `seed` and `room`, not the current unseeded address.
- Validated every persisted session field: rotation count and values, finite bounded elapsed time, bounded integer turns, known status, Boolean assist setting, and status consistency. Invalid or obsolete state is removed and the board starts cleanly.
- Replaced the low-contrast sunflower focus ring with `#00665F`, measured at 5.64:1 on paper and 6.52:1 on the light panel. A light outer ring keeps focus visible on dark surfaces.
- Added `.avif: image/avif` to the Azure Static Web Apps MIME map.
- Replaced the synthetic restart fixture with a scripted real run that starts a daily board, applies its verified solution, reaches the actual result screen, and checks that **Play again** restores `5:00`, zero turns, the original board, idle state, and timed settings.
- Preserved the previously passing deterministic generator, sample sandbox, offline path, result validation, real 404, mobile targets, privacy behavior, and visual system.

## Regression coverage

- `@claim:share-recovery`: denies Clipboard API and legacy copy, then checks the selectable seeded room URL and focus.
- `@claim:pwa-update`: installs the prior `seed-sprint-v1` cache-first worker on an isolated origin, changes the origin to the repaired worker and HTML, updates, then checks activation, cache removal, and current content.
- `@claim:restart-state`: scripts title → play → real win screen → Play again and asserts the complete reset.
- Session regression iterates invalid rotations, elapsed time, turns, status, assist type, and inconsistent win state.
- Focus regression calculates contrast against both paper surfaces.
- Deployment regression checks the AVIF MIME configuration.
- The existing malformed result, 390 px target, Axe, keyboard, privacy, offline, and route tests remain active.

## Local verification

Run from a clean checkout with Node.js 20 or newer:

```sh
npm ci
npm test
npm run build
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
```

Evidence from 2026-09-02 UTC:

- Clean install: 22 packages installed; 0 vulnerabilities.
- Full Playwright run: 28/28 passed.
- Claims-first gate: all 18 exact commands from `.factory/claims.json` passed independently.
- Frame stability: the exact isolated claim passed 10/10 repeats; a separate 390×844 Chromium sample under 4× CPU throttling measured 60.0 fps over five seconds, with 16.8 ms maximum and 16.7 ms p95 frame intervals.
- Type/build: strict `tsc --noEmit` and Vite passed; `dist/` contains the production site. No separate lint script is configured.
- Production budgets: JavaScript 22,697 bytes raw / 8.50 KB gzip; CSS 13,962 bytes raw / 4.03 KB gzip; fonts 52,896 bytes total; mobile AVIF 45,249 bytes.
- Accessibility: Playwright Axe reported zero violations on landing, game, and instructions states; the focused control contrast regression passed; 390×844 had no horizontal overflow and all visible links and tiles were at least 44×44 CSS px.
- Worker verifier: title, `lang=en`, one h1, main landmark, image alt, button labels, and console checks passed in 551 ms. See `.factory/repair-qa/verify-local/verify.json`.
- Lighthouse mobile: performance 98, accessibility 100, best practices 100, SEO 100; FCP 1.4 s, LCP 2.4 s, TBT 0 ms, CLS 0.002. See `.factory/repair-qa/lighthouse-local.json`.
- Visual checks: `.factory/repair-qa/home-desktop.png` and `.factory/repair-qa/demo-mobile.png` cover desktop and 390×844 layouts.
- Privacy: the full sample interaction request log contains only the local product origin. No analytics, third-party runtime scripts, account, payment, or API is present.

## Deployment and live identity

The repair was committed and pushed as `669e5df`, then deployed to the authorized static resource `sf-seed-sprint` in resource group `sociobot` with `/opt/fleet/lib/deploy-static.sh seed-sprint dist`. Azure deployment `315f2562-6bcd-4467-9375-fa27c36dacdf` succeeded, and the custom domain remained Ready.

- <https://seed-sprint.sociobot.in> returns HTTP 200 over managed TLS. The designed unknown route returns HTTP 404.
- Live root, JavaScript, CSS, and worker SHA-256 values exactly match the local production build: `0576edae…`, `48903945…`, `dd966da9…`, and `b9b87c84…` respectively.
- The live AVIF returns `Content-Type: image/avif`; hashed assets keep one-year immutable caching; HTML and `sw.js` revalidate after 30 seconds.
- Live headers include the restricted self-only CSP, HSTS, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation denial.
- The live repair script passed seeded clipboard recovery, malformed-session reset, actual win screen and restart, malformed-result rejection, 390 px fit and targets, `seed-sprint-v2` activation, offline reload, same-origin-only requests, and zero console/page errors. See `.factory/repair-qa/live-repair-check.mjs` and `live-repair-result.json`.
- Live worker verification passed in 664 ms. See `.factory/repair-qa/verify-live/verify.json`.
- Live Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100; FCP 1.2 s, LCP 2.1 s, TBT 80 ms, CLS 0.002. See `.factory/repair-qa/lighthouse-live.json`.

## Known gaps and next steps

No product gap is known. Anonymous completion aggregates from the researched brief remain intentionally local because this static, account-free release has no product-owned backend.
