import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://seed-sprint.sociobot.in';
const routes = [
  ['demo', 'Demo — Seed Sprint', 'Try the partly solved Seed Sprint sample board. Demo play is separate from your daily game.'],
  ['play', 'Play — Seed Sprint', 'Play a five-minute signal-routing board and share a result when you finish.'],
  ['result', 'Shared result — Seed Sprint', 'A Seed Sprint result card shows a time and turn count without showing the board layout.'],
  ['privacy', 'Privacy — Seed Sprint', 'Learn what Seed Sprint saves in this browser and what a shared result link contains.'],
  ['terms', 'Terms — Seed Sprint', 'Read the terms for playing Seed Sprint.']
];

const dist = resolve('dist');
const source = await readFile(resolve(dist, 'index.html'), 'utf8');

for (const [route, title, description] of routes) {
  const url = `${origin}/${route}`;
  const html = source
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(" \/>)/, `$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(" \/>)/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(" \/>)/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(" \/>)/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(" \/>)/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(" \/>)/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(" \/>)/, `$1${description}$2`);
  await writeFile(resolve(dist, `${route}.html`), html);
}
