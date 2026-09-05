# Review daily signal puzzle play and result sharing

## Verdict: PASS

- Work order: `seed-sprint-review-3`
- Live URL: <https://seed-sprint.sociobot.in>
- Implementation reviewed: `1cfe326029f0b69f15049f675d0846da3214fa77`
- Documentation base reviewed: `eb864f792f3848b21da26f9f74ca25bb3f87553b`
- Reviewed: 5 September 2026 UTC
- Findings: **0**
- Untested claims: **0**

The deployed browser game works from entry through play, win, loss, sharing, and restart. The one-click sample is populated and isolated from daily data. All 21 declared claim commands passed independently from a clean checkout. The full suite, build, live accessibility checks, privacy checks, offline reload, and deployed-file comparison also passed.

No product code was modified during this review.

## First screen before scrolling

### Desktop, 1440 × 900

- Job: race the same five-minute signal-routing puzzle.
- Audience: puzzle friends who want one shared board without accounts or schedules.
- First action: **Try it with sample data**.
- Stated result: it opens a partly solved practice board.
- Plain facts: free to play, works offline after the first visit, and progress stays on this device.
- The game begins at 132 px, within the 900 px first screen.

### Phone, 390 × 844

The same job, audience, action, stated result, and facts are visible before scrolling. The game begins at 684 px, within the first screen. Page width and scroll width are both 390 px. No visible link or button is smaller than 44 × 44 CSS px.

Evidence: `review-3-evidence/first-screen-desktop.png` and `first-screen-phone.png`.

## Sample and real-data isolation

One click opened `/demo` with a realistic active sample:

- board code `SPROUT-7`;
- `4:17` remaining;
- `11` turns;
- `7 of 25 route tiles connected`;
- persistent “Demo — sample board, nothing is saved to your daily game” label;
- visible **Reset demo** and **Start for real** actions.

The sample reached the real **Connected** screen at `0:43` with 45 turns. The result link contained only `seed`, `status`, `time`, and `turns`. Its result page contained no board tiles.

Reset restored the seeded timer, turns, and partial connection state. A saved daily session remained byte-for-byte unchanged during demo play and reset. **Start for real** removed all `demo:` keys, preserved the daily session, and opened `/play`.

Evidence: `review-3-evidence/demo-populated-desktop.png`, `sample-win-desktop.png`, and `live-check.json`.

## Complete game runs

- Daily win: the live `2026-09-05` board opened from the landing page and reached **Connected** at `0:02` with 43 turns.
- Restart: **Play again** restored `5:00`, zero turns, the initial board, the start action, and timed mode.
- Loss: `REVIEW3-LOSS` crossed the five-minute boundary and reached the real **Time ended** screen at `5:00`.
- Fixed board: two independent browser contexts opened the same `REVIEW3-ROOM` link. Their full tile signatures matched, and the room label survived reload.
- Input: touch, pointer, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, `R`, and `P` worked.
- Setting: assist mode changed the timer to **No limit** and persisted with board progress after reload.
- Sharing recovery: denied clipboard access exposed focused, selectable fixed-board and result URLs.
- Invalid data: malformed result parameters showed **This result link is incomplete**. Invalid saved sessions were removed and reset safely.
- Recent results: 15 completed boards left exactly the newest 14. View, replay, and clear worked.

Evidence: `review-3-evidence/today-win-desktop.png`, `today-run.json`, `loss-desktop.png`, `recent-14-desktop.png`, and `live-check.json`.

## Declared claim commands

The clean checkout was `eb864f792f3848b21da26f9f74ca25bb3f87553b`. `npm ci` installed 22 packages with zero vulnerabilities. The manifest has 21 unique IDs, and each ID appears in one tagged test. Every exact command was run separately.

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

The live page, README, demo guide, privacy page, terms page, and copy audit were checked against the manifest. No public claim was missing, incomplete, false, or untested.

Evidence: `review-3-evidence/claim-results.json`.

## Clean-checkout quality gates

- `npm ci`: PASS; zero vulnerabilities.
- Every exact claim command: PASS, 21/21.
- `npm test`: PASS, 32/32 in 38.7 seconds.
- `npm run build`: PASS; `dist/` was created.
- `npm audit --audit-level=high`: PASS; zero vulnerabilities.
- JavaScript: 25.40 KB raw / 9.30 KB gzip.
- CSS: 15.01 KB raw / 4.24 KB gzip.
- Self-hosted fonts: 52.90 KB total.
- Phone hero AVIF: 45.25 KB.

## Accessibility, routes, links, and performance

- Factory URL verification passed in 792 ms with the expected title, `lang=en`, one `h1`, one `main`, image alt attributes, labeled buttons, and no unexpected console or page errors.
- Playwright Axe found zero violations on the desktop landing page, instructions dialog, sample win, shared result, phone demo, every public route, both legal pages, and the designed 404.
- The instructions dialog opened with Enter, moved focus inside, closed with Escape, and returned focus to its trigger.
- The designed focus indicator was visible. The regression suite proved at least 3:1 contrast on both paper surfaces.
- Reduced motion changed transitions and animations to effectively instant and disabled smooth scrolling.
- A 200% zoom equivalent kept the heading and content without horizontal overflow.
- All internal links returned 200. The Param Factory link was marked as external and was not opened because it is outside this work order.
- `/`, `/demo`, `/play`, `/privacy`, `/terms`, and valid `/result` returned 200 with route-specific titles, descriptions, canonicals, and Open Graph URLs.
- `/missing-review-3` returned the designed page with HTTP 404, one heading, the site shell, legal links, and a recovery action. Its failed-resource console entry is expected and is not a defect.
- Fresh mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 2.1 s, TBT 60 ms, CLS 0.003.
- Live active-board cadence: 60.6 FPS.

The first Lighthouse launch lacked the disposable image's explicit Chromium path. After supplying the preinstalled path, one browser tab crashed before measurement. The immediate retry completed with the scores above. These were verifier setup/runtime events, not product failures.

## Privacy, offline use, and security

The full live audit recorded 375 requests. Every request used `https://seed-sprint.sociobot.in`. There were no analytics, third-party fonts, gameplay APIs, account calls, payment calls, or unexpected runtime errors.

The service worker installed from `/sw.js`, used cache `seed-sprint-v3`, checked for an update, and reloaded `/demo` offline. The exact old-worker-to-current-worker update claim also passed locally.

Live responses include a self-only content security policy, HSTS, `nosniff`, strict-origin referrer policy, and disabled camera, microphone, and geolocation permissions. The AVIF is served as `image/avif`. Hashed JavaScript and images use immutable caching.

Seed Sprint is a static, local-first game. It has no backend, tenant store, SQLite database, health endpoint, or request quota. Tenant isolation, restart persistence, health identity, and 429/`Retry-After` checks do not apply. Its room is an asynchronous fixed-board link, not a real-time lobby.

## Deployment match

The last runtime implementation change is `1cfe326029f0b69f15049f675d0846da3214fa77`. Later commits through documentation base `eb864f792f3848b21da26f9f74ca25bb3f87553b` changed tests, claims documentation, reports, and evidence, not the deployed runtime.

All 28 public build outputs from the clean production build byte-match live HTTPS. This includes route shells, hashed JavaScript and CSS, source map, fonts, images, manifest, service worker, sitemap, robots file, and designed 404. `staticwebapp.config.json` correctly returns 404 because the host consumes it as deployment configuration.

Evidence: `review-3-evidence/deployment-match.json`.

## Earlier finding disposition

Every earlier verification, polish, and review item was inspected and retested.

| Earlier item | Current disposition |
| --- | --- |
| Missing free, share, room, social, link-field, assist, and frame claims | Fixed: all appear once in the manifest and all exact commands passed. |
| Result-copy denial had no usable link | Fixed live: a complete focused and selectable result URL appeared. |
| Play again kept stale time | Fixed live: restart restored `5:00`, zero turns, the original board, and timed mode. |
| Malformed result values rendered invalid output | Fixed live: invalid input showed the safe incomplete-link screen. |
| Phone links were below 44 px | Fixed live: no visible phone control was undersized. |
| Unknown routes returned 200 | Fixed live: the designed missing page returned HTTP 404. |
| Frame-rate claim was unstable at 55 FPS | Fixed: the isolated 45 FPS command passed at 60.1 FPS; live measured 60.6 FPS. |
| Existing PWAs stayed on the old cache | Fixed: the upgrade command passed and live cache `seed-sprint-v3` reloaded offline. |
| Same-board copy denial had no recovery | Fixed live: the complete fixed link was focused and selectable. |
| Invalid saved sessions were accepted | Fixed: the full suite rejected every invalid field, and live bad state reset safely. |
| Focus indicator contrast was below 3:1 | Fixed: the contrast regression passed and focus was visible. |
| AVIF used a generic media type | Fixed live: the response is `image/avif`. |
| F-1-1 partly solved sample claim was absent | Fixed: `demo-seeded-state` passed with the seeded timer, turns, partial connection, and reset. |
| F-1-2 touch claim was absent | Fixed: the touch claim passed, and a fresh phone tap rotated a 56.3 px tile. |
| F-1-3 arrow-key claim was incomplete | Fixed: all four directions passed locally and live. |
| F-1-4 “seed” named two concepts | Fixed: the identifier is consistently “board code.” |
| F-1-5 unsupported “fair” copy | Fixed: current copy says “shared.” |
| F-1-6 subroute social metadata was wrong | Fixed: every route has its own title, description, canonical, and Open Graph URL. |
| F-1-7 the 404 lacked the site shell and metadata | Fixed: the full shell, legal links, metadata, recovery, and HTTP 404 passed. |
| F-1-8 saved results had no user-facing purpose | Fixed: recent results support view, replay, and clear. |
| F-1-9 mood slogan | Fixed: removed. |
| F-1-10 vague privacy heading | Fixed: it now says “Data saved in this browser.” |
| F-1-11 unexplained UTC wording | Fixed: the copy explains the shared daily reset in plain words. |
| F-1-12 “spoiler-safe” jargon | Fixed in public copy: the result card says it hides the board. |
| F-1-13 vague instructions control | Fixed: the control says “Show instructions.” |
| F-1-14 and F-1-15 long README sentences | Fixed: both sentences were split and remain below the limit. |
| F-1-16 performance jargon | Fixed: the README states the tested 45 FPS floor plainly. |
| F-1-17 sitemap omitted `/result` | Fixed: the route is present in the built and live sitemap. |
| Review 2 left the 14-result limit untested | Fixed: the claim and both clean and live 15-completion checks passed. |
| Start for real did not open today’s board | Fixed live: it opens `/play`, clears demo data, and preserves daily data. |

## Evidence

- `review-3-evidence/live-check.json`: 22 passed, 0 failed.
- `review-3-evidence/claim-results.json`: 21 claim commands plus full gates.
- `review-3-evidence/deployment-match.json`: 28/28 live byte matches.
- `review-3-evidence/lighthouse-live.json`: fresh live Lighthouse result.
- `review-3-evidence/verify.json`: factory URL verification.
- `review-3-evidence/*.png`: desktop, phone, sample, win, loss, and recent-results captures.

## Finding totals

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Untested claims | 0 |

**Final verdict: PASS.**
