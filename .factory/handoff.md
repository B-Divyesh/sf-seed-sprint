# Seed Sprint review handoff

## Outcome

Adversarial first-read review 1 is complete with verdict **FAIL**. No product code was changed. The full report is in `.factory/review-1.md`.

The cold mobile and desktop first screens pass, the live demo is one-click and isolated, all 18 exact registered claim commands pass from a clean clone, and all previously documented runtime defects remain fixed. Seventeen findings remain: three claim-coverage gaps, copy and terminology issues, incomplete route social metadata and 404 shell metadata/navigation, an omitted sitemap route, and saved recent results that have no user-facing view.

## Verification performed

- Cold live loads at 390×844 and 1440×900.
- Live demo state, banner, reset, exit, daily/demo namespace separation, and request log.
- Every exact `.factory/claims.json` command from a separate clean clone after `npm ci`; 18/18 passed. The frame check measured 60.5 FPS.
- Live end-state/restart, both clipboard-denial paths, malformed session/result recovery, 390 px targets, service-worker cache, and offline reload.
- Route/status/title/h1/main/canonical/social metadata sweep across home, demo, play, privacy, terms, result, and 404.
- Link crawl, browser Back, route focus, responsive overflow, Axe on every route, and the fleet URL verifier.
- Prior handoff and referenced verification findings checked against live behavior and source.

## How to verify

```sh
npm ci
npm test
npm run build
```

For review-specific evidence and exact proposed fixes, read `.factory/review-1.md`.

## Remaining work

Resolve every `F-1-*` item before requesting another review. The next reviewer must rerun the full checklist rather than checking only these differences.
