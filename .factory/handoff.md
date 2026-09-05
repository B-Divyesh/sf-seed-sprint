# Seed Sprint review 2 handoff — FAIL

## Outcome

Review 2 failed candidate `b2bc5e107b7e57ed43c10cefa66bae1bdc23b7f3` with one finding and one untested public claim. No product code was changed.

The live **Recent results** section promises that the last 14 finished boards stay in the browser. The registered `recent-results` claim and its test cover only one result, so they do not prove the quantitative limit. See `.factory/review-2.md` for the required resolution and full evidence.

## Verified behavior

- Every one of the 21 registered claim commands passed from a clean candidate checkout.
- `npm test` passed 32/32 tests.
- `npm run build` passed and produced `dist/`.
- The sampled live route shells, assets, service worker, manifest, 404, and art match the candidate build by SHA-256.
- Fresh desktop and touch-enabled phone contexts passed first-read, demo, isolation, reset, win, loss, restart, keyboard, sharing, independent friend link, recovery, offline, reduced-motion, routes, legal pages, and privacy-request checks.
- The live audit passed 55/55 checks and measured 60.0 FPS.
- Worker URL verification passed with no errors.
- Lighthouse mobile scored Performance 99 and Accessibility 100; LCP was 2.1 s and CLS was 0.003.

## Evidence

- Review: `.factory/review-2.md`
- Live results: `/work/.evidence/seed-sprint-review-2/live-review.json`
- Screenshots: `/work/.evidence/seed-sprint-review-2/*.png`
- Lighthouse: `/work/.evidence/seed-sprint-review-2/lighthouse.json`
- Factory copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`

## Reproduce

```sh
npm ci
npm test
npm run build
```

Then run each exact `test` command in `.factory/claims.json` from a clean checkout.

## Remaining work

Register and test the public 14-result retention limit, or remove the number from public copy. A PASS requires zero findings and zero untested claims.
