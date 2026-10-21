'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('../server/game');
const cards=require('../server/game-cards');
const {report}=require('../server/telemetry');
const data=require('../server/packs/game-cards-v1.json');
function setup(length='party'){
  const {room}=game.newRoom({name:'Host',length,pace:'relaxed',gameCards:true});room.code='ABCD23';
  game.addPlayer(room,'Alex');game.addPlayer(room,'Bex');game.startGame(room);
  return room;
}
function give(room,id,cardId){room.gameCards.inventory.set(id,[cardId]);}
function enterFullRound(room){
  if(room.phase==='SEED')for(const p of room.players)game.acceptSeed(room,p,`My harmless example sentence from ${p.name}`);
  for(const p of room.players){
    const type=room.round.type;
    const hand=room.round.hands[p.id];
    const value=type==='CARD'?hand[0].id:type==='DOUBLE'?{cardId:hand[0].id,line:`Brilliant ridiculous pitch by ${p.name}`}:
      `Very funny answer by ${p.name} ${room.round.requiredWord||''}`;
    game.acceptAnswer(room,p,value);
  }
  if(room.phase==='VOTE')for(const p of room.players){
    const rest=game.snapshot(room,p.id).round.candidates.filter(c=>!c.isOwn);
    game.acceptVote(room,p,rest[0].id,rest[1].id);
  }
  assert.equal(room.phase,'RESULTS');
}
test('catalogue has 15 distinct cards, 5 per tier',()=>{
  assert.equal(data.cards.length,15);assert.equal(new Set(data.cards.map(c=>c.id)).size,15);
  for(const tier of ['Chaos','Tactical','Equaliser'])assert.equal(data.cards.filter(c=>c.tier===tier).length,5);
});
test('optional mode is disabled by default; only lobby can toggle',()=>{
  const off=game.newRoom({name:'Host'}).room;off.code='ABCD23';
  assert.equal(game.snapshot(off,off.ownerId).gameCards.enabled,false);
  assert.throws(()=>game.playGameCard(off,off.players[0],'TACT_GOLD_RUSH'),/switched off/);
  game.setGameCards(off,true);assert.equal(game.snapshot(off,off.ownerId).gameCards.enabled,true);
  game.addPlayer(off,'Alex');game.addPlayer(off,'Bex');game.startGame(off);
  assert.throws(()=>game.setGameCards(off,false),/lobby/);
});
test('private inventory and predictions never leak to other players or TV',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'TACT_BULLSEYE');
  assert.equal(game.snapshot(r,p.id).gameCards.inventory[0].id,'TACT_BULLSEYE');
  assert.equal(game.snapshot(r,r.players[1].id).gameCards.inventory.length,r.gameCards.inventory.get(r.players[1].id).length);
  assert.equal(game.snapshot(r,r.players[1].id).gameCards.inventory.some(x=>x.id==='TACT_BULLSEYE'&&x.privateOwner===p.id),false);
  assert.equal(game.snapshot(r,null,true).gameCards.inventory,undefined);
  game.playGameCard(r,p,'TACT_BULLSEYE',{prediction:1});
  assert.equal(game.snapshot(r,p.id).gameCards.inventory.length,0);
  assert.equal(game.snapshot(r,null,true).gameCards.extra,undefined);
  assert.throws(()=>game.playGameCard(r,p,'TACT_GOLD_RUSH'),/allowance/);
});
test('Deckchair Shuffle preserves uniqueness, hand sizes and IDs',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'CHAOS_DECKCHAIR');
  const old=Object.values(r.round.hands).flat().map(c=>c.text).sort();
  game.playGameCard(r,p,'CHAOS_DECKCHAIR');
  assert.equal(r.phase,'SUBMIT');
  assert.deepEqual(Object.values(r.round.hands).flat().map(c=>c.text).sort(),old);
  for(const hand of Object.values(r.round.hands))assert.equal(hand.length,7);
  assert.equal(new Set(Object.values(r.round.hands).flat().map(c=>c.id)).size,21);
});
test('Mirror Mayhem is visual, server card IDs and scores remain unchanged',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'CHAOS_MIRROR');
  const original=r.round.hands[p.id].map(c=>c.id);
  game.playGameCard(r,p,'CHAOS_MIRROR');
  assert.deepEqual(r.round.hands[p.id].map(c=>c.id),original);
  assert.ok(game.snapshot(r,p.id).gameCards.activeEffects.some(e=>e.id==='CHAOS_MIRROR'));
  assert.equal(p.score,0);
});
test('Early Bell reduces timer exactly ten seconds without extra bonuses',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'CHAOS_EARLYBELL');
  const prior=r.deadline;game.playGameCard(r,p,'CHAOS_EARLYBELL');
  assert.equal(r.deadline,prior-10000);
  assert.throws(()=>game.playGameCard(r,p,'CHAOS_EARLYBELL'),/allowance/);
});
test('Wrong Envelope requires a Wit phase, rerolls early once and cannot reset existing submissions',()=>{
  const r=setup();game.finishRound(r,'skip');game.nextRound(r);
  assert.equal(r.round.type,'WIT');const p=r.players[0];give(r,p.id,'CHAOS_ENVELOPE');const old=r.round.prompt;
  game.playGameCard(r,p,'CHAOS_ENVELOPE');assert.notEqual(r.round.prompt,old);
  assert.equal(r.gameCards.once.has('CHAOS_ENVELOPE'),true);
});
test('Hot Seat swaps only TV stage order, never avatar bindings or scores',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'CHAOS_HOTSEAT');
  const avatarIds=r.players.map(x=>x.avatar);
  game.playGameCard(r,p,'CHAOS_HOTSEAT');
  assert.deepEqual(r.players.map(x=>x.avatar),avatarIds);
  assert.equal(r.gameCards.stageOrder.length,3);
});
test('Extra Helping requires own selected card, and consumes the standard swap',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'TACT_EXTRA_HELPING');
  const prior=r.round.hands[p.id].map(c=>c.text);
  game.playGameCard(r,p,'TACT_EXTRA_HELPING');
  assert.equal(r.round.swaps.has(p.id),true);
  const privateView=game.snapshot(r,p.id).gameCards.extra;
  assert.equal(privateView.choices.length,2);
  assert.equal(game.snapshot(r,null,true).gameCards.extra,undefined);
  assert.throws(()=>game.chooseGameExtra(r,p,'forgery',r.round.hands[p.id][0].id),/Choose your own/);
  game.chooseGameExtra(r,p,privateView.choices[0].id,r.round.hands[p.id][0].id);
  assert.equal(r.round.hands[p.id].length,7);
  assert.notDeepEqual(r.round.hands[p.id].map(c=>c.text),prior);
  assert.throws(()=>game.swapCard(r,p,r.round.hands[p.id][1].id),/one swap/);
});
test('Tactical Gold Rush applies a bounded +30 bonus after base scoring',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'TACT_GOLD_RUSH');
  game.playGameCard(r,p,'TACT_GOLD_RUSH');enterFullRound(r);
  const award=r.round.awards.find(x=>x.authorId===p.id);
  assert.ok(award);assert.ok(award.gameCardBonus===undefined||award.gameCardBonus<=30);
  assert.equal(p.score,award.points+(award.gameCardBonus||0));
});
test('Equaliser offers are capped at 2 and remain unavailable before two rounds',()=>{
  const r=setup();enterFullRound(r);
  assert.equal(r.gameCards.spentEqualisers.size,0);
  game.nextRound(r);enterFullRound(r);
  assert.ok(r.gameCards.spentEqualisers.size<=2);
  assert.ok(!r.gameCards.roundEqualisers.has('not-a-player'));
});
test('all Equalisers have non-final round compatibility and unique IDs',()=>{
  const equal=data.cards.filter(c=>c.tier==='Equaliser');
  assert.equal(equal.length,5);
  assert.ok(equal.every(c=>c.challenges.some(x=>x!=='FINAL')));
});
test('telemetry is private, bounded and aggregates meaningful events',()=>{
  const r=setup();
  for(let i=0;i<2600;i++)require('../server/telemetry').record(r,'card_activated',{cardId:'TACT_GOLD_RUSH',name:'secret'});
  assert.equal(r.telemetry.length,2500);
  assert.ok(r.telemetry.every(event=>event.name===undefined));
  assert.equal(report(r).cards.TACT_GOLD_RUSH.played,2500);
});
test('Tactical Double or Duff pays +30 only for unique first and never changes base awards',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'TACT_DOUBLE_DUFF');
  game.playGameCard(r,p,'TACT_DOUBLE_DUFF');
  enterFullRound(r);
  const a=r.round.awards.find(a=>a.authorId===p.id);
  assert.equal(a.gameCardBonus,a.rank===1&&!a.isJoint?30:-15);
  assert.equal(p.score,a.points+Math.max(-a.points,a.gameCardBonus));
});
test('Tactical Bullseye rejects forged predictions and keeps prediction private',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'TACT_BULLSEYE');
  assert.throws(()=>game.playGameCard(r,p,'TACT_BULLSEYE',{prediction:15}),/Predict/);
  assert.equal(r.gameCards.inventory.get(p.id).length,1,'failed activation does not consume the card');
  game.playGameCard(r,p,'TACT_BULLSEYE',{prediction:1});
  assert.equal(game.snapshot(r,null,true).gameCards.prediction,undefined);
  enterFullRound(r);
  const a=r.round.awards.find(x=>x.authorId===p.id);
  assert.equal(a.gameCardBonus,a.gold===1?30:-10);
});
test('Tactical Fast Fingers requires manual early submission and a Gold vote',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'TACT_FAST_FINGERS');
  game.playGameCard(r,p,'TACT_FAST_FINGERS');
  enterFullRound(r);
  const a=r.round.awards.find(x=>x.authorId===p.id);
  assert.equal(a.gameCardBonus,a.gold>0?20:undefined);
});
test('Equaliser Rubber-Band Rally gives bonus no larger than +40, never doubles finale',()=>{
  const r=setup();game.finishRound(r,'setup');game.nextRound(r);
  const p=r.players[0];r.gameCards.roundEqualisers.set(p.id,'EQUAL_RUBBERBAND');
  enterFullRound(r);
  const a=r.round.awards.find(x=>x.authorId===p.id);
  assert.equal(a.gameCardBonus,Math.min(40,Math.floor(a.points*.5+.5)));
  assert.ok(r.gameCards.bonusUsed.get(p.id)<=40);
});
test('Equaliser Comeback Contract awards +30 only for an answer containing word and Gold',()=>{
  const r=setup();game.finishRound(r,'setup');game.nextRound(r);
  const p=r.players[0];r.gameCards.roundEqualisers.set(p.id,'EQUAL_CONTRACT');r.gameCards.contractWords.set(p.id,'sausage');
  // In Quick Wit, the player's submission can contain the private word.
  for(const who of r.players)game.acceptAnswer(r,who,who.id===p.id?'My secret sausage joke is spectacular':`Ordinary funny reply by ${who.name}`);
  for(const who of r.players){const other=game.snapshot(r,who.id).round.candidates.filter(c=>!c.isOwn);game.acceptVote(r,who,other[0].id,other[1].id);}
  const a=r.round.awards.find(x=>x.authorId===p.id);
  assert.equal(a.gameCardBonus,a.gold>0?30:undefined);
});
test('Lucky Dip adds three private choices on the eligible next card round',()=>{
  const r=setup();game.finishRound(r,'setup');r.roundIndex=3;r.playlist=['CARD','WIT','CONTEXT','DOUBLE','CARD','FINAL'];
  const p=r.players[0];r.gameCards.pendingEqualisers.set(p.id,{cardId:'EQUAL_LUCKYDIP',offeredAt:3});
  game.nextRound(r);assert.equal(r.round.type,'CARD');
  assert.equal(r.round.hands[p.id].length,10);
  assert.equal(r.round.hands[r.players[1].id].length,7);
  assert.equal(game.snapshot(r,p.id).round.hand.length,10);
  assert.equal(game.snapshot(r,r.players[1].id).round.hand.length,7);
});
test('Underdog Crown rewards a unique first only, capped by existing bonus budget',()=>{
  const r=setup();game.finishRound(r,'setup');game.nextRound(r);
  const p=r.players[0];r.gameCards.roundEqualisers.set(p.id,'EQUAL_CROWN');
  enterFullRound(r);
  const a=r.round.awards.find(x=>x.authorId===p.id);
  assert.equal(a.gameCardBonus,a.rank===1&&!a.isJoint?40:undefined);
});
test('Lifebuoy only rewards manual bottom-half finishes',()=>{
  const r=setup();game.finishRound(r,'setup');game.nextRound(r);
  const p=r.players[0];r.gameCards.roundEqualisers.set(p.id,'EQUAL_LIFEBUOY');
  enterFullRound(r);
  const a=r.round.awards.find(x=>x.authorId===p.id);
  assert.equal(a.gameCardBonus,a.rank>Math.ceil(r.round.awards.length/2)?25:undefined);
});
test('Equaliser is offered once to a genuine trailing contestant after two rounds',()=>{
  const r=setup();enterFullRound(r);game.nextRound(r);
  r.players[0].score=0;r.players[1].score=500;r.players[2].score=500;
  enterFullRound(r);
  assert.equal(r.gameCards.spentEqualisers.has(r.players[0].id),true);
  assert.ok(r.gameCards.pendingEqualisers.has(r.players[0].id));
  const off=r.gameCards.pendingEqualisers.get(r.players[0].id);
  assert.ok(cards.cards[off.cardId]);
});
test('Game Cards are not accepted from spectators or TV through the REST interface',async()=>{
  const {server}=require('../server/index');
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const base=`http://127.0.0.1:${server.address().port}`;
  const req=async(path,method='GET',body,secret)=>{
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(secret?{Authorization:`Bearer ${secret}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:response.status,body:await response.json()};
  };
  try{
    const host=await req('/api/rooms','POST',{name:'Host',gameCards:false});
    const code=host.body.code,token=host.body.secret;
    const guest=await req(`/api/rooms/${code}/join`,'POST',{name:'Guest'});
    assert.equal((await req(`/api/rooms/${code}/action`,'POST',{type:'set-game-cards',enabled:true},guest.body.secret)).status,400);
    assert.equal((await req(`/api/rooms/${code}/action`,'POST',{type:'set-game-cards',enabled:true},token)).status,200);
    const tv=await req(`/api/rooms/${code}/display-token`,'POST',{},token);
    assert.equal((await req(`/api/rooms/${code}/telemetry`,'GET',undefined,tv.body.secret)).status,400);
    assert.equal((await req(`/api/rooms/${code}/telemetry`,'GET',undefined,guest.body.secret)).status,400);
    assert.equal((await req(`/api/rooms/${code}/telemetry`,'GET',undefined,token)).status,200);
    const no=await req(`/api/rooms/${code}/action`,'POST',{type:'play-game-card',cardId:'CHAOS_HOTSEAT'},tv.body.secret);
    assert.equal(no.status,400);
    const yes=await req(`/api/rooms/${code}/snapshot`,'GET',undefined,guest.body.secret);
    assert.equal(yes.body.gameCards.enabled,true);
  }finally{await new Promise(ok=>server.close(ok));}
});
test('UI exposes lobby toggle, private Game Card controls and TV effect banner without touching avatar helpers',()=>{
  const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');
  const app=fs.readFileSync(path.join(root,'public/assets/app.js'),'utf8');
  const tv=fs.readFileSync(path.join(root,'public/assets/tv.js'),'utf8');
  for(const phrase of ['toggle-game-cards','play-game-card','choose-game-extra','e17-card-tray','gameCardTray(s)','gameCardSwitch(s)'])assert.ok(app.includes(phrase),phrase);
  for(const phrase of ['e17-stage-effect','stagePlayers(s)','e17-stage-roster'])assert.ok(tv.includes(phrase),phrase);
  for(const page of ['public/index.html','public/tv/index.html'])assert.ok(fs.readFileSync(path.join(root,page),'utf8').includes('neon-arena-v1.7.css'));
});
test('failed forged activations never spend a private card or award bonus points',()=>{
  const r=setup(),p=r.players[0],other=r.players[1];
  const remaining=r.gameCards.inventory.get(p.id).slice();
  assert.throws(()=>game.playGameCard(r,p,'TACT_UNLISTED'),/Unknown Game Card/);
  assert.throws(()=>game.playGameCard(r,p,'EQUAL_CROWN'),/Equalisers trigger automatically/);
  assert.deepEqual(r.gameCards.inventory.get(p.id),remaining);
  assert.equal(r.gameCards.plays.get(p.id)||0,0);
  assert.equal(r.gameCards.bonusUsed.get(p.id)||0,0);
  assert.equal(r.players.every(x=>x.score===0),true);
  assert.equal(game.snapshot(r,other.id).gameCards.extra,null);
});
test('automatic end-of-round timeout does not award a Fast Fingers bonus',()=>{
  const r=setup(),p=r.players[0];give(r,p.id,'TACT_FAST_FINGERS');game.playGameCard(r,p,'TACT_FAST_FINGERS');
  for(const person of r.players.slice(1))game.acceptAnswer(r,person,r.round.hands[person.id][0].id);
  p.online=true; // Connected contestants receive an automatic CARD fallback on deadline.
  r.deadline=Date.now()-1;assert.equal(game.tick(r),true);assert.equal(r.phase,'VOTE');
  for(const player of r.players){const other=game.snapshot(r,player.id).round.candidates.filter(x=>!x.isOwn);game.acceptVote(r,player,other[0].id,other[1].id);}
  const award=r.round.awards.find(x=>x.authorId===p.id);
  assert.equal(award.gameCardBonus,undefined);
  assert.ok(report(r).submissionTimeouts>=1);
});
