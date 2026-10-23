 'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const c=require('../server/content');
const root=path.resolve(__dirname,'..');
const stage=require('../editorial/incoming-2026-10-23/candidates.json');
const summary=require('../editorial/incoming-2026-10-23/approved-summary.json');
const norm=s=>s.toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu,' ').trim();

const replacements=new Map([
 ['100063','The village fête lost its marquee because of _____.'],
 ['100072',"Tonight's brass-band number celebrates _____."],
 ['200001',"Name the social club's new signature mocktail."],
 ['200011','Give a harmless remark heard at the village fête.'],
 ['200015',"Quote a harmless line from the vicar's sermon."],
 ['200017','What innocent thing was said during flatpack assembly?'],
 ['200049','flapjack'],['200058','lovebite'],['200067','afterparty']
]);

test('200 submitted CSV IDs have exactly the user-approved wording and correct tiers',()=>{
 const added=new Map(c.approvedPack.entries.filter(e=>e.id.startsWith('etsc-more-')).map(e=>[e.id,e]));
 assert.equal(added.size,200);
 assert.equal(summary.newlyApproved,200);
 assert.equal(summary.totalApproved,850);
 assert.equal(summary.editorialChanges,9);
 for(const x of stage.entries){
   const e=added.get(x.id);
   assert.ok(e,x.id);
   assert.equal(e.text,replacements.get(x.sourceId)||x.originalText,x.sourceId);
   assert.equal(e.kind,x.kind,x.id);
   assert.equal(e.rating,x.rating,x.id);
   assert.equal(e.editorialStatus,'approved');
   assert.equal(e.sourceId,x.sourceId);
   assert.ok(c.getPool(c[e.kind],e.rating).includes(e.text));
   if(e.rating==='cheeky')assert.equal(c.getPool(c[e.kind],'clean').includes(e.text),false);
   if(e.rating==='adult'){
     assert.equal(c.getPool(c[e.kind],'clean').includes(e.text),false);
     assert.equal(c.getPool(c[e.kind],'cheeky').includes(e.text),false);
   }
 }
});

test('approved catalogue contains 850 unique IDs and no duplicate texts',()=>{
 const items=c.approvedPack.entries;
 assert.equal(items.length,850);
 assert.equal(new Set(items.map(e=>e.id)).size,850);
 assert.equal(new Set(items.map(e=>norm(e.text))).size,850);
 const starts=new Map();
 for(const e of items.filter(e=>e.kind==='responses')){
   const prefix=norm(e.text).split(' ').slice(0,4).join(' ');
   starts.set(prefix,(starts.get(prefix)||0)+1);
 }
 for(const [k,v] of starts)assert.ok(v<=3,`${k}: ${v}`);
 for(const e of items){
   if(e.kind==='responses')assert.ok(e.text.length<=45&&!e.text.includes(':'),e.id);
   if(e.kind==='cardPrompts')assert.ok(e.text.length<=90&&(e.text.match(/_____/g)||[]).length===1,e.id);
   if(e.kind==='finalWords')assert.ok(e.text.length<=30&&!/\s/.test(e.text),e.id);
   if(['witPrompts','contextPrompts','doublePrompts','finalPrompts','contracts'].includes(e.kind))assert.ok(e.text.length<=90,e.id);
 }
});

test('approval preserves original draft CSVs and complete source-to-final change ledger',()=>{
 const dir=path.join(root,'editorial/incoming-2026-10-23');
 const ledger=fs.readFileSync(path.join(dir,'approved-ledger.csv'),'utf8');
 assert.equal(ledger.trim().split(/\r?\n/).length,201);
 assert.ok(ledger.includes('The village fête lost its marquee because of _____.'));
 assert.equal(stage.entries.filter(x=>x.editorialStatus==='draft'&&x.readyToPublish===false).length,200);
 assert.equal(stage.summary.flagged,9);
 assert.ok(fs.existsSync(path.join(dir,'party_more_cards.csv')));
 assert.ok(fs.existsSync(path.join(dir,'party_more_modes.csv')));
});

test('new Last Orders words and writing prompts load in approved-only mode',()=>{
 const code=`const c=require('./server/content'); const a=c.approvedPack.entries.filter(x=>x.id.startsWith('etsc-more-'));console.log(JSON.stringify({n:a.length,word:c.finalWords.clean.includes('flapjack'),word2:c.finalWords.cheeky.includes('lovebite'),prompt:c.witPrompts.clean.includes(\"Name the social club's new signature mocktail.\"),old:c.responses.cheeky.includes(c.expansion.entries.find(x=>x.id==='et09-responses-cheeky-001').text)}))`;
 const r=cp.spawnSync(process.execPath,['-e',code],{cwd:root,encoding:'utf8',env:{...process.env,PREMIUM_CONTENT_ONLY:'1'}});
 assert.equal(r.status,0,r.stderr);
 const a=JSON.parse(r.stdout);
 assert.equal(a.n,200);
 assert.ok(a.word);assert.ok(a.word2);assert.ok(a.prompt);
 assert.equal(a.old,false);
});
