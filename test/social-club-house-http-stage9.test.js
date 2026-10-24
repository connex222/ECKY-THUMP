'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
process.env.SOCIAL_CLUB_PREVIEW='1';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-house-http-'));
process.env.ROOM_DATA_DIR=dir;
const {server,rooms}=require('../server/index');
const game=require('../server/game');
async function api(port,url,body,token){
 const response=await fetch(`http://127.0.0.1:${port}${url}`,{method:body?'POST':'GET',
 headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
 return {status:response.status,data:await response.json()};
}
test('live HTTP: only host enables House Cards; contestants write; private snapshots; host moderates',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 try{
  const created=await api(port,'/api/rooms',{name:'Host',socialClub:true});assert.equal(created.status,201);
  const base='/api/rooms/'+created.data.code;
  const friend=await api(port,base+'/join',{name:'Sally'});
  const other=await api(port,base+'/join',{name:'Dave'});
  assert.equal((await api(port,base+'/action',{type:'social-set-house-cards',enabled:true},friend.data.secret)).status,400);
  assert.equal((await api(port,base+'/action',{type:'social-add-house-card',text:'The bingo ball incident'},friend.data.secret)).status,400);
  assert.equal((await api(port,base+'/action',{type:'social-set-house-cards',enabled:true},created.data.secret)).status,200);
  assert.equal((await api(port,base+'/action',{type:'social-add-house-card',text:'The bingo ball incident'},friend.data.secret)).status,200);
  const mine=(await api(port,base+'/snapshot',null,friend.data.secret)).data;
  assert.equal(mine.houseCards.yours.length,1);
  const outsider=(await api(port,base+'/snapshot',null,other.data.secret)).data;
  assert.equal(JSON.stringify(outsider).includes('bingo ball incident'),false);
  const host=(await api(port,base+'/snapshot',null,created.data.secret)).data;
  assert.equal(host.houseCards.moderation.length,1);
  assert.equal((await api(port,base+'/action',{type:'social-remove-house-card',cardId:mine.houseCards.yours[0].id},other.data.secret)).status,400);
  assert.equal((await api(port,base+'/action',{type:'social-remove-house-card',cardId:mine.houseCards.yours[0].id},created.data.secret)).status,200);
  assert.equal((await api(port,base+'/action',{type:'social-add-house-card',text:'Nan’s raffle ticket'},friend.data.secret)).status,200);
  assert.equal((await api(port,base+'/action',{type:'start'},created.data.secret)).status,200);
  game.social.startSubmit(rooms.get(created.data.code)); // advance intro through authoritative test fixture
  const snap=(await api(port,base+'/snapshot',null,friend.data.secret)).data;
  assert.equal(snap.config.houseCards,true);
  const allHands=await Promise.all([created.data.secret,friend.data.secret,other.data.secret].map(async secret=>(await api(port,base+'/snapshot',null,secret)).data.round.hand));
  assert.equal(allHands.flat().filter(c=>c.text==='Nan’s raffle ticket').length,1); // dealt to one contestant, not necessarily author
  assert.equal((await api(port,base+'/action',{type:'social-add-house-card',text:'Another new card'},friend.data.secret)).status,400);
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
