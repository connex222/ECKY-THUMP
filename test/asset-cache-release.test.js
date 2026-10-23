'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('TV entrypoint busts the pre-Stage-3 cached renderer', () => {
  const html = fs.readFileSync(path.join(root, 'public/tv/index.html'), 'utf8');
  assert.match(html, /\/assets\/tv\.js\?v=2\.0\.0-stage3/);
  assert.match(html, /\/assets\/social-club-tv\.js\?v=2\.0\.0/);
});

test('Phone displays and loads the currently deployed legacy version', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'public/assets/app.js'), 'utf8');
  assert.match(html, /\/assets\/app\.js\?v=1\.8\.3/);
  assert.match(js, /ECKY THUMP v1\.8\.3/);
});
