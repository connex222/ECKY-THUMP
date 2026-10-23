'use strict';
/** ECKY THUMP Social Club v2 engine — private preview until TV and phone clients ship.
 * Gameplay and voting are server-authoritative. No runtime dependencies.
 */
const crypto=require('node:crypto');
const {cardPrompts,witPrompts,contextPrompts,doublePrompts,finalPrompts,responses,finalWords,getPool}=require('./content');
const token=()=>crypto.randomBytes(12).toString('hex');
const pick=a=>a[crypto.randomInt(a.length)];
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=crypto.randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
const TITLES={CARD:'THE MEAT RAFFLE',WIT:'THE TURN',CONTEXT:'CROSSED WIRES',DOUBLE:'THE HARD SELL',FINAL:'LAST ORDERS'};
const RULES={CARD:'Choose a response card for the club raffle.',WIT:'Two punchlines for two different opponents.',CONTEXT:'Write an innocent line, then twist another contestant’s.',DOUBLE:'Pick a card and write a sales pitch twice.',FINAL:'Use the required word. Last Orders counts double.'};
const SCHEDULES={quick:['CARD','WIT','FINAL'],standard:['CARD','WIT','CONTEXT','DOUBLE','FINAL'],party:['CARD','WIT','CONTEXT','DOUBLE','WIT','FINAL']};
const ROUND_MS={CARD:90000,WIT:120000,CONTEXT:125000,DOUBLE:140000,FINAL:140000};
function touch(room){room.revision=(room.revision||0)+1;room.lastActivity=Date.now();}
function phase(room,name,ms=null){room.phase=name;room.social.phaseStartedAt=Date.now();room.deadline=ms===null?null:Date.now()+ms;touch(room);}
function unusedPrompt(room,pool){
  const all=[...new Set(getPool(pool,room.config.rating))];
  if(!all.length)throw Error('The chosen humour pack has no available prompts.');
  const fresh=all.filter(p=>!room.promptHistory.has(p));
  const value=pick(fresh.length?fresh:all);room.promptHistory.add(value);return value;
}
function pairings(players,roundToken){
  if(!Array.isArray(players)||players.length<3||players.length>12)throw Error('A Social Club needs 3–12 players.');
  const ids=players.map(p=>typeof p==='string'?p:p.id);
  if(new Set(ids).size!==ids.length)throw Error('Duplicate contestant identities.');
  const order=shuffle(ids);
  return order.map((id,i)=>({id:roundToken+'-'+i,players:[id,order[(i+1)%order.length]],entries:new Map(),ballots:new Map(),audienceBallots:new Map(),result:null}));
}
function responseHands(room,size){
  const pool=[...new Set(getPool(responses,room.config.rating))];
  const needed=room.players.length*size;
  if(pool.length<needed)throw Error('Not enough unique response cards for this room.');
  // Deal without repeats for an entire room until the pool is exhausted.
  const drawn=[],thisDeal=new Set();
  room.responseDeck??=shuffle(pool);
  while(drawn.length<needed){
    if(!room.responseDeck.length)room.responseDeck=shuffle(pool.filter(x=>!thisDeal.has(x)));
    const x=room.responseDeck.shift();
    if(!thisDeal.has(x)){drawn.push(x);thisDeal.add(x);}
  }
  return new Map(room.players.map((p,i)=>[p.id,drawn.slice(i*size,(i+1)*size).map(text=>({id:token(),text}))]));
}
function beginRound(room){
  const kind=room.playlist[room.roundIndex];
  const roundId=token(),multi=['WIT','CONTEXT','DOUBLE'].includes(kind);
  const matchups=multi?pairings(room.players,roundId):[];
  const promptPool={CARD:cardPrompts,WIT:witPrompts,CONTEXT:contextPrompts,DOUBLE:doublePrompts,FINAL:finalPrompts}[kind];
  const text=unusedPrompt(room,promptPool);
  const promptById=new Map();
  if(multi)for(const m of matchups)promptById.set(m.id,unusedPrompt(room,promptPool));
  let groups=matchups;
  if(!multi){
    const order=shuffle(room.players.map(p=>p.id));
    const drums=order.length>8?[order.slice(0,Math.ceil(order.length/2)),order.slice(Math.ceil(order.length/2))]:[order];
    groups=drums.map((members,i)=>({id:roundId+'-drum-'+i,players:members,entries:new Map(),ballots:new Map(),audienceBallots:new Map(),result:null}));
  }
  room.round={id:roundId,type:kind,prompt:text,requiredWord:kind==='FINAL'?unusedPrompt(room,finalWords):null,
    startedAt:Date.now(),stage:'intro',groups,groupIndex:0,revealIndex:0,prompts:promptById,
    seeds:new Map(),hands:['CARD','DOUBLE'].includes(kind)?responseHands(room,kind==='CARD'?7:5):new Map(),
    scored:false,readyForNext:new Set()};
  room.paused=false;room.pauseRemaining=null;room.social.groupResults=[];
  phase(room,'ROUND_INTRO',6000);
}
function start(room){
  if(room.phase!=='LOBBY')throw Error('The game has already started.');
  if(room.players.length<3)throw Error('You need at least three contestants.');
  room.config.gameCards=false;
  room.social={version:2,phaseStartedAt:Date.now(),groupResults:[],lastChampion:null};
  room.playlist=[...SCHEDULES[room.config.length]];
  room.roundIndex=0;
  for(const p of room.players){p.score=0;p.firsts=0;}
  beginRound(room);
}
function expected(room,playerId){
  const r=room.round;if(!r)return [];
  if(['CARD','FINAL'].includes(r.type))return [{id:r.id,kind:r.type,prompt:r.prompt,requiredWord:r.requiredWord}];
  return r.groups.filter(g=>g.players.includes(playerId)).map(g=>({id:g.id,kind:r.type,prompt:r.prompts.get(g.id),requiredWord:null}));
}
function submitSeed(room,player,text,validate){
  const r=room.round;
  if(r?.type!=='CONTEXT'||!r.seeds||!room.players.includes(player))throw Error('The seed is not assigned to you.');
  const value=validate(text,room.config.rating),prior=r.seeds.get(player.id);
  if(prior){if(prior===value)return;throw Error('Your seed is already locked in.');}
  if(room.phase!=='SUBMIT'||r.stage!=='seed'||room.paused)throw Error('This is not the seed-writing stage.');
  if(room.deadline&&Date.now()>=room.deadline)throw Error('Seed-writing has finished.');
  r.seeds.set(player.id,value);touch(room);
  if(r.seeds.size===room.players.length)startRewrite(room);
}
function startRewrite(room){
  const r=room.round;
  if(r.type!=='CONTEXT'||r.stage!=='seed')throw Error('No seed stage to finish.');
  // Matchup i is (i,i+1); assign seed author i+2 around the same ring.
  // Each seed is used exactly once and never belongs to either rewriter.
  for(let i=0;i<r.groups.length;i++){
    const g=r.groups[i],authorId=r.groups[(i+1)%r.groups.length].players[1];
    if(g.players.includes(authorId))throw Error('Unsafe seed assignment.');
    r.prompts.set(g.id,r.seeds.get(authorId)||'An innocent story about the club raffle.');
  }
  r.stage='answer';phase(room,'SUBMIT',ROUND_MS.CONTEXT);
}
function startSubmit(room){
  const r=room.round;
  if(room.phase!=='ROUND_INTRO')throw Error('Wait for the round introduction.');
  r.stage=r.type==='CONTEXT'?'seed':'answer';
  phase(room,'SUBMIT',r.stage==='seed'?45000:ROUND_MS[r.type]);
}
function materialise(room,player,taskId,value,validate){
  const r=room.round;
  if(r.type==='CARD'){
    if(typeof value!=='string')throw Error('Choose a card from your hand.');
    const held=r.hands.get(player.id)?.find(c=>c.id===value);
    if(!held)throw Error('That response card is not in your hand.');
    return held.text;
  }
  if(r.type==='DOUBLE'){
    const card=r.hands.get(player.id)?.find(c=>c.id===value?.cardId);
    if(!card)throw Error('Choose a card from your hand.');
    return card.text+' — '+validate(value?.line,room.config.rating);
  }
  const text=validate(value,room.config.rating);
  if(r.type==='FINAL'&&!new RegExp('(?:^|[^\\p{L}])'+r.requiredWord.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[^\\p{L}])','iu').test(text))
    throw Error('Your Last Orders answer must contain the required word.');
  return text;
}
function submit(room,player,taskId,value,validate){
  const r=room.round;
  if(!r||!room.players.includes(player))throw Error('No active prompt for this contestant.');
  const task=expected(room,player.id).find(t=>t.id===taskId);
  if(!task)throw Error('This prompt is not assigned to you.');
  const group=r.groups.find(g=>g.id===taskId||(['CARD','FINAL'].includes(r.type)&&g.players.includes(player.id)));
  const text=materialise(room,player,taskId,value,validate);
  const prior=group.entries.get(player.id);
  // Repeated network delivery of an identical locked answer is harmless.
  if(prior&&!prior.auto){if(prior.text===text)return;throw Error('Your answer is already locked in.');}
  if(room.phase!=='SUBMIT'||r.stage!=='answer'||room.paused)throw Error('Answers are not open.');
  if(room.deadline&&Date.now()>=room.deadline)throw Error('Submission deadline has passed.');
  group.entries.set(player.id,{id:token(),authorId:player.id,text,auto:false});touch(room);
  if(allSubmitted(room))endSubmission(room);
}
function allSubmitted(room){
  const r=room.round;return room.players.every(p=>expected(room,p.id).every(t=>{
    const g=r.groups.find(g=>g.id===t.id||(['CARD','FINAL'].includes(r.type)&&g.players.includes(p.id)));
    return !!g?.entries.has(p.id);
  }));
}
function endSubmission(room){
  const r=room.round;if(room.phase!=='SUBMIT'||r.stage!=='answer')throw Error('No answer stage to finish.');
  for(const g of r.groups)for(const id of g.players)if(!g.entries.has(id))g.entries.set(id,{id:token(),authorId:id,text:"Our Maureen couldn't read their handwriting",auto:true});
  r.groupIndex=0;reveal(room);
}
function reveal(room){const r=room.round;r.revealIndex=0;phase(room,'REVEAL',2700);}
function revealNext(room){
  const r=room.round,g=r.groups[r.groupIndex];
  if(room.phase!=='REVEAL')throw Error('No reveal in progress.');
  if(r.revealIndex+1<g.entries.size){r.revealIndex++;phase(room,'REVEAL',2700);return;}
  phase(room,'VOTE',15000);
}
function audienceTarget(room,group){return group.entries.size>0;}
function playerEligible(room,p,group){
  if(['WIT','CONTEXT','DOUBLE'].includes(room.round.type))return !group.players.includes(p.id);
  if(room.round.groups.length===1)return true;
  // Opposite drum only: exactly one ballot per contestant in a 9–12-player round.
  return !group.players.includes(p.id);
}
function vote(room,person,entryId,{audience=false}={}){
  const r=room.round,g=r?.groups[r.groupIndex];
  if(!g)throw Error('No ballot is open.');
  if(audience){if(!room.audience.includes(person))throw Error('Audience session not found.');}
  else if(!room.players.includes(person)||!playerEligible(room,person,g))throw Error('You cannot vote in this matchup.');
  const ballots=audience?g.audienceBallots:g.ballots;
  const prior=ballots.get(person.id);
  // An exact late retry is harmless, even if early-close has changed phase.
  if(prior){if(prior===entryId)return;throw Error('Your ballot is locked.');}
  if(room.phase!=='VOTE'||room.paused||Date.now()>=(room.deadline??Infinity))throw Error('Voting has closed.');
  const entries=[...g.entries.values()].filter(e=>!e.auto);
  const candidate=entries.find(e=>e.id===entryId);
  if(!candidate)throw Error('Choose a valid submitted answer.');
  if(!audience&&candidate.authorId===person.id)throw Error('You cannot vote for your own answer.');
  ballots.set(person.id,entryId);touch(room);
  if(!audience){
    const eligible=room.players.filter(p=>playerEligible(room,p,g)&&entries.some(e=>e.authorId!==p.id));
    if(eligible.every(p=>ballots.has(p.id)))endVoting(room);
  }
}
function scoreGroup(room,g){
  const entries=[...g.entries.values()],valid=entries.filter(e=>!e.auto),counts=new Map(entries.map(e=>[e.id,0]));
  const audienceCount=g.audienceBallots.size,weight=Math.min(2,audienceCount/3);
  for(const choice of g.ballots.values())if(counts.has(choice))counts.set(choice,counts.get(choice)+1);
  for(const choice of g.audienceBallots.values())if(counts.has(choice)&&audienceCount)counts.set(choice,counts.get(choice)+weight/audienceCount);
  const total=[...counts.values()].reduce((a,b)=>a+b,0);
  const isHeadToHead=['WIT','CONTEXT','DOUBLE'].includes(room.round.type);
  const winner=isHeadToHead&&valid.length===1?valid[0]:null;
  // All *eligible* player voters for this entrant must have chosen them.
  // Their own mandatory raffle vote cannot count against their unanimity.
  const unanimityFor=e=>{
    const nonself=[...g.ballots].filter(([voter])=>voter!==e.authorId).length;
    return valid.length>=2&&nonself>=2&&counts.get(e.id)>0&&
      Math.abs(counts.get(e.id)-(nonself+weight))<1e-9;
  };
  const awards=[];
  for(const e of entries){
    let base=0;
    if(!e.auto){
      if(winner)base=1000;
      else if(['CARD','FINAL'].includes(room.round.type))base=[...g.ballots.values()].filter(id=>id===e.id).length*300;
      else if(valid.length>=2&&total>0){
        // Two-player head-to-head, floor A and remainder B; fixed 1,000-point pool.
        const a=valid[0],first=Math.floor(1000*counts.get(a.id)/total);
        base=e.id===a.id?first:1000-first;
      }
    }
    if(['CARD','FINAL'].includes(room.round.type)){
      const aVotes=[...g.audienceBallots.values()].filter(id=>id===e.id).length;
      base+=(audienceCount?Math.round(weight*aVotes/audienceCount*300):0);
    }
    const isUnanimous=!e.auto&&unanimityFor(e);
    const multiplier=room.round.type==='FINAL'?2:1;
    const bonus=isUnanimous?250:0;
    const points=base*multiplier+bonus;
    awards.push({entryId:e.id,authorId:e.authorId,base,bonus,points,forfeit:e.auto,voteWeight:counts.get(e.id),unanimous:isUnanimous});
  }
  for(const award of awards){
    const player=room.players.find(p=>p.id===award.authorId);
    if(player){player.score+=award.points;if(award.unanimous)player.firsts++;}
  }
  return {id:g.id,awards,counts:Object.fromEntries(counts),ballots:g.ballots.size,audienceBallots:g.audienceBallots.size,
    slam:awards.some(x=>x.unanimous),kind:room.round.type};
}
function endVoting(room){
  if(room.phase!=='VOTE')throw Error('There is no ballot to close.');
  const g=room.round.groups[room.round.groupIndex];
  if(!g.result){g.result=scoreGroup(room,g);room.social.groupResults.push(g.result);}
  phase(room,'MATCHUP_RESULT',4500);
}
function report(room,person,entryId){
  if(room.phase!=='VOTE')throw Error('You can only report an answer while voting is open.');
  const group=room.round.groups[room.round.groupIndex];
  if(![...group.entries.values()].some(e=>e.id===entryId&&!e.auto))throw Error('That answer is unavailable.');
  const existing=room.reports.filter(item=>item.roundId===room.round.id&&item.by===person.id);
  if(existing.length>=3)throw Error('You have reached the report limit for this round.');
  room.reports.push({by:person.id,roundId:room.round.id,entryId,reason:'inappropriate answer',at:Date.now()});
  touch(room);
}
function hide(room,entryId){
  if(room.phase!=='VOTE')throw Error('The host can hide entries only before voting finishes.');
  const group=room.round.groups[room.round.groupIndex];
  const selected=[...group.entries.values()].find(e=>e.id===entryId&&!e.auto);
  if(!selected)throw Error('That answer cannot be hidden.');
  group.entries.set(selected.authorId,{...selected,auto:true,hidden:true,text:'This entry was hidden by the host.'});
  group.ballots.clear();group.audienceBallots.clear();
  phase(room,'VOTE',15000);
}
function skip(room){
  if(!['ROUND_INTRO','SUBMIT','REVEAL','VOTE','MATCHUP_RESULT'].includes(room.phase))throw Error('Only an active round can be skipped.');
  room.paused=false;room.pauseRemaining=null;
  room.round.scored=true;room.round.skipped=true;
  // Scores from earlier matchups remain authoritative; nothing unplayed scores.
  phase(room,'ROUND_SCORES',null);
}
function nextResult(room){
  if(room.phase!=='MATCHUP_RESULT')throw Error('No completed matchup to advance.');
  if(room.round.groupIndex+1<room.round.groups.length){room.round.groupIndex++;reveal(room);return;}
  room.round.scored=true;phase(room,'ROUND_SCORES',room.config.pace==='relaxed'?null:6500);
}
function nextRound(room){
  if(room.phase==='CHAMPION'){phase(room,'COMPLETE',null);return;}
  if(room.phase!=='ROUND_SCORES')throw Error('Wait for the scores.');
  if(room.roundIndex+1===room.playlist.length){
    room.social.lastChampion=[...room.players].sort((a,b)=>b.score-a.score||a.joined-b.joined)[0]?.id;
    phase(room,'CHAMPION',room.config.pace==='relaxed'?null:8000);return;
  }
  room.roundIndex++;beginRound(room);
}
function tick(room){
  if(!room.social||room.paused||!room.deadline||Date.now()<room.deadline)return false;
  switch(room.phase){
    case 'ROUND_INTRO':startSubmit(room);break;
    case 'SUBMIT':if(room.round.stage==='seed')startRewrite(room);else endSubmission(room);break;
    case 'REVEAL':revealNext(room);break;
    case 'VOTE':endVoting(room);break;
    case 'MATCHUP_RESULT':nextResult(room);break;
    case 'ROUND_SCORES':nextRound(room);break;
    case 'CHAMPION':nextRound(room);break;
    default:return false;
  }
  return true;
}
function pause(room){
  if(!room.social||room.paused||!['ROUND_INTRO','SUBMIT','REVEAL','VOTE','MATCHUP_RESULT'].includes(room.phase))throw Error('Cannot pause this stage.');
  room.pauseRemaining=Math.max(0,(room.deadline||Date.now())-Date.now());
  room.paused=true;room.deadline=null;room.social.pausedAt=Date.now();touch(room);
}
function resume(room){
  if(!room.social||!room.paused)throw Error('The show is not paused.');
  room.social.phaseStartedAt+=Date.now()-room.social.pausedAt;
  room.paused=false;room.deadline=Date.now()+room.pauseRemaining;
  room.pauseRemaining=null;room.social.pausedAt=null;touch(room);
}
function playAgain(room){
  if(room.phase!=='COMPLETE')throw Error('Finish this show first.');
  room.social=null;room.round=null;room.phase='LOBBY';room.deadline=null;room.roundIndex=-1;room.playlist=[];
  room.paused=false;room.pauseRemaining=null;
  for(const p of room.players){p.score=0;p.firsts=0;}
  touch(room);
}
function snapshot(room,viewerId,isTV=false){
  const r=room.round,s=room.social,player=room.players.find(p=>p.id===viewerId),aud=room.audience.find(p=>p.id===viewerId);
  const base={mode:'social-club-v2',code:room.code,revision:room.revision,serverNow:Date.now(),phase:room.phase,
    deadline:room.deadline,paused:room.paused,roundNumber:room.roundIndex+1,totalRounds:room.playlist.length,
    title:r?TITLES[r.type]:null,rule:r?RULES[r.type]:null,config:room.config,
    tv:isTV,players:room.players.map(p=>({id:p.id,name:p.name,avatar:p.avatar,score:p.score,online:p.online})),
    you:isTV?null:player?{id:player.id,name:player.name,avatar:player.avatar,isHost:room.ownerId===player.id,role:'player'}:
      aud?{id:aud.id,name:aud.name,role:'audience'}:null};
  if(!r)return base;
  base.round={id:r.id,type:r.type,stage:r.stage,prompt:r.prompt,requiredWord:r.requiredWord,groupIndex:r.groupIndex,
    totalGroups:r.groups.length,answerCount:r.groups.reduce((n,g)=>n+[...g.entries.values()].filter(x=>!x.auto).length,0)};
  // Public activity indicators, never private text or hidden author identity.
  // These fields help the television light up avatars as answers arrive.
  if(isTV && room.phase==='SUBMIT'){
    base.round.submittedPlayerIds=room.round.stage==='seed'
      ? [...r.seeds.keys()]
      : room.players.filter(p=>expected(room,p.id).every(t=>{
          const group=r.groups.find(g=>g.id===t.id||(['CARD','FINAL'].includes(r.type)&&g.players.includes(p.id)));
          return !!group?.entries.has(p.id);
        })).map(p=>p.id);
  }
  if(player&&room.phase==='SUBMIT'){
    base.round.tasks=r.stage==='seed'?[{id:r.id,prompt:'Write one innocent line.',submitted:r.seeds.has(player.id)}]:expected(room,player.id).map(t=>{
      const g=r.groups.find(g=>g.id===t.id||(['CARD','FINAL'].includes(r.type)&&g.players.includes(player.id)));
      return {...t,submitted:!!g?.entries.has(player.id)};
    });
    if(r.hands.has(player.id))base.round.hand=r.hands.get(player.id);
  }
  if(['REVEAL','VOTE','MATCHUP_RESULT','ROUND_SCORES','CHAMPION','COMPLETE'].includes(room.phase)){
    const g=r.groups[r.groupIndex];
    // Authors and vote tallies stay secret until voting closes.
    const revealed=room.phase==='REVEAL'?[...g.entries.values()].slice(0,r.revealIndex+1):[...g.entries.values()];
    base.round.visibleAnswers=revealed.map((e,i)=>({id:e.id,letter:String.fromCharCode(65+i),text:e.text,
      ...(['MATCHUP_RESULT','ROUND_SCORES','CHAMPION','COMPLETE'].includes(room.phase)?{authorId:e.authorId,authorName:room.players.find(p=>p.id===e.authorId)?.name,avatar:room.players.find(p=>p.id===e.authorId)?.avatar}: {})}));
    if(room.phase==='VOTE'&&isTV){
      const eligible=room.players.filter(p=>playerEligible(room,p,g)&&
        [...g.entries.values()].some(e=>!e.auto&&e.authorId!==p.id));
      base.round.voteProgress={cast:g.ballots.size,eligible:eligible.length};
    }
    if(room.phase==='VOTE'){
      const hasVoted=(player?g.ballots:aud?g.audienceBallots:new Map()).has(viewerId);
      const eligible=!!(player&&playerEligible(room,player,g)||aud);
      base.round.vote={eligible,voted:hasVoted,groupId:g.id,choices:[...g.entries.values()].filter(e=>!e.auto&&(!player||e.authorId!==player.id)).map(e=>({id:e.id,text:e.text}))};
    }
    if(g.result&&room.phase!=='VOTE')base.round.result=g.result;
  }
  if(['ROUND_SCORES','CHAMPION','COMPLETE'].includes(room.phase))base.round.standings=[...room.players].sort((a,b)=>b.score-a.score).map(p=>({id:p.id,name:p.name,avatar:p.avatar,score:p.score}));
  if(['CHAMPION','COMPLETE'].includes(room.phase))base.champion=s.lastChampion;
  return base;
}
module.exports={TITLES,RULES,SCHEDULES,pairings,beginRound,start,submitSeed,submit,startSubmit,startRewrite,endSubmission,
  revealNext,vote,scoreGroup,endVoting,report,hide,skip,nextResult,nextRound,tick,pause,resume,playAgain,snapshot,expected};
