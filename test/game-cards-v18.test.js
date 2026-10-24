'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=require('../server/game');
const powers=require('../server/game-cards');
const root=path.resolve(__dirname,'..');
function setup(){
  const {room}=game.newRoom({name:'Host',length:'party',pace:'lively',gameCards:true});
  room.code='ABCD23';game.addPlayer(room,'Alex');game.addPlayer(room,'Bex');game.startGame(room);
  return room;
}
const give=(room,p,id)=>room.gameCards.inventory.set(p.id,[id]);
function playFirstRound(room){
  for(const p of room.players)game.acceptAnswer(room,p,room.round.hands[p.id][0].id);
  for(const p of room.players){
    const eligible=game.snapshot(room,p.id).round.candidates.filter(c=>!c.isOwn);
    game.acceptVote(room,p,eligible[0].id,eligible[1].id);
  }
  assert.equal(room.phase,'RESULTS');
}
test('quick-play snapshot exposes only the owner’s availability, reason and expiration',()=>{
  const r=setup(),p=r.players[0],other=r.players[1];give(r,p,'TACT_FAST_FINGERS');
  const own=game.snapshot(r,p.id).gameCards;
  const ownCard=own.inventory[0];
  assert.equal(ownCard.playable,true);
  assert.equal(typeof ownCard.expiresAt,'number');
  assert.ok(ownCard.expiresAt<=r.gameCards.stageStartedAt+10000);
  assert.deepEqual(game.snapshot(r,other.id).gameCards.inventory.map(c=>c.id),r.gameCards.inventory.get(other.id));
  assert.equal(game.snapshot(r,null,true).gameCards.inventory,undefined);
});
test('expired activation windows are blocked, no card or match play is consumed',()=>{
  const r=setup(),p=r.players[0];give(r,p,'TACT_FAST_FINGERS');
  r.gameCards.stageStartedAt=Date.now()-11000;
  const card=game.snapshot(r,p.id).gameCards.inventory[0];
  assert.equal(card.playable,false);assert.match(card.reason,/window closed/);
  assert.throws(()=>game.playGameCard(r,p,card.id),/window closed/);
  assert.deepEqual(r.gameCards.inventory.get(p.id),[card.id]);
  assert.equal(r.gameCards.plays.get(p.id)||0,0);
});
test('playing a tactical card after the phase deadline cannot sneak through before tick',()=>{
  const r=setup(),p=r.players[0];give(r,p,'TACT_GOLD_RUSH');
  r.deadline=Date.now()-100;
  assert.equal(game.snapshot(r,p.id).gameCards.inventory[0].playable,false);
  assert.throws(()=>game.playGameCard(r,p,'TACT_GOLD_RUSH'),/expired/);
  assert.deepEqual(r.gameCards.inventory.get(p.id),['TACT_GOLD_RUSH']);
});
test('reroll and Extra Helping selection cannot extend beyond the shared deadline',()=>{
  const r=setup(),p=r.players[0];give(r,p,'TACT_EXTRA_HELPING');
  game.playGameCard(r,p,'TACT_EXTRA_HELPING');
  const pending=game.snapshot(r,p.id).gameCards.extra;
  assert.ok(pending.choices.length===2);
  r.deadline=Date.now()-100;
  assert.throws(()=>game.chooseGameExtra(r,p,pending.choices[0].id,r.round.hands[p.id][0].id),/expired/);
  const r2=setup(),p2=r2.players[0];give(r2,p2,'TACT_GOLD_RUSH');
  r2.deadline=Date.now()-100;
  assert.throws(()=>game.rerollGameCard(r2,p2,'TACT_GOLD_RUSH'),/unavailable/);
});
test('host pause preserves early-activation and pending choice windows',()=>{
  const r=setup(),p=r.players[0];give(r,p,'TACT_FAST_FINGERS');
  const prior=r.gameCards.stageStartedAt;
  const gap=20_000;
  game.resumeCardTimers(r,gap);
  assert.equal(r.gameCards.stageStartedAt,prior+gap);
  assert.equal(game.snapshot(r,p.id).gameCards.inventory[0].playable,true);
  give(r,p,'TACT_EXTRA_HELPING');game.playGameCard(r,p,'TACT_EXTRA_HELPING');
  const previousExtra=r.gameCards.pendingExtra.get(p.id).until;
  game.resumeCardTimers(r,gap);
  assert.equal(r.gameCards.pendingExtra.get(p.id).until,previousExtra+gap);
});
test('Fast Fingers awards only when manually submitted promptly after activation',()=>{
  for(const late of [false,true]){
    const r=setup(),p=r.players[0];give(r,p,'TACT_FAST_FINGERS');
    game.playGameCard(r,p,'TACT_FAST_FINGERS');
    if(late)r.gameCards.roundTactics.get(p.id).activatedAt-=13000;
    for(const player of r.players)game.acceptAnswer(r,player,r.round.hands[player.id][0].id);
    const target=r.round.entries.find(e=>e.authorId===p.id).id;
    for(const voter of r.players){
      const possible=game.snapshot(r,voter.id).round.candidates.filter(e=>!e.isOwn);
      const gold=possible.find(e=>e.id===target)||possible[0];
      const silver=possible.find(e=>e.id!==gold.id);
      game.acceptVote(r,voter,gold.id,silver.id);
    }
    const award=r.round.awards.find(a=>a.authorId===p.id);
    assert.ok(award.gold>=1);
    assert.equal(award.gameCardBonus,late?undefined:20);
  }
});
test('quick actions appear before the collapsible drawer and retain predictive bet controls',()=>{
  const app=fs.readFileSync(path.join(root,'public/assets/app.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'public/assets/game-cards-v1.8.css'),'utf8');
  assert.match(app,/e18-quickbar/);
  assert.match(app,/e18-countdown/);
  assert.match(app,/open-power-drawer/);
  assert.match(app,/data-power-expires/);
  assert.match(app,/S\.selected=null;toastShow\('Your hand changed/);
  assert.match(css,/\.e18-quickcards/);
  for(const htmlFile of ['public/index.html','public/tv/index.html']){
    const html=fs.readFileSync(path.join(root,htmlFile),'utf8');
    assert.match(html,/social-club-v2\.css\?v=2\.0\.0/);
    assert.match(html,/avatars\.js\?v=1\.1\.0/);
  }
});
test('vanilla non-Game-Cards rooms keep unchanged snapshots and scoring',()=>{
  const {room}=game.newRoom({name:'Host',gameCards:false});room.code='EFGH23';game.addPlayer(room,'Alex');game.addPlayer(room,'Bex');
  game.startGame(room);
  assert.deepEqual(game.snapshot(room,room.players[0].id).gameCards,{enabled:false});
  for(const p of room.players)game.acceptAnswer(room,p,room.round.hands[p.id][0].id);
  for(const p of room.players){const rest=game.snapshot(room,p.id).round.candidates.filter(e=>!e.isOwn);game.acceptVote(room,p,rest[0].id,rest[1].id);}
  assert.equal(room.round.awards.every(a=>!a.gameCardBonus),true);
});

test('private telemetry shows offers, conversion and frustration without player identifiers',()=>{
  const telem=require('../server/telemetry');
  const r=setup();r.telemetry=[]; // isolate synthetic measurements from initial random card draws
  telem.record(r,'card_offered',{cardId:'TACT_GOLD_RUSH',name:'Private nickname'});
  telem.record(r,'card_offered',{cardId:'TACT_GOLD_RUSH'});
  telem.record(r,'card_activated',{cardId:'TACT_GOLD_RUSH'});
  telem.record(r,'feedback_fun',{cardId:'TACT_GOLD_RUSH'});
  telem.record(r,'feedback_frustrating',{cardId:'TACT_GOLD_RUSH'});
  telem.record(r,'client_error',{cardId:'CHAOS_MIRROR',errorType:'render',code:'Never keep client contents'});
  const res=telem.report(r);
  assert.equal(res.cards.TACT_GOLD_RUSH.offered,2);
  assert.equal(res.cards.TACT_GOLD_RUSH.played,1);
  assert.equal(res.cards.TACT_GOLD_RUSH.activationRate,50);
  assert.equal(res.cards.TACT_GOLD_RUSH.frustrationRate,50);
  assert.equal(res.cards.CHAOS_MIRROR.offered,0);
  assert.equal(res.cards.CHAOS_MIRROR.activationRate,null);
  assert.equal(res.events.some(ev=>'name' in ev||'code' in ev),false);
});
test('TV effect banners disappear without another server snapshot and honour server clock',()=>{
  const tv=fs.readFileSync(path.join(root,'public/assets/tv.js'),'utf8');
  assert.match(tv,/data-effect-expires/);
  assert.match(tv,/\(Date\.now\(\)\+clockOffset\)/);
  assert.match(tv,/banner\.remove\(\)/);
});
test('actual HTTP server delivers updated CSS and JavaScript to mobile and TV',async()=>{
  const {server}=require('../server/index');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const rel of ['/assets/game-cards-v1.8.css','/assets/app.js','/assets/tv.js']){
      const response=await fetch(base+rel);
      assert.equal(response.status,200,rel);
      assert.ok((await response.text()).length>100,rel);
    }
    const home=await (await fetch(base)).text();
    const tv=await (await fetch(base+'/tv/')).text();
    assert.match(home,/social-club-v2\.css\?v=2\.0\.0/);
    assert.match(tv,/social-club-v2\.css\?v=2\.0\.0/);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('Fast Fingers shows a private, server-timed bonus deadline',()=>{
  const r=setup(),p=r.players[0];give(r,p,'TACT_FAST_FINGERS');
  game.playGameCard(r,p,'TACT_FAST_FINGERS');
  const bonus=game.snapshot(r,p.id).gameCards.speedBonusUntil;
  assert.ok(bonus>Date.now()&&bonus<=Date.now()+12000);
  assert.equal(game.snapshot(r,r.players[1].id).gameCards.speedBonusUntil,null);
  assert.equal(game.snapshot(r,null,true).gameCards.speedBonusUntil,undefined);
  game.resumeCardTimers(r,10000);
  assert.equal(game.snapshot(r,p.id).gameCards.speedBonusUntil,bonus+10000);
  game.acceptAnswer(r,p,r.round.hands[p.id][0].id);
  assert.equal(game.snapshot(r,p.id).gameCards.speedBonusUntil,null);
  const app=fs.readFileSync(path.join(root,'public/assets/app.js'),'utf8');
  assert.match(app,/id="e18-speed-timer"/);
});
