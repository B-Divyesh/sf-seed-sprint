# Independent verification 3 — Seed Sprint

## Verdict: PASS

- Candidate commit: `b31b84f0b9a8f6fb7d522672e8c489f2a76fc1bf`
- Live URL: <https://seed-sprint.sociobot.in>
- Verified: 2026-09-02 UTC
- Work order: `seed-sprint-verify-3`
- Scope: deployed browser game / PWA; no product code changed during verification.

The earlier deployment-only concerns are resolved. A clean install, every registered claim command, the complete suite, the exact production build, independent live play, and a byte comparison all pass.

## First read and demo

PASS. On a cold desktop and 390 px mobile load, the first screen says what it is — “Race the same signal puzzle” — who it is for — puzzle friends wanting a fair five-minute board without accounts or schedules — and what to do first: **Try it with sample data**, with the immediate outcome stated as a partly solved practice board. The live 6×6 board preview is on the first screen, not a menu wall.

`/demo` opens the active `SPROUT-7` sample directly and retains the persistent “Demo — sample board” banner with **Reset demo** and **Start for real**. Demo interaction used only `demo:` local-storage keys; exiting demo removes those keys.

## Claims and clean-checkout gates

`npm ci` completed from this checkout (22 packages, audit: 0 vulnerabilities). `.factory/claims.json` exists and contains 18 IDs. I ran every exact command registered there through the local demo entry point, then ran the complete suite. All passed.

| Registered claim | Result |
| --- | --- |
| deterministic-board, complete-board, free-play, share-result | PASS |
| same-board-link, share-recovery, no-social-services, shared-link-fields | PASS |
| restart-state, progress-reload, five-minute-limit, demo-isolation | PASS |
| keyboard-controls, assist-mode, privacy-local, offline-reload | PASS |
| pwa-update, frame-rate | PASS |

- `npm test`: **28/28 passed** in 56.0 seconds. The isolated active-board cadence measured **60.5 FPS**, above the declared 45 FPS floor.
- `npm run build`: PASS (`tsc --noEmit` plus Vite); `dist/` produced.
- No separate lint command is configured.
- Production transfer budget: JS 22,697 bytes raw / **8.50 KB gzip**; CSS 13,962 bytes raw / **4.03 KB gzip**. This is below the static initial-JS 200 KB budget.

## Independent live product QA

- Deterministic scripted demo run: PASS. Rotating the verified tile orientations reached the real **Connected** end card (`0:42`, 45 turns) with **Copy result**.
- Loss boundary: PASS. A valid persisted 299.8-second run reached the real **Time ended** card at `5:00` with restart available.
- Reset: PASS. Reset demo restored the partly solved state (`4:17`, 11 turns), with no result card.
- Persistence: PASS. A tile turn and assist/no-limit setting survived reload; only `demo:session:SPROUT-7` was stored.
- Sharing: PASS. A copied room link opened `play?seed=QA-SEED&room=1I50H`, showed its room label, and rendered the seeded board. The registered result-share test verifies exactly `seed`, `status`, `time`, and `turns`, without layout data; both clipboard-denial recovery paths passed.
- Invalid recovery: PASS. A malformed result URL rendered “This result link is incomplete” and a safe **Play today’s board** recovery action.
- Input: PASS. Pointer/touch tile controls work; keyboard `R` rotated the focused tile and `P` paused/resumed. The full suite also covers arrow keys and focus contrast.

## Live deployment, privacy, accessibility, and performance

- Live root, `/demo`, `/privacy`, `/terms`, valid `/result`, and `/play` routes returned 200; an unknown route returned the designed HTTP 404.
- Local `dist/index.html`, `index-D2lKU3Pd.js`, and `index-CFyXKkyM.css` were byte-identical to the live files. SHA-256: HTML `0576edae…`, JS `48903945…`, CSS `dd966da9…`.
- The live outgoing request logs for cold home and interactive demo flows contained only `https://seed-sprint.sociobot.in`; no analytics, third-party scripts/fonts, gameplay API, account, payment, or sign-in flow was observed. This static product has no server endpoint, so rate-limit/429, concurrency, health, and Entra checks are not applicable.
- Response headers: self-only CSP including `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and disabled camera/microphone/geolocation. Hashed JS/CSS use one-year immutable caching; HTML and `sw.js` revalidate in 30 seconds.
- `/opt/fleet/lib/verify-url.sh` passed: 706 ms cold verification, title, `lang=en`, one h1, main, image alt text, labeled buttons, and zero page/console errors. Evidence is in `.factory/verification-evidence/`.
- Playwright Axe on the live home/demo at desktop and 390×844 found **0 serious/critical** (and 0 total) violations. Mobile had no horizontal overflow; tiles measured 56.33×56.33 CSS px. Reduced-motion transitions measured `0.00001s`.
- Lighthouse mobile retry: performance **97**, accessibility **100**, best practices **100**, SEO **100**; FCP 1.2 s, LCP 2.1 s, TBT 170 ms, CLS 0.002. (The first Lighthouse invocation had a verifier Chromium tab crash; immediate retry completed.)

## Defects

No release-blocking, high, medium, or low defects found. The attempted first Lighthouse invocation crashed in this verification container before loading a report; the immediate retry succeeded and is not a product failure.
