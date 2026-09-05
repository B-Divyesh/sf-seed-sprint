# Verify daily signal puzzle play and result sharing

## Verdict: PASS

- Work order: `seed-sprint-verify-5`
- Live URL: <https://seed-sprint.sociobot.in>
- Implementation reviewed: `1cfe326029f0b69f15049f675d0846da3214fa77`
- Documentation reviewed: `7664d9bc1b408d2877a9011ed22873f81d0db5b9`
- Verified: 5 September 2026 UTC
- Findings: **0**
- Untested claims: **0**

The deployed game matches the implementation candidate. The daily puzzle, isolated sample, result sharing, fixed-board link, local history, keyboard and touch controls, offline reload, legal routes, and recovery paths work. All 21 declared claim commands passed from a clean checkout. No product code was changed.

## First screen before scrolling

### Desktop, 1440 × 900

- Job: race the same five-minute signal-routing puzzle.
- Audience: puzzle friends who want one shared board without accounts or schedules.
- First action: **Try it with sample data**. The next line says it opens a partly solved practice board.
- Facts shown: free to play, works offline after the first visit, and progress stays on this device.
- The game starts at 132 px and is visible in the first screen.

### Phone, 390 × 844

The same job, audience, first action, outcome, and facts are visible. The game starts at 684 px, inside the first screen. Page width and scroll width are both 390 px. All visible links and buttons are at least 44 × 44 CSS px.

Evidence: `verification-5-evidence/first-screen-desktop.png` and `first-screen-phone.png`.

## Sample and real-data isolation

One click opened `/demo` with a realistic active board:

- board code `SPROUT-7`;
- `4:17` remaining;
- `11` turns;
- `7 of 25 route tiles connected`;
- persistent “Demo — sample board, nothing is saved to your daily game” label;
- visible **Reset demo** and **Start for real** actions.

The sample reached the real **Connected** screen at `0:43` with 45 turns. Its result URL contained only `seed`, `status`, `time`, and `turns`, and the result page contained no board layout.

Reset restored the partly solved state. In a fresh context, the verifier first created and saved progress for today’s daily board. Demo play and reset did not change that saved daily session. **Start for real** removed all `demo:` keys, kept the daily session byte-for-byte, and opened `/play`.

Evidence: `verification-5-evidence/demo-populated-desktop.png`, `sample-win-desktop.png`, and `live-check.json`.

## Complete game runs

- Win: today’s board `2026-09-05` reached **Connected** at `0:01` with 43 turns.
- Restart: **Play again** restored `5:00`, zero turns, the start control, the initial board, and timed mode.
- Loss: `VERIFY5-LOSS` crossed the five-minute boundary and reached **Time ended** at `5:00`.
- Fixed board: two independent browser contexts opened the same `VERIFY5-ROOM` link. Their complete tile signatures matched, and the room code and board survived reload.
- Settings: assist mode changed the timer to **No limit** and survived reload with board progress.
- Input: pointer, real touch, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, `R`, and `P` all worked.
- Sharing recovery: denied clipboard access exposed focused, selectable fixed-board and result URLs.
- Invalid data: malformed result parameters showed **This result link is incomplete**. Invalid stored sessions were removed and reset to `5:00`, zero turns.
- Recent results: 15 completed live boards left exactly `LIVE5-15` through `LIVE5-02`; `LIVE5-01` was removed. View, replay, and clear all worked.

Evidence: `verification-5-evidence/daily-win-desktop.png`, `loss-desktop.png`, `recent-14-desktop.png`, and `live-check.json`.

## Declared claims

The clean checkout was `7664d9b`. `npm ci` installed the documented prerequisites with zero vulnerabilities. The manifest has 21 unique IDs, and every ID appears in exactly one tagged test.

| Claim | Exact command result |
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
| `recent-results` | PASS; 15 completions proved newest 14 retained |
| `offline-reload` | PASS |
| `pwa-update` | PASS |
| `frame-rate` | PASS; 60.3 FPS, floor 45 FPS |

The live page, README, demo guide, privacy page, and terms page were checked against the manifest. No public claim was missing from `.factory/claims.json`, and no claim remained untested.

## Clean-checkout gates

- `npm ci`: PASS; 22 packages, zero vulnerabilities.
- Every exact command in `.factory/claims.json`: PASS, 21/21.
- `npm test`: PASS, 32/32 in 35.7 seconds.
- `npm run build`: PASS; TypeScript, Vite, route rendering, and `dist/` creation completed.
- `npm audit --audit-level=high`: PASS; zero vulnerabilities.
- JavaScript: 25.40 KB raw / 9.30 KB gzip.
- CSS: 15.01 KB raw / 4.24 KB gzip.
- Self-hosted fonts: 52.90 KB total.
- Phone hero AVIF: 45.25 KB.

## Accessibility, routes, links, and performance

- Worker URL verification: PASS in 767 ms with a plain title, `lang=en`, one `h1`, one `main`, alt attributes, labeled buttons, and no load errors.
- Axe: zero violations on the desktop landing page, instructions dialog, sample win, shared result, phone demo, privacy, terms, valid result, and designed 404.
- Dialog: Enter opened it, focus moved to **Close instructions**, Escape closed it, and focus returned to **Show instructions**.
- Focus: the designed indicator passed the 3:1 automated contrast regression on both paper surfaces.
- Reduced motion: transitions and animations were effectively instant; scrolling was not smooth.
- 200% zoom equivalent: the 640 px layout had no horizontal overflow or lost heading.
- Routes: `/`, `/demo`, `/play`, `/privacy`, `/terms`, and valid `/result` returned 200 with route-specific titles and metadata.
- Missing route: `/missing-verify-5` returned the designed page with HTTP 404, one heading, site navigation, footer, and recovery link. Its browser 404 resource message is expected and is not a defect.
- Internal links returned 200. The external Param Factory link had a clear external label and `rel=noreferrer`; it was not opened because this work order forbids connecting to another product.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 2.1 s, TBT 50 ms, CLS 0.003.
- Live frame rate: 60.3 FPS during active play.

## Privacy, offline use, and security

The full live run recorded 375 requests. Every request used `https://seed-sprint.sociobot.in`. There were no analytics, third-party fonts, gameplay APIs, account calls, payment calls, or unexpected console or page errors.

The service worker installed as `/sw.js`, used cache `seed-sprint-v3`, checked for an update, and reloaded `/demo` offline. The exact prior-worker-to-current-worker update claim also passed locally.

The live root sends a self-only content security policy, HSTS, `nosniff`, strict-origin referrer policy, and disabled camera, microphone, and geolocation permissions. The AVIF asset is served as `image/avif` with immutable caching.

Seed Sprint is a static, local-first game. It has no backend, tenant store, SQLite database, health endpoint, or live request quota. Tenant isolation, restart persistence, health identity, and 429/`Retry-After` checks do not apply. The fixed-board room is an asynchronous link, not a real-time lobby.

## Deployment match

The implementation candidate and documentation commit differ only by handoff and verification evidence. No product code changed after `1cfe326`.

All 28 compared build outputs byte-match live HTTPS, including route shells, JavaScript, CSS, source map, fonts, images, manifest, service worker, sitemap, robots file, and designed 404. Key hashes:

- `index.html`: `8fdba56f68442ff491ce6167927bdee9f709856bf776dbd79f7f3da71e8afce1`
- `assets/index-D0WxseaJ.js`: `e66cd1e4bb2f413f85f411559050c7c976a8a9bd91999f87b718a11f976ad998`
- `assets/index-BCq4_LNO.css`: `c1aa5cec3a57df3d092b70f9fe5a0944295b93312db45a13a4c29f6e5dc13052`
- `sw.js`: `c557e1998e664eead260f0bf2d875cc4775a2f6db8538a5c23a177667436a90b`

`staticwebapp.config.json` is correctly applied by the host and is not publicly served.

## Earlier finding disposition

Every earlier verification and review item was retested.

| Earlier item | Current evidence |
| --- | --- |
| Missing free/share/same-board/social/link-field/assist/frame claims | Fixed: all are registered once and their exact commands passed. |
| Result-copy denial had no usable link | Fixed live: complete focused selectable result URL. |
| Play again kept stale time | Fixed live: reset returned `5:00`, zero turns, initial board, timed mode. |
| Malformed result values rendered invalid output | Fixed live: safe incomplete-link screen. |
| Phone links were below 44 px | Fixed live: no undersized visible link or button at 390 px. |
| Unknown routes returned 200 | Fixed live: designed HTTP 404. |
| Frame-rate claim was unstable | Fixed: isolated command and live measurement both reported 60.3 FPS. |
| Existing PWAs stayed on the old cache | Fixed: update claim passed; live cache is `seed-sprint-v3`. |
| Same-board copy denial had no recovery | Fixed live: focused selectable fixed-board URL. |
| Invalid saved sessions were accepted | Fixed live: bad values were removed and reset. |
| Focus ring contrast was below 3:1 | Fixed: regression passed and keyboard focus was visible. |
| AVIF used a generic type | Fixed live: `image/avif`. |
| F-1-1 partly solved sample claim was absent | Fixed: `demo-seeded-state` passed with timer, turns, partial connection, and reset checks. |
| F-1-2 touch claim was absent | Fixed: `touch-controls` passed in a touch-enabled phone context and live tap rotated a tile. |
| F-1-3 arrow-key claim was incomplete | Fixed: all four arrows were tested locally and live. |
| F-1-4 “seed” named two concepts | Fixed: the identifier is “board code”; game pieces remain seeds. |
| F-1-5 unsupported “fair” copy | Fixed: current copy says “shared.” |
| F-1-6 subroute social metadata was wrong | Fixed: every route has its own canonical, Open Graph URL, title, and description. |
| F-1-7 404 lacked the site shell and metadata | Fixed: full shell, legal links, metadata, recovery action, and HTTP 404 passed. |
| F-1-8 saved results had no user-facing purpose | Fixed: recent results support view, replay, and clear. |
| F-1-9 mood slogan | Fixed: removed. |
| F-1-10 vague privacy heading | Fixed: “Data saved in this browser.” |
| F-1-11 unexplained UTC text | Fixed: plain daily-reset wording. |
| F-1-12 “spoiler-safe” jargon | Fixed in public copy: the card says it hides the board. |
| F-1-13 vague instructions control | Fixed: “Show instructions.” |
| F-1-14 long README test sentence | Fixed: split into short sentences. |
| F-1-15 long README deploy sentence | Fixed: split into short sentences. |
| F-1-16 performance jargon | Fixed: plain 45 FPS statement. |
| F-1-17 sitemap omitted `/result` | Fixed: live sitemap includes it. |
| Review 2 left the 14-result limit untested | Fixed: exact claim and both clean and live 15-completion checks passed. |
| Start for real did not open today’s board | Fixed live: opens `/play`, clears demo data, preserves daily data. |

## Evidence

- `verification-5-evidence/live-check.json`: 22 passed, 0 failed; full desktop, phone, game, route, privacy, offline, and history results.
- `verification-5-evidence/verify.json`: worker URL verification.
- `verification-5-evidence/lighthouse-live.json`: fresh live Lighthouse report.
- `verification-5-evidence/live-check.mjs`: repeatable live verifier.
- `verification-5-evidence/*.png`: first screens, populated sample, sample win, daily win, loss, and 14-result history.

## Finding totals

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Untested claims | 0 |

**Final verdict: PASS.**
