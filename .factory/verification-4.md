# Seed Sprint independent verification 4 — PASS

Verified on 2026-09-02 UTC against commit `b2bc5e107b7e57ed43c10cefa66bae1bdc23b7f3` and the deployed site at <https://seed-sprint.sociobot.in>.

## Verdict

**PASS.** The deployed static files byte-match a clean production build of the candidate. The required game loop, isolated demo, privacy behaviour, accessibility baseline, PWA offline reload, and sharing flow worked from a fresh browser context. No defects were found.

## Required claims

From the clean checkout, `npm ci` completed successfully. Every exact command in `.factory/claims.json` was run sequentially against the product's local demo entry point and passed. The claims are:

| Claim | Result |
| --- | --- |
| `deterministic-board` | PASS |
| `complete-board` | PASS |
| `demo-seeded-state` | PASS |
| `touch-controls` | PASS |
| `free-play` | PASS |
| `share-result` | PASS |
| `same-board-link` | PASS |
| `share-recovery` | PASS |
| `no-social-services` | PASS |
| `shared-link-fields` | PASS |
| `restart-state` | PASS |
| `progress-reload` | PASS |
| `five-minute-limit` | PASS |
| `demo-isolation` | PASS |
| `keyboard-controls` | PASS |
| `assist-mode` | PASS |
| `privacy-local` | PASS |
| `recent-results` | PASS |
| `offline-reload` | PASS |
| `pwa-update` | PASS |
| `frame-rate` | PASS — 60.5 FPS measured in isolated Chromium (floor: 45 FPS) |

The complete local Playwright suite subsequently passed (`32/32`; `test-results/.last-run.json` reported `passed`). `npm run build` passed and generated `dist/`; the initial game JavaScript is 25.40 KB raw / 9.30 KB gzip and CSS is 15.01 KB raw / 4.24 KB gzip.

## First-read and game QA

Cold first read: “Seed Sprint is a five-minute shared signal-routing puzzle for puzzle friends. Click **Try it with sample data** first to open a partly solved practice board.” The first screen plainly identifies the activity, audience, and first action in one screen. It includes the playable board beneath its start panel rather than a menu-only page. The visible one-click demo link opened `/demo`.

On live `/demo`, the persistent banner read “Demo — sample board, nothing is saved to your daily game,” exposed **Reset demo** and **Start for real**, and storage was namespaced as `demo:session:SPROUT-7`. The seeded state was 4:17 remaining, 11 turns, and 7 of 25 route tiles connected.

A live scripted run rotated each routed tile to its verified orientation and reached the real **Connected** result screen in 0:43. The copied result URL used `/result` and exactly `seed`, `status`, `time`, and `turns`; it did not contain board layout data. A `VERIFY-BOARD` round reached the result screen, then **Play again** restored the board, 5:00 timer, and zero turns. Keyboard `R` rotated the selected tile and `P` paused/resumed. A malformed encoded seed rendered as harmless text and still supplied a playable recovery path. Touch testing at 390×844 rotated a 56.3 px tile with no horizontal overflow.

## Live deployment, privacy, and quality evidence

- Live cold page: title `Seed Sprint — play a daily signal puzzle`, `lang=en`, one `<h1>`, one `<main>`, visible 4 px focus outline, zero console errors and zero page errors.
- Axe (live landing and game): zero serious or critical violations.
- Reduced-motion context reduced tile transition to `1e-05s`.
- Live request log during demo, play, completion, copying, and result navigation contained only `https://seed-sprint.sociobot.in`; there are no gameplay or personal-data requests to another origin.
- Service-worker check: after one live visit, an offline reload of `/demo` rendered “Connect every seed to the sprout” with no errors. The local update claim also passed.
- Live response headers included CSP with `connect-src 'self'`, `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, strict referrer policy, and a restrictive permissions policy. HTML is short-cache (`max-age=30`); hashed JS and AVIF are immutable for one year.
- Live `/`, `/demo`, `/play`, `/privacy`, `/terms`, valid `/result`, and `/sw.js` returned 200. A missing route returned the designed 404 with HTTP 404. There are no server-side product endpoints, so request-allowance / 429 testing is not applicable.
- SHA-256 comparison found local and deployed `index.html`, JS, CSS, service worker, manifest, privacy/terms shells, and 404 shell identical.
- Lighthouse against live Chromium: Performance **98**, Accessibility **100**, LCP **2.11 s**, CLS **0.003**.

Evidence captured during this verification: `/tmp/seed-sprint-live-cold.png`, `/tmp/seed-sprint-live-mobile-demo.png`, `/tmp/seed-sprint-live-root.headers`, and `/tmp/seed-sprint-live-lighthouse.json`.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.
