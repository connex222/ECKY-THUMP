'use strict';
/**
 * Local-only preview importer for user-supplied party card spreadsheets.
 * It NEVER edits server/packs, approves a card, or publishes material.
 * Use: node scripts/stage-party-csv.js SOURCE.csv OUTPUT_DIR [--compare BATCH.json ...]
 */
const fs = require('node:fs');
const path = require('node:path');

const HEADER = ['id', 'deck', 'card_type', 'text', 'pick'];
const DECKS = new Map([
  ['Family-friendly', 'clean'],
  ['Cheeky', 'cheeky'],
  ['Very adult', 'adult'],
]);
const BRANDS = /\b(?:WhatsApp|Facebook|Channel 5|Spoons|IKEA|Tinder|Amazon|OnlyFans|Ann Summers|Love Island|Viagra|Netflix|Lidl|Red Bull|Countdown|Phil Collins|Asda|eBay|Ford Fiesta|Greggs|TikTok|Instagram)\b/i;

function parseCSV(value) {
  const text = String(value).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\r' || char === '\n') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => x !== '')) rows.push(row);
      row = [];
    } else { cell += char; }
  }
  if (quoted) throw Error('Unterminated quoted CSV field.');
  if (row.length || cell.length) { row.push(cell); rows.push(row); }
  return rows;
}

function normalise(value) {
  return String(value ?? '').toLocaleLowerCase('en-GB')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
function firstFour(value) { return normalise(value).split(' ').slice(0, 4).join(' '); }
function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function csvEscape(value) {
  let v = String(value ?? '');
  // Prevent Excel/LibreOffice CSV formula injection in imported user text.
  if (/^[\s]*[=+\-@]/.test(v)) v = "'" + v;
  return '"' + v.replace(/"/g, '""') + '"';
}
function textsFromJSON(input) {
  if (Array.isArray(input)) return input.flatMap(textsFromJSON);
  if (typeof input === 'string') return [input];
  if (!input || typeof input !== 'object') return [];
  if (Array.isArray(input.entries)) return input.entries.flatMap(e => [e.text, e.newText, e.proposedText].filter(x => typeof x === 'string'));
  return [];
}
function collectComparisonTexts(extraPaths, repoRoot) {
  const old = JSON.parse(fs.readFileSync(path.join(repoRoot, 'server/packs/after-dark-v09.json'), 'utf8'));
  const texts = textsFromJSON(old);
  for (const filename of extraPaths) texts.push(...textsFromJSON(JSON.parse(fs.readFileSync(filename, 'utf8'))));
  return new Set(texts.map(normalise).filter(Boolean));
}
function stage(sourcePath, comparePaths = [], root = path.resolve(__dirname, '..')) {
  const parsed = parseCSV(fs.readFileSync(sourcePath, 'utf8'));
  if (!parsed.length || JSON.stringify(parsed[0]) !== JSON.stringify(HEADER)) {
    throw Error(`Unexpected columns. Expected exactly: ${HEADER.join(',')}`);
  }
  const sourceIds = new Set(), proposedTexts = new Set(), existing = collectComparisonTexts(comparePaths, root);
  const entries = [];
  for (const [i, cols] of parsed.slice(1).entries()) {
    if (cols.length !== HEADER.length) throw Error(`Row ${i + 2} has ${cols.length} columns; expected 5.`);
    const [sourceId, deck, rawType, text, pick] = cols;
    if (!/^\d{1,6}$/.test(sourceId) || sourceIds.has(sourceId)) throw Error(`Invalid or repeated source ID: ${sourceId}`);
    sourceIds.add(sourceId);
    const rating = DECKS.get(deck);
    const kind = rawType === 'Start (black)' ? 'cardPrompts' : rawType === 'Answer (white)' ? 'responses' : null;
    if (!rating || !kind || !text.trim()) throw Error(`Row ${i + 2}: unknown tier, card type or empty text.`);
    if (kind === 'cardPrompts' && !['1','2'].includes(pick)) throw Error(`Row ${i + 2}: invalid prompt pick value.`);
    if (kind === 'responses' && pick !== '') throw Error(`Row ${i + 2}: answer card cannot have a pick value.`);
    const originalText = text.trim();
    // The v2 engine uses FIVE underscores. Retain all requested blanks for editorial review.
    let proposedText = originalText.replace(/_{3,}/g, '_____');
    if (kind === 'responses') proposedText = proposedText.replace(/\.$/, '');
    const normalized = normalise(proposedText), issues = [];
    const blanks = (proposedText.match(/_{3,}/g) || []).length;
    if (kind === 'cardPrompts' && (pick !== '1' || blanks !== 1)) issues.push('two-blank-prompt-needs-rewrite');
    if (kind === 'cardPrompts' && proposedText.length > 90) issues.push('prompt-too-long');
    if (kind === 'responses' && proposedText.length > 45) issues.push('answer-too-long');
    if (kind === 'responses' && /:\s/.test(proposedText)) issues.push('label-colon-template');
    if (BRANDS.test(originalText)) issues.push('brand-or-entertainment-reference');
    if (existing.has(normalized)) issues.push('overlaps-current-or-staged-content');
    if (proposedTexts.has(normalized)) issues.push('duplicate-in-import');
    proposedTexts.add(normalized);
    // A format pass is NOT a publication or rights approval.
    entries.push({
      id: `etsc-csv-${sourceId.padStart(4, '0')}`, sourceId, kind, rating,
      originalDeck: deck, originalType: rawType, originalPick: pick || null,
      originalText, proposedText, editorialStatus: 'draft', reviewDecision: 'pending',
      reviewFlags: issues, readyToPublish: false,
    });
  }
  const openingCounts = new Map();
  for (const entry of entries.filter(e => e.kind === 'responses')) {
    const opening = firstFour(entry.proposedText);
    openingCounts.set(opening, (openingCounts.get(opening) || 0) + 1);
  }
  for (const entry of entries.filter(e => e.kind === 'responses')) {
    if (openingCounts.get(firstFour(entry.proposedText)) > 3) entry.reviewFlags.push('opening-overused-in-import');
  }
  const issues = {};
  for (const e of entries) for (const flag of e.reviewFlags) issues[flag] = (issues[flag] || 0) + 1;
  const counts = {};
  for (const entry of entries) {
    const key = `${entry.rating}/${entry.kind}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return {
    formatVersion: 1,
    source: path.basename(sourcePath),
    licenceStatus: 'unverified — confirm author/permission/terms before public use',
    editorialStatus: 'draft',
    published: false,
    entries,
    summary: {total: entries.length, counts, flagged: entries.filter(e => e.reviewFlags.length).length,
      clearOfFormatFlags: entries.filter(e => !e.reviewFlags.length).length, issues,
      rightsApproved: false, published: 0, approved: 0},
  };
}
function buildCSV(pack) {
  const rows = [['source_id','new_id','rating','kind','original_pick','original_text','proposed_text','review_flags','editorial_status','editor_decision']];
  for (const e of pack.entries) rows.push([e.sourceId,e.id,e.rating,e.kind,e.originalPick||'',e.originalText,e.proposedText,e.reviewFlags.join('; '),'draft','']);
  return '\uFEFF' + rows.map(row=>row.map(csvEscape).join(',')).join('\r\n')+'\r\n';
}
function buildHTML(pack) {
  const summary = pack.summary;
  const trs = pack.entries.map(e=>`<tr data-level="${htmlEscape(e.rating)}" data-kind="${htmlEscape(e.kind)}" data-flagged="${e.reviewFlags.length?'yes':'no'}"><td>${htmlEscape(e.sourceId)}</td><td>${htmlEscape(e.rating === 'adult' ? 'AFTER DARK' : e.rating.toUpperCase())}</td><td>${htmlEscape(e.kind)}</td><td>${htmlEscape(e.originalText)}</td><td>${htmlEscape(e.proposedText)}</td><td>${htmlEscape(e.reviewFlags.join(', ') || 'No format flags')}</td><td>Pending</td></tr>`).join('\n');
  return `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ECKY THUMP | Imported Card Review</title>
<style>:root{font:16px/1.5 system-ui,sans-serif;color:#f8f5ec;background:#171526}*{box-sizing:border-box}body{margin:0;padding:1.3rem}main{max-width:1450px;margin:auto}h1{font-size:clamp(1.5rem,3vw,2.4rem)}p{max-width:92ch}.warning{border:1px solid #ddbe77;background:#2a2530;border-radius:10px;padding:1rem;margin:1rem 0}.filters{display:flex;flex-wrap:wrap;gap:1rem;margin:1.2rem 0}.filters label{display:grid;gap:.25rem}select,input{border:2px solid #a1a0b3;border-radius:7px;background:#fff;color:#111;padding:.65rem;font-size:1rem;min-height:44px}input{min-width:230px}table{border-collapse:collapse;width:100%;background:#221d30}th,td{padding:.7rem;text-align:left;border-bottom:1px solid #524765;vertical-align:top}th{position:sticky;top:0;background:#362a45}tbody tr:nth-child(2n){background:#282238}td:nth-child(4),td:nth-child(5){min-width:185px;max-width:380px;overflow-wrap:anywhere}caption{text-align:left;padding:1rem}a{color:#ffdf82}#visible{font-weight:800}tr[hidden]{display:none}@media(max-width:900px){table{font-size:.85rem}th,td{padding:.35rem}td:nth-child(4),td:nth-child(5){min-width:150px}}@media print{*{color:#000!important;background:#fff!important}th{position:static}.filters{display:none}}</style>
<main><h1>ECKY THUMP — Uploaded card review</h1><p><strong>${summary.total} cards</strong>: ${summary.clearOfFormatFlags} format-clear; ${summary.flagged} require an identified wording/overlap check. This is an offline editorial review, not a game update.</p><p class="warning"><strong>NOT APPROVED OR PUBLISHED.</strong> Rights/licence status is unverified. Cards marked 'No format flags' still require comedy, grammar, rating and permission checks. After Dark cards are for consenting adults only.</p>
<div class="filters"><label>Search card text<input type="search" id="search" placeholder="Search all columns"></label><label>Humour level<select id="level"><option value="">All ratings</option><option value="clean">Family</option><option value="cheeky">Cheeky</option><option value="adult">After Dark</option></select></label><label>Type<select id="kind"><option value="">All cards</option><option value="cardPrompts">Prompts</option><option value="responses">Answers</option></select></label><label>Review<select id="flags"><option value="">All</option><option value="yes">Flagged only</option><option value="no">Format-clear only</option></select></label></div><p id="visible" aria-live="polite">Showing all ${summary.total} cards</p><table><thead><tr><th>ID</th><th>Rating</th><th>Type</th><th>Original</th><th>Formatted proposal</th><th>Flags</th><th>Decision</th></tr></thead><tbody>${trs}</tbody></table></main><script>
const trs=[...document.querySelectorAll('tbody tr')];const filters=['search','level','kind','flags'].map(id=>document.getElementById(id));function filter(){const [query,level,kind,flags]=filters.map(e=>e.value.toLowerCase());let visible=0;trs.forEach(tr=>{const ok=(!query||tr.textContent.toLowerCase().includes(query))&&(!level||tr.dataset.level===level)&&(!kind||tr.dataset.kind.toLowerCase()===kind)&&(!flags||tr.dataset.flagged===flags);tr.hidden=!ok;if(ok)visible++});document.getElementById('visible').textContent=visible+' of '+trs.length+' cards shown'}filters.forEach(el=>el.addEventListener('input',filter));filter();</script></html>`;
}
function writeReview(pack, outputDir) {
  fs.mkdirSync(outputDir,{recursive:true});
  fs.writeFileSync(path.join(outputDir,'party-cards-staging.json'),JSON.stringify(pack,null,2)+'\n');
  fs.writeFileSync(path.join(outputDir,'party-cards-editorial-review.csv'),buildCSV(pack));
  fs.writeFileSync(path.join(outputDir,'party-cards-review.html'),buildHTML(pack));
  fs.writeFileSync(path.join(outputDir,'import-report.json'),JSON.stringify(pack.summary,null,2)+'\n');
}
if (require.main === module) {
  const args = process.argv.slice(2), source = args.shift(), out = args.shift();
  if (!source || !out) { console.error('Usage: node scripts/stage-party-csv.js SOURCE.csv OUTPUT_DIR [--compare BATCH.json ...]'); process.exit(2); }
  const compare = [];
  while(args.length){const flag=args.shift();if(flag!=='--compare'||!args.length)throw Error('Expected --compare FILE.json');compare.push(args.shift());}
  const result = stage(source,compare);
  writeReview(result,out);
  console.log(JSON.stringify(result.summary,null,2));
}
module.exports = {stage,parseCSV,normalise,buildCSV,buildHTML,writeReview};
