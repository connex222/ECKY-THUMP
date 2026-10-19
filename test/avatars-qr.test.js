'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('../server/game');
const {avatars}=require('../server/avatars');
const {qrSVG}=require('../server/qr');
test('roster has 24 adult portraits and eight mascots with unique IDs',()=>{
  assert.equal(avatars.length,32);
  assert.equal(avatars.filter(x=>x.group==='adult').length,24);
  assert.equal(avatars.filter(x=>x.group==='mascot').length,8);
  assert.equal(new Set(avatars.map(x=>x.id)).size,32);
});
test('avatars are validated for hosts, guests, and lobby changes',()=>{
  assert.throws(()=>game.newRoom({name:'Host',avatar:'../../etc/passwd'}),/avatar/);
  const {room}=game.newRoom({name:'Host',avatar:'adult-18'});
  assert.equal(room.players[0].avatar,'adult-18');
  const {id}=game.addPlayer(room,'Guest',false,'mascot-02');
  const guest=room.players.find(x=>x.id===id);
  assert.equal(game.snapshot(room,id).you.avatar,'mascot-02');
  game.setAvatar(room,guest,'adult-24');
  assert.equal(game.snapshot(room,room.ownerId).players.find(x=>x.id===id).avatar,'adult-24');
  assert.throws(()=>game.setAvatar(room,guest,'unknown'),/avatar/);
  game.addPlayer(room,'Third');
  game.startGame(room);
  assert.throws(()=>game.setAvatar(room,guest,'adult-02'),/between matches/);
});
test('QR generator creates a real SVG matrix, no external service',()=>{
  const svg=qrSVG('https://example.org/join/?room=ABC123');
  assert.match(svg,/^<svg /);
  assert.ok((svg.match(/<rect /g)||[]).length>60);
  assert.match(svg,/shape-rendering="crispEdges"/);
});

test('hosted per-room QR endpoint returns a room-specific SVG', async()=>{
  const {server}=require('../server/index');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const url=`http://127.0.0.1:${server.address().port}`;
    const created=await (await fetch(url+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'QR Host',avatar:'adult-14'})})).json();
    const response=await fetch(url+`/api/rooms/${created.code}/join-qr.svg`,{headers:{'x-forwarded-proto':'https'}});
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-type'),/image\/svg\+xml/);
    assert.match(await response.text(),/^<svg /);
    const snapshot=await (await fetch(url+`/api/rooms/${created.code}/snapshot`,{headers:{Authorization:'Bearer '+created.secret}})).json();
    assert.equal(snapshot.you.avatar,'adult-14');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
