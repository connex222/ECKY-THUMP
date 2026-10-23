'use strict';
/** Validate Batch 02 against Batch 01 and source. No editorial approval and no publishing. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const source = read('server/packs/after-dark-v09.json');
const batch01 = read('editorial/family-responses-batch-01.json');
const batch02 = read('editorial/family-responses-batch-02.json');
const errors = [];
const family = source.entries.filter(entry => entry.kind === 'responses' && entry.rating === 'clean');
const existing = new Map(source.entries.map(entry => [entry.id, entry]));
const normalize = value => String(value || '').toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const firstFour = value => normalize(value).split(' ').slice(0, 4).join(' ');
const drafts = [batch01, batch02];
if (family.length !== 140) errors.push(`Unexpected source Family count: ${family.length}`);
for (const [number, batch] of drafts.entries()) {
  const expected = `social-club-family-responses-batch-0${number + 1}`;
  if (batch.id !== expected || batch.editorialStatus !== 'draft') errors.push(`Incorrect draft metadata for batch ${number + 1}`);
  if (batch.entries.length !== 100) errors.push(`Expected exactly 100 in ${expected}`);
}
if (batch02.dependency !== batch01.id) errors.push('Batch 02 does not identify its Batch 01 dependency');
const seenIds = new Set();
const candidates = [...batch01.entries, ...batch02.entries];
const replacementMap = new Map();
for (let i = 0; i < candidates.length; i++) {
  const e = candidates[i];
  if (seenIds.has(e.id)) errors.push(`Duplicated draft ID ${e.id}`);
  seenIds.add(e.id);
  if (e.kind !== 'responses' || e.rating !== 'clean') errors.push(`Non-Family response: ${e.id}`);
  if (e.editorialStatus !== 'draft') errors.push(`Unapproved approval status: ${e.id}`);
  const text = e.newText;
  if (typeof text !== 'string' || text !== text.trim() || text.length < 4 || text.length > 45) errors.push(`Length/whitespace issue: ${e.id}`);
  if (/[:\n\r]|_{3,}/.test(text)) errors.push(`Colon/newline/blank in ${e.id}`);
  if (/\b(?:favorite|color|neighbor|apologize|organize|canceled|traveling)\b/i.test(text)) errors.push(`US spelling: ${e.id}`);
  if (/\b(?:facebook|whatsapp|amazon|greggs|tiktok|instagram|netflix|tesco)\b/i.test(text)) errors.push(`Company name: ${e.id}`);
  if (/\b(?:shit|fuck|bitch|arsehole|twat)\b/i.test(text)) errors.push(`Not Family-safe: ${e.id}`);
  if (i < 100) {
    if (e.id !== family[i]?.id || e.oldText !== family[i]?.text) errors.push(`Batch 01 ID / original mismatch at ${i + 1}`);
  } else if (i < 140) {
    const expected = family[i];
    if (e.id !== expected?.id || e.oldText !== expected?.text || e.action !== 'REWRITE') errors.push(`Bad rewrite at ${i + 1}`);
  } else {
    const expectedID = `etsc20-responses-clean-${String(i - 139).padStart(3, '0')}`;
    if (e.id !== expectedID || existing.has(e.id) || e.oldText !== null || e.action !== 'ADD') errors.push(`Bad addition at ${i + 1}`);
  }
  replacementMap.set(e.id, text);
}
// Evaluate all 200 proposals in the context of unchanged legacy entries.
const allTexts = new Map(source.entries.map(e => [e.id, replacementMap.get(e.id) ?? e.text]));
for (const e of batch02.entries.filter(e => e.action === 'ADD')) allTexts.set(e.id, e.newText);
const counts = new Map(), openings = new Map();
for (const [id, value] of allTexts) {
  const key = normalize(value), open = firstFour(value);
  counts.set(key, (counts.get(key) || 0) + 1);
  openings.set(open, (openings.get(open) || 0) + 1);
}
for (const { id, newText } of candidates) {
  if ((counts.get(normalize(newText)) || 0) > 1) errors.push(`Exact text collision: ${id}`);
  if ((openings.get(firstFour(newText)) || 0) > 3) errors.push(`Opening used >3 times: ${id}`);
}
const result = {
  batch: batch02.id,
  totalProposalsAcrossBatches: candidates.length,
  rewrites: batch02.entries.filter(e => e.action === 'REWRITE').length,
  additions: batch02.entries.filter(e => e.action === 'ADD').length,
  approved: candidates.filter(e => e.editorialStatus === 'approved').length,
  published: false,
  proposedFamilyResponses: family.length + batch02.entries.filter(e => e.action === 'ADD').length,
  maxNewTextLength: Math.max(...candidates.map(e => e.newText.length)),
  errors,
};
if (require.main === module) console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
module.exports = { validate: () => result };
