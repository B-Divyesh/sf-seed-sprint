# Seed Sprint

Race friends on the same five-minute signal puzzle, then compare results with a link.

Seed Sprint is a free browser game for puzzle friends. Rotate a daily 6×6 routing board to connect three seeds to one sprout. A timed round allows five minutes. The date creates the board, so every player gets the same verified puzzle.

Play at [seed-sprint.sociobot.in](https://seed-sprint.sociobot.in) or open the [sample board](https://seed-sprint.sociobot.in/demo). The demo starts partly solved and stores data only under separate `demo:` browser keys.

## Controls

- Click or tap a tile to rotate it clockwise.
- Use arrow keys to move between tiles.
- Press `R` to rotate the focused tile.
- Press `P` to pause or resume.
- Remove the timer with assist mode.

Progress and settings stay in local storage on this device. The game sends no gameplay or personal data to another server. It works offline after the first visit.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:5173/demo` for the isolated sample board.

## Test and build

```sh
npm test
npm run build
```

Playwright runs 23 tests, including all 16 registered product claims: deterministic boards, free play, result and same-board links, assist mode, local privacy, offline reload, keyboard controls, and frame rate. The Chromium performance check measures at least 55 frames per second while the active board is shown. The production build lands in `dist/`, with `index.html` at its root.

## Deploy

Deploy the contents of `dist/` as a static site. `staticwebapp.config.json` rewrites only the supported game routes, supplies security headers, and returns the designed 404 page with HTTP status 404 for unknown paths.

## Privacy and licensing

Read the in-product `/privacy` and `/terms` pages. The source is MIT licensed. Fraunces and Atkinson Hyperlegible are licensed under the SIL Open Font License; their license files ship beside the fonts. The original generated hero asset and prompt are in `assets/src/`.
