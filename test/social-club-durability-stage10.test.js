'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const persistence=require('../server/persistence');
const durability=require('../server/durability');

test('a failed private save is reported, does not interrupt gameplay, and clears on recovery',()=>{
 const original=persistence.store;
 try{
   persistence.store=()=>{const err=Error('Private data');err.code='EACCES';throw err;};
   assert.equal(durability.store({config:{socialClub:true}}),false);
   const degraded=durability.status();
   assert.equal(degraded.state,'degraded');
   assert.equal(degraded.guaranteed,false);
   assert.equal(JSON.stringify(degraded).includes('Private data'),false);
   persistence.store=()=>true;
   assert.equal(durability.store({config:{socialClub:true}}),true);
   assert.notEqual(durability.status().state,'degraded');
 }finally{persistence.store=original;}
});

test('startup recovery returns an empty map when the private disk cannot be listed',()=>{
 const previous=process.env.ROOM_DATA_DIR;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-storage-failure-'));
 const file=path.join(root,'not-a-directory');fs.writeFileSync(file,'x');
 try{
   process.env.ROOM_DATA_DIR=file;
   const rooms=durability.restore();
   assert.ok(rooms instanceof Map);assert.equal(rooms.size,0);
   assert.equal(durability.status().state,'degraded');
 }finally{
   if(previous===undefined)delete process.env.ROOM_DATA_DIR;else process.env.ROOM_DATA_DIR=previous;
   fs.rmSync(root,{recursive:true,force:true});
 }
});

test('a full or read-only disk cannot turn a completed in-memory room action into an HTTP failure',async()=>{
 const original=process.env.ROOM_DATA_DIR,preview=process.env.SOCIAL_CLUB_PREVIEW;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-unavailable-disk-'));
 const file=path.join(root,'not-a-directory');fs.writeFileSync(file,'x');
 process.env.ROOM_DATA_DIR=file;process.env.SOCIAL_CLUB_PREVIEW='1';
 const {server,rooms}=require('../server/index');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=`http://127.0.0.1:${server.address().port}`;
 async function request(uri,body,secret){const response=await fetch(address+uri,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(secret?{Authorization:'Bearer '+secret}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};}
 try{
   const created=await request('/api/rooms',{socialClub:true,name:'Diskless Host'});
   assert.equal(created.status,201);
   const uri='/api/rooms/'+created.data.code;
   const friend=await request(uri+'/join',{name:'Friend'});assert.equal(friend.status,201);
   const health=await request('/api/health');
   assert.equal(health.status,200);assert.equal(health.data.roomRecovery.state,'degraded');
   assert.equal(health.data.roomRecovery.guaranteed,false);
   const snapshot=await request(uri+'/snapshot',undefined,created.data.secret);
   assert.equal(snapshot.status,200);assert.equal(snapshot.data.players.length,2);
   assert.ok(rooms.has(created.data.code));
 }finally{
   await new Promise(resolve=>server.close(resolve));
   fs.rmSync(root,{recursive:true,force:true});
   if(original===undefined)delete process.env.ROOM_DATA_DIR;else process.env.ROOM_DATA_DIR=original;
   if(preview===undefined)delete process.env.SOCIAL_CLUB_PREVIEW;else process.env.SOCIAL_CLUB_PREVIEW=preview;
 }
});
