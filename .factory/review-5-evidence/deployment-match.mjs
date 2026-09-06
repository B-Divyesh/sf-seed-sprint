import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const base = 'https://seed-sprint.sociobot.in';
const dist = '/tmp/seed-sprint-review5.UDOhXI/repo/dist';
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function files(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? files(path.join(dir, entry.name), relative) : [relative];
  });
}

const routes = new Map([
  ['index.html', '/'],
  ['demo.html', '/demo'],
  ['play.html', '/play'],
  ['privacy.html', '/privacy'],
  ['terms.html', '/terms'],
  ['result.html', '/result']
]);
const rows = [];
for (const file of files(dist).filter(file => file !== 'staticwebapp.config.json')) {
  const url = `${base}${routes.get(file) ?? `/${file}`}`;
  const local = fs.readFileSync(path.join(dist, file));
  const response = await fetch(url);
  const live = Buffer.from(await response.arrayBuffer());
  const row = {
    file,
    url,
    status: response.status,
    contentType: response.headers.get('content-type'),
    localBytes: local.length,
    liveBytes: live.length,
    localSha256: sha256(local),
    liveSha256: sha256(live)
  };
  row.match = row.localSha256 === row.liveSha256;
  rows.push(row);
  assert.equal(response.status, 200, file);
  assert.equal(row.match, true, file);
}
const configResponse = await fetch(`${base}/staticwebapp.config.json`);
assert.equal(configResponse.status, 404);
const output = {
  implementationCommit: '1cfe326029f0b69f15049f675d0846da3214fa77',
  documentationCommit: 'e0e510dd644295b537c3e183714fe37e3199e9f3',
  fileCount: rows.length,
  matchCount: rows.filter(row => row.match).length,
  mismatches: rows.filter(row => !row.match),
  staticConfigStatus: configResponse.status,
  rows
};
fs.writeFileSync('.factory/review-5-evidence/deployment-match.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify({ fileCount: output.fileCount, matchCount: output.matchCount, mismatches: output.mismatches, staticConfigStatus: output.staticConfigStatus }, null, 2));
