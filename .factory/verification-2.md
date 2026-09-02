# Independent verification 2 — Seed Sprint

## Verdict: FAIL

- Candidate: `ca71bd6436c6bac66c8c88f00b3014316298115d`
- Live URL: <https://seed-sprint.sociobot.in>
- Verified: 2026-09-02 UTC
- Work order: `seed-sprint-verify-2`
- Artifact class: browser game / PWA

The cold deployment matches the candidate and the deterministic game can be played from title screen through win and loss screens. The candidate is not releasable because one mandatory claim test failed, existing PWA installations do not update to this build, and the same-board share action has no valid recovery when clipboard access is denied.

No product code was changed during verification.

## Release-blocking findings

### High — the mandatory frame-rate claim fails

The exact command declared by `.factory/claims.json` failed during the required claims-first run:

```text
npm test -- --grep @claim:frame-rate
Expected: >= 55
Received: 53.34914048606627
```

The failure produced `test-results/product--claim-frame-rate--6fd4a-ames-per-second-in-Chromium-chromium/test-failed-1.png` and `trace.zip`.

A later complete `npm test` run passed all 23 tests, including this check. That does not cancel the mandatory failure; it demonstrates instability. A `--repeat-each=10` run with the repository's default two workers failed 10/10 samples at 13.78–26.68 fps. An independent live two-second sample under 4× CPU throttling reached 59.5 fps. The product appears smooth in isolation, but its advertised and registered ≥55 fps check is not reliable under the actual test runner.

### High — previously installed PWAs remain on the old build

`public/sw.js` is byte-identical between the previous deployed candidate `9213232858d71b835e3e041a23b2d2d7d2e14ed4` and this candidate. Both use cache name `seed-sprint-v1` and cache-first navigation. The application shell changed from `/assets/index-DACCY-lB.js` to `/assets/index-GSEiKBZK.js`.

An independent two-version test installed the old build on one origin, changed that origin to the candidate, called `registration.update()`, and reloaded. Chromium reported no installing or waiting worker and continued to load `/assets/index-DACCY-lB.js`. It never reached the candidate script.

Fresh installs work offline, but returning PWA users who visited the prior build can remain permanently pinned to stale cached HTML and code. This also means the repaired live deployment does not match the candidate for those users.

### High — same-board sharing cannot recover from clipboard denial

On live `/play`, with both `navigator.clipboard.writeText` and `document.execCommand('copy')` denied, **Copy same-board link** announces:

> The link could not be copied. Copy the address from your browser.

No input, link, or selectable value is shown. The browser address is only `/play`; it omits the fixed `seed` and `room`, so it can open a different daily board after the UTC date changes. This breaks the primary “friends can play this exact board at any time” job in a supported error path.

The separate **Copy result** denial path is fixed: it displays, focuses, and selects the complete `/result?seed=…&status=…&time=…&turns=…` URL.

## Other findings

### Medium — persisted session values are not validated

The loader accepts any parsed object whose `rotations` array has 36 entries. With `elapsed: -100`, `turns: -9`, `status: "playing"`, and null rotations, reload showed `6:39`, `-9` turns, `24 of 24 route tiles connected`, and an enabled Pause button. Invalid or obsolete local state should be bounded and reset.

### Medium — the focus indicator misses the required contrast

The global focus style is a 4 px `#E4AD19` outline. Its contrast against the normal `#F4E8CE` page background is 1.68:1 and against the `#FFF9EA` panel background is 1.94:1, below the attached 3:1 requirement. Keyboard focus is present and thick, but not sufficiently contrasted on the main surfaces.

### Low — AVIF is served with a generic media type

The live hero AVIF returns `Content-Type: application/octet-stream` rather than `image/avif`. Chromium displayed it successfully, but the deployment MIME map should identify AVIF explicitly.

## Mandatory first-read and demo gate

PASS.

- What: “Race the same signal puzzle.”
- For whom: “For puzzle friends who want one fair five-minute board without accounts or schedules.”
- First action: “Try it with sample data,” followed by “Opens a partly solved practice board.”

The 6×6 board is visible in the first desktop screen. At 390×844 it begins at y=639.72, so the game itself is also visible without scrolling. One click opens the active `SPROUT-7` sample with the persistent demo banner, **Reset demo**, and **Start for real**. Demo keys were restricted to `demo:` and removed on exit.

Evidence: `qa-artifacts/first-read-desktop.png`, `first-read-mobile.png`, and `demo-mobile.png`.

## Claims gate

`.factory/claims.json` exists with 16 unique IDs. Source inspection found each ID exactly once as `@claim:<id>`.

The clean clone initially had no dependencies, so the first direct command could not import `@playwright/test`; after the required `npm ci`, every exact claim command was run. Fifteen passed. `frame-rate` failed at 53.35 fps and therefore fails the release by the claims contract.

| Claim | Result |
| --- | --- |
| `deterministic-board` | PASS |
| `complete-board` | PASS |
| `free-play` | PASS |
| `share-result` | PASS |
| `same-board-link` | PASS |
| `no-social-services` | PASS |
| `shared-link-fields` | PASS |
| `restart-state` | PASS |
| `progress-reload` | PASS |
| `five-minute-limit` | PASS |
| `demo-isolation` | PASS |
| `keyboard-controls` | PASS |
| `assist-mode` | PASS |
| `privacy-local` | PASS |
| `offline-reload` | PASS |
| `frame-rate` | **FAIL — 53.35 fps, minimum 55** |

The landing page and README claims are represented in the manifest. No additional unlisted product claim was identified.

## Clean-checkout gates

- `npm ci`: PASS; 22 packages installed, 0 audit vulnerabilities.
- `npm test`: PASS on the later broad run; 23/23 tests in 1.0 minute.
- `npm run build`: PASS; includes `tsc --noEmit`; `dist/` produced.
- Lint: no lint script or separate lint configuration exists.
- Both full and production-only `npm audit --audit-level=high`: PASS; 0 vulnerabilities.
- Generator soak: PASS for all 36,525 UTC dates from 2000 through 2099. Every board was deterministic, contained 22–26 route tiles, exactly three seeds and one sprout, and passed `isSolved` with its stored solution.

| Build asset | Raw | Gzip/observed transfer |
| --- | ---: | ---: |
| JavaScript | 21.37 KB | 8.08 KB gzip |
| CSS | 13.80 KB | 3.98 KB gzip |
| Fonts total | 52.90 KB | 53.80 KB with headers |
| Mobile hero AVIF | 45.25 KB | 45.55 KB with headers |

All static budgets pass.

## Independent live game run

- Daily seed: `2026-09-02`.
- Goal/challenge: rotate the 6×6 board's 22 routed tiles to connect three seeds to the sprout before five minutes.
- Win: PASS; reached `Connected in 0:04 with 34 turns` and the real end screen.
- Loss: PASS; a 299.9-second boundary advanced to `Time ended` at 5:00.
- Restart: PASS; restored idle state, `5:00`, `0` turns, and the original board.
- Normal same-board share: PASS; copied `/play?seed=2026-09-02&room=1OQV0`; a fresh page had an identical tile/class/label signature.
- Result share: PASS; exact fields were `seed`, `status`, `time`, and `turns`; no layout data appeared; the shared page had no board.
- Clipboard recovery: result PASS; same-board FAIL as described above.
- Progress and assist setting: PASS across reload.
- Keyboard: PASS for arrows, `R`, and `P`; native pointer/touch controls also worked.
- Live frame sample: 59.5 fps for two seconds under 4× CPU throttling, with one 33.3 ms maximum interval.
- Invalid shared-result URL: PASS; rendered “This result link is incomplete” without unsafe or nonsensical values.
- Invalid persisted session: FAIL as described above.

Screenshots: `qa-artifacts/end-win-desktop.png` and `end-loss-desktop.png`.

## Accessibility and responsive checks

- Playwright Axe serious/critical: 0 on landing, instructions, active mobile demo, and invalid-result recovery.
- Worker `verify-url.sh`: PASS; title, `lang=en`, one h1, main landmark, image alt attributes, labeled buttons, and zero console/page errors; 736 ms live load.
- 390×844: no horizontal overflow; all visible links/buttons were at least 44×44 CSS px; routed tiles measured 56.33×56.33 px.
- 200% desktop zoom equivalent (640 px layout width): no horizontal overflow or first-screen content loss.
- Dialog focus management, route h1 focus, browser Back, skip link presence, arrow navigation, and keyboard operation passed.
- Reduced motion: transition and animation duration measured 0.00001 s and scroll behavior was `auto`.
- Focus ring: present at 4 px, but contrast fails as reported above.

## Privacy, security, routes, and caching

- The full live play/share flow recorded 32 requests, all to `https://seed-sprint.sociobot.in`.
- No analytics, third-party fonts/scripts, API calls, console errors, or page errors were observed.
- Root response includes CSP restricted to self, `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, and a camera/microphone/geolocation deny policy.
- `/`, `/demo`, `/play`, `/privacy`, `/terms`, and a valid `/result` return 200. An unknown route returns the designed page with HTTP 404.
- Hashed JS/CSS and art use one-year immutable caching. HTML and `sw.js` use 30-second revalidation. Fonts use 30-day caching.
- A fresh service-worker install and offline `/demo` reload pass. The upgrade path fails as reported above.
- This is a static product with no server endpoint, product-unlock request, account, or sign-in. API 429/`Retry-After`, backend concurrency, server persistence, health identity, and Entra checks are not applicable.

## Lighthouse and deployment identity

A fresh live Lighthouse mobile run reported:

| Category/metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 1.2 s |
| LCP | 2.0 s |
| TBT | 90 ms |
| CLS | 0.002 |

The first Lighthouse attempt had a verifier-side Chromium tab crash; the immediate retry completed with the results above.

The live root HTML, hashed JavaScript, and CSS are byte-identical to the candidate build. A broader comparison found all 22 served build artifacts byte-identical; the designed 404 body also matched. The live asset names are `index-GSEiKBZK.js` and `index-Cid-mF8C.css`, exactly as produced from the candidate.

## Required fixes

1. Make the registered fps claim deterministic and representative, or remove/relax the quantitative claim. The exact registered command must pass reliably.
2. Version the service worker/cache whenever the shell changes and test an upgrade from the prior production build, not only a fresh offline install.
3. Give **Copy same-board link** the same visible/selectable fallback used by **Copy result**, including the fixed seed and room.
4. Validate every persisted session field and reset incompatible or out-of-range state.
5. Use a focus indicator with at least 3:1 contrast against both paper surfaces.
6. Serve AVIF with `image/avif`.
