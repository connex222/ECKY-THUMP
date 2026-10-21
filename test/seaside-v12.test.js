'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const crypto=require('node:crypto');
const game=require('../server/game');
const {server}=require('../server/index');
const baseDir=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(baseDir,rel),'utf8');
function lobby(){const {room,id,secret}=game.newRoom({name:'Host',rating:'clean',length:'quick',pace:'lively'});room.code='HHTT22';const a=game.addPlayer(room,'Alice'),b=game.addPlayer(room,'Bob');return {room,id,secret,a,b};}
test('all 42 avatar library files, metadata and bindings are byte-for-byte unchanged from uploaded v1.1',()=>{
 const baseline=require('./avatar-baseline-v11.json');
 assert.equal(Object.keys(baseline).length,42);
 for(const [filename,hash] of Object.entries(baseline)){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(baseDir,filename))).digest('hex'),hash,filename);
 }
});
test('the v1.5 visual reset is modular, keeps avatar scripts and preserves accessibility behaviour',()=>{
 for(const page of ['public/index.html','public/tv/index.html']){
  const html=read(page);assert.match(html,/e15-modern/);assert.match(html,/modern-v1\.5\.css\?v=1\.5\.0/);assert.match(html,/avatars\.js\?v=1\.1\.0/);
 }
 assert.match(read('public/assets/modern-v1.5.css'),/prefers-reduced-motion:reduce/);
 assert.match(read('public/assets/app.js'),/navigator\.vibrate/);
 assert.match(read('public/assets/app.js'),/draftKey/);
 assert.match(read('public/assets/tv.js'),/data-tv-rating/);
});
test('overflow audience can join past 12 players; audience has no avatar, private hand, score or voting power',()=>{
 const {room}=lobby();
 for(let i=3;i<12;i++)game.addPlayer(room,'P'+i);
 assert.equal(room.players.length,12);
 const spectator=game.addAudience(room,'Balcony Bob');
 assert.equal(spectator.role,'audience');
 assert.equal(room.audience.length,1);
 assert.equal(game.findAudience(room,spectator.secret)?.id,spectator.id);
 game.startGame(room);
 const s=game.snapshot(room,spectator.id);
 assert.equal(s.you.role,'audience');assert.equal(s.round.hand?.length||0,0);assert.equal(s.you.avatar,undefined);
 assert.equal(s.players.length,12);assert.equal(s.audienceCount,1);
 assert.throws(()=>game.acceptAnswer(room,room.audience[0],room.round.hands[room.players[0].id][0].id));
 assert.equal(room.phase,'SUBMIT');
});
test('audience admission also works during matches, subject to a 30-spectator limit',()=>{
 const {room}=lobby();game.startGame(room);
 const audience=game.addAudience(room,'Latecomer');
 assert.equal(game.snapshot(room,audience.id).you.role,'audience');
 for(let i=1;i<30;i++)game.addAudience(room,'Viewer '+i);
 assert.throws(()=>game.addAudience(room,'Over capacity'),/full/);
});
test('After Dark switch requires individual age consent, remains lobby-only and resets content deck',()=>{
 const {room}=lobby();
 assert.throws(()=>game.setLobbyRating(room,'adult'),/Everyone must tap/);
 room.players.forEach(p=>game.consentAfterDark(room,p));
 const spectator=game.addAudience(room,'Spectator');
 assert.throws(()=>game.setLobbyRating(room,'adult'),/Everyone must tap/);
 game.consentAfterDark(room,room.audience[0]);
 room.responseDeck=['any'];room.promptHistory.add('a');
 game.setLobbyRating(room,'adult');
 assert.equal(room.config.rating,'adult');assert.equal(room.responseDeck,null);assert.equal(room.promptHistory.size,0);
 game.startGame(room);
 assert.throws(()=>game.setLobbyRating(room,'clean'),/cannot change/);
});
test('heckles are cosmetic, targeted, capped and limited to active phases',()=>{
 const {room}=lobby();const viewer=game.addAudience(room,'Comedian');
 const p=room.audience[0];
 assert.throws(()=>game.audienceChaos(room,p,'pudding'),/Wait/);
 game.startGame(room);const before=room.deadline, scores=room.players.map(p=>p.score);
 assert.throws(()=>game.audienceChaos(room,p,'fireworks'),/Unknown/);
 assert.throws(()=>game.audienceChaos(room,p,'pudding','not-a-player'),/contestant/);
 game.audienceChaos(room,p,'pudding',room.players[1].id);
 assert.equal(room.chaosEvents[0].kind,'pudding');assert.equal(room.chaosEvents[0].targetId,room.players[1].id);
 assert.throws(()=>game.audienceChaos(room,p,'shake'),/eight seconds/);
 assert.equal(room.deadline,before);assert.deepEqual(room.players.map(p=>p.score),scores);
 assert.equal(game.snapshot(room,viewer.id).chaos.events.length,1);
});
test('audience chooses harmless atmosphere modifiers; ballot data never changes score',()=>{
 const {room}=lobby();const {id}=game.addAudience(room,'Heckler');game.startGame(room);
 const person=room.audience[0];
 game.audienceVote(room,person,'pier-panic');
 assert.equal(game.snapshot(room,id).chaos.leader,'pier-panic');
 assert.equal(game.snapshot(room,id).chaos.tally['pier-panic'],1);
 assert.throws(()=>game.audienceVote(room,person,'pudding-rain'),/moment/);
 assert.equal(room.round.ballots.size,0);
 assert.throws(()=>game.audienceVote(room,person,'illegal'),/Unknown/);
});
test('lively results automatically transition after 4.5 seconds; relaxed results wait for host',()=>{
 const {room}=lobby();game.startGame(room);
 game.finishRound(room,'Test skip');
 const ms=room.deadline-Date.now();
 assert.ok(ms>3000&&ms<=4500,`unexpected ${ms}ms`);
 room.deadline=Date.now()-1;
 assert.equal(game.tick(room),true);assert.equal(room.roundIndex,1);
 const other=lobby().room;other.config.pace='relaxed';game.startGame(other);game.finishRound(other,'Test skip');
 assert.equal(other.deadline,null);
});
test('HTTP: spectators get independent tokens, cannot play or host, and rejoin at same room state',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const request=async(path,method='GET',body,token)=>{
  const res=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',...(token?{'Authorization':`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:res.status,body:await res.json()};
 };
 try{
  const host=(await request('/api/rooms','POST',{name:'Host'})).body;
  const room=host.code;
  const p1=(await request(`/api/rooms/${room}/join`,'POST',{name:'Alice'})).body;
  await request(`/api/rooms/${room}/join`,'POST',{name:'Bob'});
  for(let i=3;i<12;i++)await request(`/api/rooms/${room}/join`,'POST',{name:'Guest '+i});
  const audience=await request(`/api/rooms/${room}/join`,'POST',{name:'Extra person'});
  assert.equal(audience.status,201);assert.equal(audience.body.role,'audience');
  let snap=await request(`/api/rooms/${room}/snapshot`,'GET',undefined,audience.body.secret);
  assert.equal(snap.body.you.role,'audience');assert.equal(snap.body.audienceCount,1);
  const forbidden=await request(`/api/rooms/${room}/action`,'POST',{type:'start'},audience.body.secret);
  assert.equal(forbidden.status,400);
  const forbidOther=await request(`/api/rooms/${room}/action`,'POST',{type:'set-lobby-rating',rating:'adult'},p1.secret);
  assert.equal(forbidOther.status,400);
  const started=await request(`/api/rooms/${room}/action`,'POST',{type:'start'},host.secret);
  assert.equal(started.status,200);
  snap=await request(`/api/rooms/${room}/snapshot`,'GET',undefined,audience.body.secret);
  assert.equal(snap.body.round.hand?.length||0,0);
  assert.equal(snap.body.round.prompt.length>0,true);
  const now=await request(`/api/rooms/${room}/action`,'POST',{type:'chaos',kind:'wrench',targetId:p1.seatId},audience.body.secret);
  assert.equal(now.status,200);
  const resumed=await request(`/api/rooms/${room}/snapshot`,'GET',undefined,p1.secret);
  assert.equal(resumed.body.you.id,p1.seatId);
  assert.equal(resumed.body.chaos.events.at(-1).kind,'wrench');
 }finally{await new Promise(r=>server.close(r));}
});
test('HTTP: TV can change only a consented lobby rating, not player actions',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const request=async(path,method='GET',body,token)=>{const res=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json()};};
 try{
  const host=(await request('/api/rooms','POST',{name:'Host',adultConfirmed:true})).body;
  const room=host.code;
  const tv=(await request(`/api/rooms/${room}/display-token`,'POST',{},host.secret)).body;
  assert.equal((await request(`/api/rooms/${room}/action`,'POST',{type:'set-lobby-rating',rating:'adult'},tv.secret)).status,200);
  assert.equal((await request(`/api/rooms/${room}/snapshot`,'GET',undefined,host.secret)).body.config.rating,'adult');
  assert.equal((await request(`/api/rooms/${room}/action`,'POST',{type:'start'},tv.secret)).status,400);
  assert.equal((await request(`/api/rooms/${room}/action`,'POST',{type:'chaos',kind:'pudding'},tv.secret)).status,400);
 }finally{await new Promise(r=>server.close(r));}
});
