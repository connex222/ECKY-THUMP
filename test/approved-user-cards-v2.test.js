'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const c = require('../server/content');
const pack = c.approvedPack;
const projectRoot = path.join(__dirname, '..');
const norm = text => text.toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

test('approved overlay contains exactly the approved 200 staged and 450 uploaded cards', () => {
  assert.equal(pack.id, 'ecky-social-club-approved-v1');
  assert.equal(pack.entries.length, 650);
  assert.equal(pack.entries.filter(e=>e.id.startsWith('etsc-csv-')).length, 450);
  assert.equal(pack.entries.filter(e=>!e.id.startsWith('etsc-csv-')).length, 200);
  const ids = pack.entries.map(e=>e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(pack.entries.map(e=>norm(e.text))).size, 650);
  assert.ok(pack.entries.every(e=>e.editorialStatus==='approved'));
});

test('every imported prompt is single-blank and every response is short and insertion-ready', () => {
  for (const e of pack.entries) {
    assert.ok(['clean', 'cheeky', 'adult'].includes(e.rating));
    assert.ok(['responses', 'cardPrompts'].includes(e.kind));
    assert.ok(e.text && e.text===e.text.trim());
    if(e.kind==='responses') {assert.ok(e.text.length<=45,e.id);assert.ok(!e.text.includes(':'),e.id);}
    else {assert.ok(e.text.length<=90,e.id);assert.equal((e.text.match(/_____/g)||[]).length,1,e.id);}
  }
  const openings = new Map();
  for (const e of pack.entries.filter(x=>x.kind==='responses')) {
    const four = norm(e.text).split(' ').slice(0,4).join(' ');
    openings.set(four,(openings.get(four)||0)+1);
  }
  for(const [key,n] of openings)assert.ok(n<=3, key+' repeated '+n+' times');
  assert.doesNotMatch(pack.entries.map(e=>e.text).join('\n'),/\b(?:IKEA|Facebook|Tesco|Morrisons|Poundland|Tinder|Google|Netflix|WhatsApp|Viagra|Amazon)\b/i);
});

test('every approved card respects the player humour level and superseded Family text is not dealt', () => {
  for (const e of pack.entries) {
    const selected = c.getPool(c[e.kind], e.rating);
    assert.ok(selected.includes(e.text),e.id);
    if(e.rating==='cheeky')assert.equal(c.getPool(c[e.kind],'clean').includes(e.text), false, e.id);
    if(e.rating==='adult'){
      assert.equal(c.getPool(c[e.kind],'clean').includes(e.text),false,e.id);
      assert.equal(c.getPool(c[e.kind],'cheeky').includes(e.text),false,e.id);
    }
  }
  const legacy = c.expansion.entries.find(e=>e.id==='et09-responses-clean-001');
  assert.ok(legacy);
  assert.equal(c.responses.clean.includes(legacy.text),false);
  assert.ok(c.responses.clean.includes(pack.entries.find(e=>e.id===legacy.id).text));
});

test('PREMIUM_CONTENT_ONLY=1 filters unapproved expansion content while retaining approved text', () => {
  const code = `const c=require('./server/content');const old=c.expansion.entries.find(x=>x.id==='et09-responses-cheeky-001');const now=c.approvedPack.entries.find(x=>x.id==='etsc-csv-0140');console.log(JSON.stringify({oldIn:c.responses.cheeky.includes(old.text),newIn:c[now.kind][now.rating].includes(now.text),approved:c.approvedPack.entries.length}));`;
  const p = spawnSync(process.execPath,['-e',code],{cwd:projectRoot,env:{...process.env,PREMIUM_CONTENT_ONLY:'1'},encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  const x=JSON.parse(p.stdout);
  assert.equal(x.oldIn,false);
  assert.equal(x.newIn,true);
  assert.equal(x.approved,650);
});

test('approved import ledger tracks all edits without touching the original pack', () => {
  const ledger=fs.readFileSync(path.join(projectRoot,'editorial/approved-card-import-ledger.csv'),'utf8');
  const summary=require('../editorial/approved-card-import-summary.json');
  assert.equal(summary.totalApproved,650);
  assert.equal(summary.sourceCSV,450);
  assert.equal(summary.priorFamilyBatches,200);
  assert.equal(summary.rewrites,37);
  assert.match(ledger,/etSC|etsc-csv-0001/i);
  assert.equal(c.expansion.entries.length,1200);
});
