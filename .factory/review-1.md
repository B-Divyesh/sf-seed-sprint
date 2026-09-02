# Adversarial first-read review 1 — Seed Sprint

## Verdict: FAIL

- Work order: `seed-sprint-review-1`
- Candidate: `2d4df3339736009770e6c9c34f119b2baf021e70`
- Live URL: <https://seed-sprint.sociobot.in>
- Reviewed: 2026-09-02 UTC
- Blocking findings: none
- Other findings: 17

The game is clear on first read, the one-click demo is real and isolated, and all 18 registered claim commands pass. The release still fails this zero-finding review because one advertised demo state is absent from the claims manifest, two advertised input methods are not exercised by their claim tests, several copy rules are missed, route metadata and the static 404 shell are incomplete, and the brief's locally saved result history has no user-facing value.

No product code was modified during this review.

## Findings

### High

#### F-1-1 — The partly solved demo state is an unlisted claim

- Exact copy: landing caption, “Opens a partly solved practice board.” README: “The demo starts partly solved…”
- Evidence: `.factory/claims.json` has no claim for the seeded initial demo state. The untagged “Reset demo restores its seeded sample state” test checks 11 turns and a status sentence, but no manifest entry points to it and it does not assert that the board is partly solved.
- Impact: a visitor is promised meaningful sample progress, but the required claims gate does not protect that promise.
- Fix: add a `demo-seeded-state` claim and exactly one `@claim:demo-seeded-state` test. From a fresh `/demo`, assert an active timer near 4:18, 11 turns, and a connected count greater than zero and less than the route-tile total; then assert Reset restores the same state.

#### F-1-2 — The advertised touch control is unlisted and untested

- Exact copy: README Controls, “Click or tap a tile to rotate it clockwise.”
- Evidence: no claim names tap input. The completion test uses Playwright `click()`, not a touch-enabled context and `tap()`.
- Impact: phone visitors are explicitly told that touch works, but the claims suite does not verify the phone interaction it advertises.
- Fix: register a `touch-controls` claim and test one tile rotation with `hasTouch: true` and `locator.tap()` at 390 px.

#### F-1-3 — The keyboard claim test omits the advertised arrow-key behavior

- Exact copy: README Controls, “Use arrow keys to move between tiles.”
- Evidence: `@claim:keyboard-controls` presses `R` and `P` only. No test presses an arrow key and checks that focus moves to the intended non-empty tile.
- Impact: the registered test can pass while a documented keyboard navigation path is broken.
- Fix: extend the one existing `@claim:keyboard-controls` test to press each relevant arrow direction, confirm focus movement and row boundaries, then retain the current rotate and pause checks.

### Medium

#### F-1-4 — “Seed” names two different concepts on the same screen

- Exact locations: “Connect every seed to the sprout” and “Board seed SPROUT-7”; the landing slogan also says “Same seed.”
- Impact: “seed” means both a source marker and the deterministic board identifier. A first-time player cannot know which meaning applies without reading surrounding UI.
- Fix: keep “seed” for the visible source markers and rename the identifier everywhere to “board code,” for example “Board code: SPROUT-7.”

#### F-1-5 — “Fair” is an unsupported marketing adjective

- Exact copy: first-screen sentence, “For puzzle friends who want one fair five-minute board without accounts or schedules.” The meta description also says “the same fair board.”
- Impact: “fair” does not name the observable reason for fairness. The deterministic-board test proves identical boards, not fairness in every possible sense.
- Fix: write “For puzzle friends who want one shared five-minute board without accounts or schedules.” Change the meta description to use “shared” or “identical.”

#### F-1-6 — Subroutes publish the home page as their Open Graph URL

- Exact location: rendered `<meta property="og:url" content="https://seed-sprint.sociobot.in/">` on `/demo`, `/play`, `/privacy`, `/terms`, and `/result?...`; their Open Graph and Twitter titles/descriptions also remain the home-page values.
- Impact: shared subroutes describe and canonically identify the home page in social metadata. This is especially weak for the product's core shared-result link.
- Fix: provide route-specific Open Graph/Twitter title, description, and URL values. Pre-render route shells so non-JavaScript link-preview crawlers receive the right spoiler-free metadata while preserving the shared URL.

#### F-1-7 — The real 404 does not use the required site shell or metadata

- Exact location: live `/missing-board` returns the designed `public/404.html`, but its header contains only the wordmark; its footer has no Privacy, Terms, Param Factory, version, or build ID. It also lacks a meta description, canonical link, Open Graph tags, Twitter tags, and apple-touch icon.
- Impact: a visitor arriving through a broken link loses the standard navigation and policy links, and the route fails the metadata checklist.
- Fix: give `404.html` the same header/footer contents as application routes and add a 404-specific description, canonical, social metadata, and apple-touch icon while retaining HTTP 404.

#### F-1-8 — Saved recent results have no user-facing purpose

- Exact locations: `/privacy` says “Seed Sprint saves your current board, settings, and recent daily results in local storage.” `saveCompletion()` retains 14 results, but no route reads or displays them.
- Impact: the product stores data that the player cannot inspect, use, export, or clear inside the product. The brief's returning-player loop and possible archive are left without an obvious local history view.
- Fix: add a local “Recent results” section that lists the last 14 dates, outcomes, times, and turns, with replay/share actions and a clear-history control. Keep it local; AI and sync are not warranted for this game.

### Low

#### F-1-9 — The section label is a mood slogan, not information

- Exact copy: “Same seed. Different route.”
- Impact: the line is ambiguous and does not tell the visitor what the section contains. It also reinforces the two meanings of “seed.”
- Fix: delete it; the adjacent “How it works” heading already names the section. Alternatively use “Three steps to play.”

#### F-1-10 — A privacy heading relies on the vague word “here”

- Exact copy: “Your play stays here.”
- Impact: heard out of context, the heading does not say where data is stored.
- Fix: write “Data saved in this browser.”

#### F-1-11 — “UTC” is unexplained first-screen jargon

- Exact copy: “One board every UTC day.”
- Impact: a phone visitor may not know the acronym or what it means for the reset.
- Fix: write “Everyone gets one new board at the same time each day.” Put the exact UTC reset time in help text if needed.

#### F-1-12 — “Spoiler-safe” is jargon where the concrete behavior is stronger

- Exact copy: “Send a spoiler-safe card or the board link.”
- Impact: the phrase asks the reader to infer what is hidden.
- Fix: write “Share a result card that hides the board, or send the board link.”

#### F-1-13 — The instructions button does not use a result-naming verb

- Exact control: header button “How to play.”
- Impact: it names a topic, not the action that will happen.
- Fix: label the button “Show instructions.” Keep the dialog heading as “How to play.”

#### F-1-14 — One README test sentence exceeds 22 words

- Exact copy, 29 words: “Playwright covers every registered product claim, including deterministic boards, a real run through the end screen and restart, sharing recovery, assist mode, local privacy, offline updates, and keyboard controls.”
- Impact: it compresses unrelated test areas into one sentence and uses test-suite jargon.
- Fix: “Playwright tests every registered product claim. It covers board generation, end states, restarts, sharing, assist mode, privacy, offline updates, and keyboard controls.”

#### F-1-15 — One README deployment sentence exceeds 22 words

- Exact copy, 23 words: “`staticwebapp.config.json` rewrites only the supported game routes, supplies security headers, and returns the designed 404 page with HTTP status 404 for unknown paths.”
- Impact: three deployment behaviors are packed into one sentence.
- Fix: “`staticwebapp.config.json` sends supported routes to the game and adds security headers. Unknown paths show the designed 404 page and return HTTP 404.”

#### F-1-16 — The performance sentence uses avoidable implementation jargon

- Exact copy: “The isolated Chromium performance check uses a tested floor of 45 frames per second.”
- Impact: “isolated Chromium performance check” is harder to scan than the result it communicates.
- Fix: “The browser performance test requires at least 45 frames per second.”

#### F-1-17 — The sitemap omits a real application route

- Exact location: `public/sitemap.xml` lists `/`, `/demo`, `/play`, `/privacy`, and `/terms`, but not `/result`.
- Impact: it does not meet the route-completeness rule. `/result` is a designed route even though a useful result also needs query parameters.
- Fix: add the canonical `/result` route to the sitemap, or document and implement an explicit no-index policy for parameter-only result pages and exempt it from the sitemap rule.

## Cold first-screen check

### 390 × 844, before scrolling

- What it does, in my words: a daily five-minute tile-routing signal puzzle.
- For whom: friends who want to compare the same puzzle without an account or scheduled session.
- First click: **Try it with sample data**, which says it opens a partly solved practice board.
- Result: PASS. The headline, audience sentence, action, outcome, three facts, and top of the game preview are visible without scrolling.

### 1440 × 900, before scrolling

- What it does, in my words: the same daily signal-routing puzzle for everyone, played against five minutes.
- For whom: puzzle friends comparing an asynchronous board.
- First click: **Try it with sample data**.
- Result: PASS. The complete hero and a full 6×6 board preview are visible.

The exact first-screen text was “Race the same signal puzzle,” “For puzzle friends who want one fair five-minute board without accounts or schedules,” and “Try it with sample data.” There is no blocking first-read failure.

## Copy audit

Counts treat a hyphenated term, URL, path, number, or keyboard key as one word. Repeated navigation labels are listed once. Commands and code blocks are not sentences.

### Landing page and instructions

| Copy item | Words | Result |
| --- | ---: | --- |
| Seed Sprint | 2 | OK, wordmark |
| Demo | 1 | OK, navigation link |
| Privacy | 1 | OK, navigation link |
| How to play | 3 | **F-1-13**, button label |
| One board every UTC day | 5 | **F-1-11**, jargon |
| Race the same signal puzzle | 5 | OK |
| For puzzle friends who want one fair five-minute board without accounts or schedules. | 13 | **F-1-5**, marketing adjective |
| Try it with sample data | 5 | OK |
| Opens a partly solved practice board. | 6 | **F-1-1**, unlisted claim |
| Free to play | 3 | OK; `free-play` |
| Works offline after your first visit | 6 | OK; `offline-reload` |
| Progress stays on this device | 5 | OK; `progress-reload` |
| Today | 1 | OK |
| Today’s board is ready | 4 | OK |
| Finish before the five-minute clock ends. | 6 | OK; `five-minute-limit` |
| Play today’s board | 3 | OK |
| Same seed. | 2 | **F-1-9**, slogan and ambiguous term |
| Different route. | 2 | **F-1-9**, slogan |
| How it works | 3 | OK |
| Rotate the tiles. | 3 | OK |
| Join every line from the seeds to the sprout. | 9 | OK |
| Beat five minutes. | 3 | OK; `five-minute-limit` |
| The board is the same for everyone that day. | 9 | OK; `deterministic-board` |
| Share your result. | 3 | OK; `share-result` |
| Send a spoiler-safe card or the board link. | 8 | **F-1-12**, jargon |
| A small daily game | 4 | OK |
| There is no chat, account, live lobby, or endless puzzle feed. | 11 | OK; `no-social-services` |
| Your play stays here | 4 | **F-1-10**, vague heading |
| The game saves progress in this browser. | 7 | OK; `progress-reload` |
| Shared links include only the seed, time, turns, and result. | 10 | OK; `shared-link-fields` |
| Seed Sprint is a five-minute daily signal puzzle. | 8 | OK |
| Terms | 1 | OK, navigation link |
| Built by Param Factory | 4 | OK, external link is announced |
| Version 1.0.1 | 2 | OK |
| Hero image generated for this game. | 6 | OK, provenance |
| Rotate tiles to join every green line. | 7 | OK |
| Connect all three seeds to the sprout. | 7 | **F-1-4**, term collision on game route |
| Finish before five minutes ends. | 5 | OK |
| Use arrow keys to move. | 5 | **F-1-3**, test gap |
| Press R to rotate. | 4 | OK; `keyboard-controls` |
| Press P to pause. | 4 | OK; `keyboard-controls` |
| Close instructions | 2 | OK |

No landing-page sentence exceeds 22 words and no banned word appears.

### README

| Sentence | Words | Result |
| --- | ---: | --- |
| Race friends on the same five-minute signal puzzle, then compare results with a link. | 14 | OK |
| Seed Sprint is a free browser game for puzzle friends. | 10 | OK; `free-play` |
| Rotate a daily 6×6 routing board to connect three seeds to one sprout. | 13 | OK |
| A timed round allows five minutes. | 6 | OK; `five-minute-limit` |
| The date creates the board, so every player gets the same verified puzzle. | 13 | OK; `deterministic-board` |
| Play at seed-sprint.sociobot.in or open the sample board. | 8 | OK |
| The demo starts partly solved and stores data only under separate `demo:` browser keys. | 14 | **F-1-1** for the first clause; second clause is `demo-isolation` |
| Click or tap a tile to rotate it clockwise. | 9 | **F-1-2** for tap coverage |
| Use arrow keys to move between tiles. | 7 | **F-1-3** |
| Press R to rotate the focused tile. | 7 | OK; `keyboard-controls` |
| Press P to pause or resume. | 6 | OK; `keyboard-controls` |
| Remove the timer with assist mode. | 6 | OK; `assist-mode` |
| Progress and settings stay in local storage on this device. | 10 | OK; `progress-reload` |
| The game sends no gameplay or personal data to another server. | 11 | OK; `privacy-local` |
| It works offline after the first visit. | 7 | OK; `offline-reload` |
| Requires Node.js 20 or newer. | 5 | OK, setup requirement |
| Open `http://localhost:5173/demo` for the isolated sample board. | 7 | OK |
| Playwright covers every registered product claim, including deterministic boards, a real run through the end screen and restart, sharing recovery, assist mode, local privacy, offline updates, and keyboard controls. | 29 | **F-1-14**, over 22 words |
| The isolated Chromium performance check uses a tested floor of 45 frames per second. | 14 | **F-1-16**, jargon; `frame-rate` |
| The production build lands in `dist/`, with `index.html` at its root. | 11 | OK |
| Deploy the contents of `dist/` as a static site. | 9 | OK |
| `staticwebapp.config.json` rewrites only the supported game routes, supplies security headers, and returns the designed 404 page with HTTP status 404 for unknown paths. | 23 | **F-1-15**, over 22 words |
| Read the in-product `/privacy` and `/terms` pages. | 7 | OK |
| The source is MIT licensed. | 5 | OK; confirmed by `LICENSE` |
| Fraunces and Atkinson Hyperlegible are licensed under the SIL Open Font License; their license files ship beside the fonts. | 19 | OK; files present |
| The original generated hero asset and prompt are in `assets/src/`. | 10 | OK; files present |

README headings are “Seed Sprint,” “Controls,” “Run locally,” “Test and build,” “Deploy,” and “Privacy and licensing.” Each names its section and needs no rewrite.

## Demo and sandbox verification

PASS.

- One click from `/` opened `/demo`.
- The first demo screen was already active at `4:17`, 11 turns, and “7 of 25 route tiles connected.” It visibly showed a realistic 6×6 board rather than setup UI.
- The persistent banner read “Demo — sample board, nothing is saved to your daily game” and exposed **Reset demo** and **Start for real**.
- After one move, only `demo:session:SPROUT-7` was added. A pre-seeded `daily:session:PROBE` value was unchanged.
- **Reset demo** restored 11 turns and the initial timer and removed the demo storage entry.
- **Start for real** removed demo keys while preserving the pre-existing daily key.
- The interactive live flow made requests only to `https://seed-sprint.sociobot.in`.
- In a fresh context, the live service worker used `seed-sprint-v2`; `/demo` reloaded offline after the first visit.

## Claims verification

The repository was cloned to a separate temporary directory, `npm ci` completed with 0 vulnerabilities, and every exact `test` command from `.factory/claims.json` ran independently. All registered commands passed.

| Claim ID | Result | Evidence |
| --- | --- | --- |
| `deterministic-board` | PASS | 366 generated seeds were repeated and solved by their stored solution |
| `complete-board` | PASS | sample reached the real result card |
| `free-play` | PASS | timed play started without account or payment UI |
| `share-result` | PASS | result URL contained only spoiler-safe result fields |
| `same-board-link` | PASS | copied URL reproduced the tile signature |
| `share-recovery` | PASS | denied clipboard exposed a focused fixed URL |
| `no-social-services` | PASS | no account, chat, lobby, or feed UI |
| `shared-link-fields` | PASS | exact seed/status/time/turns fields |
| `restart-state` | PASS | real win and complete 5:00 reset |
| `progress-reload` | PASS | move and setting survived reload |
| `five-minute-limit` | PASS | boundary reached Time ended |
| `demo-isolation` | PASS | demo storage namespace and exit cleanup |
| `keyboard-controls` | PASS as written | R and P passed; arrow coverage remains F-1-3 |
| `assist-mode` | PASS | no-limit mode survived reload |
| `privacy-local` | PASS | request origins were same-origin |
| `offline-reload` | PASS | dedicated offline context reloaded `/demo` |
| `pwa-update` | PASS | old worker upgraded to the current page/cache |
| `frame-rate` | PASS | 60.5 FPS against the 45 FPS floor |

The passed commands do not clear F-1-1 through F-1-3 because the advertised behaviors are absent from, or not exercised by, the registered assertions.

## Earlier finding regression check

No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists. I rechecked every defect described by the earlier handoff and its referenced verification history against both live behavior and code.

| Earlier defect | Current result |
| --- | --- |
| Advertised free/share/same-board/social/link-field/assist claims were absent | FIXED: all previously named claims appear once in the manifest and once as a tag |
| Result clipboard denial had no usable recovery | FIXED LIVE: a complete result URL became visible, selected, and focused |
| Play again retained stale time | FIXED LIVE: real completion followed by Play again restored 5:00, zero turns, idle state, and the initial board |
| Malformed result values rendered invalid output | FIXED LIVE: malformed input shows “This result link is incomplete” |
| Mobile links missed 44 px targets | FIXED LIVE: all visible links and buttons on the 390 px demo were at least 44×44 px |
| Unknown routes returned HTTP 200 | FIXED LIVE: `/missing-board` returns HTTP 404 |
| Frame-rate claim was unstable at 55 FPS | FIXED: isolated 45 FPS command passed at 60.5 FPS |
| Existing PWAs stayed on the old cache | FIXED: upgrade claim passed; live cache is `seed-sprint-v2` and offline reload passed |
| Same-board clipboard denial had no valid fallback | FIXED LIVE: complete fixed-seed URL became visible and focused |
| Invalid saved sessions were accepted | FIXED LIVE: malformed values reset to 5:00 and zero turns |
| Focus ring contrast was below 3:1 | FIXED: current automated contrast regression passes both paper surfaces |
| AVIF used a generic media type | FIXED LIVE: `Content-Type: image/avif` |

The broad earlier “unlisted claims” problem is not fully closed because the separate partly solved/touch/arrow statements in F-1-1 through F-1-3 remain outside adequate registered coverage. The originally enumerated omissions are fixed.

## Structure, accessibility, and links

- PASS: route titles are under 60 characters and follow the product/route pattern.
- PASS: `/`, `/demo`, `/play`, `/privacy`, `/terms`, a valid `/result`, and the 404 each have one `<h1>` and one `<main>`.
- PASS: canonical URLs update for application routes; favicon, 180 px apple-touch icon, 1200×630 original social image, theme color, and root metadata exist.
- PASS: internal navigation uses real paths; direct loads work; browser Back restored `/`; route changes moved focus to the new `<h1>` and reset scroll.
- PASS: all crawled internal and external links returned 200, apart from the intentionally tested unknown URL returning 404.
- PASS: the live home, demo, play, privacy, terms, result, and 404 produced zero Axe violations. The expected browser network message for the intentional 404 document was not counted as an application console fault.
- PASS: the worker's live URL verifier found `lang=en`, one h1, main, alt attributes, labeled buttons, and no console/page errors on the home route.
- PASS: 390 px had no horizontal overflow; the live prior-regression script confirmed all visible demo links and buttons meet 44×44 px.
- PASS: the risograph collage, clipped shapes, warm paper palette, self-hosted Fraunces/Atkinson type, and restrained rotation motion are distinct and match `.factory/design.md`; this is not a generic SaaS layout.
- FAIL: route social metadata, the 404 shell/metadata, and sitemap completeness are F-1-6, F-1-7, and F-1-17.

## Missed leverage

F-1-8 is the only obvious missing product step: expose the recent results the game already saves. AI would be decorative here, and a remote sync or live lobby would conflict with the brief's account-free, asynchronous, local-first scope.

## What would make this perfect

Resolve F-1-1 through F-1-17, then rerun the entire review from a clean context. In particular: register and exercise every advertised demo/input claim, remove ambiguous and jargon-heavy copy, expose useful local result history, serve accurate route social metadata, complete the 404 shell, and reconcile `/result` with the sitemap policy. A new review should not pass until the copy inventory, claim manifest, live demo, every route, and history regression checks contain zero findings.
