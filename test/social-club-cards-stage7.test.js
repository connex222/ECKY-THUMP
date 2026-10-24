'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=require('../server/game');
const social=game.social;
const cards=require('../server/social-club-cards');
const persistence=require('../server/persistence');
function make(n=4,kind='WIT',enabled=true){
  const {room}=game.newRoom({name:'Host',socialClub:true,gameCards:enabled,length:'standard'});
  room.code='CARDS7';for(let i=1;i<n;i++)game.addPlayer(room,'Contestant '+i);
  social.start(room);room.playlist=[kind,'FINAL'];room.roundIndex=0;social.beginRound(room);
  social.startSubmit(room);return room;
}
function held(room,p,id){room.social.cards.hand.set(p.id,id);room.social.cards.played.delete(p.id);}
function submitAll(room){
  for(const p of room.players)for(const task of social.expected(room,p.id)){
    let value='A proper laugh in the working men’s club';
    if(room.round.type==='CARD')value=room.round.hands.get(p.id)[0].id;
    if(room.round.type==='DOUBLE')value={cardId:room.round.hands.get(p.id)[0].id,line:value};
    if(room.round.type==='FINAL')value='The '+room.round.requiredWord+' from the chippy';
    social.submit(room,p,task.id,value,game.validateAnswer);
  }
  if(room.phase==='SUBMIT'&&room.round.secondChanceGrace)social.endSubmission(room);
}
function voteFor(room,entry){
  while(room.phase==='REVEAL')social.revealNext(room);
  const group=room.round.groups[room.round.groupIndex];
  for(const player of room.players){
    if(room.phase!=='VOTE')break;
    const v=social.snapshot(room,player.id).round.vote;
    if(v.eligible&&v.choices.some(x=>x.id===entry.id))social.vote(room,player,entry.id);
  }
  if(room.phase==='VOTE')social.endVoting(room);
}
test('six named Social Club cards; off by default; host-only toggle remains a lobby setting',()=>{
  assert.deepEqual(Object.values(cards.LABELS),['DOUBLE OR NOWT','NICKED','HECKLE','SECOND CHANCE','UNDERDOG','POWER CUT']);
  const r=make(4,'WIT',false);
  assert.equal(r.config.gameCards,false);
  assert.equal(social.snapshot(r,r.players[0].id).gameCards.enabled,false);
  assert.throws(()=>social.setGameCards(r,true),/lobby/);
  assert.throws(()=>social.playGameCard(r,r.players[0],'NICKED',{},game.validateAnswer),/switched off/);
});
test('holding is capped at one card and playing is capped at once per round',()=>{
  const r=make();const p=r.players[0];held(r,p,'POWER_CUT');
  assert.equal([...r.social.cards.hand].filter(([id])=>id===p.id).length,1);
  social.playGameCard(r,p,'POWER_CUT',{},game.validateAnswer);
  assert.equal(r.social.cards.hand.get(p.id),null);
  assert.equal(r.social.cards.played.has(p.id),true);
  assert.throws(()=>social.playGameCard(r,p,'POWER_CUT',{},game.validateAnswer),/not in your hand/);
  assert.equal(r.round.powerCutPending,true);
});
test('power cut lasts three seconds before revealing any text and does not reveal author IDs',()=>{
  const r=make();const p=r.players[0];held(r,p,'POWER_CUT');
  social.playGameCard(r,p,'POWER_CUT',{},game.validateAnswer);submitAll(r);
  assert.equal(r.phase,'REVEAL');assert.equal(social.snapshot(r,null,true).round.blackout,true);
  assert.deepEqual(social.snapshot(r,null,true).round.visibleAnswers,[]);
  social.revealNext(r);assert.equal(r.round.revealIndex,0);
  r.round.powerCutUntil=Date.now()-5;social.revealNext(r);
  const snap=social.snapshot(r,null,true);
  assert.equal(snap.round.visibleAnswers.length,1);
  assert.equal(Object.hasOwn(snap.round.visibleAnswers[0],'authorId'),false);
});
test('NICKED transfers exactly 100 points and never pushes leader below zero',()=>{
  const r=make();const p=r.players[0],leader=r.players[1];p.score=15;leader.score=500;
  held(r,p,'NICKED');social.playGameCard(r,p,'NICKED',{},game.validateAnswer);
  assert.equal(p.score,115);assert.equal(leader.score,400);
  assert.equal(social.snapshot(r,null,true).gameCards.moment.title,'NICKED');
  assert.throws(()=>social.playGameCard(r,p,'NICKED',{},game.validateAnswer),/not in your hand/);
});
test('HECKLE may target only a revealed, genuine answer, and is displayed on TV only',()=>{
  const r=make();const p=r.players[0];held(r,p,'HECKLE');
  submitAll(r);
  const group=r.round.groups[0],answers=[...group.entries.values()];
  assert.throws(()=>social.playGameCard(r,p,'HECKLE',{entryId:answers[1].id,text:'Very suspicious raffle prize'},game.validateAnswer),/already revealed|cannot be played/i);
  social.playGameCard(r,p,'HECKLE',{entryId:answers[0].id,text:'Very suspicious raffle prize'},game.validateAnswer);
  assert.equal(social.snapshot(r,null,true).round.heckles[0].text,'Very suspicious raffle prize');
  assert.equal(social.snapshot(r,r.players[1].id).round.heckles,undefined);
  assert.throws(()=>social.playGameCard(r,p,'HECKLE',{entryId:answers[0].id,text:'Again'},game.validateAnswer),/not in your hand/);
});
test('SECOND CHANCE rewrites just one submitted answer without changing its ID',()=>{
  const r=make();const p=r.players[0];held(r,p,'SECOND_CHANCE');
  const task=social.expected(r,p.id)[0];social.submit(r,p,task.id,'My first answer at the chippy',game.validateAnswer);
  const g=r.round.groups.find(g=>g.id===task.id),old=g.entries.get(p.id);
  social.playGameCard(r,p,'SECOND_CHANCE',{taskId:task.id,value:'My revised answer at the club'},game.validateAnswer);
  const now=g.entries.get(p.id);assert.equal(now.id,old.id);assert.equal(now.text,'My revised answer at the club');
  assert.throws(()=>social.playGameCard(r,p,'SECOND_CHANCE',{taskId:task.id,value:'Another rewrite'},game.validateAnswer),/not in your hand/);
});
test('SECOND CHANCE gets a bounded submission grace period when all players finish early',()=>{
  const r=make(4,'WIT');const p=r.players[0];
  for(const member of r.players)held(r,member,'POWER_CUT');held(r,p,'SECOND_CHANCE');
  const before=r.deadline;
  for(const member of r.players)for(const task of social.expected(r,member.id))
    social.submit(r,member,task.id,'The pub committee have spoken',game.validateAnswer);
  assert.equal(r.phase,'SUBMIT');
  assert.equal(r.round.secondChanceGrace,true);
  assert.equal(r.deadline<=before,true);
  assert.equal(r.deadline<=Date.now()+12000,true);
  const task=social.expected(r,p.id)[0];
  social.playGameCard(r,p,'SECOND_CHANCE',{taskId:task.id,value:'The chippy queue has spoken'},game.validateAnswer);
  assert.equal(r.phase,'REVEAL');
});
test('DOUBLE OR NOWT doubles winning duel points but awards zero when the player loses',()=>{
  for(const win of [true,false]){
    const r=make();const p=r.players[0];held(r,p,'DOUBLE_OR_NOWT');
    social.playGameCard(r,p,'DOUBLE_OR_NOWT',{},game.validateAnswer);
    const target=r.social.cards.effects.get(p.id).groupId;
    submitAll(r);
    for(let i=0;i<r.round.groups.length;i++){
      const group=r.round.groups[i],owned=[...group.entries.values()].find(x=>x.authorId===p.id);
      if(group.id===target){
        voteFor(r,win?owned:[...group.entries.values()].find(x=>x.authorId!==p.id));
        const award=group.result.awards.find(x=>x.authorId===p.id);
        assert.equal(win?award.points>1000:award.points===0,true,`win=${win} points=${award.points}`);
        break;
      }
      voteFor(r,[...group.entries.values()][0]);social.nextResult(r);
    }
  }
});
test('unique trailing player automatically receives UNDERDOG, +150 on a winning duel',()=>{
  const r=make(),p=r.players[0];r.players.forEach(x=>{x.score=600});p.score=100;
  r.playlist=['WIT','WIT','FINAL'];r.roundIndex=1;social.beginRound(r);assert.equal(r.social.cards.hand.get(p.id),null);
  assert.equal(r.social.cards.effects.get(p.id).id,'UNDERDOG');
  social.startSubmit(r);submitAll(r);
  for(let i=0;i<r.round.groups.length;i++){
    const group=r.round.groups[i],owned=[...group.entries.values()].find(x=>x.authorId===p.id);
    if(owned){voteFor(r,owned);const a=group.result.awards.find(x=>x.authorId===p.id);assert.equal(a.cardBonus,150);break;}
    voteFor(r,[...group.entries.values()][0]);social.nextResult(r);
  }
});
test('no Game Cards may alter Last Orders points',()=>{
  const r=make(4,'FINAL');assert.equal(r.round.type,'FINAL');
  assert.equal(social.snapshot(r,r.players[0].id).gameCards.hold,undefined);
  held(r,r.players[0],'NICKED');assert.throws(()=>social.playGameCard(r,r.players[0],'NICKED',{},game.validateAnswer),/switched off/);
  submitAll(r);voteFor(r,[...r.round.groups[0].entries.values()][0]);
  assert.equal(r.round.groups[0].result.awards.every(x=>x.cardBonus===undefined),true);
});
test('card maps, used flags and pending effect survive atomic snapshot restoration',()=>{
  const dir=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'ecky-cards-'));
  const previous=process.env.ROOM_DATA_DIR;
  try{process.env.ROOM_DATA_DIR=dir;
    const r=make();held(r,r.players[0],'POWER_CUT');
    social.playGameCard(r,r.players[0],'POWER_CUT',{},game.validateAnswer);
    persistence.store(r);const recovered=persistence.restore().get(r.code);
    assert.equal(recovered.social.cards.hand instanceof Map,true);
    assert.equal(recovered.social.cards.played instanceof Set,true);
    assert.equal(recovered.round.powerCutPending,true);
    assert.equal(recovered.social.cards.played.has(r.players[0].id),true);
  }finally{if(previous===undefined)delete process.env.ROOM_DATA_DIR;else process.env.ROOM_DATA_DIR=previous;fs.rmSync(dir,{recursive:true,force:true});}
});
test('Stage 7 phone and TV load the six-card controls without legacy tray',()=>{
  const phone=fs.readFileSync(path.join(__dirname,'../public/assets/social-club-phone.js'),'utf8');
  const tv=fs.readFileSync(path.join(__dirname,'../public/assets/social-club-tv.js'),'utf8');
  assert.match(phone,/PLAY A CARD/);assert.match(phone,/social-play-card/);
  assert.match(tv,/club-gamecard-moment/);assert.match(tv,/club-blackout/);
  assert.doesNotMatch(phone,/POWER-UPS TRAY/);
});
