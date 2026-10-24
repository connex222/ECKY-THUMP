'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const game=require('../server/game');
const social=game.social;
const persistence=require('../server/persistence');
function makeRoom(size=3,rating='clean'){
  const obj=game.newRoom({name:'Host',socialClub:true,rating});
  const room=obj.room;room.code='ABCD24';
  for(let i=1;i<size;i++)game.addPlayer(room,'Friend '+i);
  return {room,secret:obj.secret};
}
const add=(room,player,text)=>social.addHouseCard(room,player,text,game.validateAnswer);
test('House Cards are opt-in, lobby-only and enforce five 45-character safe unique responses',()=>{
 const {room}=makeRoom(),p=room.players[1];
 assert.equal(room.config.houseCards,false);
 assert.throws(()=>add(room,p,'The raffle committee'),/not enabled/);
 social.setHouseCards(room,true);
 const id=add(room,p,'The raffle committee');
 assert.ok(room.houseCards.has(id));
 assert.throws(()=>add(room,p,'the   raffle committee'),/already/);
 assert.throws(()=>add(room,p,'An alarmingly long house card that simply keeps going and going and going'),/45 characters/);
 assert.throws(()=>add(room,p,'Visit www.example.com'),/Links/);
 assert.throws(()=>add(room,p,'The fucking chip shop'),/Clean humour/);
 for(let i=0;i<4;i++)add(room,p,'Fresh house card number '+i);
 assert.throws(()=>add(room,p,'One more cheeky card'),/up to five/);
 social.start(room);
 assert.throws(()=>add(room,p,'Too late for cards'),/before the show starts/);
 assert.throws(()=>social.setHouseCards(room,false),/lobby/);
 assert.throws(()=>social.removeHouseCard(room,p,id),/lobby/);
});
test('owner moderation, privacy and no text leakage to opponents, audience or TV',()=>{
 const {room}=makeRoom(),host=room.players[0],author=room.players[1],other=room.players[2];
 social.setHouseCards(room,true);const id=add(room,author,'My uncle’s lucky bingo dabber');
 const mine=social.snapshot(room,author.id),hostView=social.snapshot(room,host.id),stranger=social.snapshot(room,other.id),tv=social.snapshot(room,null,true);
 assert.deepEqual(mine.houseCards.yours.map(x=>x.id),[id]);
 assert.equal(mine.houseCards.moderation.length,0);
 assert.equal(hostView.houseCards.moderation[0].text,'My uncle’s lucky bingo dabber');
 assert.equal(stranger.houseCards.total,1);
 assert.deepEqual(stranger.houseCards.yours,[]);
 assert.deepEqual(stranger.houseCards.moderation,[]);
 assert.equal(JSON.stringify(stranger).includes('lucky bingo dabber'),false);
 assert.equal(JSON.stringify(tv).includes('lucky bingo dabber'),false);
 assert.throws(()=>social.removeHouseCard(room,other,id),/Only the author or the host/);
 social.removeHouseCard(room,host,id);assert.equal(room.houseCards.size,0);
 const id2=add(room,author,'A surprise parcel of black pudding');
 game.removePlayer(room,author.id);assert.equal(room.houseCards.has(id2),false);
});
test('house cards are room-only, can be disabled without dealing and drawn into six/twelve contestant hands',()=>{
 for(const n of [3,6,12]){
   const {room}=makeRoom(n);social.setHouseCards(room,true);
   for(let i=0;i<n;i++)add(room,room.players[i],'House joke from player '+i);
   const hand=social.responseHands(room,7);
   const cards=[...hand.values()].flat().map(c=>c.text);
   assert.equal(cards.length,n*7);
   assert.equal(new Set(cards).size,cards.length);
   assert.equal(cards.filter(text=>text.startsWith('House joke')).length,n);
   assert.deepEqual([...hand.values()].map(h=>h.length),Array(n).fill(7));
   const separate=makeRoom(3).room;
   assert.equal([...social.responseHands(separate,7).values()].flat().some(c=>c.text.startsWith('House joke')),false);
   social.setHouseCards(room,false);
   assert.equal([...social.responseHands(room,5).values()].flat().some(c=>c.text.startsWith('House joke')),false);
 }
});
test('changing rating refuses to expose inappropriate house cards to Family players',()=>{
 const {room}=makeRoom(3,'cheeky');social.setHouseCards(room,true);
 add(room,room.players[0],'The wanker in charge of bingo');
 assert.throws(()=>game.setLobbyRating(room,'clean'),/Remove House Cards/);
 assert.equal(room.config.rating,'cheeky');
 social.removeHouseCard(room,room.players[0],[...room.houseCards.keys()][0]);
 game.setLobbyRating(room,'clean');assert.equal(room.config.rating,'clean');
});
test('lobby room with house cards recovers from disk and preserves private ownership, but expires with room',()=>{
 const old=process.env.ROOM_DATA_DIR,dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-house-'));
 process.env.ROOM_DATA_DIR=dir;
 try{
   const {room,secret}=makeRoom();social.setHouseCards(room,true);
   const id=add(room,room.players[1],'My nan’s emergency biscuit tin');
   persistence.store(room);
   const restored=persistence.restore().get(room.code);
   assert.equal(restored.phase,'LOBBY');assert.ok(restored.houseCards instanceof Map);
   assert.equal(restored.houseCards.get(id).authorId,restored.players[1].id);
   assert.equal(game.findPlayer(restored,secret).id,restored.ownerId);
   assert.equal(social.snapshot(restored,restored.players[2].id).houseCards.yours.length,0);
   restored.created=Date.now()-7*3600000;persistence.store(restored);
   assert.equal(persistence.restore().size,0);
   assert.equal(fs.existsSync(path.join(dir,room.code+'.json')),false);
 }finally{
   if(old===undefined)delete process.env.ROOM_DATA_DIR;else process.env.ROOM_DATA_DIR=old;
   fs.rmSync(dir,{recursive:true,force:true});
 }
});
test('classic game keeps House Cards disabled and does not expose Social Club moderation',()=>{
 const classic=game.newRoom({name:'Classic Host'}).room;
 assert.equal(classic.config.socialClub,false);
 assert.equal(classic.config.houseCards,false);
 assert.equal(Object.hasOwn(game.snapshot(classic,classic.players[0].id),'houseCards'),false);
});
