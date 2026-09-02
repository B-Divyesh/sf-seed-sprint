# Polish round 1 — Seed Sprint

Candidate repaired: `28f482e3707c3b0463a21ec51eb0e723f3ae6fad`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Registered `demo-seeded-state`; its test checks the 4:18 sample timer, 11 turns, partial connections, and reset. | `@claim:demo-seeded-state`; live `/demo`; `/tmp/seed-sprint-live.aQhYXJ/live-demo-mobile.png` |
| F-1-2 | Registered `touch-controls`; a touch-enabled 390 px context uses `tap()` and verifies rotation. | `@claim:touch-controls`; live `/demo` touch check |
| F-1-3 | Extended the existing keyboard claim to validate ArrowLeft, ArrowRight, ArrowUp, ArrowDown, `R`, and `P`. | `@claim:keyboard-controls` |
| F-1-4 | Kept visible source markers as “seeds” and renamed the deterministic identifier to “board code” throughout player copy. | copy audit terminology table; live `/play` |
| F-1-5 | Replaced “fair” with the testable “shared” on the first screen and in metadata. | live `/`; `index.html` metadata |
| F-1-6 | Added route-specific runtime metadata and generated static shells for demo, play, result, privacy, and terms. Result metadata stays spoiler-free. | built-shell test; live `/demo` canonical and OG URL check |
| F-1-7 | Added the full header/footer, policy links, version, favicon/apple icon, canonical, description, Open Graph, and Twitter metadata to `404.html`. | static-404-shell test; live `/missing-board` returns 404 |
| F-1-8 | Added a local Recent results view with the last 14 finishes, replay/view-result links, and confirmed clearing. | `@claim:recent-results`; `/tmp/seed-sprint-live.aQhYXJ/live-recent-mobile.png` |
| F-1-9 | Removed the ambiguous “Same seed. Different route.” label. | `.factory/copy-audit.md` |
| F-1-10 | Rewrote the privacy heading as “Data saved in this browser.” | live `/`; `.factory/copy-audit.md` |
| F-1-11 | Replaced the first-screen UTC phrase with “A new board starts at the same time each day.” | live `/`; `.factory/copy-audit.md` |
| F-1-12 | Rewrote sharing copy to say that the result card hides the board. | live `/`; `@claim:share-result` |
| F-1-13 | Renamed the header control to “Show instructions.” | accessibility test; live `/demo` |
| F-1-14 | Split the long README testing sentence into short plain sentences. | README copy review |
| F-1-15 | Split the long README deployment sentence into two plain sentences. | README copy review |
| F-1-16 | Rewrote the performance sentence as a browser result, not implementation jargon. | README copy review; `@claim:frame-rate` |
| F-1-17 | Added `/result` to `sitemap.xml`. | built sitemap inspection; live `/result?...` |

## Verification

- Clean clone at `/tmp/seed-sprint-clean.nXJNFE`: `npm ci`, `npm test` (32 passed), and `npm run build` all passed. Log: `/tmp/seed-sprint-clean.log`.
- Every exact command in `.factory/claims.json` passed after `npm ci`. Log: `/tmp/seed-sprint-claims-final.log`.
- Local full suite: 32 passed in 35.8 seconds. Log: `/tmp/seed-sprint-final-test.log`.
- Live cold-root verification passed with zero page/console errors: `/tmp/seed-sprint-live.aQhYXJ/verify.json`; screenshots: `/tmp/seed-sprint-live.aQhYXJ/screenshot-desktop.png` and `/tmp/seed-sprint-live.aQhYXJ/screenshot-mobile.png`.
- Live route status check: `/`, `/demo`, `/play`, `/privacy`, `/terms`, and valid `/result` returned 200; `/missing-board` returned 404.
