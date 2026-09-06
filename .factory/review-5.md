# Review daily signal puzzle play and result sharing

## Verdict: PASS

- Work order: `seed-sprint-review-5`
- Live URL: <https://seed-sprint.sociobot.in>
- Implementation reviewed: `1cfe326029f0b69f15049f675d0846da3214fa77`
- Documentation reviewed: `e0e510dd644295b537c3e183714fe37e3199e9f3`
- Reviewed: 6 September 2026 UTC
- Findings: **0**
- Untested claims: **0**

The live game works through active play, win, loss, sharing, and reset on desktop and phone. The one-click sample is populated, persistently labeled, and isolated from daily data. All 21 declared claim commands passed independently from a clean checkout. The full suite, production build, accessibility checks, offline and update paths, links, legal routes, designed 404, and deployment comparison also passed.

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

Evidence: `review-5-evidence/first-screen-desktop.png`, `first-screen-phone.png`, and `live-check.json`.

## Sample and data isolation

One click opened `/demo` with a realistic active sample:

- board code `SPROUT-7`;
- `4:17` remaining after load from the seeded `4:18` state;
- `11` turns;
- `7 of 25 route tiles connected`;
- persistent “Demo — sample board, nothing is saved to your daily game” label;
- visible **Reset demo** and **Start for real** actions.

The sample reached the real **Connected** screen at `0:43` with 45 turns. Its result link contained only `seed`, `status`, `time`, and `turns`. The result page contained no board tiles, and the demo label remained visible on the end screen.

Reset restored the sample timer, 11 turns, and partial connection state. A saved daily session remained byte-for-byte unchanged during demo play and reset. **Start for real** removed every `demo:` key, preserved the daily session, and opened today’s `/play` board.

Evidence: `review-5-evidence/demo-populated-desktop.png`, `sample-win-desktop.png`, and `live-check.json`.

## Complete game loops

### Desktop

- The live `2026-09-06` daily board reached **Connected** at `0:01` with 41 turns.
- **Play again** restored `5:00`, zero turns, the initial board, the start action, and timed mode.
- `REVIEW5-LOSS` crossed from 299.8 seconds to **Time ended** at `5:00`.
- Pointer, Enter, Space, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, `R`, and `P` worked.
- A simulated hidden-tab visibility event paused active play and exposed **Resume board**.

### Phone, 390 × 844 with touch enabled

- `REVIEW5-PHONE-WIN` started by touch and reached **Connected** at `0:02` with 43 turns.
- Touching **Play again** restored `5:00`, zero turns, and the start action.
- `REVIEW5-PHONE-LOSS` crossed the five-minute boundary to **Time ended** at `5:00`.
- Its result link opened **This board beat the clock**, contained only the four registered fields, and exposed no board layout.
- Reset after the loss restored `5:00`, zero turns, and the start action.
- Both end screens fit without horizontal overflow. Both restart targets were 118 × 47.5 CSS px.

### Other play paths

- Two independent browser contexts opened one `REVIEW5-ROOM` link. Every tile signature matched, and the room code survived reload.
- Assist mode changed the timer to **No limit** and persisted with progress after reload.
- Clipboard denial exposed focused, selectable fixed-board and result URLs.
- Malformed result parameters showed **This result link is incomplete**. Invalid saved sessions were removed and reset safely.
- Fifteen completions left exactly the newest 14 results. View, replay, and clear all worked.

Evidence: `review-5-evidence/daily-win-desktop.png`, `loss-desktop.png`, `end-win-phone.png`, `end-loss-phone.png`, `phone-loop.json`, `recent-14-desktop.png`, and `live-check.json`.

## Declared claim commands

The clean checkout was `e0e510dd644295b537c3e183714fe37e3199e9f3`. `npm ci` installed 22 packages with zero vulnerabilities. The manifest has 21 unique IDs, and every ID appears in exactly one tagged test. Every exact command was run separately after the clean install.

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
| `frame-rate` | PASS; 60.4 FPS against the 45 FPS floor |

The live page, README, demo guide, privacy page, terms page, and copy audit were checked against the manifest. No public claim was missing, false, incomplete, or untested.

Evidence: `review-5-evidence/claim-results.json`.

## Clean-checkout quality gates

- `npm ci`: PASS; zero vulnerabilities.
- Exact claim commands: PASS, 21/21.
- `npm test`: PASS, 32/32 in 37.5 seconds.
- `npm run build`: PASS; `dist/` was created.
- `npm audit --audit-level=high`: PASS; zero vulnerabilities.
- JavaScript: 25.40 KB raw / 9.30 KB gzip.
- CSS: 15.01 KB raw / 4.24 KB gzip.
- Self-hosted fonts: 52.90 KB total.
- Phone hero AVIF: 45.25 KB.

## Accessibility, routes, links, and performance

- The factory URL verifier passed in 617 ms with the expected title, `lang=en`, one `h1`, one `main`, image alt attributes, labeled buttons, and no errors.
- Playwright Axe found zero violations on the landing page, instructions dialog, sample win, shared result, phone demo, every public route, both legal pages, and the designed 404.
- The dialog opened with Enter, moved focus inside, closed with Escape, and returned focus to its trigger.
- The skip link moved focus into `main`. Browser Back and Forward restored the route and focused each route’s `h1`.
- The focus indicator passed the repository’s 3:1 contrast regression on both paper surfaces.
- Reduced motion made transitions and animations effectively instant and disabled smooth scrolling.
- The 200% zoom equivalent retained content without horizontal overflow.
- Every in-scope link on `/`, `/demo`, `/play`, `/privacy`, `/terms`, a valid `/result`, and the 404 resolved. The Param Factory link is marked as external and was not fetched because it is outside this product’s scope.
- Public routes returned 200 with route-specific titles, descriptions, canonicals, and Open Graph URLs.
- `/missing-review-5` returned the designed page with HTTP 404, one heading, the standard shell, legal links, and a recovery action. Its browser 404 resource message is expected and is not a defect.
- Fresh mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.20 s, LCP 2.10 s, TBT 40 ms, CLS 0.003.
- Live active-board cadence: 60.5 FPS.

Evidence: `review-5-evidence/verify-url/verify.json`, `interaction-routes.json`, `designed-404-desktop.png`, `lighthouse-live.json`, and `live-check.json`.

## Privacy, offline use, updates, and security

The full live game audit recorded 377 requests. Every request used `https://seed-sprint.sociobot.in`. There were no analytics, third-party fonts, gameplay APIs, account calls, payment calls, unexpected console errors, or page errors.

The live service worker installed from `/sw.js`, used cache `seed-sprint-v3`, checked for an update, and reloaded `/demo` offline. The isolated old-worker-to-current-worker update claim also passed from the clean checkout.

Live responses include a self-only content security policy, HSTS, `nosniff`, strict-origin referrer policy, and disabled camera, microphone, and geolocation permissions. AVIF files use `image/avif`. Hashed assets and images use long-lived caching.

Seed Sprint is a static, local-first game. It has no backend, tenant store, SQLite database, health endpoint, or request quota. Tenant isolation, server restart persistence, health identity, and 429/`Retry-After` checks do not apply. Its room is an asynchronous fixed-board link, not real-time multiplayer.

AI would not improve the brief’s deterministic, nonverbal puzzle loop. No AI feature is promised or required.

## Deployment identity

The last runtime implementation change is `1cfe326029f0b69f15049f675d0846da3214fa77`. Later commits through documentation head `e0e510dd644295b537c3e183714fe37e3199e9f3` contain only reports and evidence.

All 28 public build outputs from the clean production build byte-match live HTTPS. This includes route shells, hashed JavaScript and CSS, source map, fonts, images, manifest, service worker, sitemap, robots file, and designed 404. `staticwebapp.config.json` correctly returns 404 because the host consumes it as deployment configuration.

Evidence: `review-5-evidence/deployment-match.json`.

## Earlier finding disposition

Every earlier verification, polish, and review finding was retested, including minor items.

| Earlier item | Current evidence |
| --- | --- |
| Missing free, share, room, social, link-field, assist, and frame claims | Fixed: each claim appears once and each exact command passed. |
| Result-copy denial had no usable link | Fixed live: a complete focused, selectable result URL appeared. |
| Play again retained stale time | Fixed live: reset restored `5:00`, zero turns, initial board, and timed mode on desktop and phone. |
| Malformed result values rendered invalid output | Fixed live: the safe incomplete-link screen appeared. |
| Phone links were below 44 px | Fixed live: no visible phone target was undersized. |
| Unknown routes returned 200 | Fixed live: the designed page returned HTTP 404. |
| Frame-rate command was unstable | Fixed: isolated and live checks reported 60.4 and 60.5 FPS. |
| Existing PWAs stayed on the old cache | Fixed: the update claim passed; live cache is `seed-sprint-v3`. |
| Same-board copy denial had no recovery | Fixed live: a complete focused, selectable fixed-board URL appeared. |
| Invalid persisted session fields were accepted | Fixed live: corrupt values were removed and reset safely. |
| Focus indicator contrast was below 3:1 | Fixed: the contrast regression passed and keyboard focus was visible. |
| AVIF used a generic media type | Fixed live: AVIF responses use `image/avif`. |
| F-1-1 partly solved sample claim was absent | Fixed: `demo-seeded-state` passed with timer, turns, partial connection, and reset. |
| F-1-2 touch claim was absent | Fixed: the touch claim passed; fresh phone runs reached win and loss. |
| F-1-3 arrow-key claim was incomplete | Fixed: all four directions passed locally and live. |
| F-1-4 “seed” named two concepts | Fixed: the identifier is consistently “board code.” |
| F-1-5 unsupported “fair” copy | Fixed: current copy says “shared.” |
| F-1-6 subroute social metadata was wrong | Fixed: every route has its own title, description, canonical, and Open Graph URL. |
| F-1-7 the 404 lacked the site shell and metadata | Fixed: full shell, legal links, metadata, recovery, and HTTP 404 passed. |
| F-1-8 saved results had no user-facing purpose | Fixed: recent results support view, replay, and clear. |
| F-1-9 mood slogan | Fixed: removed. |
| F-1-10 vague privacy heading | Fixed: it says “Data saved in this browser.” |
| F-1-11 unexplained UTC wording | Fixed: copy explains the shared daily reset in plain words. |
| F-1-12 “spoiler-safe” jargon | Fixed in public copy: the result card says it hides the board. |
| F-1-13 vague instructions control | Fixed: the control says “Show instructions.” |
| F-1-14 long README test sentence | Fixed: split into short sentences. |
| F-1-15 long README deploy sentence | Fixed: split into short sentences. |
| F-1-16 performance jargon | Fixed: README states the tested 45 FPS floor plainly. |
| F-1-17 sitemap omitted `/result` | Fixed: the built and live sitemap include it. |
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
