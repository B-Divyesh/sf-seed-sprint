# Seed Sprint verification handoff — PASS

## Independent verification outcome

**PASS** on 2026-09-02 UTC for candidate commit `b2bc5e107b7e57ed43c10cefa66bae1bdc23b7f3` deployed at <https://seed-sprint.sociobot.in>.

The verifier ran `npm ci`, every registered claim command, the full 32-test Playwright suite, and `npm run build` from the clean checkout. The complete suite passed, build generated `dist/`, and the isolated FPS claim measured 60.5 FPS. Live desktop/mobile/end-to-end, privacy request logging, offline reload, sharing/recovery, keyboard, reduced-motion, axe, headers/cache, deployment-byte-match, and Lighthouse checks passed. Lighthouse measured Performance 98, Accessibility 100, LCP 2.11 s, CLS 0.003. No defects remain.

See `.factory/verification-4.md` for the claim-by-claim evidence, exact live observations, limitations, and severity inventory.

## How to run / verify

```sh
npm ci
npm test
npm run build
```

Open `/demo` for the isolated sample game. The deployed candidate is <https://seed-sprint.sociobot.in>.

## Known gaps

None. This static browser game has no accounts, payments, server-side product APIs, analytics, or external gameplay services.

---

# Prior builder handoff

## Outcome

Polish round 1 repaired all 17 findings from `.factory/review-1.md`. The product remains a static Vite TypeScript browser game with a deterministic daily routing board, isolated one-click demo, local progress, and local recent-result history.

Repair commit: `28f482e3707c3b0463a21ec51eb0e723f3ae6fad` (`fix: polish review findings`). It was pushed to `main` and deployed to <https://seed-sprint.sociobot.in> on 2026-09-02 UTC.

## What changed

- Added registered, observable claim coverage for the seeded demo state, real touch input, arrow-key navigation, and saved recent results. The manifest now has 20 claims.
- Clarified first-screen wording and terminology: visible markers remain seeds; the deterministic identifier is a board code. Replaced “fair,” unexplained UTC language, “spoiler-safe,” and the ambiguous section slogan.
- Added a useful local Recent results section with replay, result-view, and confirmed clear actions.
- Added route-specific titles, descriptions, canonical URLs, Open Graph, and Twitter metadata at runtime and as built static shells for non-JavaScript crawlers. Result metadata stays generic and never reveals layout.
- Completed the designed 404 shell and sitemap; unknown routes return HTTP 404 with navigation, legal links, metadata, version, and a way home.
- Bumped the service-worker cache to `seed-sprint-v3` so an existing install updates after this shell change.

## Verification

- Clean clone: `/tmp/seed-sprint-clean.nXJNFE` ran `npm ci`, `npm test`, and `npm run build`; **32/32 tests passed**. Log: `/tmp/seed-sprint-clean.log`.
- Every exact command registered in `.factory/claims.json` passed after `npm ci`; the isolated frame-rate claim measured **60.3 FPS**. Log: `/tmp/seed-sprint-claims-final.log`.
- Local full suite: **32/32 passed** in 35.8 seconds. Log: `/tmp/seed-sprint-final-test.log`.
- `npm run build` produces `dist/`; shipped JS is 25.40 KB raw / 9.30 KB gzip and CSS is 15.01 KB raw / 4.24 KB gzip.
- Cold live root check passed in 760 ms: title, `lang=en`, one h1, main landmark, image alt attributes, labels, and zero console/page errors. Evidence: `/tmp/seed-sprint-live.aQhYXJ/verify.json`.
- Live route check: `/`, `/demo`, `/play`, `/privacy`, `/terms`, and a valid `/result` returned 200; `/missing-board` returned 404. Live `/demo` served its own title/canonical/Open Graph URL and passed touch/reset checks. Evidence: `/tmp/seed-sprint-live.aQhYXJ/live-product-check.json`.
- Playwright Axe checks are part of the passing suite for landing, demo, instructions, mobile layout, and route screens. The standalone Axe CLI could not start Selenium Chrome in this container; this did not affect the Playwright Axe coverage.

See `.factory/polish-1.md` for the finding-by-finding map and screenshot paths.

## Run and deploy

```sh
npm ci
npm test
npm run build
```

Deploy `dist/` to the `sf-seed-sprint` static app. `staticwebapp.config.json` supplies the headers, explicit route shells, and HTTP 404 override.

## Known gaps

None. No accounts, payment, analytics, external gameplay API, or server-side state are used.
