'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const game=require('../server/game');
const social=game.social;
const persistence=require('../server/persistence');
function room(size=3,kind='WIT'){
  const {room:r}=game.newRoom({name:'Host',socialClub:true,pace:'relaxed',length:'standard'});
  r.code='TEST24';for(let i=1;i<size;i++)game.addPlayer(r,'Friend '+i);
  social.start(r);r.playlist=[kind];r.roundIndex=0;social.beginRound(r);
  social.startSubmit(r);return r;
}
function writeAll(r,value='A reasonable joke about the chip shop'){
  for(const p of r.players)for(const task of social.expected(r,p.id)){
    const item=r.round.type==='DOUBLE'?{cardId:r.round.hands.get(p.id)[0].id,line:value}:
      r.round.type==='CARD'?r.round.hands.get(p.id)[0].id:
      r.round.type==='FINAL'?('One '+r.round.requiredWord+' at the chip shop'):value;
    social.submit(r,p,task.id,item,game.validateAnswer);
  }
  assert.equal(r.phase,'REVEAL');
}
function revealUntilVote(r){while(r.phase==='REVEAL')social.revealNext(r);assert.equal(r.phase,'VOTE');}
test('3–12 player circular pairing assigns two different prompts per player with no self pairs',()=>{
  for(let n=3;n<=12;n++){
    const players=Array.from({length:n},(_,i)=>({id:'person'+i}));
    const groups=social.pairings(players,'R');assert.equal(groups.length,n);
    const count=new Map(players.map(p=>[p.id,0])),pairs=new Set();
    for(const g of groups){assert.equal(g.players.length,2);assert.notEqual(g.players[0],g.players[1]);
      const key=g.players.slice().sort().join(':');assert.equal(pairs.has(key),false,key);pairs.add(key);
      for(const id of g.players)count.set(id,count.get(id)+1);
    }
    assert.equal([...count.values()].every(x=>x===2),true);
  }
});
test('quick / standard / long playlist stays in Social Club order',()=>{
  assert.deepEqual(social.SCHEDULES.quick,['CARD','WIT','FINAL']);
  assert.deepEqual(social.SCHEDULES.standard,['CARD','WIT','CONTEXT','DOUBLE','FINAL']);
  assert.deepEqual(social.SCHEDULES.party,['CARD','WIT','CONTEXT','DOUBLE','WIT','FINAL']);
});
test('writing answers are private until results; one immutable ballot per eligible player',()=>{
  const r=room(4,'WIT');writeAll(r);
  let snap=social.snapshot(r,r.players[0].id);
  assert.equal(snap.round.visibleAnswers.length,1);
  assert.equal(Object.hasOwn(snap.round.visibleAnswers[0],'authorId'),false);
  revealUntilVote(r);const g=r.round.groups[0],author=r.players.find(p=>g.players.includes(p.id));
  const competitor=social.snapshot(r,author.id).round.vote;
  assert.equal(competitor.eligible,false);
  assert.deepEqual(competitor.choices.map(x=>x.id),[...g.entries.values()].filter(e=>e.authorId!==author.id).map(x=>x.id));
  const eligible=r.players.filter(p=>!g.players.includes(p.id));
  const id=[...g.entries.values()][0].id;
  social.vote(r,eligible[0],id);social.vote(r,eligible[0],id);
  assert.throws(()=>social.vote(r,eligible[0],[...g.entries.values()][1].id),/locked/);
  social.vote(r,eligible[1],id);
  assert.equal(r.phase,'MATCHUP_RESULT');
  assert.equal(g.result.slam,true);
  assert.equal(g.result.awards.find(a=>a.entryId===id).points,1250);
  assert.equal(social.snapshot(r,null,true).round.visibleAnswers.every(a=>a.authorId),true);
});
test('three-person head-to-head has one player voter and cannot trigger a cheap slam',()=>{
  const r=room(3,'WIT');writeAll(r);revealUntilVote(r);
  const g=r.round.groups[0],person=r.players.find(p=>!g.players.includes(p.id));
  social.vote(r,person,[...g.entries.values()][0].id);
  assert.equal(g.result.slam,false);
  assert.equal(g.result.awards.reduce((n,a)=>n+a.points,0),1000);
});
test('audience ballots are capped at two vote equivalents; audience cannot control contestant ballot',()=>{
  const r=room(4,'WIT');writeAll(r);revealUntilVote(r);
  const g=r.round.groups[0],entries=[...g.entries.values()];
  for(let i=0;i<12;i++){
    const audience=game.addAudience(r,'Spectator '+i);
    social.vote(r,r.audience.find(a=>a.id===audience.id),entries[1].id,{audience:true});
  }
  assert.equal(g.audienceBallots.size,12);
  const voters=r.players.filter(p=>!g.players.includes(p.id));
  for(const p of voters)social.vote(r,p,entries[0].id);
  assert.equal(g.result.awards.reduce((n,a)=>n+a.base,0),1000);
  assert.equal(g.result.awards.every(a=>a.bonus===0),true);
  assert.equal(g.result.awards[0].base,500);
  assert.equal(g.result.awards[1].base,500);
});
test('no-shows are explicit forfeits; walkovers score once and never grant slam bonus',()=>{
  const r=room(4,'WIT'),g=r.round.groups[0],first=r.players.find(p=>p.id===g.players[0]);
  social.submit(r,first,g.id,'My nan and her raffle tickets',game.validateAnswer);
  social.endSubmission(r);revealUntilVote(r);
  social.endVoting(r);assert.equal(g.result.awards.find(a=>a.authorId===first.id).points,1000);
  assert.equal(g.result.awards.find(a=>a.authorId===g.players[1]).points,0);
  assert.equal(g.result.slam,false);
  const other=r.round.groups[1];
  assert.equal(other.entries.size,2);
  assert.equal([...other.entries.values()].every(e=>e.auto),true);
});
test('12-player raffle uses two drums, and each contestant has exactly one non-self voting group',()=>{
  const r=room(12,'CARD');writeAll(r);
  assert.equal(r.round.groups.length,2);
  assert.equal(r.round.groups.every(g=>g.players.length===6),true);
  const counts=new Map(r.players.map(p=>[p.id,0]));
  for(const g of r.round.groups){
    for(const p of r.players)if(social.snapshot(r,p.id).round){
      const isOwn=g.players.includes(p.id);
      if(!isOwn)counts.set(p.id,counts.get(p.id)+1);
    }
  }
  assert.equal([...counts.values()].every(v=>v===1),true);
});
test('Crossed Wires seed author is never either contestant, and all players receive two rewrites',()=>{
  const r=room(5,'CONTEXT');
  assert.equal(r.round.stage,'seed');
  for(const p of r.players)social.submitSeed(r,p,'A lovely brass band in Bury',game.validateAnswer);
  assert.equal(r.round.stage,'answer');
  for(const p of r.players){const tasks=social.expected(r,p.id);assert.equal(tasks.length,2);
    for(const task of tasks){const g=r.round.groups.find(g=>g.id===task.id);
      assert.equal(g.players.includes(p.id),true);
      social.submit(r,p,task.id,'It all went wrong at the gala',game.validateAnswer);
    }
  }
  assert.equal(r.phase,'REVEAL');
});
test('submission and voting time limits are checked at the action boundary',()=>{
  const r=room(3,'WIT');r.deadline=Date.now()-1;
  assert.throws(()=>social.submit(r,r.players[0],social.expected(r,r.players[0].id)[0].id,'Something funny',game.validateAnswer),/deadline/);
  r.deadline=Date.now()+10000;writeAll(r);revealUntilVote(r);r.deadline=Date.now()-1;
  const g=r.round.groups[0],eligible=r.players.find(p=>!g.players.includes(p.id));
  assert.throws(()=>social.vote(r,eligible,[...g.entries.values()][0].id),/closed/);
});
test('pause preserves deadline and blocks edits until resumed',()=>{
  const r=room(3,'WIT'),p=r.players[0];social.pause(r);
  assert.equal(r.deadline,null);assert.equal(r.paused,true);
  assert.throws(()=>social.submit(r,p,social.expected(r,p.id)[0].id,'A very cheeky raffle',game.validateAnswer),/not open/);
  social.resume(r);assert.equal(r.paused,false);assert.ok(r.deadline>Date.now());
});
test('approved snapshots restore Maps, Sets, scores and hashed reconnect credentials',()=>{
  const before=process.env.ROOM_DATA_DIR,dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-preview-'));
  process.env.ROOM_DATA_DIR=dir;
  try{
    const created=game.newRoom({name:'Host',socialClub:true});const r=created.room;r.code='ABCD24';
    game.addPlayer(r,'Second');game.addPlayer(r,'Third');social.start(r);social.startSubmit(r);
    const p=r.players[0],task=social.expected(r,p.id)[0];
    social.submit(r,p,task.id,r.round.hands.get(p.id)[0].id,game.validateAnswer);
    assert.equal(persistence.store(r),true);const file=path.join(dir,'ABCD24.json');
    assert.equal(fs.existsSync(file),true);
    const text=fs.readFileSync(file,'utf8');assert.equal(text.includes(created.secret),false);
    const result=persistence.restore();const again=result.get(r.code);
    assert.ok(again);assert.equal(game.findPlayer(again,created.secret).id,p.id);
    assert.equal(again.round.groups[0].entries instanceof Map,true);
    assert.equal(again.promptHistory instanceof Set,true);
    assert.equal(game.snapshot(again,p.id).round.tasks[0].submitted,true);
    persistence.remove(r.code);assert.equal(fs.existsSync(file),false);
  }finally{if(before===undefined)delete process.env.ROOM_DATA_DIR;else process.env.ROOM_DATA_DIR=before;fs.rmSync(dir,{force:true,recursive:true});}
});
test('six hour retention rejects old rooms and deletes expired files',()=>{
  const before=process.env.ROOM_DATA_DIR,dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-preview-expired-'));
  process.env.ROOM_DATA_DIR=dir;
  try{const r=room(3);r.code='ABCD25';r.created=Date.now()-7*3600000;
    persistence.store(r);assert.equal(persistence.restore().size,0);
    assert.equal(fs.existsSync(path.join(dir,'ABCD25.json')),false);
  }finally{if(before===undefined)delete process.env.ROOM_DATA_DIR;else process.env.ROOM_DATA_DIR=before;fs.rmSync(dir,{recursive:true,force:true});}
});
test('Crossed Wires uses each submitted seed exactly once and never for its original author',()=>{
  const r=room(7,'CONTEXT');
  const seedById=new Map();
  for(const [i,p] of r.players.entries()){
    const seed='A unique innocent brass band story number '+i;
    seedById.set(p.id,seed);social.submitSeed(r,p,seed,game.validateAnswer);
  }
  const seen=new Set();
  for(const g of r.round.groups){
    const text=r.round.prompts.get(g.id);
    const origin=[...seedById].find(([id,seed])=>seed===text)?.[0];
    assert.ok(origin);assert.equal(g.players.includes(origin),false);
    assert.equal(seen.has(origin),false);seen.add(origin);
  }
  assert.equal(seen.size,r.players.length);
});
test('Last Orders awards double base points but not double slam bonus',()=>{
  const r=room(3,'FINAL');
  writeAll(r);revealUntilVote(r);
  const g=r.round.groups[0],all=[...g.entries.values()];
  for(const player of r.players){const choice=all.find(e=>e.authorId!==player.id);social.vote(r,player,choice.id);}
  const result=g.result;
  assert.equal(result.awards.reduce((n,a)=>n+a.base,0),900);
  assert.equal(result.awards.reduce((n,a)=>n+a.points,0),1800+result.awards.reduce((n,a)=>n+a.bonus,0));
  assert.equal(result.awards.every(a=>a.points===a.base*2+a.bonus),true);
});
test('a unanimous raffle vote yields a single +250 award without doubling in Last Orders',()=>{
  const r=room(4,'FINAL');writeAll(r);revealUntilVote(r);
  const g=r.round.groups[0],first=[...g.entries.values()][0];
  const voters=r.players.filter(p=>p.id!==first.authorId);
  voters.forEach(p=>social.vote(r,p,first.id));
  const owner=r.players.find(p=>p.id===first.authorId);
  social.vote(r,owner,[...g.entries.values()].find(e=>e.id!==first.id).id);
  assert.equal(g.result.slam,true);
  const prize=g.result.awards.find(a=>a.entryId===first.id);
  assert.equal(prize.base,900);assert.equal(prize.bonus,250);assert.equal(prize.points,2050);
});
test('a completed group cannot award points twice',()=>{
  const r=room(4,'WIT');writeAll(r);revealUntilVote(r);const g=r.round.groups[0];
  const voters=r.players.filter(p=>!g.players.includes(p.id));
  for(const p of voters)social.vote(r,p,[...g.entries.values()][0].id);
  const points=r.players.map(p=>p.score);
  assert.throws(()=>social.endVoting(r),/no ballot/i);
  assert.deepEqual(r.players.map(p=>p.score),points);
});
test('household TV snapshot hides unrevealed answers and all authors until the matchup result',()=>{
  const r=room(4,'WIT');writeAll(r);let t=social.snapshot(r,null,true);
  assert.equal(t.round.visibleAnswers.length,1);
  assert.equal(t.round.visibleAnswers.some(e=>e.authorName||e.authorId),false);
  social.revealNext(r);t=social.snapshot(r,null,true);
  assert.equal(t.round.visibleAnswers.length,2);
  assert.equal(t.round.visibleAnswers.some(e=>e.authorId),false);
  social.revealNext(r);t=social.snapshot(r,null,true);
  assert.equal(t.round.visibleAnswers.some(e=>e.authorId),false);
  social.endVoting(r);t=social.snapshot(r,null,true);
  assert.equal(t.round.visibleAnswers.every(e=>!!e.authorId&&!!e.avatar),true);
});
test('complete six-round show from lobby to champion at 3 and 12 players',()=>{
  for(const size of [3,12]){
    const {room:r}=game.newRoom({name:'Host',socialClub:true,length:'party',pace:'relaxed'});
    r.code='PART24';for(let i=1;i<size;i++)game.addPlayer(r,'Friend '+i);
    social.start(r);assert.equal(r.phase,'ROUND_INTRO');
    for(const roundType of social.SCHEDULES.party){
      assert.equal(r.round.type,roundType);
      social.startSubmit(r);
      if(r.round.stage==='seed')for(const [i,p] of r.players.entries()){
        social.submitSeed(r,p,'Innocent tale of a club raffle number '+i,game.validateAnswer);
      }
      for(const p of r.players){for(const task of social.expected(r,p.id)){
        const chosen=roundType==='CARD'?r.round.hands.get(p.id)[0].id:
          roundType==='DOUBLE'?{cardId:r.round.hands.get(p.id)[0].id,line:'My favourite works do'}:
          roundType==='FINAL'?'A lovely '+r.round.requiredWord+' with my nan':
          'One unforgettable night at the social club';
        social.submit(r,p,task.id,chosen,game.validateAnswer);
      }}
      assert.equal(r.phase,'REVEAL');
      for(let groupIndex=0;groupIndex<r.round.groups.length;groupIndex++){
        revealUntilVote(r);
        const group=r.round.groups[groupIndex];
        for(const p of r.players){
          const ownGroup=group.players.includes(p.id);
          if(['WIT','CONTEXT','DOUBLE'].includes(roundType)?ownGroup:(r.round.groups.length>1&&ownGroup))continue;
          const option=[...group.entries.values()].find(e=>!e.auto&&e.authorId!==p.id);
          if(option&&r.phase==='VOTE')social.vote(r,p,option.id);
        }
        if(r.phase==='VOTE')social.endVoting(r);
        assert.equal(group.result!==null,true);
        assert.equal(r.phase,'MATCHUP_RESULT');
        social.nextResult(r);
      }
      assert.equal(r.phase,'ROUND_SCORES');
      assert.equal(r.round.scored,true);
      assert.equal(r.round.groups.every(g=>g.result!==null),true);
      social.nextRound(r);
    }
    assert.equal(r.phase,'CHAMPION');
    assert.ok(r.players.some(p=>p.id===r.social.lastChampion));
    social.nextRound(r);assert.equal(r.phase,'COMPLETE');
    social.playAgain(r);assert.equal(r.phase,'LOBBY');
    assert.equal(r.players.every(p=>p.score===0),true);
  }
});
test('host hides an inappropriate answer, resetting ballots without unmasking the author',()=>{
  const r=room(4,'WIT');writeAll(r);revealUntilVote(r);
  const group=r.round.groups[0],entries=[...group.entries.values()];
  const viewer=r.players.find(p=>!group.players.includes(p.id));
  social.vote(r,viewer,entries[0].id);
  social.report(r,viewer,entries[0].id);
  assert.equal(r.reports.length,1);
  social.hide(r,entries[0].id);
  assert.equal(group.ballots.size,0);
  assert.equal(group.entries.get(entries[0].authorId).auto,true);
  assert.equal(social.snapshot(r,viewer.id).round.visibleAnswers[0].authorId,undefined);
  assert.throws(()=>social.vote(r,viewer,entries[0].id),/valid submitted answer/);
});
test('host skip leaves already-awarded matchups unchanged and prevents later points',()=>{
  const r=room(4,'WIT');writeAll(r);revealUntilVote(r);
  const group=r.round.groups[0];
  for(const voter of r.players.filter(p=>!group.players.includes(p.id)))social.vote(r,voter,[...group.entries.values()][0].id);
  assert.equal(r.phase,'MATCHUP_RESULT');
  const scores=r.players.map(p=>p.score);
  social.skip(r);assert.equal(r.phase,'ROUND_SCORES');
  assert.equal(r.round.skipped,true);assert.deepEqual(r.players.map(p=>p.score),scores);
});
test('network retry of identical answer and ballot is idempotent across phase transition',()=>{
  const r=room(3,'WIT'),author=r.players[0],task=social.expected(r,author.id)[0];
  const text='The chip shop banned the brass band';
  social.submit(r,author,task.id,text,game.validateAnswer);
  for(const p of r.players)for(const t of social.expected(r,p.id)){
    if(p.id===author.id&&t.id===task.id)continue;
    social.submit(r,p,t.id,'The raffle was a spectacular disaster',game.validateAnswer);
  }
  assert.equal(r.phase,'REVEAL');
  assert.doesNotThrow(()=>social.submit(r,author,task.id,text,game.validateAnswer));
  assert.throws(()=>social.submit(r,author,task.id,'A completely changed line',game.validateAnswer),/locked/);
  revealUntilVote(r);
  const group=r.round.groups[0],voter=r.players.find(p=>!group.players.includes(p.id));
  const id=[...group.entries.values()][0].id;
  social.vote(r,voter,id);assert.equal(r.phase,'MATCHUP_RESULT');
  const before=r.players.map(p=>p.score);
  assert.doesNotThrow(()=>social.vote(r,voter,id));
  assert.deepEqual(r.players.map(p=>p.score),before);
  assert.throws(()=>social.vote(r,voter,[...group.entries.values()][1].id),/locked/);
});
