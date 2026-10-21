'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const publicCopy = [
  'public/index.html', 'public/tv/index.html', 'public/assets/app.js',
  'public/assets/tv.js', 'public/assets/arena.css', 'public/assets/showtime.css',
  'public/assets/ecky-logo.svg', 'server/index.js', 'server/game.js',
  'server/content.js', 'server/game-cards.js', 'server/packs/game-cards-v1.json',
  'README.md', 'CHANGELOG.md', 'CONTENT-REVIEW.html'
];

test('official ECKY THUMP spelling is the only player-facing brand name', () => {
  for (const file of publicCopy) {
    assert.doesNotMatch(read(file), /ECKEY\s+THUMP/i, `${file} has the old public spelling`);
  }
  for (const file of ['public/index.html', 'public/tv/index.html', 'CONTENT-REVIEW.html']) {
    assert.match(read(file), /lang="en-GB"/, `${file} needs en-GB document language`);
  }
  assert.match(read('public/index.html'), /<title>ECKY THUMP/);
  assert.match(read('public/tv/index.html'), /<title>ECKY THUMP/);
  assert.match(read('public/assets/app.js'), /alt="ECKY THUMP"/);
  assert.match(read('public/assets/tv.js'), /ECKY THUMP!/);
});

test('logo resource names and accessible SVG title use the correct brand', () => {
  const svg = read('public/assets/ecky-logo.svg');
  assert.match(svg, /<title id="title">ECKY THUMP<\/title>/);
  assert.match(svg, />ECKY<\/text>/);
  assert.doesNotMatch(svg, />ECKEY<\/text>/);
  assert.ok(fs.statSync(path.join(root, 'public/assets/branding/ecky-thump-logo.webp')).size > 100000);
  assert.ok(!fs.existsSync(path.join(root, 'public/assets/eckey-logo.svg')));
  assert.ok(!fs.existsSync(path.join(root, 'public/assets/branding/eckey-thump-logo.webp')));
});

test('text uses UK spelling, not US alternatives in published game copy', () => {
  const files = [
    'server/content.js', 'server/packs/after-dark-v09.json',
    'server/packs/game-cards-v1.json', 'public/assets/app.js',
    'public/assets/tv.js'
  ];
  const usTerms = /\b(?:favorite|favorites|colorful|neighbor|neighbors|neighborhood|humor|apologize|organize|organizer|realize|traveling|traveler|canceling|canceled|defense|toward)\b/i;
  for (const file of files) assert.doesNotMatch(read(file), usTerms, `${file} contains US spelling`);
  assert.match(read('server/packs/game-cards-v1.json'), /towards the leader/);
});

test('historic avatar assets and compatibility identifiers remain unchanged', () => {
  const baseline = JSON.parse(read('test/avatar-baseline-v11.json'));
  assert.equal(Object.keys(baseline).length, 42);
  for (const [rel, digest] of Object.entries(baseline)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
    assert.equal(actual, digest, `${rel} changed unexpectedly`);
  }
  assert.match(read('public/assets/app.js'), /window\.ECKEY_AVATARS/);
  assert.match(read('public/assets/app.js'), /eckey-session-/);
  assert.equal(JSON.parse(read('server/packs/after-dark-v09.json')).id, 'eckey-after-dark-09');
});

test('live game serves the corrected brand and both local logo assets', async () => {
  const { server } = require('../server/index');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await (await fetch(origin + '/api/health')).json();
    assert.equal(health.service, 'ECKY THUMP');
    assert.equal(health.version, require('../package.json').version);
    for (const asset of ['/assets/ecky-logo.svg','/assets/branding/ecky-thump-logo.webp']) {
      const response = await fetch(origin + asset);
      assert.equal(response.status, 200, `${asset} must load`);
      assert.ok((await response.arrayBuffer()).byteLength > 200);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
