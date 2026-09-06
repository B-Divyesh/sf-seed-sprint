# Review daily signal puzzle play and result sharing

## Verdict: PASS

- Work order: `seed-sprint-review-4`
- Live URL: <https://seed-sprint.sociobot.in>
- Implementation reviewed: `1cfe326029f0b69f15049f675d0846da3214fa77`
- Documentation reviewed: `49548c89d2897dee44a686a12a71a1b1c5498d42`
- Reviewed: 6 September 2026 UTC
- Findings: **0**
- Untested claims: **0**

The live browser game works from entry through active play, win, loss, sharing, and reset on desktop and phone. The one-click sample is populated and isolated from daily data. All 21 declared claim commands passed independently from a clean checkout. The full suite, production build, live accessibility checks, offline behavior, update behavior, links, legal routes, designed 404, and deployed-file comparison also passed.

No product code was modified during this review.

## First screen before scrolling

### Desktop, 1440 × 900

- Job: race the same five-minute signal-routing puzzle.
- Audience: puzzle friends who want one shared board without accounts or schedules.
- First action: **Try it with sample data**.
- Stated result: it opens a partly solved practice board.
- Plain facts: free to play, works offline after the first visit, and progress stays on this device.
- The game starts at 132 px, inside the 900 px first screen.

### Phone, 390 × 844

The same job, audience, first action, stated result, and facts are visible before scrolling. The game starts at 684 px, inside the first screen. Page width and scroll width are both 390 px. No visible link or button is smaller than 44 × 44 CSS px.

Evidence: `review-4-evidence/first-screen-desktop.png`, `first-screen-phone.png`, and `live-check.json`.

## Sample and data isolation

One click opened `/demo` with a realistic active sample:

- board code `SPROUT-7`;
- `4:17` remaining after load from the seeded `4:18` state;
- `11` turns;
- `7 of 25 route tiles connected`;
- persistent “Demo — sample board, nothing is saved to your daily game” label;
- visible **Reset demo** and **Start for real** actions.

The sample reached the real **Connected** screen at `0:43` with 45 turns. Its result link contained only `seed`, `status`, `time`, and `turns`. The result page contained no board tiles.

Reset restored the sample timer, 11 turns, and partial connection state. A saved daily session remained byte-for-byte unchanged during demo play and reset. **Start for real** removed all `demo:` keys, preserved the daily session, and opened `/play`.

Evidence: `review-4-evidence/demo-populated-desktop.png`, `sample-win-desktop.png`, and `live-check.json`.

## Complete game loops

### Desktop

- The live `2026-09-06` daily board started and reached **Connected** at `0:01` with 41 turns.
- **Play again** restored `5:00`, zero turns, the initial board, the start action, and timed mode.
- `REVIEW4-LOSS` crossed from 299.8 seconds through the live timer and reached **Time ended** at `5:00`.
- Pointer, Enter, Space, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, `R`, and `P` worked.
- A visibility change paused active play. Resume continued from the saved state.

### Phone, 390 × 844 with touch enabled

- `REVIEW4-PHONE-WIN` started by touch and reached **Connected** at `0:02` with 51 turns.
- Touching **Play again** restored `5:00`, zero turns, and the start action.
- `REVIEW4-PHONE-LOSS` started by touch and crossed the five-minute boundary to **Time ended** at `5:00`.
- Reset after the loss again restored `5:00`, zero turns, and the start action.
- Both end screens fit without horizontal overflow. Both **Play again** targets were 118 × 47.5 CSS px.

### Other play paths

- Two independent browser contexts opened one `REVIEW4-ROOM` link. Every tile signature matched, and the room code survived reload.
- Assist mode changed the timer to **No limit** and persisted with progress after reload.
- Clipboard denial exposed focused, selectable fixed-board and result URLs.
- Malformed result parameters showed **This result link is incomplete**. Invalid saved sessions were removed and reset safely.
- Fifteen completions left exactly the newest 14 results. View, replay, and clear all worked.

Evidence: `review-4-evidence/daily-win-desktop.png`, `loss-desktop.png`, `end-win-phone.png`, `end-loss-phone.png`, `phone-loop-live.json`, `recent-14-desktop.png`, and `live-check.json`.

## Declared claim commands

The clean checkout was `49548c89d2897dee44a686a12a71a1b1c5498d42`. `npm ci` installed 22 packages with zero vulnerabilities. The manifest has 21 unique IDs, and every ID appears in exactly one tagged test. Every exact command was run separately after the clean install.

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
| `recent-results` | PASS; 15 completions proved the newest 14 are retained |
| `offline-reload` | PASS |
| `pwa-update` | PASS |
| `frame-rate` | PASS; 60.1 FPS against the 45 FPS floor |

The live page, README, demo guide, privacy page, terms page, and copy audit were checked against the manifest. No public claim was missing, false, incomplete, or untested.

Evidence: `review-4-evidence/claim-results.json`.

## Clean-checkout quality gates

- `npm ci`: PASS; zero vulnerabilities.
- Exact claim commands: PASS, 21/21.
- `npm test`: PASS, 32/32 in 35.9 seconds.
- `npm run build`: PASS; `dist/` was created.
- `npm audit --audit-level=high`: PASS; zero vulnerabilities.
- JavaScript: 25.40 KB raw / 9.28 KB gzip.
- CSS: 15.01 KB raw / 4.25 KB gzip.
- Self-hosted fonts: 52.90 KB total.
- Phone hero AVIF: 45.25 KB.

## Accessibility, routes, links, and performance

- The factory URL verifier passed in 660 ms with the expected title, `lang=en`, one `h1`, one `main`, image alt attributes, labeled buttons, and no unexpected errors.
- Playwright Axe found zero violations on the landing page, instructions dialog, sample win, shared result, phone demo, every public route, both legal pages, and the designed 404.
- The instructions dialog opened with Enter, moved focus inside, closed with Escape, and returned focus to its trigger.
- The skip link moved the main landmark to the top and retained focus inside it.
- Browser Back and Forward restored the correct route and moved focus to each route’s `h1`.
- The designed focus indicator passed the repository’s 3:1 contrast regression on both paper surfaces.
- Reduced motion changed transitions and animations to effectively instant and disabled smooth scrolling.
- The 200% zoom equivalent retained the heading and content without horizontal overflow.
- Every internal link on `/`, `/demo`, `/play`, `/privacy`, `/terms`, a valid `/result`, and the 404 resolved successfully. In-page skip links remained on their document.
- The Param Factory link is clearly marked as external. It was not fetched because it is outside this product’s authorized scope.
- `/`, `/demo`, `/play`, `/privacy`, `/terms`, and valid `/result` returned 200 with route-specific titles, descriptions, canonicals, and Open Graph URLs.
- `/missing-review-4` returned the designed page with HTTP 404, one heading, the standard shell, legal links, and a recovery action. Its browser 404 resource message is expected and is not a defect.
- Fresh mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.20 s, LCP 2.18 s, TBT 55 ms, CLS 0.003.
- Live active-board cadence: 60.5 FPS.

Evidence: `review-4-evidence/verify-url/verify.json`, `interaction-routes-live.json`, `designed-404-desktop.png`, `lighthouse-live.json`, and `live-check.json`.

## Privacy, offline use, updates, and security

The full live game audit recorded 375 requests. Every request used `https://seed-sprint.sociobot.in`. There were no analytics, third-party fonts, gameplay APIs, account calls, payment calls, unexpected console errors, or page errors.

The live service worker installed from `/sw.js`, used cache `seed-sprint-v3`, checked for an update, and reloaded `/demo` offline. The exact isolated old-worker-to-current-worker update claim also passed from the clean checkout.

Live responses include a self-only content security policy, HSTS, `nosniff`, strict-origin referrer policy, and disabled camera, microphone, and geolocation permissions. AVIF files use `image/avif`. Hashed assets and images use long-lived caching.

Seed Sprint is a static, local-first game. It has no backend, tenant store, SQLite database, health endpoint, or request quota. Tenant isolation, server restart persistence, health identity, and 429/`Retry-After` checks do not apply. Its room is an asynchronous fixed-board link, not real-time multiplayer.

AI would not improve the brief’s deterministic, nonverbal puzzle loop. No AI feature is promised or required.

## Deployment identity

The last runtime implementation change is `1cfe326029f0b69f15049f675d0846da3214fa77`. Later commits through documentation head `49548c89d2897dee44a686a12a71a1b1c5498d42` contain only reports and evidence.

All 28 public build outputs from the clean production build byte-match live HTTPS. This includes route shells, hashed JavaScript and CSS, source map, fonts, images, manifest, service worker, sitemap, robots file, and designed 404. `staticwebapp.config.json` correctly returns 404 because the host consumes it as deployment configuration.

Evidence: `review-4-evidence/deployment-match.json`.

## Earlier finding disposition

Every earlier verification, polish, and review item was inspected and freshly retested.

| Earlier item | Current disposition |
| --- | --- |
| Missing free, share, room, social, link-field, assist, and frame claims | Fixed: each claim appears once in the manifest and each exact command passed. |
| Result-copy denial had no usable link | Fixed live: a complete focused and selectable result URL appeared. |
| Play again kept stale time | Fixed on desktop and phone: reset restored `5:00`, zero turns, the original board, and timed mode. |
| Malformed result values rendered invalid output | Fixed live: invalid input showed the safe incomplete-link screen. |
| Phone links were below 44 px | Fixed live: no visible phone control was undersized. |
| Unknown routes returned 200 | Fixed live: the designed missing page returned HTTP 404. |
| Frame-rate claim was unstable at 55 FPS | Fixed: the isolated 45 FPS command passed at 60.1 FPS; live measured 60.5 FPS. |
| Existing PWAs stayed on the old cache | Fixed: the old-worker upgrade command passed and live cache `seed-sprint-v3` reloaded offline. |
| Same-board copy denial had no recovery | Fixed live: the complete fixed link was focused and selectable. |
| Invalid saved sessions were accepted | Fixed: the full suite rejected invalid fields, and the live bad state reset safely. |
| Focus indicator contrast was below 3:1 | Fixed: the contrast regression passed and focus was visible. |
| AVIF used a generic media type | Fixed live: the response is `image/avif`. |
| F-1-1 partly solved sample claim was absent | Fixed: `demo-seeded-state` passed with timer, turns, partial connection, and reset. |
| F-1-2 touch claim was absent | Fixed: the touch claim passed; fresh phone runs used touch from start through win and loss reset. |
| F-1-3 arrow-key claim was incomplete | Fixed: all four directions passed locally and live. |
| F-1-4 “seed” named two concepts | Fixed: the identifier is consistently “board code.” |
| F-1-5 unsupported “fair” copy | Fixed: current copy says “shared.” |
| F-1-6 subroute social metadata was wrong | Fixed: every route has its own title, description, canonical, and Open Graph URL. |
| F-1-7 the 404 lacked the site shell and metadata | Fixed: the full shell, legal links, metadata, recovery, and HTTP 404 passed. |
| F-1-8 saved results had no user-facing purpose | Fixed: recent results support view, replay, and clear. |
| F-1-9 mood slogan | Fixed: removed. |
| F-1-10 vague privacy heading | Fixed: it says “Data saved in this browser.” |
| F-1-11 unexplained UTC wording | Fixed: copy explains the shared daily reset in plain words. |
| F-1-12 “spoiler-safe” jargon | Fixed in public copy: the result card says it hides the board. |
| F-1-13 vague instructions control | Fixed: the control says “Show instructions.” |
| F-1-14 and F-1-15 long README sentences | Fixed: both sentences are split and remain under the limit. |
| F-1-16 performance jargon | Fixed: README states the tested 45 FPS floor plainly. |
| F-1-17 sitemap omitted `/result` | Fixed: the route is present in the built and live sitemap. |
| Review 2 left the 14-result limit untested | Fixed: the claim and both clean and live 15-completion checks passed. |
| Start for real did not open today’s board | Fixed live: it opens `/play`, clears demo data, and preserves daily data. |

## Finding totals

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Untested claims | 0 |

**Final verdict: PASS.**
