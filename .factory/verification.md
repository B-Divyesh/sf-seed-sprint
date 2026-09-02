# Independent verification — Seed Sprint

## Verdict: FAIL

- Candidate: `9213232858d71b835e3e041a23b2d2d7d2e14ed4`
- Live URL: <https://seed-sprint.sociobot.in>
- Verified: 2026-09-02 UTC
- Work order: `seed-sprint-verify-1`

The candidate is deployed correctly and the main game loop works, but it does not meet the full acceptance contract. The claims manifest is incomplete, result sharing has no usable recovery when clipboard access fails, restart shows stale time, malformed shared-result values are not validated, and several mobile links miss the 44 px target minimum.

No product code was changed during verification.

## Findings

### High — release-blocking claims are not listed or tested

The live page and README advertise claims that have no entry and no exact tagged test in `.factory/claims.json`. The claims contract says any unlisted visitor-facing claim fails review.

Confirmed omissions include:

- “Free to play.”
- “Send a spoiler-safe card or the board link.” The current completion test only checks that a result card and copy button appear.
- “Friends can play this exact board at any time.” No claim test follows the copied same-board URL and compares boards.
- “There is no chat, account, live lobby, or endless puzzle feed.”
- “Shared links include only the seed, time, turns, and result.”
- Assist mode as an advertised mode.
- The handoff’s 60 fps performance claim, which the game-loop contract requires in the claims matrix.

Independent QA did verify the same-board link, spoiler-safe result, assist persistence, same-origin requests, and 60.0 fps behavior, but that does not repair the mandatory manifest/test omission in this candidate.

### High — the core share action has no valid clipboard-failure recovery

With clipboard write and the legacy copy fallback denied, **Copy result** announces:

> The result could not be copied. Copy the address from your browser.

The browser remains at `/play?seed=QA-CLIP`; that address is not the generated `/result?...` link and contains no result, time, or turns. The result text/link is not displayed or selectable anywhere. A player in this supported error path cannot perform the core job of comparing a result by link. Evidence: `qa-evidence/recovery-live.json`.

### Medium — restart leaves a stale timer

After the scripted daily win at `0:04`, **Play again** returned to the idle overlay and reset turns to `0`, but the visible timer remained `4:55` instead of `5:00`. Starting play updates it, but the reset state is visibly inconsistent. Reproduced in all independent live runs. The existing `restart-state` claim checks the demo banner reset, not post-result **Play again**.

### Medium — malformed result parameters render invalid output

`/result?seed=...&status=won&time=bogus&turns=-9` safely escapes markup, but displays `NaN:NaN` and `-9 turns`. Shared-link numeric input needs finite, non-negative bounds and a clear recovery. Evidence: `qa-evidence/live-product-qa.json`.

### Medium — five mobile links are below the 44 px target minimum

At 390 px, the game tiles are 56.33 × 56.33 px and pass. The following links fail the attached accessibility baseline:

| Link | Measured size |
| --- | ---: |
| Seed Sprint home | 145 × 31.5 px |
| Demo | 43 × 24 px |
| Privacy (footer) | 47 × 22.5 px |
| Terms (footer) | 40 × 22.5 px |
| Built by Param Factory | 147 × 22.5 px |

### Low — unknown SPA routes return HTTP 200

`/missing-board` renders the designed “Page not found” screen, but the server response is `200`, not `404`. Missing excluded assets correctly return `404`. This weakens crawler and cache semantics for mistyped page URLs.

## Mandatory first-read and demo gate

PASS.

The cold desktop first viewport states:

- What: “Race the same signal puzzle.”
- For whom: “For puzzle friends who want one fair five-minute board without accounts or schedules.”
- First action: “Try it with sample data,” with “Opens a partly solved practice board.”

The first screen visibly contains the 6×6 game board behind one start prompt rather than a menu wall. At 390 × 844, the board begins at y=639.72 and is visible in the captured first viewport. One click opens `/demo`, already active at 42 seconds and 11 turns, with the persistent demo banner, **Reset demo**, and **Start for real**. Demo storage stayed in `demo:` keys and was discarded on exit.

Screenshots:

- `qa-evidence/live-first-screen-desktop.png`
- `qa-evidence/live-first-screen-mobile.png`
- `qa-evidence/live-demo-mobile.png`

## Claims gate

The commands were enumerated before source inspection. Direct pre-install invocations could not load `@playwright/test` because a clean clone has no `node_modules`; no product assertion ran in those attempts. After the required `npm ci`, every exact command from `.factory/claims.json` passed:

| Claim | Exact result |
| --- | --- |
| `deterministic-board` | PASS, 1 test |
| `complete-board` | PASS, 1 test |
| `restart-state` | PASS, 1 test |
| `progress-reload` | PASS, 1 test |
| `five-minute-limit` | PASS, 1 test |
| `demo-isolation` | PASS, 1 test |
| `keyboard-controls` | PASS, 1 test |
| `privacy-local` | PASS, 1 test |
| `offline-reload` | PASS, 1 test |

Logs: `qa-evidence/claim-tests.log` and `qa-evidence/claim-tests-installed.log`.

## Clean-clone local gates

- `npm ci`: PASS; 22 packages installed; 0 vulnerabilities.
- `npm test`: PASS; 13/13 Playwright tests in 39.7 s.
- `npm run build`: PASS; runs `tsc --noEmit` and Vite production build; `dist/` produced.
- Lint: no lint script exists.
- `npm audit` and `npm audit --omit=dev`: PASS; 0 vulnerabilities.
- Generator soak: PASS across all 36,525 UTC dates from 2000 through 2099. Every board was deterministic, had 22–26 routed tiles, exactly three seeds and one sprout, and accepted its generated solution.

## Independent live game run

The deterministic scripted run covered title → active play → real end screen → restart.

- Daily seed: `2026-09-02`.
- Start state: timer `5:00`; start button required before timing.
- Goal and challenge: rotate 22 routed tiles to connect three seeds to one sprout before five minutes.
- Win: PASS; `Connected in 0:04 with 34 turns`; real result overlay reached.
- Loss: PASS; a `299.9`-second boundary fixture advanced to the `5:00` “Time ended” screen.
- Same-board link: PASS; copied `/play?seed=2026-09-02&room=1OQV0`; a fresh friend page had an identical tile/rotation/label signature.
- Result link: PASS on normal input; the copied summary omitted tile layout and opened the correct shared-result screen.
- Restart: PARTIAL; state and turns reset, but the displayed timer defect above remains.
- Persistence: PASS; a turn and assist mode survived reload.
- Recovery: PASS for malformed local storage; corrupt JSON reset to a clean `5:00` idle board.
- Keyboard: PASS for visible 4 px focus, tile rotation with `R`, pause/resume with `P`, dialog focus capture, Escape close, and focus return.
- Pointer/touch: PASS for tile operation and 56.33 px mobile game cells; global mobile link targets have the separate defect above.
- Frame cadence: 60.0 fps over 2.02 seconds with 4× CPU throttling; maximum observed frame interval 16.8 ms.

End-state screenshots:

- `qa-evidence/live-end-win-desktop.png`
- `qa-evidence/live-end-loss-desktop.png`

## Accessibility and responsive QA

- Axe serious/critical: 0 across desktop landing, instructions dialog, active demo, win screen, malformed-result screen, mobile landing, and mobile demo.
- Lighthouse accessibility: 100.
- Semantic checks: `lang=en`, one `<h1>`, one `<main>`, route-specific titles, skip link, labels for route tiles, and no missing alt text.
- Focus: visible 4 px sunflower outline; no dialog trap; focus returns to **How to play** after close.
- Reduced motion: PASS; transition/animation duration measured `0.00001s`, scroll behavior `auto`.
- 390 px layout: no horizontal overflow; board and primary actions fit. The first viewport includes the top of the game.
- Contrast: axe and Lighthouse found no contrast violations.

## Privacy, security, network, and PWA

- Full live flow request log: 81 requests, all to `https://seed-sprint.sociobot.in`; no analytics, runtime CDN, or third-party API requests.
- Console errors: 0. Page errors: 0.
- CSP restricts default/script/style/font/connect/worker/manifest to self, allows image `data:`, blocks framing, and restricts base/form actions.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS, and restrictive camera/microphone/geolocation policy are present.
- Service worker: active at `/sw.js`; update check completed; cache `seed-sprint-v1` present; `/demo` reloaded successfully offline in a fresh context.
- The product is static and made no server-side API or product-unlock calls. Rate-limit/429, backend concurrency, persistence boundary, health identity, and Entra sign-in checks are not applicable.

## Performance, caching, and deployment identity

Live Lighthouse mobile simulation:

| Category/metric | Result |
| --- | ---: |
| Performance | 94 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 1.2 s |
| LCP | 2.1 s |
| TBT | 242 ms |
| CLS | 0.002 |

Observed interaction event duration peaked at 32 ms over five live mobile tile rotations.

Build budgets:

- JavaScript: 20.11 KB raw / 7.66 KB gzip (budget 200 KB).
- CSS: 13.36 KB raw / 3.91 KB gzip (budget 50 KB).
- Fonts: 52.90 KB total (budget 120 KB).
- Mobile hero AVIF: 45.25 KB (budget 300 KB).

Caching:

- Hashed JS/CSS: `public, max-age=31536000, immutable`; conditional request returned `304`.
- Fonts: 30-day cache.
- HTML and service worker: 30-second revalidation.

Deployment match:

- `git rev-parse HEAD` equals the candidate commit.
- All 22 served output files compared, including the source map, match the local production build byte-for-byte by SHA-256.
- `staticwebapp.config.json` is correctly consumed as platform configuration rather than served as a public file.

## Evidence index

- `qa-evidence/live-product-qa.json` — 43 passing and 3 failing independent assertions plus requests, axe, mobile, FPS, reduced-motion, and PWA data.
- `qa-evidence/live-product-qa.mjs` — reproducible live test driver.
- `qa-evidence/npm-test.log`, `npm-build.log`, `verify-url-live.log`.
- `qa-evidence/deployment-hashes.log`, `routes-live.json`, `recovery-live.json`.
- `qa-evidence/lighthouse-live.json`, `interaction-latency-live.json`.
- `qa-evidence/generator-100-years.log`.

## Required next steps

1. Add a visible, selectable share-result/link fallback when copying fails; test the denied-clipboard path.
2. Add every advertised claim and mode to `.factory/claims.json` with one exact tagged test each, including spoiler safety, same-board links, assist mode, free/no-account statements, and measured frame rate.
3. Refresh the timer UI during restart and add a post-result restart test that checks timer, board, turns, status, and settings.
4. Validate and bound `time`, `turns`, `status`, and seed query parameters before rendering shared results.
5. Increase every mobile link’s interactive box to at least 44 × 44 CSS px.
6. Return an actual HTTP 404 for unknown page routes while retaining the designed recovery screen.

