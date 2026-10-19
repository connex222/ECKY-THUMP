'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('../server/game');
function party() {
  const {room,id}=game.newRoom({name:'Host',length:'party',pace:'relaxed'});
  room.code='GHJK23';
  const first=game.addPlayer(room,'One');const second=game.addPlayer(room,'Two');
  return {room,ids:[id,first.id,second.id]};
}
test('separate private TV links work simultaneously in three homes',()=>{
  const {room}=party();
  const tokens=Array.from({length:3},()=>game.mintDisplay(room));
  assert.equal(new Set(tokens).size,3);
  for(const token of tokens) {
    assert.equal(game.verifyDisplay(room,token),true);
    const view=game.snapshot(room,null,true);
    assert.equal(view.you,null);
  }
  assert.equal(game.verifyDisplay(room,'wrong'),false);
  for(let i=0;i<3;i++)game.mintDisplay(room);
  assert.equal(game.verifyDisplay(room,tokens[0]),false,'after six links the oldest is invalidated');
  assert.equal(game.verifyDisplay(room,tokens[1]),true);
});
test('relaxed games nights have longer timers and host-paced reveals',()=>{
  const {room,ids}=party();
  game.startGame(room);
  assert.equal(room.playlist.length,6);
  assert.equal(room.config.pace,'relaxed');
  assert.ok(room.deadline-Date.now()>=89000);
  for(const id of ids){
    const p=room.players.find(x=>x.id===id);
    game.acceptAnswer(room,p,game.snapshot(room,id).round.hand[0].id);
  }
  assert.equal(room.phase,'VOTE');
  assert.ok(room.deadline-Date.now()>=74000);
  for(const id of ids){
    const p=room.players.find(x=>x.id===id);
    const others=game.snapshot(room,id).round.candidates.filter(x=>!x.isOwn);
    game.acceptVote(room,p,others[0].id,others[1].id);
  }
  assert.equal(room.phase,'RESULTS');
  assert.equal(room.deadline,null);
  assert.equal(game.tick(room),false);
  game.nextRound(room);
  assert.equal(room.phase,'SUBMIT');
  assert.equal(room.round.type,'WIT');
  assert.ok(room.deadline-Date.now()>=119000);
});
test('play again keeps friends and room code but wipes prior scoreboard and private round state',()=>{
  const {room,ids}=party();
  game.startGame(room);
  for(let i=0;i<6;i++){
    if(room.phase==='SEED')for(const id of ids){
      game.acceptSeed(room,room.players.find(x=>x.id===id),`A very innocent line from round ${i+1} by ${room.players.find(x=>x.id===id).name}`);
    }
    for(const id of ids){
      const player=room.players.find(x=>x.id===id);
      const type=room.round.type;
      const val=type==='CARD'?game.snapshot(room,id).round.hand[0].id:
        type==='DOUBLE'?{cardId:game.snapshot(room,id).round.hand[0].id,line:`Absurd sales pitch from ${player.name}`}:
        `Ridiculous answer from ${player.name} round ${i+1} ${room.round.requiredWord||''}`;
      game.acceptAnswer(room,player,val);
    }
    for(const id of ids){
      const player=room.players.find(x=>x.id===id);
      const other=game.snapshot(room,id).round.candidates.filter(x=>!x.isOwn);
      game.acceptVote(room,player,other[0].id,other[1].id);
    }
    game.nextRound(room);
  }
  assert.equal(room.phase,'COMPLETE');
  assert.ok(room.players.some(p=>p.score>0));
  const priorPlayers=room.players.map(x=>x.id);
  assert.throws(()=>game.startGame(room),/already started/);
  game.playAgain(room);
  assert.equal(room.phase,'LOBBY');
  assert.equal(room.code,'GHJK23');
  assert.deepEqual(room.players.map(x=>x.id),priorPlayers);
  assert.deepEqual(room.players.map(x=>x.score),[0,0,0]);
  assert.equal(room.round,null);
  assert.equal(room.results.length,0);
  assert.equal(room.deadline,null);
  assert.equal(room.playlist.length,0);
  game.startGame(room);
  assert.equal(room.roundIndex,0);
  assert.equal(room.playlist.length,6);
  assert.throws(()=>game.playAgain(room),/Finish/);
});
test('invalid party length and pace are rejected',()=>{
  assert.throws(()=>game.newRoom({name:'A Host',length:'endless'}),/Invalid game length/);
  assert.throws(()=>game.newRoom({name:'A Host',pace:'instant'}),/Invalid party pace/);
});
test('host can remove a lobby player between games, while active matches cannot be altered',()=>{
  const {room,ids}=party();
  assert.throws(()=>game.removePlayer(room,ids[0]),/host cannot remove/);
  const removed=room.players[2];
  const id=game.removePlayer(room,removed.id);
  assert.equal(id,removed.id);
  assert.equal(room.players.length,2);
  assert.equal(game.findPlayer(room,game.addPlayer(room,'Replacement').secret)?.name,'Replacement');
  game.startGame(room);
  assert.throws(()=>game.removePlayer(room,room.players[1].id),/between games/);
});
