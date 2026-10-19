'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {server}=require('../server/index');
test('private TV links and repeat-match host permission work over HTTP',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  async function req(path,method='GET',body,secret){
    const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(secret?{Authorization:'Bearer '+secret}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:res.status,data:await res.json()};
  }
  try{
    const created=await req('/api/rooms','POST',{name:'Host',length:'party',pace:'relaxed'});
    assert.equal(created.status,201);
    const room=created.data.code;
    const friend=(await req(`/api/rooms/${room}/join`,'POST',{name:'Second'})).data;
    (await req(`/api/rooms/${room}/join`,'POST',{name:'Third'})).data;
    const displays=[];
    for(let i=0;i<3;i++){
      const token=(await req(`/api/rooms/${room}/display-token`,'POST',{},created.data.secret)).data.secret;
      displays.push(token);
    }
    for(const token of displays){
      const s=await req(`/api/rooms/${room}/snapshot`,'GET',undefined,token);
      assert.equal(s.status,200);
      assert.equal(s.data.tv,true);
    }
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'play-again'},friend.secret)).status,400);
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'play-again'},created.data.secret)).status,400);
    const hostSnap=await req(`/api/rooms/${room}/snapshot`,'GET',undefined,created.data.secret);
    assert.equal(hostSnap.data.config.pace,'relaxed');
    assert.equal(hostSnap.data.config.length,'party');
    assert.equal((await req('/api/health')).data.version,'0.8.0');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('host-only removal makes a departed friend token unusable',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  async function req(path,method='GET',body,secret){
    const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(secret?{Authorization:'Bearer '+secret}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:res.status,data:await res.json()};
  }
  try{
    const host=(await req('/api/rooms','POST',{name:'Host'})).data;
    const room=host.code;
    const friend=(await req(`/api/rooms/${room}/join`,'POST',{name:'Friend'})).data;
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'remove-player',playerId:friend.seatId},friend.secret)).status,400);
    assert.equal((await req(`/api/rooms/${room}/action`,'POST',{type:'remove-player',playerId:friend.seatId},host.secret)).status,200);
    assert.equal((await req(`/api/rooms/${room}/snapshot`,'GET',undefined,friend.secret)).status,401);
    const view=(await req(`/api/rooms/${room}/snapshot`,'GET',undefined,host.secret)).data;
    assert.equal(view.players.length,1);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
