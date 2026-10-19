'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const g=require('../server/game');
function room(length='party',count=4){
 const {room}=g.newRoom({name:'Host Person',length,pace:'relaxed'});room.code='JHCD23';
 for(let i=1;i<count;i++)g.addPlayer(room,`Player ${i}`);
 g.startGame(room);return room;
}
function completeSubmission(r){
 if(r.phase==='SEED')for(const p of r.players)g.acceptSeed(r,p,`I had a completely normal day ${p.name}`);
 assert.equal(r.phase,'SUBMIT');
 for(const p of r.players){
  const state=g.snapshot(r,p.id);
  const value=r.round.type==='CARD'?state.round.hand[0].id:
    r.round.type==='DOUBLE'?{cardId:state.round.hand[0].id,line:`This product is certified by ${p.name}`}:
    `Absolutely terrible answer from ${p.name} ${r.round.requiredWord||''}`;
  g.acceptAnswer(r,p,value);
 }
 assert.equal(r.phase,'VOTE');
 for(const p of r.players){
  const candidates=g.snapshot(r,p.id).round.candidates.filter(x=>!x.isOwn);
  g.acceptVote(r,p,candidates[0].id,candidates[1].id);
 }
 assert.equal(r.phase,'RESULTS');
}
test('Party playlist provides five different play patterns and a double-points finale',()=>{
 const r=room();
 assert.deepEqual(r.playlist,['CARD','WIT','CONTEXT','DOUBLE','CARD','FINAL']);
 for(let i=0;i<r.playlist.length;i++){
   assert.equal(r.round.type,r.playlist[i]);
   completeSubmission(r);
   assert.equal(r.round.awards.length,4);
   assert.equal(r.round.multiplier,i===5?2:1);
   g.nextRound(r);
 }
 assert.equal(r.phase,'COMPLETE');
 assert.equal(g.snapshot(r,r.players[0].id).champions.length>=1,true);
});
test('Context seeds remain private, are cross-assigned with no self-seeding and only rewrites win points',()=>{
 const r=room('standard',3);
 for(let i=0;i<2;i++){completeSubmission(r);g.nextRound(r);}
 assert.equal(r.phase,'SEED');
 assert.equal(g.snapshot(r,null,true).round.assignedSeed,undefined);
 const seeds=new Map();
 for(const p of r.players){const seed=`An ordinary message from ${p.name}`;seeds.set(p.id,seed);g.acceptSeed(r,p,seed);}
 assert.equal(r.phase,'SUBMIT');
 assert.equal(g.snapshot(r,null,true).round.assignedSeed,undefined);
 const authored=new Map();
 for(const p of r.players){
  const state=g.snapshot(r,p.id).round;
  assert.notEqual(state.assignedSeed,seeds.get(p.id));
  assert.equal(state.hand,undefined);
  assert.equal(g.snapshot(r,r.players.find(x=>x.id!==p.id).id).round.entries,undefined);
  authored.set(p.id,state.assignedSeed);
  g.acceptAnswer(r,p,`FAKE HEADLINE: council regrets the message from ${p.name}`);
 }
 assert.equal(r.phase,'VOTE');
 for(const p of r.players){const state=g.snapshot(r,p.id).round;assert.ok(state.candidates.every(x=>!('authorId' in x)));
  assert.ok(state.candidates.some(x=>x.text.includes('FAKE HEADLINE')));
  const others=state.candidates.filter(x=>!x.isOwn);g.acceptVote(r,p,others[0].id,others[1].id);
 }
 assert.equal(r.phase,'RESULTS');
 assert.ok(g.snapshot(r,null,true).round.entries.every(e=>e.seedAuthorName));
});
test('Context missing seed timeout uses harmless fallback and advances without disclosing ownership',()=>{
 const r=room('standard',3);
 for(let i=0;i<2;i++){completeSubmission(r);g.nextRound(r);}
 g.acceptSeed(r,r.players[0],'A perfectly normal office meeting');
 r.deadline=Date.now()-1;
 assert.equal(g.tick(r),true);
 assert.equal(r.phase,'SUBMIT');
 assert.equal(r.round.assignments.size,3);
 assert.equal(g.snapshot(r,null,true).round.assignedSeed,undefined);
});
test('Double Trouble rejects forged cards and requires a valid original caption',()=>{
 const r=room();
 for(let i=0;i<3;i++){completeSubmission(r);g.nextRound(r);}
 assert.equal(r.round.type,'DOUBLE');
 const player=r.players[0],state=g.snapshot(r,player.id).round;
 assert.equal(state.hand.length,5);
 assert.throws(()=>g.acceptAnswer(r,player,'Wrong type'),/Choose a card/);
 assert.throws(()=>g.acceptAnswer(r,player,{cardId:'forged',line:'A rather funny ad'}),/not in your hand/);
 assert.throws(()=>g.acceptAnswer(r,player,{cardId:state.hand[0].id,line:'hi'}),/3 and 160/);
 assert.throws(()=>g.acceptAnswer(r,player,{cardId:state.hand[0].id,line:'https://untrusted.example.com'}),/Links/);
 g.acceptAnswer(r,player,{cardId:state.hand[0].id,line:'Guaranteed to shock the neighbourhood'});
 assert.match(r.round.entries[0].text,/Guaranteed to shock/);
 assert.equal(g.snapshot(r,r.players[1].id).round.entries,undefined);
});
test('Finale uses identical voting weights but doubles awarded points',()=>{
 const r=room('standard',3);
 for(let i=0;i<3;i++){completeSubmission(r);g.nextRound(r);}
 assert.equal(r.round.type,'FINAL');
 assert.throws(()=>g.acceptAnswer(r,r.players[0],'An answer with no magic word'),/must include/);
 completeSubmission(r);
 const baseline=g.scoreEntries(r.round.entries,[...r.round.ballots.values()]);
 for(const award of r.round.awards){assert.equal(award.points,baseline.find(x=>x.entryId===award.entryId).points*2);}
 assert.equal(g.snapshot(r,null,true).round.multiplier,2);
});
test('A host may skip a Context seed stage and no points are awarded',()=>{
 const r=room('standard',3);
 for(let i=0;i<2;i++){completeSubmission(r);g.nextRound(r);}
 assert.equal(r.phase,'SEED');g.finishRound(r,'Host skip');
 assert.equal(r.phase,'RESULTS');assert.equal(r.round.awards.length,0);
});
