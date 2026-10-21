'use strict';
// Server-authoritative, optional Game Cards. Never treat comedy response cards as powers.
const crypto=require('node:crypto');
const catalogue=require('./packs/game-cards-v1.json').cards;
const {record}=require('./telemetry');
const cards=Object.freeze(Object.fromEntries(catalogue.map(c=>[c.id,Object.freeze(c)])));
const random=(items)=>items[crypto.randomInt(items.length)];
const supported=['CARD','WIT','CONTEXT','DOUBLE'];
const scoreCards=c=>['TACT_DOUBLE_DUFF','TACT_GOLD_RUSH','TACT_FAST_FINGERS','TACT_BULLSEYE'].includes(c.id);
function state(room){return room.gameCards;}
function baseCard(c){return {id:c.id,name:c.name,tier:c.tier,challenges:c.challenges,phase:c.phase,visual:c.visual,risk_reward:c.risk_reward,description:c.effect,trigger:c.trigger};}
function init(room){
  room.gameCards={enabled:!!room.config.gameCards,inventory:new Map(),playedRound:new Set(),plays:new Map(),bonusUsed:new Map(),spentEqualisers:new Set(),pendingEqualisers:new Map(),roundEqualisers:new Map(),roundTactics:new Map(),lastChaosRound:-1,discardedRound:new Set(),once:new Set(),effects:[],lastEffect:null,events:[],serial:0,startedAt:0,stageStartedAt:0};
}
function setEnabled(room,enabled){
  if(room.phase!=='LOBBY')throw Error('Game Cards can only change in the lobby.');
  if(typeof enabled!=='boolean')throw Error('Choose Game Cards on or off.');
  room.config.gameCards=enabled;init(room);room.revision++;
}
function announce(room,c,by,kind='played'){
  const s=state(room);const item={serial:++s.serial,id:c.id,name:c.name,tier:c.tier,by:by||'THE GAME',kind,at:Date.now()};
  s.lastEffect=item;s.events.push(item);s.events=s.events.slice(-8);room.revision++;
}
function eligibleForRound(c,type,phase='SUBMIT'){return c.challenges.includes(type)&&c.phase.includes(phase);}
function draw(room,player,excludedIds=new Set()){
  const s=state(room);if(!s?.enabled)return;
  const hand=s.inventory.get(player.id)||[];
  if(hand.length>=2||(s.plays.get(player.id)||0)>=2)return;
  const options=catalogue.filter(c=>['Chaos','Tactical'].includes(c.tier)&&eligibleForRound(c,room.round.type,'SUBMIT')&&!hand.includes(c.id)&&!excludedIds.has(c.id)&&!s.once.has(c.id));
  if(!options.length)return;
  const picked=random(options);hand.push(picked.id);s.inventory.set(player.id,hand);
  record(room,'card_offered',{cardId:picked.id});
}
function onMatchStart(room){
  init(room);
}
function atRoundStart(room,drawResponses,cardId){
  const s=state(room);if(!s?.enabled)return;
  s.playedRound=new Set();s.discardedRound=new Set();s.roundTactics=new Map();s.roundEqualisers=new Map();s.lastChaosRound=-1;s.effects=[];s.startedAt=Date.now();s.stageStartedAt=Date.now();s.stageOrder=null;s.submitAt=new Map();s.pendingExtra=new Map();s.contractWords=new Map();
  const type=room.round.type;
  // Awarded catch-up cards do not consume a normal inventory slot or activation.
  for(const [id,p] of [...s.pendingEqualisers]){
    if(type==='FINAL'||room.roundIndex-p.offeredAt>2){s.pendingEqualisers.delete(id);continue;}
    if(!supported.includes(type))continue;
    const c=cards[p.cardId];if(!c.challenges.includes(type))continue;
    s.roundEqualisers.set(id,c.id);s.pendingEqualisers.delete(id);
    if(c.id==='EQUAL_LUCKYDIP'&&room.round.hands[id]){
      const excluded=new Set(Object.values(room.round.hands).flat().map(c=>c.text));
      const extra=drawResponses(room,3,excluded);
      extra.forEach((text,i)=>room.round.hands[id].push({id:cardId(room,id,text,`lucky-${i}`),text}));
    }
    if(c.id==='EQUAL_CONTRACT'){
      const words=['spectacular','sausage','underpants','mystery','legend','pudding','flamingo','mayhem'];
      s.contractWords??=new Map();s.contractWords.set(id,random(words));
    }
    announce(room,c,'UNDERDOG','equaliser');
  }
  // A fresh playable card is dealt each eligible round, up to a two-card hand.
  if(type!=='FINAL')for(const p of room.players)draw(room,p);
}
/** Once each eligible round, exchange a held power-up for another compatible one.
 * Validated on the server; no draws if the hand cannot receive a replacement.
 */
function reroll(room,player,id){
  const s=state(room),r=room.round;
  if(!s?.enabled||!r||room.phase!=='SUBMIT'||room.paused||r.type==='FINAL'||(room.deadline!=null&&Date.now()>=room.deadline))throw Error('Power-up rerolls are unavailable now.');
  if(s.discardedRound.has(player.id))throw Error('You have already rerolled a power-up this round.');
  if(s.playedRound.has(player.id)||(s.plays.get(player.id)||0)>=2)throw Error('No power-up plays remain this round.');
  if(r.entries.some(e=>e.authorId===player.id))throw Error('You have already submitted your answer.');
  const hand=s.inventory.get(player.id)||[];
  if(!hand.includes(id))throw Error('That Game Card is not in your hand.');
  const replacements=catalogue.filter(c=>['Chaos','Tactical'].includes(c.tier)&&eligibleForRound(c,r.type,'SUBMIT')&&!hand.includes(c.id)&&!s.once.has(c.id));
  if(!replacements.length)throw Error('No replacement Game Cards are available for this challenge.');
  s.inventory.set(player.id,hand.filter(x=>x!==id));
  draw(room,player,new Set([id]));
  s.discardedRound.add(player.id);
  record(room,'card_discarded',{cardId:id});
  room.revision++;
}
function atRewriteStart(room){const s=state(room);if(s?.enabled)s.stageStartedAt=Date.now();}
/** Host pauses freeze both the shared round timer and card effect clocks. */
function onResume(room,pausedMs){
  const s=state(room);
  if(!s?.enabled||!Number.isFinite(pausedMs)||pausedMs<=0)return;
  s.stageStartedAt+=pausedMs;
  for(const tactic of s.roundTactics.values())if(tactic.activatedAt)tactic.activatedAt+=pausedMs;
  for(const pending of (s.pendingExtra||new Map()).values())pending.until+=pausedMs;
  for(const effect of s.effects)if(effect.until)effect.until+=pausedMs;
}
function atSubmit(room,player){const s=state(room);if(s?.enabled){s.submitAt??=new Map();s.submitAt.set(player.id,Date.now());}}
function onResults(room){
  const s=state(room);if(!s?.enabled)return;
  const r=room.round;
  if(!r.skipReason&&r.type!=='FINAL'){
    for(const player of room.players){
      const award=r.awards.find(x=>x.authorId===player.id);
      if(!award)continue;
      let adjustment=0;
      const tactic=s.roundTactics.get(player.id);
      if(tactic){
        const id=tactic.id;
        switch(id){
          case 'TACT_DOUBLE_DUFF':adjustment=award.rank===1&&!award.isJoint?30:-15;break;
          case 'TACT_GOLD_RUSH':adjustment=award.gold?Math.min(30,award.gold*10):-10;break;
          case 'TACT_FAST_FINGERS':{
            const max=room.config.pace==='lively'?12000:20000;
            const didSubmit=r.entries.some(e=>e.authorId===player.id&&!e.auto);
            adjustment=didSubmit&&award.gold>0&&(s.submitAt?.get(player.id)||Infinity)-tactic.activatedAt<=max?20:0;
            break;
          }
          case 'TACT_BULLSEYE':adjustment=award.gold===tactic.prediction?30:-10;break;
        }
        record(room,'card_resolved',{cardId:id});
      }
      const equal=s.roundEqualisers.get(player.id);
      if(equal){
        const entry=r.entries.find(e=>e.authorId===player.id&&!e.hidden&&!e.auto);
        switch(equal){
          case 'EQUAL_LIFEBUOY':adjustment+=entry&&award.rank>Math.floor(r.awards.length/2)?25:0;break;
          case 'EQUAL_CROWN':adjustment+=award.rank===1&&!award.isJoint?40:0;break;
          case 'EQUAL_RUBBERBAND':adjustment+=Math.min(40,Math.floor(award.points*.5+.5));break;
          case 'EQUAL_CONTRACT':{
            const word=s.contractWords?.get(player.id);
            adjustment+=entry&&word&&entry.authoredText?.toLowerCase().split(/[^a-z]+/).includes(word.toLowerCase())&&award.gold>0?30:0;break;
          }
        }
        record(room,'card_resolved',{cardId:equal});
      }
      const positive=Math.max(0,adjustment),used=s.bonusUsed.get(player.id)||0;
      adjustment=Math.min(positive,Math.max(0,40-used))+Math.min(0,adjustment);
      if(adjustment>0)s.bonusUsed.set(player.id,used+adjustment);
      const actual=Math.max(-player.score,adjustment);
      player.score+=actual;
      if(actual){award.gameCardBonus=actual;}
    }
  }
  // No Equalisers in the final; only offer to current trailers for an upcoming non-finale round.
  const next=room.playlist[room.roundIndex+1];
  if(next&&next!=='FINAL'&&room.roundIndex>=1&&s.enabled){
    const leader=Math.max(...room.players.map(p=>p.score));
    const trailing=room.players.filter(p=>!s.spentEqualisers.has(p.id)&&!s.pendingEqualisers.has(p.id)&&leader-p.score>=Math.max(100,Math.ceil(leader*.25)))
      .sort((a,b)=>a.score-b.score).slice(0,2);
    for(const p of trailing){
      const options=catalogue.filter(c=>c.tier==='Equaliser'&&c.challenges.includes(next));
      if(!options.length)continue;
      const c=random(options);
      s.pendingEqualisers.set(p.id,{cardId:c.id,offeredAt:room.roundIndex});s.spentEqualisers.add(p.id);
      record(room,'card_offered',{cardId:c.id});
    }
  }
}
/** Authoritative availability preview for the player's private card inventory.
 * Every click is rechecked by play(); previews never grant permissions.
 */
function inspectPlay(room,player,c,now=Date.now()){
  const s=state(room),r=room.round;
  const unavailable=(reason)=>({playable:false,reason});
  if(!s?.enabled)return unavailable('Game Cards are switched off.');
  if(room.paused)return unavailable('Host paused the round.');
  if(!r||!['SUBMIT','RESULTS'].includes(room.phase))return unavailable('Wait for an active round.');
  if(c.tier==='Equaliser')return unavailable('Equalisers trigger automatically for eligible players.');
  if(!eligibleForRound(c,r.type,room.phase)||(r.type==='FINAL'&&c.tier==='Tactical'))return unavailable('Not usable in this challenge.');
  if(s.playedRound.has(player.id)||(s.plays.get(player.id)||0)>=2)return unavailable('Power-up allowance exhausted.');
  if(!(s.inventory.get(player.id)||[]).includes(c.id))return unavailable('Card is not in your hand.');
  if(room.phase==='SUBMIT'){
    if(r.entries.some(e=>e.authorId===player.id))return unavailable('Your answer is already submitted.');
    if(room.deadline!=null&&now>=room.deadline)return unavailable('The round clock has expired.');
  }
  if(c.tier==='Chaos'&&s.lastChaosRound===room.roundIndex)return unavailable('A Chaos card already played this round.');
  if(s.once.has(c.id))return unavailable('Already used this match.');
  if(room.phase==='SUBMIT'){
    const elapsed=now-s.stageStartedAt,remaining=(room.deadline||0)-now;
    const windows={CHAOS_DECKCHAIR:12000,CHAOS_MIRROR:((r.type==='CARD'?room.config.pace==='relaxed'?90000:45000:r.type==='DOUBLE'?room.config.pace==='relaxed'?140000:85000:room.config.pace==='relaxed'?120000:70000)/2),CHAOS_ENVELOPE:10000,CHAOS_EARLYBELL:10000,TACT_DOUBLE_DUFF:10000,TACT_FAST_FINGERS:10000};
    if(windows[c.id]!==undefined&&elapsed>windows[c.id])return unavailable('Activation window closed.');
    if(c.id==='CHAOS_DECKCHAIR'&&room.players.filter(p=>!r.entries.some(e=>e.authorId===p.id)).length<2)return unavailable('Not enough players waiting.');
    if(c.id==='CHAOS_ENVELOPE'&&r.entries.length)return unavailable('Someone has already answered.');
    if(c.id==='CHAOS_EARLYBELL'&&remaining<35000)return unavailable('Too little time remaining.');
    if(c.id==='TACT_EXTRA_HELPING'&&r.swaps.has(player.id))return unavailable('Response-card swap already used.');
  }
  const windows={CHAOS_DECKCHAIR:12000,CHAOS_ENVELOPE:10000,CHAOS_EARLYBELL:10000,TACT_DOUBLE_DUFF:10000,TACT_FAST_FINGERS:10000};
  const special=windows[c.id];
  const expiresAt=room.phase==='SUBMIT'?Math.min(room.deadline||Infinity,special!==undefined?s.stageStartedAt+special:Infinity):null;
  return {playable:true,reason:null,expiresAt:Number.isFinite(expiresAt)?expiresAt:null};
}
function play(room,player,id,options={},helpers){
  const s=state(room),r=room.round;
  if(!s?.enabled)throw Error('Game Cards are switched off for this match.');
  if(room.paused||!r||!['SUBMIT','RESULTS'].includes(room.phase))throw Error('Game Cards cannot be played now.');
  if(typeof id!=='string'||!Object.hasOwn(cards,id))throw Error('Unknown Game Card.');
  const c=cards[id];
  const available=inspectPlay(room,player,c);
  if(!available.playable)throw Error(available.reason);
  if(c.tier==='Equaliser')throw Error('Equalisers trigger automatically for eligible players.');
  if(!eligibleForRound(c,r.type,room.phase)||r.type==='FINAL'&&c.tier==='Tactical')throw Error('This card cannot be played during this challenge.');
  if(s.playedRound.has(player.id)||(s.plays.get(player.id)||0)>=2)throw Error('Your Game Card allowance is exhausted.');
  const hand=s.inventory.get(player.id)||[];
  if(!hand.includes(id))throw Error('That Game Card is not in your hand.');
  if(room.phase==='SUBMIT'&&r.entries.some(e=>e.authorId===player.id))throw Error('Game Cards must be played before submitting.');
  const elapsed=Date.now()-s.stageStartedAt,remaining=(room.deadline||0)-Date.now();
  const early=(ms)=>{if(elapsed>ms)throw Error('This Game Card must be played earlier in the round.');};
  const once=(key)=>{if(s.once.has(key))throw Error('That disruption has already happened this match.');};
  if(c.tier==='Chaos'&&s.lastChaosRound===room.roundIndex)throw Error('Only one global Chaos card is allowed per round.');
  let commit=()=>{};
  switch(id){
    case 'CHAOS_DECKCHAIR':{
      early(12000);
      const eligible=room.players.filter(p=>!r.entries.some(e=>e.authorId===p.id));
      if(eligible.length<2)throw Error('Not enough unsubmitted players.');
      const pair=helpers.shuffle(eligible).slice(0,2);
      commit=()=>{const a=r.hands[pair[0].id],b=r.hands[pair[1].id];const ia=crypto.randomInt(a.length),ib=crypto.randomInt(b.length);
        const x=a[ia].text,y=b[ib].text;
        a[ia]={id:helpers.cardId(room,pair[0].id,y,'chaos'),text:y};b[ib]={id:helpers.cardId(room,pair[1].id,x,'chaos'),text:x};};break;
    }
    case 'CHAOS_MIRROR':early(Math.floor(helpers.roundMs(room,r.type)/2));commit=()=>s.effects.push({id,until:Date.now()+10000});break;
    case 'CHAOS_ENVELOPE':early(10000);once(id);if(r.entries.length)throw Error('Answers have already been submitted.');
      commit=()=>{r.prompt=helpers.freshWit(room);s.stageStartedAt=Date.now();room.deadline=Date.now()+helpers.roundMs(room,'WIT');s.once.add(id);};break;
    case 'CHAOS_HOTSEAT':{
      if(room.players.length<2)throw Error('Not enough contestants.');
      commit=()=>{const players=room.players.map(p=>p.id);const shuffled=helpers.shuffle(players);const a=shuffled[0],b=shuffled[1];const i=players.indexOf(a),j=players.indexOf(b);[players[i],players[j]]=[players[j],players[i]];s.stageOrder=players;};break;
    }
    case 'CHAOS_EARLYBELL':early(10000);once(id);if(remaining<35000)throw Error('Not enough time remaining for the early bell.');
      commit=()=>{room.deadline-=10000;s.once.add(id);};break;
    case 'TACT_DOUBLE_DUFF':early(10000);break;
    case 'TACT_FAST_FINGERS':early(10000);break;
    case 'TACT_GOLD_RUSH':break;
    case 'TACT_BULLSEYE':if(![1,2].includes(options.prediction))throw Error('Predict one or two Gold votes.');break;
    case 'TACT_EXTRA_HELPING':{
      if(r.swaps.has(player.id))throw Error('Your standard swap has already been used.');
      const excluded=new Set(Object.values(r.hands).flat().map(x=>x.text));
      commit=()=>{const texts=helpers.drawResponses(room,2,excluded);
        s.pendingExtra??=new Map();s.pendingExtra.set(player.id,{until:Date.now()+10000,choices:texts.map((text,i)=>({id:helpers.cardId(room,player.id,text,`extra-${i}`),text}))});
        r.swaps.add(player.id);
      };break;
    }
    default:throw Error('Card effect not implemented.');
  }
  commit();
  if(c.tier==='Chaos')s.lastChaosRound=room.roundIndex;
  if(c.tier==='Tactical'&&scoreCards(c))s.roundTactics.set(player.id,{id,prediction:options.prediction,activatedAt:Date.now()});
  s.inventory.set(player.id,hand.filter(x=>x!==id));s.playedRound.add(player.id);s.plays.set(player.id,(s.plays.get(player.id)||0)+1);
  announce(room,c,player.name);record(room,'card_activated',{cardId:id});
}
function chooseExtra(room,player,drawId,replaceId,makeId){
  const s=state(room),r=room.round,pending=s?.pendingExtra?.get(player.id);
  if(!s?.enabled||room.phase!=='SUBMIT'||!pending||Date.now()>pending.until||(room.deadline!=null&&Date.now()>=room.deadline)||r.entries.some(e=>e.authorId===player.id))throw Error('Extra Helping has expired.');
  const choice=pending.choices.find(x=>x.id===drawId),hand=r.hands[player.id],slot=hand?.findIndex(x=>x.id===replaceId);
  if(!choice||slot<0||slot===undefined)throw Error('Choose your own card to replace and one drawn option.');
  hand[slot]={id:makeId(room,player.id,choice.text,'extra-taken'),text:choice.text};
  s.pendingExtra.delete(player.id);room.revision++;
  record(room,'card_resolved',{cardId:'TACT_EXTRA_HELPING'});
}
function publicView(room,viewerId,isTV){
  const s=state(room);if(!s?.enabled)return {enabled:false};
  const result={enabled:true,latest:s.lastEffect,activeEffects:s.effects.filter(x=>x.until>Date.now()).map(x=>({...x})),stageOrder:s.stageOrder||null,chaosUsed:s.lastChaosRound===room.roundIndex,spentOnce:[...s.once]};
  if(!isTV&&room.players.some(p=>p.id===viewerId)){
    result.inventory=(s.inventory.get(viewerId)||[]).map(id=>({...baseCard(cards[id]),...inspectPlay(room,room.players.find(p=>p.id===viewerId),cards[id])}));
    result.playedThisRound=s.playedRound.has(viewerId);
    result.rerolledThisRound=s.discardedRound.has(viewerId);
    result.playsUsed=s.plays.get(viewerId)||0;
    result.bonusRemaining=Math.max(0,40-(s.bonusUsed.get(viewerId)||0));
    const speed=s.roundTactics.get(viewerId);
    result.speedBonusUntil=speed?.id==='TACT_FAST_FINGERS'&&room.phase==='SUBMIT'&&!room.round.entries.some(e=>e.authorId===viewerId)?
      speed.activatedAt+(room.config.pace==='lively'?12000:20000):null;
    const extra=s.pendingExtra?.get(viewerId);result.extra=extra&&extra.until>Date.now()?{until:extra.until,choices:extra.choices}:null;
    const equal=s.roundEqualisers.get(viewerId)||s.pendingEqualisers.get(viewerId)?.cardId;
    result.equaliser=equal?baseCard(cards[equal]):null;
    result.contractWord=s.roundEqualisers.get(viewerId)==='EQUAL_CONTRACT'?s.contractWords?.get(viewerId)||null:null;
  }
  return result;
}
module.exports={cards,init,setEnabled,onMatchStart,atRoundStart,atRewriteStart,atSubmit,onResume,onResults,play,reroll,chooseExtra,publicView,inspectPlay};
