'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const avatars=require('../public/assets/avatars.json');
const game=require('../server/game');
test('both player and TV pages preload the shared avatar registry',()=>{
 for(const page of ['public/index.html','public/tv/index.html']){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  assert.match(html, /assets\/avatars\.js\?v=0\.9\.1/);
  assert.ok(html.indexOf('/assets/avatars.js')<html.indexOf('/assets/'+(page.includes('/tv/')?'tv.js':'app.js')));
 }
});
test('seven distinct adult headliners use real portrait and full-body WebP files',()=>{
 const updated=avatars.filter(x=>x.spotlight);
 assert.equal(updated.length,7);
 assert.equal(new Set(updated.map(x=>x.id)).size,7);
 for(const a of updated){
  assert.equal(a.group,'adult');
  for(const field of ['image','celebration']){
   assert.match(a[field],/\.webp$/);
   const filepath=path.join(root,'public',a[field].replace(/^\//,''));
   assert.ok(fs.statSync(filepath).size>4000,`${a.id} ${field} missing`);
   assert.equal(fs.readFileSync(filepath).subarray(0,4).toString(),'RIFF');
  }
 }
});
test('results reveal avatar with attribution only after voting',()=>{
 const {room}=game.newRoom({name:'Host',avatar:'adult-06'});
 room.code='MHK234';
 game.addPlayer(room,'Friend A',false,'adult-13');
 game.addPlayer(room,'Friend B',false,'adult-14');
 game.startGame(room);
 const players=room.players;
 for(const p of players){const snap=game.snapshot(room,p.id);game.acceptAnswer(room,p,snap.round.hand[0].id);}
 const duringVote=game.snapshot(room,null,true);
 assert.equal(duringVote.phase,'VOTE');
 assert.equal(duringVote.round.entries,undefined);
 assert.ok(duringVote.round.candidates.every(c=>c.authorAvatar===undefined));
 for(const p of players){const other=game.snapshot(room,p.id).round.candidates.filter(c=>!c.isOwn);game.acceptVote(room,p,other[0].id,other[1].id);}
 const after=game.snapshot(room,null,true);
 assert.equal(after.phase,'RESULTS');
 assert.equal(after.round.entries.length,3);
 assert.deepEqual(new Set(after.round.entries.map(e=>e.authorAvatar)),new Set(['adult-06','adult-13','adult-14']));
});
test('TV lobby and final reveal contain QR and winner spotlight markup',()=>{
 const tv=fs.readFileSync(path.join(root,'public/assets/tv.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/assets/app.js'),'utf8');
 assert.match(tv,/tv-scan-to-join/);
 assert.match(tv,/join-qr\.svg/);
 assert.match(tv,/tvWinners\(s\)/);
 assert.match(tv,/tv-finale-cast/);
 assert.match(app,/winner-spotlight/);
 assert.match(app,/final-cast-player/);
});
