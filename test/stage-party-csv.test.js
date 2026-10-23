'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {stage,parseCSV,writeReview}=require('../scripts/stage-party-csv');

test('CSV parsing supports BOM, escaped quotes, commas and CRLF',()=>{
 const rows=parseCSV('\uFEFFid,deck,card_type,text,pick\r\n1,Family-friendly,Start (black),"Bring ""fun"", please ____.",1\r\n');
 assert.deepEqual(rows[1],['1','Family-friendly','Start (black)','Bring "fun", please ____.','1']);
});

test('user cards can be formatted for offline review without becoming approved content',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-import-'));
 try{
   const file=path.join(dir,'source.csv');
   fs.writeFileSync(file,'id,deck,card_type,text,pick\r\n1,Family-friendly,Start (black),The raffle prize is ____.,1\r\n2,Cheeky,Answer (white),A forgotten pub voucher.,\r\n3,Very adult,Start (black),One part ____ and one part ____.,2\r\n4,Very adult,Answer (white),Nodding along to a conversation you cannot hear.,\r\n5,Family-friendly,Answer (white),An <injection> & a biscuit.,\r\n');
   const pack=stage(file,[],path.resolve(__dirname,'..'));
   assert.equal(pack.summary.total,5);
   assert.equal(pack.summary.approved,0);
   assert.equal(pack.summary.published,0);
   assert.equal(pack.licenceStatus.includes('unverified'),true);
   assert.equal(pack.entries[0].proposedText,'The raffle prize is _____.');
   assert.equal(pack.entries[1].proposedText,'A forgotten pub voucher');
   assert.ok(pack.entries[2].reviewFlags.includes('two-blank-prompt-needs-rewrite'));
   assert.ok(pack.entries[3].reviewFlags.includes('answer-too-long'));
   assert.ok(pack.entries.every(e=>e.editorialStatus==='draft'&&!e.readyToPublish));
   writeReview(pack,dir);
   const html=fs.readFileSync(path.join(dir,'party-cards-review.html'),'utf8');
   assert.match(html,/&lt;injection&gt; &amp; a biscuit/);
   assert.doesNotMatch(html,/<injection>/);
   const csv=fs.readFileSync(path.join(dir,'party-cards-editorial-review.csv'),'utf8');
   assert.equal(csv.trim().split(/\r?\n/).length,6);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('malformed columns and duplicate source IDs never enter staging',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-import-'));
 try{
   const file=path.join(dir,'source.csv');
   fs.writeFileSync(file,'id,deck,card_type,text,pick\n1,Cheeky,Answer (white),Pub biscuit,\n1,Cheeky,Answer (white),Second one,\n');
   assert.throws(()=>stage(file,[],path.resolve(__dirname,'..')),/repeated source ID/);
   fs.writeFileSync(file,'id,deck,card_type,text,pick\n1,Cheeky,Answer (white),Pub biscuit,extra,\n');
   assert.throws(()=>stage(file,[],path.resolve(__dirname,'..')),/columns/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
