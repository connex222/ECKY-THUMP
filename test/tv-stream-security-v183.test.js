'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {server,rooms,connections}=require('../server/index');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check){
  for(let i=0;i<60;i++){if(check())return;await sleep(25);}
  assert.fail('Timed out waiting for SSE transport cleanup.');
}
test('read-only TV tokens remain independent and participant SSE disconnects are tracked',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const controllers=[];let roomCode=null;
  async function request(url,method='GET',body,secret){
    const res=await fetch(base+url,{method,headers:{
      ...(secret?{Authorization:'Bearer '+secret}:{}),
      ...(body?{'Content-Type':'application/json'}:{})
    },body:body?JSON.stringify(body):undefined});
    return {status:res.status,data:await res.json()};
  }
  try{
    const host=await request('/api/rooms','POST',{name:'Host',rating:'clean'});
    assert.equal(host.status,201);roomCode=host.data.code;
    const tvTokens=[];
    for(let i=0;i<3;i++){
      const minted=await request('/api/rooms/'+roomCode+'/display-token','POST',{},host.data.secret);
      assert.equal(minted.status,200);tvTokens.push(minted.data.secret);
    }
    const denied=await request('/api/rooms/'+roomCode+'/action','POST',{type:'set-lobby-rating',rating:'adult'},tvTokens[0]);
    assert.equal(denied.status,400);assert.match(denied.data.error,/read-only/i);
    const view=await request('/api/rooms/'+roomCode+'/snapshot','GET',undefined,host.data.secret);
    assert.equal(view.data.config.rating,'clean');
    const connect=async token=>{
      const ctrl=new AbortController();controllers.push(ctrl);
      const res=await fetch(base+'/api/rooms/'+roomCode+'/events',{signal:ctrl.signal,headers:{Authorization:'Bearer '+token}});
      assert.equal(res.status,200);
    };
    for(const token of tvTokens)await connect(token);
    assert.equal([...connections.get(roomCode)].filter(ch=>ch.tv).length,3);
    await connect(tvTokens[0]);
    assert.equal([...connections.get(roomCode)].filter(ch=>ch.tv).length,3);
    const joined=await request('/api/rooms/'+roomCode+'/join','POST',{name:'Friend'});
    await connect(joined.data.secret);
    const player=rooms.get(roomCode).players.find(p=>p.id===joined.data.seatId);
    assert.equal(player.online,true);
    controllers.at(-1).abort();
    await until(()=>player.online===false);
    assert.equal([...connections.get(roomCode)].filter(ch=>ch.tv).length,3);
  }finally{
    for(const ctrl of controllers)ctrl.abort();
    await new Promise(resolve=>server.close(resolve));
    if(roomCode){connections.delete(roomCode);rooms.delete(roomCode);}
  }
});
