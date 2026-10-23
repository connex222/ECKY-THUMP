'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const c=require('../server/content');
const g=require('../server/game');
const EXPE={responses:[140,300,280],cardPrompts:[20,65,65],witPrompts:[10,50,50],contextPrompts:[10,28,27],doublePrompts:[8,24,23],finalPrompts:[7,20,18],finalWords:[5,10,10],contracts:[5,13,12]};
const tiers=['clean','cheeky','adult'];

test('exactly 1,200 new content entries, tiered and unique with stable IDs',()=>{
  assert.equal(c.expansion.entries.length,1200);
  assert.equal(new Set(c.expansion.entries.map(x=>x.id)).size,1200);
  assert.equal(new Set(c.expansion.entries.map(x=>x.text.toLowerCase())).size,1200);
  for(const [kind,counts] of Object.entries(EXPE))for(let i=0;i<3;i++){
    const matches=c.expansion.entries.filter(x=>x.kind===kind&&x.rating===tiers[i]);
    assert.equal(matches.length,counts[i],`${kind}/${tiers[i]}`);
    for(const item of matches){assert.equal(item.pack,'eckey-after-dark-09');assert.equal(item.editorialStatus,'draft');assert.ok(item.tags.includes(item.rating));assert.ok(item.text.length<=160);}
  }
  assert.equal(c.expansion.entries.filter(x=>x.rating!=='clean').length,995);
});

test('rating ceilings are strict for every added library type',()=>{
  for(const kind of Object.keys(EXPE)){
    const source=c[kind];
    assert.ok(source);
    for(const tier of tiers){
      const pool=c.getPool(source,tier);
      assert.equal(new Set(pool).size,pool.length,`duplicate ${kind}/${tier}`);
      const allowed=tiers.slice(0,tiers.indexOf(tier)+1);
      const superseded=new Set(c.approvedPack.entries.map(e=>e.id));
      for(const item of c.expansion.entries.filter(e=>e.kind===kind)){
        const normal=item.text.toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
        const approvedTexts=new Set(c.approvedPack.entries.map(e=>e.text.toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu,' ').trim()));
        const approvedMatch=c.approvedPack.entries.some(e=>e.kind===kind && e.text===item.text && allowed.includes(e.rating));
        const expected=approvedMatch || (!superseded.has(item.id) && !approvedTexts.has(normal) && allowed.includes(item.rating));
        assert.equal(pool.includes(item.text),expected,`${kind} ${tier} ${item.id}`);
      }
      for(const item of c.approvedPack.entries.filter(e=>e.kind===kind)){
        assert.equal(pool.includes(item.text),allowed.includes(item.rating),`approved ${kind} ${tier} ${item.id}`);
      }
    }
  }
});

test('maximum 12-player Clean games use unique dealt cards across all rounds',()=>{
  const {room}=g.newRoom({name:'Host Player',rating:'clean'});room.code='PQRS24';
  for(let i=1;i<12;i++)g.addPlayer(room,`Guest ${i}`);
  g.startGame(room);
  const all=new Set();let total=0;
  for(let i=0;i<6;i++){
    if(['CARD','DOUBLE'].includes(room.round.type)){
      const batch=Object.values(room.round.hands).flat().map(card=>card.text);
      assert.equal(new Set(batch).size,batch.length);
      for(const text of batch){assert.equal(all.has(text),false,'card was repeated in same match');all.add(text);}
      total+=batch.length;
    }
    g.finishRound(room,'test: advance without votes');
    g.nextRound(room);
  }
  assert.equal(room.phase,'COMPLETE');
  assert.equal(total,228);
  assert.equal(all.size,228);
});

test('play-again preserves the unused deck and prompt rotation for the same three friends',()=>{
  const {room}=g.newRoom({name:'Host Player',rating:'cheeky'});room.code='RTYS32';
  g.addPlayer(room,'Guest One');g.addPlayer(room,'Guest Two');
  const unique=new Set(),prompts=new Set();
  for(let gameNumber=0;gameNumber<3;gameNumber++){
    g.startGame(room);
    for(let i=0;i<6;i++){
      if(['CARD','DOUBLE'].includes(room.round.type)){
        for(const card of Object.values(room.round.hands).flat()){
          assert.equal(unique.has(card.text),false,'repeat before deck exhaustion');
          unique.add(card.text);
        }
      }
      const marker=`${room.round.type}:${room.round.prompt}`;
      assert.equal(prompts.has(marker),false,'repeated prompt across play-again');prompts.add(marker);
      if(room.round.type==='WIT')assert.ok(c.getPool(c.contracts,'cheeky').includes(room.round.contract));
      if(room.round.type==='FINAL')assert.ok(c.getPool(c.finalWords,'cheeky').includes(room.round.requiredWord));
      g.finishRound(room,'test: advance without votes');g.nextRound(room);
    }
    assert.equal(room.phase,'COMPLETE');
    if(gameNumber<2)g.playAgain(room);
  }
  assert.equal(unique.size,171);
});

test('a player may swap one private card once; forged swaps and second swaps fail',()=>{
 const {room}=g.newRoom({name:'Test Host'});room.code='KPGT23';
 g.addPlayer(room,'Player Two');g.addPlayer(room,'Player Three');g.startGame(room);
 const p=room.players[0];const initial=g.snapshot(room,p.id).round.hand.map(card=>({...card}));
 assert.equal(initial.length,7);
 assert.throws(()=>g.swapCard(room,p,'forged'),/Select one/);
 g.swapCard(room,p,initial[0].id);
 const updated=g.snapshot(room,p.id).round;
 assert.equal(updated.swapUsed,true);
 assert.equal(updated.hand.length,7);
 assert.notEqual(updated.hand[0].text,initial[0].text);
 assert.equal(updated.hand.filter(x=>initial.some(y=>x.id===y.id)).length,6);
 assert.equal(g.snapshot(room,room.players[1].id).round.swapUsed,false);
 assert.equal(g.snapshot(room,null,true).round.hand,undefined);
 assert.throws(()=>g.swapCard(room,p,updated.hand[1].id),/one swap/);
 g.acceptAnswer(room,p,updated.hand[0].id);
 assert.throws(()=>g.swapCard(room,p,updated.hand[1].id),/already been submitted/);
});

test('12-player clean card swaps still produce unique hands over deck refill',()=>{
 const {room}=g.newRoom({name:'Original Host',rating:'clean'});room.code='QLMN24';
 for(let i=1;i<12;i++)g.addPlayer(room,`Friend ${i}`);
 for(let match=0;match<2;match++){
   g.startGame(room);
   for(let i=0;i<6;i++){
     if(['CARD','DOUBLE'].includes(room.round.type)){
       for(const player of room.players){
         const hand=g.snapshot(room,player.id).round.hand;
         g.swapCard(room,player,hand[0].id);
       }
       const hands=Object.values(room.round.hands).flat().map(x=>x.text);
       assert.equal(new Set(hands).size,hands.length);
     }
     g.finishRound(room,'test skip');g.nextRound(room);
   }
   if(match===0)g.playAgain(room);
 }
});
