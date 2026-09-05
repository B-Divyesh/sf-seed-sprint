# Seed Sprint verification 5 handoff — PASS

## Independent verification outcome

Fresh independent QA passed with zero findings and zero untested claims. The implementation remains `1cfe326029f0b69f15049f675d0846da3214fa77`; the documentation base reviewed was `7664d9bc1b408d2877a9011ed22873f81d0db5b9`. No product code changed during verification.

All 21 exact claim commands passed from a clean checkout. The full suite passed 32/32, the production build created `dist/`, and all 28 compared build outputs byte-match live HTTPS. Fresh Lighthouse scored 99 Performance and 100 for Accessibility, Best Practices, and SEO.

Live desktop and phone checks covered the first screen, one-click sample, persistent sample label, daily-data isolation, reset, Start for real, independent fixed-board clients, keyboard, touch, assist persistence, win, loss, restart, invalid data, blocked clipboard recovery, 14-result retention, routes, legal pages, designed HTTP 404, reduced motion, 200% zoom equivalent, offline reload, Axe, privacy requests, and security headers. The live verifier recorded 22 passes and zero failures.

Full results: `.factory/verification-5.md`. Evidence: `.factory/verification-5-evidence/`.

## Outcome

The strict review finding is resolved. The public **Recent results** promise now has a quantitative claim and outcome-based regression coverage: the test completes 15 distinct boards, verifies that exactly the newest 14 are visible, verifies the oldest is absent, then verifies view, replay, and clear.

I also corrected a small documentation-to-product mismatch found during the final live check. **Start for real** now opens today’s playable board directly. Reset and exit both preserve any existing daily data while clearing demo data.

Implementation SHA: `1cfe326029f0b69f15049f675d0846da3214fa77`.

The retention-coverage commit is `2ea3d08fca6289eedaa895dc2d597ebe9b711364`. Earlier review/report documentation ended at `743e83d769f1a2ef0734314b49c4ce46797a24ac`; this handoff is a later documentation record, not a different implementation candidate.

## What changed

- Registered the exact public promise: “The last 14 finished boards can be viewed, replayed, and cleared in this browser.”
- Replaced the one-result history check with 15 real, distinct near-complete runs. Each reaches the result screen through a tile rotation before the visible retained list is checked.
- Made the demo’s **Start for real** action navigate to `/play`, as documented.
- Extended the demo-isolation claim to prove a pre-existing daily-storage probe survives a demo move, demo reset, and exit to `/play`; demo keys are removed.
- Copied the verb-first 84-character catalog description to `/work/.evidence/catalog-description.txt`.

## How to run and verify

```sh
npm ci
npm test
npm run build
```

Run every exact command in `.factory/claims.json` after `npm ci`. All 21 commands passed from a fresh clone at `/tmp/seed-sprint-final-clean.5fQsNH`.

- Full Playwright suite: **32/32 passed**.
- Production build: passed; `dist/` was generated.
- Retention claim: passed after 15 completions; visible list contained `RETENTION-15` through `RETENTION-02`, with `RETENTION-01` absent.
- Isolated Chromium frame check: **60.1 FPS**, above the declared 45 FPS floor.
- Live mobile Lighthouse: Performance **99**, Accessibility **100**, Best Practices **100**, and SEO **100**.
- `verify-url.sh` against HTTPS: passed in 631 ms, with title, `lang`, one `h1`, `main`, image alt attributes, labels, and no console or page errors.
- Live Axe checks: zero serious or critical violations on the landing screen and active phone demo.

## Deployment and live check

Static deployment completed successfully on the existing one-site `sf-seed-sprint` Static Web App. It reused the current durable app and custom domain; no backend, volume, replica, or infrastructure setting was changed.

- Deployment ID: `588596ab-4fd2-4b94-80d6-f94e8f2ce462`.
- Deployed implementation SHA: `1cfe326029f0b69f15049f675d0846da3214fa77`.
- HTTPS now serves `/assets/index-D0WxseaJ.js`; the live AVIF response is `image/avif`.
- Fresh desktop first read, without scrolling: job “Race the same signal puzzle”; audience “puzzle friends” wanting one shared five-minute board without accounts or schedules; first action “Try it with sample data,” which opens a partly solved practice board. The board starts at 132 px.
- Fresh 390 × 844 touch first read has the same job, audience, and action; the board starts at 684 px, and `scrollWidth` equals 390 px.
- The live demo opened in one click with the persistent sample label, 4:17 remaining, 11 turns, and 7 of 25 connected route tiles. Reset restored 4:18 and 11 turns. Exit removed demo keys, kept the daily probe unchanged, and opened `/play`.
- A scripted `LIVE-WIN-2026` round reached the real **Connected** screen at 0:01 with 36 turns. **Play again** restored 5:00, zero turns, and the start control. `LIVE-LOSS-2026` reached the real **Time ended** screen at 5:00.
- `/`, `/demo`, `/play`, `/privacy`, `/terms`, and a valid `/result` return 200. `/missing-board` returns the designed HTTP 404. Route titles are specific.

Fresh evidence is in `.factory/repair-3-evidence/`, including landing screenshots, win/loss end screens, and `verify.json`.

## Earlier finding disposition

All findings from `verification.md`, `verification-2.md`, `review-1.md`, and `review-2.md` are covered by the current implementation and suite. This includes result and board-link recovery, reset timer, invalid shared data and persisted sessions, 44 px mobile targets, real 404 behavior, stable frame-rate testing, PWA updates, focus contrast, AVIF MIME type, demo state, touch, arrows, metadata, legal/404 shell, copy fixes, sitemap coverage, and useful local history.

The last unresolved item from review 2 was the untested 14-result limit; it is now registered and tested quantitatively.

## Known gaps and next steps

No known release-blocking gaps remain. Seed Sprint is a static, local-first game with no backend or external integration, so server health, tenant isolation, SQLite restart persistence, rate limits, and 429/`Retry-After` checks do not apply.
