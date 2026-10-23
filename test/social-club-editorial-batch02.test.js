'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = require('../server/packs/after-dark-v09.json');
const one = require('../editorial/family-responses-batch-01.json');
const two = require('../editorial/family-responses-batch-02.json');
const dir = path.resolve(__dirname, '..');

test('Batch 02 contains 40 exact-ID source rewrites and 60 independent new drafts', () => {
  const family = source.entries.filter(e => e.kind === 'responses' && e.rating === 'clean');
  assert.equal(family.length, 140);
  assert.equal(two.entries.length, 100);
  assert.equal(two.editorialStatus, 'draft');
  assert.equal(two.dependency, one.id);
  for (let i = 0; i < 40; i++) {
    const e = two.entries[i];
    assert.deepEqual([e.action, e.id, e.oldText, e.editorialStatus], ['REWRITE', family[i + 100].id, family[i + 100].text, 'draft']);
  }
  for (let i = 40; i < 100; i++) {
    const e = two.entries[i];
    assert.equal(e.action, 'ADD');
    assert.equal(e.id, `etsc20-responses-clean-${String(i - 39).padStart(3, '0')}`);
    assert.equal(e.oldText, null);
    assert.equal(e.editorialStatus, 'draft');
  }
});

test('All 200 Family drafts respect format and cross-batch uniqueness checks', () => {
  const report = require('../scripts/validate-editorial-batch02').validate();
  assert.equal(report.totalProposalsAcrossBatches, 200);
  assert.equal(report.rewrites, 40);
  assert.equal(report.additions, 60);
  assert.equal(report.approved, 0);
  assert.deepEqual(report.errors, []);
});

test('Neither drafts nor additional cards are loaded into the playable catalogue', () => {
  const expansion = require('../server/content').expansion.entries;
  const original = two.entries[0];
  assert.ok(expansion.some(e => e.id === original.id && e.text === original.oldText && e.editorialStatus === 'draft'));
  assert.equal(expansion.some(e => e.id === original.id && e.text === original.newText), false);
  for (const proposed of two.entries.filter(e => e.action === 'ADD')) {
    assert.equal(expansion.some(e => e.id === proposed.id), false);
  }
});

test('Batch 02 includes readable offline HTML and a 100-row CSV change ledger', () => {
  const csv = fs.readFileSync(path.join(dir, 'editorial/family-responses-batch-02.csv'), 'utf8');
  const html = fs.readFileSync(path.join(dir, 'editorial/family-responses-batch-02-review.html'), 'utf8');
  assert.equal(csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/).length, 101);
  assert.match(csv, /old_text,proposed_new_text,action,editorial_status/);
  assert.match(html, /All 100 are DRAFTS/);
  assert.match(html, /lang="en-GB"/);
  assert.match(html, /100 of 100 shown/);
  assert.equal((html.match(/<tr data-kind=/g) || []).length, 100);
});
