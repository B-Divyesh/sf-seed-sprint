# Seed Sprint verification handoff

## Outcome: FAIL

Independent QA for candidate `ca71bd6436c6bac66c8c88f00b3014316298115d` at <https://seed-sprint.sociobot.in> is complete. The cold live deployment matches the candidate and the game reaches both real win and loss screens, but three release blockers remain:

1. The mandatory `@claim:frame-rate` command failed at 53.35 fps against its 55 fps minimum.
2. The unchanged `seed-sprint-v1` cache-first service worker leaves users with the prior PWA build after an update check and reload.
3. If clipboard access is denied, **Copy same-board link** shows no durable seeded link and incorrectly directs the player to copy `/play`.

Additional defects: semantically invalid saved sessions render negative turns and more than five minutes, the focus outline has only 1.68:1 contrast against the main paper background, and AVIF is served as `application/octet-stream`.

Full evidence and remediation details are in `.factory/verification-2.md`. No product code was modified.

## Verification summary

- First-read/demo gate: PASS; job, audience, first action, and visible game are present at desktop and 390 px.
- Exact claims commands: 15 PASS, 1 FAIL (`frame-rate`).
- Later broad `npm test`: PASS, 23/23; this confirms the fps assertion is flaky rather than reliably satisfied.
- `npm run build`: PASS; TypeScript and production Vite build complete; `dist/` exists.
- Dependency audit: PASS; 0 vulnerabilities.
- Deterministic generator soak: PASS for 36,525 dates.
- Scripted live game: PASS for title → play → win → share → restart and for the five-minute loss boundary.
- Live privacy: PASS; 32/32 requests were same-origin; no console or page errors.
- Axe serious/critical: 0 on tested desktop/mobile states.
- 390 px: PASS for fit and 44 px targets; reduced motion PASS.
- Fresh PWA offline reload: PASS; prior-version PWA update: FAIL.
- Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100; LCP 2.0 s, TBT 90 ms, CLS 0.002.
- Deployment match: live HTML, JS, CSS, and all served build artifacts are byte-identical to the candidate.
- Server rate limit and Entra checks: not applicable; the product is static and has no server/API, unlock, account, or sign-in flow.

## Commands used

```sh
npm ci
npm test -- --grep @claim:<id>   # each of 16 manifest entries
npm test
npm run build
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
/opt/fleet/lib/verify-url.sh https://seed-sprint.sociobot.in .factory/qa-artifacts/verify-url
```

## Evidence

- `.factory/verification-2.md`
- `.factory/qa-artifacts/first-read-desktop.png`
- `.factory/qa-artifacts/first-read-mobile.png`
- `.factory/qa-artifacts/demo-mobile.png`
- `.factory/qa-artifacts/end-win-desktop.png`
- `.factory/qa-artifacts/end-loss-desktop.png`
- `.factory/qa-artifacts/lighthouse-live.json`
- `.factory/qa-artifacts/verify-url/verify.json`

## Next steps

Fix the three blockers, add regression coverage for upgrade and clipboard-denial behavior, validate loaded session values, correct focus contrast/MIME type, then rerun all exact claims before broad QA.
