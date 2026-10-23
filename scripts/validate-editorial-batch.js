'use strict';
/** Validate proposed rewrites only. Never publish/approve them automatically. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'server/packs/after-dark-v09.json'), 'utf8'));
const batch = JSON.parse(fs.readFileSync(path.join(root, 'editorial/family-responses-batch-01.json'), 'utf8'));
const errors = [];
const expected = source.entries.filter(e => e.kind === 'responses' && e.rating === 'clean').slice(0, 100);
const byId = new Map(source.entries.map(e => [e.id, e]));
const ids = new Set();
const normalise = text => String(text || '').toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const firstFour = text => normalise(text).split(' ').slice(0, 4).join(' ');
const titles = new Map();
const openings = new Map();
const proposedIds = new Set(batch.entries.map(e => e.id));
const replacements = new Map(batch.entries.map(e => [e.id, e.newText]));
for (const entry of source.entries) {
  const text = replacements.get(entry.id) ?? entry.text;
  const lower = normalise(text);
  if (!titles.has(lower)) titles.set(lower, []);
  titles.get(lower).push(entry.id);
  const opening = firstFour(text);
  if (!openings.has(opening)) openings.set(opening, []);
  openings.get(opening).push(entry.id);
}
if (batch.id !== 'social-club-family-responses-batch-01' || batch.editorialStatus !== 'draft') errors.push('Batch must remain in draft state');
if (batch.entries.length !== 100) errors.push('Batch must contain exactly 100 proposed replacements');
for (const [i, e] of batch.entries.entries()) {
  const original = byId.get(e.id);
  if (!original) { errors.push(`Unknown source ID ${e.id}`); continue; }
  if (ids.has(e.id)) errors.push(`Repeated ID ${e.id}`);
  ids.add(e.id);
  if (e.id !== expected[i]?.id) errors.push(`Wrong or out-of-order ID at position ${i + 1}`);
  if (e.kind !== 'responses' || e.rating !== 'clean') errors.push(`Unexpected kind or tier: ${e.id}`);
  if (e.oldText !== original.text) errors.push(`Original text mismatch: ${e.id}`);
  if (e.editorialStatus !== 'draft') errors.push(`Unapproved entry: ${e.id}`);
  if (typeof e.newText !== 'string' || e.newText.trim() !== e.newText || e.newText.length < 4 || e.newText.length > 45) errors.push(`Invalid length/whitespace ${e.id}`);
  if (/[:\n\r]|_{3,}/.test(e.newText)) errors.push(`No colons, line breaks, or blanks in response ${e.id}`);
  if (/\b(?:favorite|color|neighbor|apologize|organize|canceled|traveling)\b/i.test(e.newText)) errors.push(`US spelling candidate ${e.id}`);
  if (/\b(?:facebook|whatsapp|amazon|quality street|greggs|tiktok|instagram)\b/i.test(e.newText)) errors.push(`Commercial brand reference ${e.id}`);
  if ((titles.get(normalise(e.newText)) || []).length > 1) errors.push(`Duplicate response across staged deck ${e.id}`);
  // The legacy pack has repeated openings outside this batch; reject new collisions, not historical debt.
  if ((openings.get(firstFour(e.newText)) || []).length > 3) errors.push(`Opening repeated over three times: ${e.id}`);
}
if (proposedIds.size !== batch.entries.length) errors.push('Duplicate IDs in batch');
const result = {
  batch: batch.id, proposed: batch.entries.length, approved: batch.entries.filter(e => e.editorialStatus === 'approved').length,
  published: false, maxResponseLength: Math.max(...batch.entries.map(e => e.newText.length)),
  errors,
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
module.exports = { validate: () => result };
