# Seed Sprint handoff

## What shipped

- A complete deterministic daily 6×6 signal-routing game with 22–26 routed tiles, three seeds, one sprout, a five-minute loss state, and a verified solution for every generated board.
- The full loop: ready state, play, pause, refresh recovery, win or timeout, spoiler-safe result card, restart, and same-board friend link.
- Pointer, touch, and keyboard input. Arrow keys move, `R` rotates, and `P` pauses. Assist mode removes the timer and persists.
- A one-click `/demo` with the fixed, partly solved `SPROUT-7` board. Demo keys use the `demo:` namespace and are deleted when the player chooses **Start for real**.
- Local-only daily progress and recent completion history. No accounts, analytics, gameplay API, third-party scripts, or runtime CDN calls.
- Offline reload through a versioned service worker, plus privacy, terms, result, and designed 404 routes.
- A product-specific risograph collage system, generated hero art, responsive AVIF/WebP/JPEG delivery, favicon, social preview, and self-hosted OFL fonts.
- Route titles, canonical URLs, social metadata, sitemap, robots rules, security headers, reduced-motion behavior, mobile layout, and visible keyboard focus.

## How to run

```sh
npm install
npm run dev
npm test
npm run build
```

The static deploy root is `dist/`. The demo entry point is `/demo`.

## Verification

- `npm test`: 13 Playwright tests, including all nine claims, deterministic solutions across 366 seeds, both end states, demo isolation, offline reload, keyboard use, mobile sizing, route coverage, and axe scans.
- `npm run build`: passed. Output is 7.65 KB JavaScript gzip and 3.90 KB CSS gzip.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 <temp-dir>`: HTTP 200, no console errors, one H1, `lang=en`, main landmark, no missing alt text, and no unlabeled buttons. Measured load was 632 ms on the local preview.
- Lighthouse 12.8.2 mobile simulation: Performance 98, Accessibility 100, Best Practices 100, SEO 100. LCP 2.3 s, CLS 0.002, TBT 90 ms.
- A 390×844 Chromium pass found no horizontal overflow and measured every board tile at least 44×44 CSS pixels.
- The requestAnimationFrame timer rendered at 61.1 fps over two seconds at 390×844 with 4× CPU throttling.
- `npm audit --omit=dev`: no known production vulnerabilities.

The detailed claim matrix is in `.factory/claims.json`. Image provenance and the complete prompt are in `.factory/design.md` and `assets/src/seed-circuit.prompt.json`. The Lighthouse JSON is in `.factory/lighthouse.json`.

## Known gaps and next steps

- Same-board links are asynchronous. There is no live presence or leaderboard backend, matching the brief’s no-appointment audience and static deployment.
- Completion data stays local, so the success metrics cannot be observed in v1. A future privacy-preserving, aggregate-only endpoint could count completions and opened share links.
- The optional paid archive is a future funding path, not part of this free v1.
- Lighthouse numbers came from the local production preview. Re-run them against the deployed URL after the factory publishes it.
