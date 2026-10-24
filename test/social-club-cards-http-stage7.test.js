'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
// Each node:test file has its own process, so this preview flag cannot affect classic test suites.
process.env.SOCIAL_CLUB_PREVIEW='1';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-stage7-http-'));
process.env.ROOM_DATA_DIR=dir;
const {server}=require('../server/index');
async function api(port,path,body,secret){
  const res=await fetch(`http://127.0.0.1:${port}${path}`,{
    method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(secret?{Authorization:`Bearer ${secret}`}:{})},
    body:body?JSON.stringify(body):undefined});
  return {status:res.status,data:await res.json()};
}
test('live HTTP Social Club can opt into six cards only as host, and plays one server-authenticated card',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  try{
    const created=await api(port,'/api/rooms',{name:'Game Host',socialClub:true,gameCards:false});
    assert.equal(created.status,201);const code=created.data.code;
    const url=`/api/rooms/${code}`;
    const other=await api(port,url+'/join',{name:'Mate One'});
    await api(port,url+'/join',{name:'Mate Two'});
    assert.equal((await api(port,url+'/action',{type:'social-set-cards',enabled:true},other.data.secret)).status,400);
    assert.equal((await api(port,url+'/action',{type:'social-set-cards',enabled:true},created.data.secret)).status,200);
    let snap=await api(port,url+'/snapshot',null,created.data.secret);
    assert.equal(snap.data.gameCards.enabled,true);
    assert.equal(snap.data.gameCards.hold,undefined); // no round hand in the lobby
    assert.equal((await api(port,url+'/action',{type:'start'},created.data.secret)).status,200);
    snap=await api(port,url+'/snapshot',null,created.data.secret);
    assert.equal(snap.data.gameCards.enabled,true);
    assert.ok(snap.data.gameCards.hold);
    assert.equal(snap.data.gameCards.available.length,6);
    assert.equal((await api(port,url+'/action',{type:'social-set-cards',enabled:false},created.data.secret)).status,400);
    assert.equal((await api(port,url+'/action',{type:'social-play-card',cardId:'NICKED'},other.data.secret)).status,400);
    const after=await api(port,url+'/snapshot',null,created.data.secret);
    assert.equal(after.data.gameCards.enabled,true);
  }finally{
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
