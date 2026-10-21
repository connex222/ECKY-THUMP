'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=require('../server/game');
const powers=require('../server/game-cards');
const telemetry=require('../server/telemetry');
const project=path.resolve(__dirname,'..');
function setup(gameCards=true){
  const {room}=game.newRoom({name:'Host',gameCards,length:'party',pace:'lively'});
  room.code='TEST24';game.addPlayer(room,'Alex');game.addPlayer(room,'Beth');game.startGame(room);
  return room;
}
function submitted(r){
  for(const p of r.players)game.acceptAnswer(r,p,r.round.hands[p.id][0].id);
  assert.equal(r.phase,'VOTE');
  return r;
}
test('server rejects answers after deadline before the background tick changes phase',()=>{
  const r=setup(), p=r.players[0],valid=r.round.hands[p.id][0].id;
  r.deadline=Date.now()-1;
  assert.throws(()=>game.acceptAnswer(r,p,valid),/timed out/);
  assert.equal(r.round.entries.length,0);
  assert.equal(r.phase,'SUBMIT');
});
test('response-card swaps also reject after the phase deadline',()=>{
  const r=setup(),p=r.players[0],card=r.round.hands[p.id][0].id;
  r.deadline=Date.now()-1;
  assert.throws(()=>game.swapCard(r,p,card),/timed out/);
  assert.equal(r.round.swaps.size,0);
});
test('late voting cannot influence results even before the timer tick',()=>{
  const r=submitted(setup()),p=r.players[0];
  const candidates=game.snapshot(r,p.id).round.candidates.filter(x=>!x.isOwn);
  r.deadline=Date.now()-1;
  assert.throws(()=>game.acceptVote(r,p,candidates[0].id,candidates[1].id),/timed out/);
  assert.equal(r.round.ballots.size,0);
});
test('identical ballot retries are idempotent; switching votes is prohibited',()=>{
  const r=submitted(setup()),p=r.players[0];
  const candidates=game.snapshot(r,p.id).round.candidates.filter(x=>!x.isOwn);
  game.acceptVote(r,p,candidates[0].id,candidates[1].id);
  const revision=r.revision,events=r.telemetry.filter(e=>e.type==='vote_cast').length;
  game.acceptVote(r,p,candidates[0].id,candidates[1].id);
  assert.equal(r.revision,revision);
  assert.equal(r.telemetry.filter(e=>e.type==='vote_cast').length,events);
  assert.throws(()=>game.acceptVote(r,p,candidates[1].id,candidates[0].id),/already locked/);
  assert.deepEqual(r.round.ballots.get(p.id),{voterId:p.id,gold:candidates[0].id,silver:candidates[1].id});
});
test('late context starter lines are rejected before phase rollover',()=>{
  const r=setup();
  game.finishRound(r,'Skipped');game.nextRound(r);
  game.finishRound(r,'Skipped');game.nextRound(r);
  assert.equal(r.round.type,'CONTEXT');assert.equal(r.phase,'SEED');
  r.deadline=Date.now()-1;
  assert.throws(()=>game.acceptSeed(r,r.players[0],'A safe starter line'),/timed out/);
  assert.equal(r.round.seeds.size,0);
});
test('paused Game Card visual effects and extra options remain visible until resume',()=>{
  const r=setup(),p=r.players[0], now=Date.now();
  r.paused=true;r.round.pausedAt=now-15000;
  r.gameCards.effects.push({id:'CHAOS_MIRROR',until:now-2000});
  r.gameCards.pendingExtra.set(p.id,{until:now-2000,choices:[{id:'abc',text:'safe response'}]});
  const snap=game.snapshot(r,p.id);
  assert.equal(snap.gameCards.activeEffects.length,1);
  assert.equal(snap.gameCards.extra.choices.length,1);
  r.paused=false;r.round.pausedAt=null;
  assert.equal(game.snapshot(r,p.id).gameCards.activeEffects.length,0);
});
test('Lifebuoy only awards the bottom half in odd-sized rounds',()=>{
  const r=setup(),p=r.players[0];r.round.awards=r.players.map((v,i)=>({authorId:v.id,rank:i+1,points:100,gold:0,silver:0,isJoint:false}));
  r.round.entries=r.players.map(v=>({authorId:v.id,auto:false,hidden:false}));
  r.gameCards.roundEqualisers.set(p.id,'EQUAL_LIFEBUOY');
  p.score=100;r.round.awards[0].rank=2;
  powers.onResults(r);assert.equal(p.score,100,'second of three is not in the bottom half');
  r.gameCards.bonusUsed.clear();r.round.awards[0].rank=3;
  powers.onResults(r);assert.equal(p.score,125,'third of three gets +25');
});
test('Game Card scoring never awards additional points in a skipped round',()=>{
  const r=setup(),p=r.players[0];r.gameCards.roundTactics.set(p.id,{id:'TACT_DOUBLE_DUFF'});
  r.round.skipReason='Skipped';r.round.awards=[{authorId:p.id,rank:1,isJoint:false,points:100,gold:2}];
  powers.onResults(r);assert.equal(p.score,0);
});
test('public and private Game Card snapshots do not expose another contestant’s inventory',()=>{
  const r=setup();
  const a=game.snapshot(r,r.players[0].id).gameCards;
  const b=game.snapshot(r,r.players[1].id).gameCards;
  assert.ok(Array.isArray(a.inventory)&&Array.isArray(b.inventory));
  assert.equal('inventory' in game.snapshot(r,null,true).gameCards,false);
  assert.equal('contractWord' in game.snapshot(r,null,true).gameCards,false);
});
test('Game Cards remain entirely off for non-opt-in rooms',()=>{
  const r=setup(false);assert.deepEqual(game.snapshot(r,r.players[0].id).gameCards,{enabled:false});
  assert.throws(()=>game.playGameCard(r,r.players[0],'TACT_GOLD_RUSH'),/switched off/);
});
test('1200 expansion entries have unique IDs and no exact duplicate jokes inside each tier',()=>{
  const entries=JSON.parse(fs.readFileSync(path.join(project,'server/packs/after-dark-v09.json'),'utf8')).entries;
  assert.equal(entries.length,1200);
  const ids=new Set(),texts=new Set();
  for(const e of entries){
    assert.equal(typeof e.text,'string');assert.ok(e.text.trim().length>1);
    assert.equal(ids.has(e.id),false,`duplicate id ${e.id}`);ids.add(e.id);
    const key=`${e.rating}:${e.kind}:${e.text.toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu,' ').trim()}`;
    assert.equal(texts.has(key),false,`duplicate content ${e.id}`);texts.add(key);
  }
});
test('accessible v1.8.2 polish stylesheet is loaded on mobile and TV without modifying avatars',()=>{
  const css=fs.readFileSync(path.join(project,'public/assets/game-night-v1.8.2.css'),'utf8');
  assert.match(css,/:focus-visible/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/prefers-contrast/);
  for(const file of ['public/index.html','public/tv/index.html']){
    const html=fs.readFileSync(path.join(project,file),'utf8');
    assert.match(html,/game-night-v1\.8\.2\.css\?v=1\.8\.2/);
    assert.match(html,/avatars\.js\?v=1\.1\.0/);
  }
});
test('UI disables Gold and Silver voting choices after ballot lock-in',()=>{
  const app=fs.readFileSync(path.join(project,'public/assets/app.js'),'utf8');
  assert.match(app,/BALLOT LOCKED/);
  assert.match(app,/data-action="gold"[^`]+\$\{s\.round\.voted/);
  assert.match(app,/data-action="silver"[^`]+\$\{s\.round\.voted/);
  assert.doesNotMatch(app,/UPDATE MY BALLOT/);
});
test('live health and polish assets are served correctly from HTTP',async()=>{
  const {server}=require('../server/index');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const status=await (await fetch(base+'/api/health')).json();
    assert.equal(status.version,'1.8.2');
    const css=await fetch(base+'/assets/game-night-v1.8.2.css');
    assert.equal(css.status,200);assert.match(await css.text(),/:focus-visible/);
    const missing=await fetch(base+'/assets/missing.css');assert.equal(missing.status,404);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
