'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('../server/game');

test('Gold/Silver vote weighting, ordering and point allocation',()=>{
  const entries=[{id:'a',authorId:'A'},{id:'b',authorId:'B'},{id:'c',authorId:'C'}];
  const votes=[{voterId:'A',gold:'b',silver:'c'},
    {voterId:'B',gold:'a',silver:'c'},
    {voterId:'C',gold:'b',silver:'a'}];
  const result=game.scoreEntries(entries,votes);
  assert.deepEqual(Object.fromEntries(result.map(r=>[r.entryId,[r.weight,r.points]])),{b:[4,100],a:[3,60],c:[2,25]});
});
test('two-way tie shares points by occupied rank',()=>{
  const entries=[{id:'a',authorId:'A'},{id:'b',authorId:'B'},{id:'c',authorId:'C'},{id:'d',authorId:'D'}];
  const votes=[{voterId:'C',gold:'a',silver:'b'},{voterId:'D',gold:'b',silver:'a'}];
  const result=game.scoreEntries(entries,votes);
  assert.equal(result.find(x=>x.entryId==='a').points,80);
  assert.equal(result.find(x=>x.entryId==='b').points,80);
  assert.equal(result.find(x=>x.entryId==='c').points,25);
  assert.equal(result.find(x=>x.entryId==='d').points,25);
});
test('three-way empty-ballot tie allocates 62 points per entry',()=>{
  const entries=['a','b','c'].map(id=>({id,authorId:id}));
  assert.deepEqual(game.scoreEntries(entries,[]).map(x=>x.points),[62,62,62]);
});
test('refuses invalid vote pairs and self-voting at scoring boundary',()=>{
  const entries=[{id:'a',authorId:'A'},{id:'b',authorId:'B'},{id:'c',authorId:'C'}];
  const result=game.scoreEntries(entries,[{voterId:'A',gold:'a',silver:'b'},{voterId:'A',gold:'b',silver:'b'}]);
  assert.ok(result.every(x=>x.weight===0));
});
test('answer protections reject links, contact details and markup',()=>{
  for(const bad of ['https://example.com','Call 07700 900456 today','hello <script>','name@example.org','  '])
    assert.throws(()=>game.validateAnswer(bad));
  assert.equal(game.validateAnswer('  The kettle is the mayor!  '),'The kettle is the mayor!');
});
test('unrevealed private hands and submission identities do not reach other players or TV',()=>{
  const {room,id:host,secret}=game.newRoom({name:'Host'});room.code='ABCD23';
  const a=game.addPlayer(room,'Guest One'); const b=game.addPlayer(room,'Guest Two');
  assert.equal(game.findPlayer(room,secret).id,host);
  game.startGame(room);
  const hostView=game.snapshot(room,host);
  const aView=game.snapshot(room,a.id);
  assert.equal(hostView.round.hand.length,7);
  assert.equal(aView.round.hand.length,7);
  assert.equal(game.snapshot(room,null,true).round.hand,undefined);
  assert.notDeepEqual(hostView.round.hand,aView.round.hand);
  game.acceptAnswer(room,room.players[0],hostView.round.hand[0].id);
  assert.equal(game.snapshot(room,a.id).round.entries,undefined);
  assert.equal(game.snapshot(room,null,true).round.entries,undefined);
  game.acceptAnswer(room,room.players[1],aView.round.hand[0].id);
  game.acceptAnswer(room,room.players[2],game.snapshot(room,b.id).round.hand[0].id);
  const v=game.snapshot(room,a.id);
  assert.equal(v.phase,'VOTE');
  assert.equal(v.round.candidates.filter(c=>c.isOwn).length,1);
  assert.equal(v.round.candidates.length,3);
  assert.ok(v.round.candidates.every(c=>!('authorId' in c)));
  assert.ok(game.snapshot(room,null,true).round.candidates.every(c=>!('isOwn' in c)||!c.isOwn));
});
test('two players insufficient to begin and adult mode requires confirmation',()=>{
  const {room}=game.newRoom({name:'Host'});room.code='ABC2D3';
  game.addPlayer(room,'Partner');assert.throws(()=>game.startGame(room),/three players/);
  assert.throws(()=>game.newRoom({name:'Host',rating:'adult'}),/confirm/);
});
test('Clean rating rejects common strong profanity in authored answers',()=>{
  assert.throws(()=>game.validateAnswer('This is some fucking nonsense','clean'),/Clean/);
  assert.equal(game.validateAnswer('Slightly ridiculous nonsense','clean'),'Slightly ridiculous nonsense');
  assert.throws(()=>game.validateAnswer('This is fucking nonsense','cheeky'),/Cheeky/);
  assert.equal(game.validateAnswer('A rather cheeky joke','cheeky'),'A rather cheeky joke');
});
test('12-player standard championship completes all four rounds with private hands and no duplicate awards',()=>{
  const {room}=game.newRoom({name:'Captain',length:'standard'});room.code='XYZ234';
  for(let i=1;i<12;i++)game.addPlayer(room,'Contestant '+i);
  game.startGame(room);
  assert.equal(room.players.length,12);
  for(let round=0;round<4;round++){
    if(room.phase==='SEED'){
      for(const p of room.players)game.acceptSeed(room,p,`I saw something perfectly ordinary at lunch ${p.name}`);
    }
    assert.equal(room.phase,'SUBMIT');
    if(room.round.type==='CARD'){
      const hands=room.players.map(p=>game.snapshot(room,p.id).round.hand);
      assert.ok(hands.every(h=>h.length===7));
      assert.equal(new Set(hands.flatMap(h=>h.map(c=>c.text))).size,84);
    }
    for(let i=0;i<12;i++){
      const p=room.players[i];
      const type=room.round.type;
      const val=type==='CARD'?game.snapshot(room,p.id).round.hand[0].id:
        type==='DOUBLE'?{cardId:game.snapshot(room,p.id).round.hand[0].id,line:`The official sales pitch number ${i+1} has arrived.`}:
        `The official answer number ${i+1} has arrived ${room.round.requiredWord||''}.`;
      game.acceptAnswer(room,p,val);
    }
    assert.equal(room.phase,'VOTE');
    for(const p of room.players){
      const others=game.snapshot(room,p.id).round.candidates.filter(c=>!c.isOwn);
      game.acceptVote(room,p,others[0].id,others[1].id);
    }
    assert.equal(room.phase,'RESULTS');
    assert.equal(room.round.awards.length,12);
    assert.equal(new Set(room.round.awards.map(a=>a.authorId)).size,12);
    assert.equal(room.results.length,round+1);
    game.nextRound(room);
  }
  assert.equal(room.phase,'COMPLETE');
  assert.equal(room.results.length,4);
  assert.equal(room.players.reduce((t,p)=>t+p.score,0),room.results.flatMap(r=>r.awards).reduce((t,a)=>t+a.points,0));
});
