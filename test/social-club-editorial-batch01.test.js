'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = require('../server/packs/after-dark-v09.json');
const batch = require('../editorial/family-responses-batch-01.json');

test('first 100 Family response rewrites preserve source IDs, ratings, originals and draft status', () => {
  const originals = source.entries.filter(e => e.rating === 'clean' && e.kind === 'responses').slice(0, 100);
  assert.equal(batch.entries.length, 100);
  assert.equal(batch.editorialStatus, 'draft');
  for (let i = 0; i < 100; i++) {
    assert.equal(batch.entries[i].id, originals[i].id);
    assert.equal(batch.entries[i].oldText, originals[i].text);
    assert.equal(batch.entries[i].kind, 'responses');
    assert.equal(batch.entries[i].rating, 'clean');
    assert.equal(batch.entries[i].editorialStatus, 'draft');
    assert.ok(batch.entries[i].newText.length <= 45);
    assert.doesNotMatch(batch.entries[i].newText, /[:\n\r]/);
  }
});

test('unapproved Stage 6 draft text is not injected into the running content pool', () => {
  const c = require('../server/content');
  const { id, oldText, newText } = batch.entries[0];
  assert.ok(c.expansion.entries.some(e => e.id === id && e.text === oldText && e.editorialStatus === 'draft'));
  assert.equal(c.expansion.entries.some(e => e.text === newText), false);
});

test('review artefacts include full CSV change ledger and accessible HTML', () => {
  const csv = fs.readFileSync(path.join(root, 'editorial/family-responses-batch-01.csv'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'editorial/family-responses-batch-01-review.html'), 'utf8');
  assert.equal(csv.trim().split(/\r?\n/).length, 101);
  assert.match(csv, /old_text,proposed_new_text,action,editorial_status/);
  assert.match(html, /All 100 are DRAFTS/);
  assert.match(html, /lang="en-GB"/);
  assert.match(html, /100 of 100 shown/);
  assert.equal((html.match(/<tr><td class="no">/g) || []).length, 100);
});
