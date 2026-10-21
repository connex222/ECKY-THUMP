'use strict';
/** Synthetic game-night simulator. Human jokes and genuine reaction quality cannot be simulated. */
const game=require('../server/game');
const rng=require('node:crypto');
const choose=a=>a[rng.randomInt(a.length)];
const args=process.argv.slice(2);
const matchesPerCell=Math.max(1,Math.min(1000,Number(args[0])||30));
const sizes=[3,6,12],lengths=['quick','standard','party'],paces=['lively','relaxed'];
const report={matches:0,rounds:0,activations:0,rerolls:0,failedActivations:0,equalisers:0,negativeScores:0,completed:0,byGroup:{}};
for(const size of sizes)for(const length of lengths)for(const pace of paces)for(const enabled of [false,true]){
 const key=`${size}p / ${length} / ${pace} / ${enabled?'cards':'normal'}`;
 const tally=report.byGroup[key]={matches:0,leaderAtHalfWon:0,averageFinalSpread:0,gameCardActivations:0,equalisers:0};
 for(let m=0;m<matchesPerCell;m++){
  const {room}=game.newRoom({name:'Host',length,pace,gameCards:enabled});room.code='SIM234';
  for(let i=1;i<size;i++)game.addPlayer(room,`P${String(i).padStart(2,'0')}`);
  const skills=new Map(room.players.map(p=>[p.id,Math.random()]));
  game.startGame(room);let midwayLeader=null;
  for(let round=0;round<room.playlist.length;round++){
   if(room.phase==='SEED')for(const p of room.players)game.acceptSeed(room,p,`An innocent story about ${p.name}`);
   if(enabled){
    for(const p of room.players){
     const snap=game.snapshot(room,p.id),hand=snap.gameCards?.inventory||[];
     if(!snap.round?.submitted&&snap.gameCards.playsUsed<2&&!snap.gameCards.playedThisRound&&hand.length&&Math.random()<.22){
      try{game.rerollGameCard(room,p,hand[rng.randomInt(hand.length)].id);report.rerolls++;}catch{}
     }
     const view=game.snapshot(room,p.id);
     const usable=view.gameCards.inventory.filter(c=>c.challenges.includes(room.round.type)&&c.phase.includes('SUBMIT')&&!(c.tier==='Chaos'&&view.gameCards.chaosUsed)&&!view.gameCards.spentOnce.includes(c.id)&&!(c.id==='TACT_EXTRA_HELPING'&&room.round.swaps.has(p.id)));
     if(view.gameCards.playsUsed<2&&!view.gameCards.playedThisRound&&usable.length&&Math.random()<.42){
      const card=choose(usable);
      try{
       game.playGameCard(room,p,card.id,{prediction:choose([1,2])});report.activations++;tally.gameCardActivations++;
       const after=game.snapshot(room,p.id).gameCards;
       if(after.extra?.choices?.length){const draw=after.extra.choices[0].id,replace=room.round.hands[p.id][0].id;game.chooseGameExtra(room,p,draw,replace);}
      }catch(error){report.failedActivations++;report.activationErrors??={};report.activationErrors[error.message]=(report.activationErrors[error.message]||0)+1;}
     }
    }
   }
   for(const p of room.players){
    const type=room.round.type;
    const hand=room.round.hands?.[p.id]||[];
    const value=type==='CARD'?choose(hand).id:type==='DOUBLE'?{cardId:choose(hand).id,line:`Ridiculous sales pitch by ${p.name}`}:
      `The wacky joke by ${p.name} about ${room.round.requiredWord||'nothing'}`;
    game.acceptAnswer(room,p,value);
   }
   if(room.phase!=='VOTE')throw Error(`Did not enter vote: ${room.phase}`);
   for(const p of room.players){
    const candidates=game.snapshot(room,p.id).round.candidates.filter(c=>!c.isOwn);
    const ordered=candidates.map(c=>({c,v:(skills.get(room.round.entries.find(e=>e.id===c.id)?.authorId)||0)+Math.random()*.8})).sort((a,b)=>b.v-a.v);
    game.acceptVote(room,p,ordered[0].c.id,ordered[1].c.id);
   }
   if(room.phase!=='RESULTS')throw Error(`Did not show results: ${room.phase}`);
   report.rounds++;
   tally.equalisers+=room.gameCards?.roundEqualisers?.size||0;
   if(room.roundIndex===Math.floor((room.playlist.length-1)/2)){
    const sorted=game.sortedPlayers(room);midwayLeader=sorted[0].id;
   }
   game.nextRound(room);
  }
  if(room.phase!=='COMPLETE')throw Error('Did not complete match');
  const rankings=game.sortedPlayers(room);
  if(rankings.some(p=>p.score<0))report.negativeScores++;
  tally.averageFinalSpread+=rankings[0].score-rankings.at(-1).score;
  if(rankings[0].id===midwayLeader)tally.leaderAtHalfWon++;
  tally.matches++;report.completed++;report.matches++;
 }
 tally.averageFinalSpread=Math.round(tally.averageFinalSpread/tally.matches);
 tally.leaderAtHalfWon=Number((100*tally.leaderAtHalfWon/tally.matches).toFixed(1));
}
report.equalisers=Object.values(report.byGroup).reduce((n,x)=>n+x.equalisers,0);
process.stdout.write(JSON.stringify(report,null,2)+'\n');
