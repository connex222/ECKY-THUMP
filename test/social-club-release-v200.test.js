'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('both entry pages load exactly one Stage 8 stylesheet with no legacy cascade requests', () => {
  for (const file of ['public/index.html', 'public/tv/index.html']) {
    const html = read(file);
    assert.equal((html.match(/rel="stylesheet"/g) || []).length, 1, file);
    assert.match(html, /social-club-v2\.css\?v=2\.0\.0/);
    assert.doesNotMatch(html, /modern-v1\.5\.css|neon-arena-v1\.6\.css|game-cards-v1\.8\.css/);
    assert.ok(html.indexOf('/assets/avatars.js') < html.indexOf(file.includes('/tv/') ? '/assets/tv.js' : '/assets/app.js'));
  }
  const css = read('public/assets/social-club-v2.css');
  assert.match(css, /@layer legacy/);
  assert.match(css, /Stage 8 inclusive keyboard/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
  assert.doesNotMatch(css, /@import/);
  for (const token of ['--e-lime', '.club-phone-vote', '.club-shell', 'e18-quickbar']) assert.ok(css.includes(token), token);
});

test('shared ES module is consumed by both runtimes with no new runtime dependencies', () => {
  const helpers = read('public/assets/shared.mjs');
  assert.match(helpers, /export function escapeHtml/);
  assert.match(helpers, /export function serverClockOffset/);
  assert.match(helpers, /export function resolveAvatar/);
  for (const file of ['public/assets/app.js', 'public/assets/tv.js']) {
    const js = read(file);
    assert.match(js, /import\('\.\/shared\.mjs'\)/);
    assert.match(js, /resolveAvatar\(AVATARS,id\)/);
  }
  assert.equal(Object.keys(require('../package.json').dependencies || {}).length, 0);
});

test('canonical v2.0.0 version comes from package.json and authenticated health metadata', async () => {
  const pkg = require('../package.json');
  assert.equal(pkg.version, '2.0.0');
  const phone = read('public/assets/app.js');
  assert.match(phone, /fetch\('\/api\/health'/);
  assert.match(phone, /data-release-version/);
  assert.doesNotMatch(phone, /ECKY THUMP v1\.8\.3 · PRIVATE GAME NIGHT/);
  const {server} = require('../server/index');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const data = await (await fetch(url + '/api/health')).json();
    assert.equal(data.version, pkg.version);
    const css = await fetch(url + '/assets/social-club-v2.css');
    assert.equal(css.status, 200);
    assert.equal(css.headers.get('content-type'), 'text/css; charset=utf-8');
    assert.ok((await css.text()).length > 120_000);
    const helpers = await fetch(url + '/assets/shared.mjs');
    assert.equal(helpers.status, 200);
    assert.match(helpers.headers.get('content-type'), /javascript/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('paid Render disk is an opt-in blueprint and November acceptance is pending', () => {
  const render = read('render.persistent.example.yaml');
  assert.match(render, /plan: starter/);
  assert.match(render, /mountPath: \/data/);
  assert.match(render, /ROOM_DATA_DIR/);
  assert.doesNotMatch(read('render.yaml'), /plan: starter|mountPath: \/data/);
  const checklist = read('docs/NOVEMBER-ACCEPTANCE.md');
  assert.match(checklist, /Not yet completed/);
  assert.match(checklist, /20–25 minute Standard target/);
});

test('phone announces changed round phases to assistive technology', () => {
  assert.match(read('public/index.html'), /id="phase-announcement"[^>]+aria-live="polite"/);
  const phone = read('public/assets/app.js');
  assert.match(phone, /newKey !== oldKey/);
  assert.match(phone, /announcement.textContent/);
});
