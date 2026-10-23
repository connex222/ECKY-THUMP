'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {stage,buildReviewCsv,buildReviewHtml}=require('../scripts/stage-more-cards');
const dir=path.join(root,'editorial/incoming-2026-10-23');
const staged=require('../editorial/incoming-2026-10-23/candidates.json');
const srcCards=path.join(dir,'party_more_cards.csv');
const srcModes=path.join(dir,'party_more_modes.csv');

test('ordinary and other modes source imports preserve 200 original text entries as drafts',()=>{
 const pack=stage(srcCards,srcModes);
 assert.deepEqual(pack,staged);
 assert.equal(pack.summary.total,200);
 assert.equal(pack.summary.ordinary,100);
 assert.equal(pack.summary.modes,100);
 assert.equal(pack.summary.approved,0);
 assert.equal(pack.summary.published,0);
 assert.equal(pack.entries.filter(e=>e.editorialStatus==='draft'&&!e.readyToPublish).length,200);
 const keys=new Set(pack.entries.map(e=>e.id));assert.equal(keys.size,200);
 assert.equal(pack.entries.filter(e=>e.kind==='cardPrompts').length,25);
 assert.equal(pack.entries.filter(e=>e.kind==='finalWords').length,35);
 assert.equal(pack.entries.filter(e=>e.kind==='contracts').length,25);
 assert.ok(pack.entries.filter(e=>e.reviewFlags.length).length>0);
});

test('new draft texts cannot enter the live approved catalogue',()=>{
 const live=require('../server/content');
 assert.equal(live.approvedPack.entries.length,650);
 const ids=new Set(live.approvedPack.entries.map(e=>e.id));
 for(const item of staged.entries)assert.equal(ids.has(item.id),false,`premature publication ${item.id}`);
 assert.equal(staged.published,false);
});

test('writer generates safe, searchable review HTML and editable CSV ledger',()=>{
 const csv=buildReviewCsv(staged);
 const html=buildReviewHtml(staged);
 assert.match(csv,/editor_decision/);
 assert.equal(csv.trim().split(/\r?\n/).length,201);
 assert.match(html,/lang="en-GB"/);
 assert.match(html,/200 draft entries/);
 assert.equal((html.match(/<tr data-file=/g)||[]).length,200);
 assert.doesNotMatch(html,/No cards have been loaded into the game.*<iframe/i);
});

test('strict schema rejects duplicate numeric ID, wrong pick and malformed headers',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-more-cards-'));
 try{
  const card=path.join(temp,'cards.csv'),mode=path.join(temp,'modes.csv');
  fs.writeFileSync(card,'id,deck,card_type,text,pick\n100001,Family-friendly,Start (black),Bad _____.,2\n');
  fs.writeFileSync(mode,'id,deck,kind,text\n200001,Family-friendly,finalWords,marmalade\n');
  assert.throws(()=>stage(card,mode),/pick must be exactly 1/i);
  fs.writeFileSync(card,'id,deck,card_type,text,pick\n200001,Family-friendly,Start (black),Bad _____.,1\n');
  assert.throws(()=>stage(card,mode),/Repeated source ID/);
  fs.writeFileSync(card,'thing,deck,card_type,text,pick\n100001,Family-friendly,Start (black),Bad _____.,1\n');
  assert.throws(()=>stage(card,mode),/Bad header/);
 } finally {fs.rmSync(temp,{recursive:true,force:true})}
});

test('no unreviewed mode entries have been forced into ordinary response or prompt kind',()=>{
 const ordinary=staged.entries.filter(e=>e.sourceFile==='party_more_cards.csv');
 const special=staged.entries.filter(e=>e.sourceFile==='party_more_modes.csv');
 assert.equal(ordinary.length,100);assert.equal(special.length,100);
 assert.ok(ordinary.every(e=>['responses','cardPrompts'].includes(e.kind)));
 assert.ok(special.every(e=>['witPrompts','contextPrompts','doublePrompts','finalPrompts','finalWords','contracts'].includes(e.kind)));
 assert.equal(special.filter(e=>e.rating==='adult').length,17);
});
