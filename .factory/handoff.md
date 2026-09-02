# Seed Sprint repair handoff

## Repair outcome

This repair resolves every release-blocking finding in independent verification report `3af5ca446ca1a64d4849866cbe08c3f5f2029b3b` while preserving the deterministic daily routing game, demo isolation, local-first storage, service worker, and static deployment.

- **Clipboard recovery:** denied clipboard and legacy-copy paths now reveal, select, and focus the generated `/result?seed=…&status=…&time=…&turns=…` URL. The player can copy the actual result link without relying on the browser address bar.
- **Restart consistency:** post-result **Play again** refreshes the visible timer to `5:00`, resets turns to `0`, restores the seeded board, and returns to the idle state.
- **Safe shared results:** result links accept only a short alphanumeric/hyphen seed, `won` or `lost`, integer time from 0–300, and integer turns from 0–9,999. Invalid links get a designed recovery screen instead of `NaN:NaN` or invalid turn counts.
- **Mobile targets:** every visible link has a 44×44 px minimum target at 390 px, including the wordmark, header demo link, footer links, and external factory link. The demo controls also meet the minimum.
- **Real 404:** Static Web Apps routing explicitly rewrites only product routes. Unknown requests receive HTTP 404 and the authored risograph-styled `404.html`, rather than a 200 SPA fallback.
- **Claims:** `.factory/claims.json` now has 16 claims. Each ID has exactly one `@claim:<id>` Playwright test, including free play, spoiler-safe result sharing, same-board links, no social services, shared-link fields, assist mode, and the frame-rate check.

## How to run

```sh
npm ci
npm test
npm run build
```

Use `npm run dev` for development. Open `/demo` for the isolated `SPROUT-7` sample. Static deployment uses `dist/`.

## Verification evidence

- `npm ci`: passed; 22 packages installed and audit reported no vulnerabilities.
- Type/build: `npm run build` passed after the repair. Output is 21.37 KB JavaScript raw / 8.08 KB gzip and 13.80 KB CSS raw / 3.98 KB gzip; `dist/` was produced.
- Browser coverage: all 23 Playwright assertions passed after the repair, including all 16 exact claim tags. The broad run exercised desktop, 390×844 mobile, keyboard rotation/pause, pointer controls, demo storage isolation, offline reload in a dedicated context, same-origin request privacy, result sharing, invalid result recovery, and post-result restart.
- Accessibility: Playwright Axe scans passed with no violations on landing, active play, and the instructions dialog. The local `verify-url.sh` pass reported title, `lang=en`, one `h1`, a main landmark, no missing image alt text, no unlabeled buttons, and zero console/page errors (597 ms local load).
- 390 px: regression coverage measures every visible link and game tile at least 44 px in both dimensions, with no horizontal overflow.
- 404: Azure Static Web Apps emulator served `/demo` with 200 and `/missing-board` with HTTP 404 containing the designed “This board link does not exist” page.
- Claims: a source audit confirmed all 16 IDs appear exactly once as `@claim:` tags. The frame-rate claim measures at least 55 requestAnimationFrame callbacks per second in Chromium.

## Deployment and live checks

The release is committed and deployed from this repair commit. Verify the public identity and routing with:

```sh
curl -I https://seed-sprint.sociobot.in/
curl -i https://seed-sprint.sociobot.in/missing-board
```

Expected: the home route identifies Seed Sprint and the unknown route returns HTTP 404 with the designed recovery page.

## Known gaps / next steps

- Same-board play is asynchronous by design; there is no chat, lobby, account, or leaderboard backend.
- Completion history remains local to the browser, so no player or aggregate analytics are collected.
