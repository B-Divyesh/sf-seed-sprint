# Seed Sprint

Race friends on the same five-minute signal puzzle, then compare results with a link.

Seed Sprint is a free browser game for puzzle friends. Rotate a daily 6×6 routing board to connect three seeds to one sprout. A timed round allows five minutes. Each day uses one shared board with a verified solution.

Play at [seed-sprint.sociobot.in](https://seed-sprint.sociobot.in) or open the [sample board](https://seed-sprint.sociobot.in/demo). The demo starts partly solved and stores data under separate `demo:` browser keys.

## Controls

- Click or tap a tile to rotate it clockwise.
- Use arrow keys to move between tiles.
- Press `R` to rotate the focused tile.
- Press `P` to pause or resume.
- Remove the timer with assist mode.

Progress and settings stay in local storage on this device. The game sends no gameplay or personal data to another server. It works offline after the first visit.

Recent finished boards appear on the play page. You can replay, view, or clear them there.

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

Playwright tests every registered product claim. It covers board generation, end states, restarts, sharing, assist mode, privacy, offline updates, touch, and keyboard controls. The browser performance test requires at least 45 frames per second. The production build lands in `dist/`, with `index.html` at its root.

## Deploy

Deploy the contents of `dist/` as a static site. `staticwebapp.config.json` sends supported routes to the game and adds security headers. Unknown paths show the designed 404 page and return HTTP 404.

## Privacy and licensing

Read the in-product `/privacy` and `/terms` pages. The source is MIT licensed. Fraunces and Atkinson Hyperlegible are licensed under the SIL Open Font License; their license files ship beside the fonts. The original generated hero asset and prompt are in `assets/src/`.
