'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=require('../server/game');
const telemetry=require('../server/telemetry');
const {server}=require('../server/index');
const projectRoot=path.join(__dirname,'..');

function roomWithCards(){
  const {room}=game.newRoom({name:'Host',length:'party',pace:'lively',gameCards:true});
  room.code='TST234';game.addPlayer(room,'Friend One');game.addPlayer(room,'Friend Two');game.startGame(room);
  return room;
}

test('a new live controller displays a compact Game Card tray while answering',()=>{
  const text=fs.readFileSync(path.join(projectRoot,'public/assets/app.js'),'utf8');
  assert.match(text,/\$\{roundGuide\(s\)\}\$\{gameCardDrawer\(s\)\}/);
  assert.match(text,/function gameCardDrawer\(s\)/);
  assert.match(text,/id="e171-powers"/);
  assert.match(text,/S\.powerDrawerOpen=oldPowers\.open/);
  assert.match(text,/reroll-game-card/);
  const css=fs.readFileSync(path.join(projectRoot,'public/assets/neon-arena-v1.7.css'),'utf8');
  assert.match(css,/\.e171-powers>summary/);
});

test('reroll exchanges one private Game Card without awarding points or altering response cards',()=>{
  const room=roomWithCards(),p=room.players[0];
  room.gameCards.inventory.set(p.id,['TACT_GOLD_RUSH','CHAOS_ENVELOPE']);
  const before=room.round.hands[p.id].map(c=>c.text);
  const initial=room.gameCards.inventory.get(p.id).slice();
  game.rerollGameCard(room,p,'CHAOS_ENVELOPE');
  const now=room.gameCards.inventory.get(p.id);
  assert.equal(now.length,2);
  assert.equal(now.includes('CHAOS_ENVELOPE'),false);
  assert.equal(now.includes('TACT_GOLD_RUSH'),true);
  assert.notDeepEqual(initial,now);
  assert.equal(p.score,0);
  assert.deepEqual(room.round.hands[p.id].map(c=>c.text),before);
  assert.equal(game.snapshot(room,p.id).gameCards.rerolledThisRound,true);
  assert.equal(game.snapshot(room,room.players[1].id).gameCards.rerolledThisRound,false);
  assert.equal(telemetry.report(room).cards.CHAOS_ENVELOPE.discarded,1);
});

test('cannot reroll two times, forge another player card, or reroll when submitted',()=>{
  const room=roomWithCards(),p=room.players[0],q=room.players[1];
  room.gameCards.inventory.set(p.id,['CHAOS_ENVELOPE','TACT_GOLD_RUSH']);
  room.gameCards.inventory.set(q.id,['TACT_BULLSEYE']);
  assert.throws(()=>game.rerollGameCard(room,p,'TACT_BULLSEYE'),/not in your hand/);
  assert.deepEqual(room.gameCards.inventory.get(p.id),['CHAOS_ENVELOPE','TACT_GOLD_RUSH']);
  game.rerollGameCard(room,p,'CHAOS_ENVELOPE');
  assert.throws(()=>game.rerollGameCard(room,p,'TACT_GOLD_RUSH'),/already rerolled/);
  game.acceptAnswer(room,p,room.round.hands[p.id][0].id);
  assert.throws(()=>game.rerollGameCard(room,p,'TACT_GOLD_RUSH'),/already rerolled/);
  assert.equal(room.gameCards.plays.get(p.id)||0,0,'reroll does not count as a played card');
});

test('rerolls are disabled after a card is played, on finale, and when powers are switched off',()=>{
  const room=roomWithCards(),p=room.players[0];
  room.gameCards.inventory.set(p.id,['TACT_GOLD_RUSH','TACT_BULLSEYE']);
  game.playGameCard(room,p,'TACT_GOLD_RUSH');
  assert.throws(()=>game.rerollGameCard(room,p,'TACT_BULLSEYE'),/No power-up plays remain/);
  room.round.type='FINAL';
  assert.throws(()=>game.rerollGameCard(room,p,'TACT_BULLSEYE'),/unavailable/);
  const other=game.newRoom({name:'Host',gameCards:false}).room;other.code='TST235';
  assert.throws(()=>game.rerollGameCard(other,other.players[0],'TACT_GOLD_RUSH'),/unavailable/);
});

test('reroll allowance resets for new rounds, but not within the same round',()=>{
  const room=roomWithCards(),p=room.players[0];
  room.gameCards.inventory.set(p.id,['CHAOS_ENVELOPE','TACT_GOLD_RUSH']);
  game.rerollGameCard(room,p,'CHAOS_ENVELOPE');
  game.finishRound(room,'test skip');game.nextRound(room);
  assert.equal(room.gameCards.discardedRound.has(p.id),false);
  assert.equal(game.snapshot(room,p.id).gameCards.rerolledThisRound,false);
});

test('host telemetry aggregates round pacing by real challenge, without player details',()=>{
  const room=roomWithCards();
  telemetry.record(room,'round_finished',{durationMs:12500,challenge:'CARD',name:'Never store names'});
  telemetry.record(room,'round_finished',{durationMs:17500,challenge:'CARD',token:'Never store tokens'});
  telemetry.record(room,'round_finished',{durationMs:25000,challenge:'WIT'});
  telemetry.record(room,'round_finished',{durationMs:100,challenge:'UNTRUSTED'});
  const result=telemetry.report(room);
  assert.equal(result.byChallenge.CARD.count,2);
  assert.equal(result.byChallenge.CARD.avgMs,15000);
  assert.equal(result.byChallenge.WIT.avgMs,25000);
  assert.equal(result.byChallenge.UNTRUSTED,undefined);
  assert.equal(result.events.some(e=>e.name||e.token),false);
});

test('REST reroll is authenticated and not available to spectators or TV screens',async()=>{
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const base=`http://127.0.0.1:${server.address().port}`;
  const send=async(path,method='GET',data,token)=>{
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:data===undefined?undefined:JSON.stringify(data)});
    return {status:response.status,data:await response.json()};
  };
  try{
    const host=await send('/api/rooms','POST',{name:'Host',gameCards:true});const code=host.data.code;
    await send(`/api/rooms/${code}/join`,'POST',{name:'Guest 1'});
    await send(`/api/rooms/${code}/join`,'POST',{name:'Guest 2'});
    await send(`/api/rooms/${code}/action`,'POST',{type:'start'},host.data.secret);
    const tv=await send(`/api/rooms/${code}/display-token`,'POST',{},host.data.secret);
    const url=`/api/rooms/${code}/action`,body={type:'reroll-game-card',cardId:'TACT_GOLD_RUSH'};
    assert.equal((await send(url,'POST',body,tv.data.secret)).status,400);
    const audience=await send(`/api/rooms/${code}/join`,'POST',{name:'Spectator'});
    assert.equal(audience.data.role,'audience');
    assert.equal((await send(url,'POST',body,audience.data.secret)).status,400);
    assert.equal((await send(url,'POST',body,'wrong')).status,401);
  }finally{await new Promise(ok=>server.close(ok));}
});

test('a match-limited disruption is blocked in snapshots and replacement draws once consumed',()=>{
  const room=roomWithCards(),p=room.players[0];
  room.gameCards.inventory.set(p.id,['CHAOS_EARLYBELL']);
  game.playGameCard(room,p,'CHAOS_EARLYBELL');
  assert.ok(game.snapshot(room,p.id).gameCards.spentOnce.includes('CHAOS_EARLYBELL'));
  game.finishRound(room,'test skip');game.nextRound(room);
  room.gameCards.inventory.set(p.id,['CHAOS_EARLYBELL']);
  game.rerollGameCard(room,p,'CHAOS_EARLYBELL');
  assert.equal(room.gameCards.inventory.get(p.id).includes('CHAOS_EARLYBELL'),false);
});

test('starting another match clears feedback eligibility and power-up inventory',()=>{
  const room=roomWithCards(),p=room.players[0];
  p.lastFeedback=new Set(['1']);
  room.playlist=['CARD'];
  game.finishRound(room,'test skip');game.nextRound(room);
  assert.equal(room.phase,'COMPLETE');
  game.playAgain(room);
  assert.equal(p.lastFeedback.size,0);
  assert.equal(room.gameCards.playedRound.size,0);
  assert.equal(room.phase,'LOBBY');
});
