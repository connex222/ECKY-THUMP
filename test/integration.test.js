'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {server}=require('../server/index');

test('a complete, authenticated 3-player 2-round game via REST (including TV and safety)',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  async function req(path,method='GET',body,secret){
    const result=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(secret?{Authorization:'Bearer '+secret}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:result.status,data:await result.json()};
  }
  try{
    const created=await req('/api/rooms','POST',{name:'Host',rating:'clean',length:'quick'});
    assert.equal(created.status,201);
    const room=created.data.code;
    const first=created.data;
    const second=(await req(`/api/rooms/${room}/join`,'POST',{name:'Eva'})).data;
    const third=(await req(`/api/rooms/${room}/join`,'POST',{name:'Mo'})).data;
    const people=[first,second,third];
    assert.equal((await req(`/api/rooms/${room}/snapshot`)).status,401);
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'start'},second.secret)).status,400);
    const stage=(await req(`/api/rooms/${room}/display-token`,'POST',{},first.secret)).data;
    assert.ok(stage.secret);
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'start'},stage.secret)).status,400);
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'start'},first.secret)).status,200);
    for(const player of people){
      const snapshot=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,player.secret)).data;
      assert.equal(snapshot.phase,'SUBMIT');
      assert.equal(snapshot.round.hand.length,7);
      const choice=snapshot.round.hand[0].id;
      assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'submit',value:choice},player.secret)).status,200);
    }
    let stageView=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,stage.secret)).data;
    assert.equal(stageView.phase,'VOTE');
    assert.equal(stageView.round.candidates.length,3);
    assert.ok(stageView.round.candidates.every(c=>!('authorName' in c)));
    for(const player of people){
      const snapshot=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,player.secret)).data;
      const other=snapshot.round.candidates.filter(c=>!c.isOwn);
      assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'vote',gold:other[0].id,silver:other[1].id},player.secret)).status,200);
    }
    let snap=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,first.secret)).data;
    assert.equal(snap.phase,'RESULTS');
    assert.ok([185,186].includes(snap.players.reduce((acc,p)=>acc+p.score,0)));
    const firstRoundTotal=snap.players.reduce((acc,p)=>acc+p.score,0);
    assert.equal(snap.round.entries.length,3);
    assert.ok(snap.round.entries.every(e=>e.authorName));
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'next'},first.secret)).status,200);
    snap=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,first.secret)).data;
    assert.equal(snap.round.type,'WIT');
    const texts=['My robot is your new manager.','Our hotel has been repossessed.','Free soup. Absolutely no questions.'];
    for(let i=0;i<3;i++)assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'submit',value:texts[i]},people[i].secret)).status,200);
    let s=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,first.secret)).data;
    assert.equal(s.phase,'VOTE');
    for(const player of people){
      s=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,player.secret)).data;
      const other=s.round.candidates.filter(c=>!c.isOwn);
      assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'vote',gold:other[0].id,silver:other[1].id},player.secret)).status,200);
    }
    s=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,first.secret)).data;
    assert.equal(s.phase,'RESULTS');
    assert.ok([185,186].includes(s.players.reduce((acc,p)=>acc+p.score,0)-firstRoundTotal));
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'next'},first.secret)).status,200);
    s=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,first.secret)).data;
    assert.equal(s.phase,'COMPLETE');assert.ok(s.champions.length>=1);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
