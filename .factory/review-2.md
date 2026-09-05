# Review 2 — race and compare one shared signal puzzle

## Verdict: FAIL

- Work order: `seed-sprint-review-2`
- Live URL: <https://seed-sprint.sociobot.in>
- Candidate reviewed: `b2bc5e107b7e57ed43c10cefa66bae1bdc23b7f3`
- Last product-code commit: `28f482e3707c3b0463a21ec51eb0e723f3ae6fad`
- Documentation SHA reviewed: `1558bdc8a42d8189dbf82cab3369fee687c383d1`
- Reviewed: 2026-09-05 UTC
- Finding count: **1**
- Untested claim count: **1**

The game works end to end and the deployed files match the candidate build. All 21 registered claim commands pass. The review still fails because one quantitative public claim is incomplete in the claims manifest and untested. The supplied claims contract requires a finding for any such claim.

No product code was modified.

## Finding

### High — the 14-result retention limit is not registered or tested

The live **Recent results** section says:

> Your last 14 finished boards stay in this browser.

The `recent-results` manifest entry only claims that recent boards can be viewed, replayed, and cleared. Its tagged test creates one finished board. It never creates 15 boards, asserts that exactly 14 remain, or proves that the oldest board is removed.

The implementation uses `slice(-14)`, so source inspection suggests the statement is true. That is not the sandbox proof required for a quantitative public claim.

Required resolution: add “14” to the registered claim and extend its one tagged test to create 15 distinct completions. Assert that the newest 14 are shown, the oldest is absent, and replay, view, and clear still work. The other valid resolution is to remove the number from public copy.

## First screen before scrolling

### Desktop, 1440 × 900

- Job: race the same daily 6×6 signal-routing puzzle before five minutes ends.
- Audience: puzzle friends who want to compare one shared board without accounts or schedules.
- First action: **Try it with sample data**. The adjacent text says it opens a partly solved practice board.
- The live game board begins at 132 px and is visible without scrolling.
- The screen also states that play is free, offline after the first visit, and saved on this device.

### Phone, 390 × 844

The same job, audience, and first action are visible before scrolling. The board begins at 684 px, so the game itself is also visible in the first screen. There is no horizontal overflow, and every visible link and button is at least 44 × 44 CSS px.

Evidence: `/work/.evidence/seed-sprint-review-2/first-screen-desktop.png` and `first-screen-phone.png`.

## Demo and real-data isolation

The one-click action opened `/demo` in an active, populated state:

- board code `SPROUT-7`;
- `4:17` remaining;
- `11` turns;
- `7 of 25 route tiles connected`;
- persistent “Demo — sample board, nothing is saved to your daily game” label;
- visible **Reset demo** and **Start for real** actions.

A move created only `demo:session:SPROUT-7`. A preloaded `daily:review-probe` value stayed unchanged. **Reset demo** restored the timer, turns, and connection count. Leaving the demo removed demo keys and preserved the daily probe.

The sample was solved through the real **Connected** end screen at `0:43` and 45 turns. Its result link contained only `seed`, `status`, `time`, and `turns`.

## Complete game runs

The live daily board for `2026-09-05` was played from entry to active play and a real win screen. The verified solution finished at `0:02` with 43 turns. **Play again** restored `5:00`, zero turns, the initial board, idle state, and timed settings.

An independent browser context opened room `1NWW7` from the copied board link. Its complete tile signature matched the first client, and the room label survived the link.

A separate `REVIEW-LOSS` board was advanced across the five-minute boundary. It reached the real **Time ended** screen at `5:00`. Invalid stored sessions reset to a safe idle board. Malformed result parameters showed “This result link is incomplete.” Clipboard denial exposed a focused, selectable fixed board URL.

Evidence:

- `/work/.evidence/seed-sprint-review-2/sample-win-desktop.png`
- `/work/.evidence/seed-sprint-review-2/daily-win-desktop.png`
- `/work/.evidence/seed-sprint-review-2/loss-desktop.png`
- `/work/.evidence/seed-sprint-review-2/live-review.json` — 55 passed, 0 failed

## Registered claim commands

The candidate was cloned to `/tmp/seed-sprint-review2-clean.mn0kuJ/repo`. `npm ci` installed the documented prerequisites with zero audit vulnerabilities. Every exact command from `.factory/claims.json` passed independently.

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
| `recent-results` | PASS as written; the untested 14-result limit is the finding above |
| `offline-reload` | PASS |
| `pwa-update` | PASS |
| `frame-rate` | PASS at 60.3 FPS; required floor is 45 FPS |

The manifest has 21 unique IDs and each registered ID has one tagged test. The untested public claim count is one because the manifest and test omit the live quantitative limit.

## Full build and deployment comparison

- `npm test`: PASS, 32/32 tests in 42.2 seconds.
- `npm run build`: PASS; `dist/` produced.
- JavaScript: 25.40 KB raw / 9.30 KB gzip.
- CSS: 15.01 KB raw / 4.24 KB gzip.
- Live frame-rate sample: 60.0 FPS.
- Candidate and live SHA-256 values matched for the root and all route shells, JavaScript, CSS, service worker, manifest, 404 files, AVIF, and social card.
- Live AVIF content type: `image/avif`.

The live implementation matches candidate `b2bc5e1`. The later `1558bdc` commit changes verification documentation only and does not require a different product image.

## Accessibility, performance, routes, and links

- Worker `verify-url.sh`: PASS in 722 ms with the expected title, `lang=en`, one `<h1>`, one `<main>`, alt text, labeled buttons, and no errors.
- Axe: zero violations on the desktop first screen, phone demo, privacy, terms, valid result, and designed 404.
- Keyboard: arrow movement, `R`, `P`, dialog focus capture, Escape close, and trigger-focus return passed.
- Focus: visible designed ring; the full suite verifies at least 3:1 contrast on both paper surfaces.
- Reduced motion: transitions and animations became effectively instant.
- 200% zoom equivalent at a 640 px layout width: no horizontal overflow or lost heading.
- Touch: a real touch-enabled phone context rotated a 56 px tile.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 2.1 s, TBT 70 ms, CLS 0.003.
- Titles are route-specific for `/`, `/demo`, `/play`, `/result`, `/privacy`, `/terms`, and the 404 page.
- All internal routes and the Param Factory footer link returned HTTP 200.
- The sitemap lists all six public routes.
- `/missing-review-2` returned the designed page with HTTP 404. Its expected failed-resource console entry is not a defect; no unexpected console or page errors occurred.

## Privacy, offline use, and security

The complete live audit recorded 122 requests. Every request used `https://seed-sprint.sociobot.in`; no analytics, third-party font, gameplay API, account, payment, or personal-data request appeared.

The privacy and terms pages rendered with their own titles and one heading each. Recent history could be viewed, replayed, and cleared. Demo storage remained separate from daily storage. After one visit, `/demo` reloaded offline from service-worker cache `seed-sprint-v3`. The service-worker upgrade claim also passed.

Response headers include a self-only CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, and denied camera, microphone, and geolocation permissions.

This is a static product. Backend tenant isolation, SQLite restart persistence, health endpoints, and 429/`Retry-After` checks do not apply.

## Earlier finding disposition

Every earlier review item was retested.

| Earlier item | Current evidence |
| --- | --- |
| F-1-1 demo seeded-state claim | Fixed: registered test passed at 4:17, 11 turns, and partial connections; reset matched. |
| F-1-2 touch claim | Fixed: touch-enabled 390 px context rotated a tile. |
| F-1-3 arrow-key coverage | Fixed: all directions are covered; live ArrowRight moved focus. |
| F-1-4 “seed” term collision | Fixed: the identifier is consistently “board code.” |
| F-1-5 unsupported “fair” | Fixed: live copy says “shared.” |
| F-1-6 subroute social metadata | Fixed: built and live route metadata are route-specific. |
| F-1-7 incomplete 404 shell | Fixed: designed 404 has the site shell, legal links, metadata, and HTTP 404. |
| F-1-8 recent results lacked use | Fixed functionally: view, replay, and clear passed. The new 14-result sentence has the separate test gap above. |
| F-1-9 mood slogan | Fixed: removed. |
| F-1-10 vague privacy heading | Fixed: “Data saved in this browser.” |
| F-1-11 unexplained UTC text | Fixed: plain daily reset wording. |
| F-1-12 “spoiler-safe” jargon | Fixed: copy says the result card hides the board. |
| F-1-13 instructions control | Fixed: “Show instructions.” |
| F-1-14 long README test sentence | Fixed: split into short sentences. |
| F-1-15 long README deploy sentence | Fixed: split into short sentences. |
| F-1-16 performance jargon | Fixed: plain 45 FPS statement. |
| F-1-17 sitemap omitted `/result` | Fixed: `/result` is listed. |
| Result-copy denial recovery | Fixed: focused selectable result URL passed. |
| Post-result stale timer | Fixed: restart restored 5:00. |
| Malformed result values | Fixed: invalid result recovery passed. |
| Undersized mobile links | Fixed: no visible phone target was below 44 × 44 px. |
| Unknown route returned 200 | Fixed: designed page returns HTTP 404. |
| Unstable frame-rate command | Fixed: isolated command passed at 60.3 FPS. |
| Existing PWA stayed stale | Fixed: upgrade test passed; live cache is `seed-sprint-v3`. |
| Same-board copy denial | Fixed: focused selectable fixed URL passed. |
| Invalid persisted session fields | Fixed: corrupt values reset safely. |
| Low-contrast focus indicator | Fixed: contrast regression test passed. |
| AVIF generic media type | Fixed: live response is `image/avif`. |

## Finding totals

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 1 |
| Medium | 0 |
| Low | 0 |
| Untested claims | 1 |

**Final verdict: FAIL.**
