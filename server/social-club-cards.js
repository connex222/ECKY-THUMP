'use strict';
/** Six Social Club Game Cards, independent of the original 15-card game.
 * The server owns all timing, hand, score and eligibility decisions.
 */
const {randomInt}=require('node:crypto');
const LABELS=Object.freeze({
  DOUBLE_OR_NOWT:'DOUBLE OR NOWT',NICKED:'NICKED',HECKLE:'HECKLE',
  SECOND_CHANCE:'SECOND CHANCE',UNDERDOG:'UNDERDOG',POWER_CUT:'POWER CUT'
});
const TEXT=Object.freeze({
  DOUBLE_OR_NOWT:'Double your next duel score if you win; zero if you lose.',
  NICKED:'Nick 100 points from the leader.',
  HECKLE:'Add one short heckle under a revealed TV answer.',
  SECOND_CHANCE:'Replace one answer you have already submitted.',
  UNDERDOG:'The last-place regular gets +150 for winning the next duel.',
  POWER_CUT:'Black out the telly for three seconds before the reveal.'
});
const choices=['DOUBLE_OR_NOWT','NICKED','HECKLE','SECOND_CHANCE','POWER_CUT'];
function shuffled(items){const out=[...items];for(let i=out.length-1;i>0;i--){const j=randomInt(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
function init(room){room.social.cards={hand:new Map(),played:new Set(),effects:new Map(),moment:null,serial:0};}
function enabled(room){return !!room.config.gameCards&&!!room.social?.cards&&room.round?.type!=='FINAL';}
function moment(room,player,card,description){
  const c=room.social.cards;
  c.moment={serial:++c.serial,at:Date.now(),roundId:room.round.id,by:player.name,cardId:card,
    title:LABELS[card],description};
}
function onRound(room){
  const c=room.social?.cards;if(!c)return;
  c.hand.clear();c.played.clear();c.effects.clear();c.moment=null;
  if(!enabled(room))return;
  let deck=[];
  for(const p of room.players){
    if(!deck.length){const pool=room.round.type==='CARD'?['HECKLE','POWER_CUT']:choices.filter(x=>room.roundIndex>0||x!=='NICKED');deck=shuffled(pool);}
    c.hand.set(p.id,deck.shift());
  }
  if(room.roundIndex>0 && ['WIT','CONTEXT','DOUBLE'].includes(room.round.type)){
    const sorted=[...room.players].sort((a,b)=>a.score-b.score||a.joined-b.joined);
    // Require a genuinely last-place player; no arbitrary favour when all tied.
    if(sorted[0].score<sorted[1].score){
      const p=sorted[0];c.hand.set(p.id,null);c.played.add(p.id);
      c.effects.set(p.id,{id:'UNDERDOG',groupId:room.round.groups.find(g=>g.players.includes(p.id))?.id});
      moment(room,p,'UNDERDOG','The bottom of the table gets one shot at +150!');
    }
  }
}
function eligibility(room,player){
  const c=room.social?.cards,card=c?.hand.get(player.id),round=room.round;
  if(!enabled(room)||!card||c.played.has(player.id)||room.paused)return {playable:false};
  const own=round.groups.filter(g=>g.players.includes(player.id));
  const submitted=own.filter(g=>g.entries.has(player.id));
  if(card==='DOUBLE_OR_NOWT')return {playable:room.phase==='SUBMIT'&&submitted.length===0&&['WIT','CONTEXT','DOUBLE'].includes(round.type),card,targets:[]};
  if(card==='NICKED')return {playable:['ROUND_INTRO','SUBMIT'].includes(room.phase)&&room.players.some(p=>p.id!==player.id&&p.score>=100&&p.score>player.score),card,targets:[]};
  if(card==='SECOND_CHANCE')return {playable:room.phase==='SUBMIT'&&round.stage==='answer'&&['WIT','CONTEXT'].includes(round.type)&&submitted.length>0,
    card,targets:submitted.map(g=>({id:['CARD'].includes(round.type)?round.id:g.id,label:room.round.prompts.get(g.id)||room.round.prompt}))};
  if(card==='HECKLE'){
    const group=round.groups[round.groupIndex];
    return {playable:room.phase==='REVEAL'&&round.revealIndex>=0&&group.entries.size>0,
      card,targets:[...group.entries.values()].slice(0,round.revealIndex+1).filter(e=>!e.auto).map(e=>({id:e.id,label:e.text}))};
  }
  if(card==='POWER_CUT')return {playable:room.phase==='SUBMIT'&&round.stage==='answer',card,targets:[]};
  return {playable:false};
}
function play(room,player,card,options,validate){
  const c=room.social?.cards;
  if(!enabled(room)||room.paused||!c)throw Error('Game Cards are switched off for this round.');
  if(!Object.hasOwn(LABELS,card)||card==='UNDERDOG'||c.hand.get(player.id)!==card||c.played.has(player.id))
    throw Error('This Game Card is not in your hand.');
  const e=eligibility(room,player);
  if(!e.playable)throw Error('This Game Card cannot be played now.');
  const r=room.round;
  let description=TEXT[card];
  if(card==='DOUBLE_OR_NOWT'){
    const g=r.groups.find(g=>g.players.includes(player.id));
    if(!g)throw Error('There is no available duel.');
    c.effects.set(player.id,{id:card,groupId:g.id});
  }else if(card==='NICKED'){
    const leader=[...room.players].sort((a,b)=>b.score-a.score||a.joined-b.joined)[0];
    if(!leader||leader.id===player.id||leader.score<100||leader.score<=player.score)throw Error('There is no leader to nick points from.');
    leader.score-=100;player.score+=100;description=`100 points nicked from ${leader.name}!`;
  }else if(card==='HECKLE'){
    const item=e.targets.find(x=>x.id===options?.entryId);
    if(!item)throw Error('Choose an answer already revealed on the TV.');
    const text=validate(options?.text,room.config.rating);
    if([...text].length>80)throw Error('A heckle must be 80 characters or fewer.');
    r.heckles??=new Map();
    if(r.heckles.has(options.entryId))throw Error('That answer has already been heckled.');
    r.heckles.set(options.entryId,{text,by:player.name});
    description='A heckle has landed on the telly!';
  }else if(card==='SECOND_CHANCE'){
    const target=e.targets.find(t=>t.id===options?.taskId);
    if(!target)throw Error('Choose an answer you have already submitted.');
    const g=r.groups.find(g=>g.id===target.id|| (r.type==='CARD'&&g.players.includes(player.id)));
    const old=g?.entries.get(player.id);
    if(!old||old.auto)throw Error('That answer cannot be rewritten.');
    // Delegate value parsing to a caller-supplied *server* materialiser.
    const text=options.materialise(options.taskId,options.value);
    g.entries.set(player.id,{...old,text});
    description='One answer has been rewritten!';
  }else if(card==='POWER_CUT'){
    r.powerCutPending=true;description='The lights will go out before the next reveal!';
  }
  c.hand.set(player.id,null);c.played.add(player.id);
  moment(room,player,card,description);
  room.revision++;room.lastActivity=Date.now();
}
function applyAwards(room,group,awards){
  const c=room.social?.cards;
  if(!enabled(room)||!c||room.round.type==='FINAL')return;
  for(const award of awards){
    const effect=c.effects.get(award.authorId);
    if(!effect||effect.groupId!==group.id)continue;
    const opponent=awards.find(a=>a.authorId!==award.authorId);
    // Victory is measured using the normal award before these Game Card modifiers.
    const won=!!opponent&&!award.forfeit&&award.points>opponent.points;
    if(effect.id==='UNDERDOG'&&won){award.cardBonus=150;award.points+=150;}
    if(effect.id==='DOUBLE_OR_NOWT'){
      award.cardBonus=won?award.points:-award.points;
      award.points=won?award.points*2:0;
    }
    c.effects.delete(award.authorId);
  }
}
function publicView(room,viewerId,isTV){
  const c=room.social?.cards;
  const view={enabled:!!room.config.gameCards,available:['DOUBLE OR NOWT','NICKED','HECKLE','SECOND CHANCE','UNDERDOG','POWER CUT']};
  if(!c)return view;
  if(c.moment && Date.now()-c.moment.at<6000)view.moment=c.moment;
  if(!isTV){
    const player=room.players.find(p=>p.id===viewerId);
    if(player&&enabled(room)){
      const card=c.hand.get(player.id);
      if(card){const e=eligibility(room,player);view.hold={id:card,title:LABELS[card],description:TEXT[card],playable:e.playable,targets:e.targets||[]};}
    }
  }
  return view;
}
module.exports={LABELS,TEXT,init,onRound,eligibility,play,applyAwards,publicView};
