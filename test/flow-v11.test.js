'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=require('../server/game');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
function match(){
 const {room,id,secret}=game.newRoom({name:'Host',length:'quick',pace:'relaxed'});
 room.code='GGHH22';
 const a=game.addPlayer(room,'Alice'),b=game.addPlayer(room,'Bob');
 return {room,ids:[id,a.id,b.id],secrets:[secret,a.secret,b.secret]};
}
function completeCurrent(room,ids){
 if(room.phase==='SEED')for(const id of ids)game.acceptSeed(room,room.players.find(p=>p.id===id),`I went to the shops with ${id}.`);
 for(const id of ids){
   const p=room.players.find(p=>p.id===id),type=room.round.type;
   const value=type==='CARD'?game.snapshot(room,id).round.hand[0].id:
     type==='DOUBLE'?{cardId:game.snapshot(room,id).round.hand[0].id,line:`A terrible advert for ${p.name}`}:
     `What a disastrous performance from ${p.name} ${room.round.requiredWord||''}`;
   game.acceptAnswer(room,p,value);
 }
 assert.equal(room.phase,'VOTE');
 for(const id of ids){
   const p=room.players.find(p=>p.id===id),other=game.snapshot(room,id).round.candidates.filter(c=>!c.isOwn);
   game.acceptVote(room,p,other[0].id,other[1].id);
 }
 assert.equal(room.phase,'RESULTS');
}
test('results ready-ups are private to the current reveal, shared with TV and idempotent',()=>{
 const {room,ids}=match();
 game.startGame(room);
 assert.throws(()=>game.markReady(room,room.players[0]),/results/);
 completeCurrent(room,ids);
 const host=room.players[0],guest=room.players[1];
 assert.equal(game.snapshot(room,guest.id).round.readyCount,0);
 game.markReady(room,guest);
 const revision=room.revision;
 game.markReady(room,guest);
 assert.equal(room.revision,revision);
 assert.equal(game.snapshot(room,guest.id).round.youReady,true);
 assert.equal(game.snapshot(room,host.id).round.youReady,false);
 const stage=game.snapshot(room,null,true);
 assert.equal(stage.round.readyCount,1);
 assert.equal(stage.round.youReady,false);
 assert.equal(stage.round.nextChallenge,'QUICK WIT');
 game.nextRound(room);
 assert.equal(game.snapshot(room,guest.id).round.readyCount,0);
 assert.throws(()=>game.markReady(room,guest),/results/);
});
test('full match publishes end-of-night highlights only after the championship',()=>{
 const {room,ids}=match();game.startGame(room);
 completeCurrent(room,ids);
 assert.equal(game.snapshot(room,ids[0]).nightRecap,undefined);
 game.nextRound(room);completeCurrent(room,ids);
 game.nextRound(room);
 const snap=game.snapshot(room,ids[0]);
 assert.equal(snap.phase,'COMPLETE');
 assert.equal(snap.nightRecap.roundsPlayed,2);
 assert.equal(snap.nightRecap.answersSubmitted,6);
 assert.equal(snap.nightRecap.totalBallots,6);
 assert.ok(snap.nightRecap.topMoments.length>=2);
 const tv=game.snapshot(room,null,true);
 assert.deepEqual(tv.nightRecap,snap.nightRecap);
 game.playAgain(room);
 assert.equal(game.snapshot(room,ids[0]).nightRecap,undefined);
});
test('player and TV UI include stage instructions, progress, and readable finish sequence',()=>{
 const html=read('public/index.html'),tvHtml=read('public/tv/index.html');
 for(const page of [html,tvHtml])assert.match(page,/modern-v1\.5\.css\?v=1\.6\.0/);
 assert.match(read('public/assets/modern-v1.5.css'),/flow-v1\.1\.css\?v=1\.1\.0/);
 const app=read('public/assets/app.js'),tv=read('public/assets/tv.js');
 for(const token of ['function roundGuide','function readyPanel','ready-next','nightRecap','ballot-tracker','clockOffset'])assert.ok(app.includes(token),token);
 for(const token of ['readyCount','nextChallenge','tv-recap','clockOffset'])assert.ok(tv.includes(token),token);
 assert.match(read('public/assets/flow-v1.1.css'),/prefers-reduced-motion:reduce/);
});
test('server accepts ready-next only for authenticated participants during results',async()=>{
 const {server}=require('../server/index');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
   const base=`http://127.0.0.1:${server.address().port}`;
   const post=async(path,data,secret)=>{
     const res=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(secret?{Authorization:`Bearer ${secret}`}:{})},body:JSON.stringify(data)});
     return {status:res.status,data:await res.json()};
   };
   const created=await post('/api/rooms',{name:'Host',length:'quick'});
   const code=created.data.code;
   assert.equal((await post(`/api/rooms/${code}/action`,{type:'ready-next'},created.data.secret)).status,400);
   assert.equal((await post(`/api/rooms/${code}/action`,{type:'ready-next'})).status,401);
 } finally {await new Promise(resolve=>server.close(resolve));}
});
test('three friends can vote, signal ready and continue the same room over HTTP',async()=>{
 const {server}=require('../server/index');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 async function req(path,secret,method='GET',body){
  const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(secret?{Authorization:`Bearer ${secret}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:res.status,data:await res.json()};
 }
 try {
  const host=(await req('/api/rooms',null,'POST',{name:'Host',length:'quick'})).data;
  const a=(await req(`/api/rooms/${host.code}/join`,null,'POST',{name:'Alice'})).data;
  const b=(await req(`/api/rooms/${host.code}/join`,null,'POST',{name:'Bob'})).data;
  const tokens=[host.secret,a.secret,b.secret],url=`/api/rooms/${host.code}`;
  assert.equal((await req(url+'/action',host.secret,'POST',{type:'start'})).status,200);
  for(const token of tokens){
    const state=(await req(url+'/snapshot',token)).data;
    assert.equal((await req(url+'/action',token,'POST',{type:'submit',value:state.round.hand[0].id})).status,200);
  }
  for(const token of tokens){
    const state=(await req(url+'/snapshot',token)).data;
    assert.equal(state.phase,'VOTE');
    const others=state.round.candidates.filter(c=>!c.isOwn);
    assert.equal((await req(url+'/action',token,'POST',{type:'vote',gold:others[0].id,silver:others[1].id})).status,200);
  }
  for(const token of tokens)assert.equal((await req(url+'/action',token,'POST',{type:'ready-next'})).status,200);
  const result=(await req(url+'/snapshot',host.secret)).data;
  assert.equal(result.round.readyCount,3);
  assert.equal(result.round.nextChallenge,'QUICK WIT');
  assert.equal((await req(url+'/action',a.secret,'POST',{type:'next'})).status,400);
  assert.equal((await req(url+'/action',host.secret,'POST',{type:'next'})).status,200);
  const next=(await req(url+'/snapshot',a.secret)).data;
  assert.equal(next.round.label,'QUICK WIT');
  assert.equal(next.round.readyCount,0);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
