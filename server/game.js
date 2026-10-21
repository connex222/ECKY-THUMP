'use strict';
const crypto = require('node:crypto');
const {validateAvatar}=require('./avatars');
const powers=require('./game-cards');
const telemetry=require('./telemetry');
const { cardPrompts, witPrompts, contextPrompts, doublePrompts, finalPrompts, seedFallbacks, responses, finalWords, contracts, getPool } = require('./content');

const ROLES = ['clean', 'cheeky', 'adult'];
const SECRET = () => crypto.randomBytes(32).toString('base64url');
const hash = secret => crypto.createHash('sha256').update(secret).digest('hex');
const randomId = () => crypto.randomBytes(9).toString('hex');
const randomPick = list => list[crypto.randomInt(list.length)];
const mix = list => {
  const out = [...list];
  for (let i=out.length-1; i>0; i--) {
    const j=crypto.randomInt(i+1);
    [out[i],out[j]] = [out[j],out[i]];
  }
  return out;
};
const roundHalfUp = n => Math.floor(n+0.5);
function scoreEntries(entries, ballots, multiplier = 1) {
  const active = entries.filter(x => !x.hidden);
  const weights = new Map(active.map(x => [x.id, { gold:0, silver:0, weight:0 }]));
  for (const ballot of ballots) {
    if (!weights.has(ballot.gold) || !weights.has(ballot.silver) || ballot.gold === ballot.silver) continue;
    if (active.some(x => x.authorId === ballot.voterId && (x.id === ballot.gold || x.id === ballot.silver))) continue;
    const gold=weights.get(ballot.gold), silver=weights.get(ballot.silver);
    gold.gold++; gold.weight+=2; silver.silver++; silver.weight++;
  }
  const ordered = [...active].sort((a,b) => weights.get(b.id).weight - weights.get(a.id).weight || a.id.localeCompare(b.id));
  const scored=[];
  for(let i=0; i<ordered.length;) {
    let j=i+1;
    while (j<ordered.length && weights.get(ordered[j].id).weight === weights.get(ordered[i].id).weight) j++;
    const base = Array.from({length:j-i}, (_,k) => ([100,60][i+k] ?? 25)).reduce((a,b)=>a+b,0)/(j-i);
    for(let k=i;k<j;k++) {
      const entry=ordered[k], stats=weights.get(entry.id);
      scored.push({entryId:entry.id, authorId:entry.authorId, rank:i+1, isJoint:j-i>1, points:roundHalfUp(base)*multiplier, ...stats});
    }
    i=j;
  }
  return scored;
}
function validateName(name) {
  if (typeof name !== 'string') throw Error('Enter a nickname.');
  const text=name.trim().replace(/\s+/g,' ');
  if (text.length<2 || [...text].length>22 || /[<>\u0000-\u001f]/.test(text)) throw Error('Nicknames must be 2–22 characters without special markup.');
  if (/https?:|www\.|@/.test(text)) throw Error('Links and contact details are not allowed as nicknames.');
  return text;
}
const segmenter=new Intl.Segmenter('en', {granularity:'grapheme'});
function validateAnswer(input, rating='clean') {
  if (typeof input !== 'string') throw Error('Please type an answer.');
  const text=input.trim().replace(/\s+/g,' ');
  const len=[...segmenter.segment(text)].length;
  if (len<3 || len>160) throw Error('Answers must be between 3 and 160 characters.');
  if (/[<>\u0000-\u001f]/.test(text)) throw Error('Markup and control characters are not allowed.');
  if (/(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|co\.uk|io)\b|\b[^\s@]+@[^\s@]+\.[^\s@]+\b)/i.test(text)) throw Error('Links and contact details are not allowed.');
  if (/(?:\+?\d[\s().-]*){10,}/.test(text)) throw Error('Phone numbers are not allowed.');
  if (/\b(?:kill yourself|kys|i will kill you|i'm going to kill you)\b/i.test(text)) throw Error('Threatening language is not allowed.');
  // A small, deliberately conservative prefilter only. NOT a complete moderation solution.
  if (rating === 'clean' && /\b(?:fuck|fucking|fucked|shit|shitty|bitch|bitches|wank|wanker|cunt|dick|dicks|cock|cocks|asshole|arsehole|bollocks)\b/i.test(text))
    throw Error('Please keep your answer suitable for Clean humour.');
  if (rating === 'cheeky' && /\b(?:cunt|fucking|fucked|motherfucker|motherfucking)\b/i.test(text))
    throw Error('That wording is beyond the Cheeky rating.');
  return text;
}
function newRoom({name, rating='clean', length='party', pace='relaxed', gameCards=false, adultConfirmed=false,avatar}) {
  if (!ROLES.includes(rating)) throw Error('Invalid humour setting.');
  if (!['quick','standard','party'].includes(length)) throw Error('Invalid game length.');
  if (!['relaxed','lively'].includes(pace)) throw Error('Invalid party pace.');
  if (typeof gameCards!=='boolean') throw Error('Game Cards setting must be on or off.');
  if (rating === 'adult' && !adultConfirmed) throw Error('The host must confirm all players are adults.');
  const hostName=validateName(name);
  const secret=SECRET(); const id=randomId();
  const room={
    code:'', created:Date.now(), lastActivity:Date.now(), config:{rating,length,pace,gameCards}, phase:'LOBBY',
    ownerId:id, displayHashes:[], players:[{id,name:hostName,avatar:validateAvatar(avatar),tokenHash:hash(secret),adultConfirmed:!!adultConfirmed,ready:true,online:false,joined:0,score:0,firsts:0,golds:0,silvers:0}],
    audience:[], chaosEvents:[], chaosVotes:new Map(), chaosSerial:0,
    playlist:[], roundIndex:-1, round:null, deadline:null, paused:false, pauseRemaining:null, pauses:0,
    revision:1, promptHistory:new Set(), responseDeck:null, responseDealt:0, results:[], events:new Set(), reports:[], finishedAt:null,
  };
  powers.init(room);
  return {room,id,secret};
}
function addPlayer(room, name, adultConfirmed=false,avatar) {
  if (room.phase!=='LOBBY') throw Error('This match has started. Join the next game.');
  if (room.players.length>=12) throw Error('This room is full.');
  if (room.config.rating==='adult' && !adultConfirmed) throw Error('Confirm that you are an adult to join this room.');
  const safe=validateName(name);
  if ([...room.players,...room.audience].some(p=>p.name.toLowerCase()===safe.toLowerCase())) throw Error('This nickname is already taken.');
  const id=randomId(),secret=SECRET();
  const nextJoined=Math.max(-1,...room.players.map(p=>p.joined))+1;
  room.players.push({id,name:safe,avatar:validateAvatar(avatar),tokenHash:hash(secret),adultConfirmed:!!adultConfirmed,ready:true,online:false,joined:nextJoined,score:0,firsts:0,golds:0,silvers:0});
  room.revision++;
  return {id,secret};
}
// Audience participants have their own authenticated sessions, never an avatar key,
// private hand, answer, vote, or right to host controls.
function addAudience(room,name,adultConfirmed=false) {
  if(room.audience.length>=30)throw Error('The audience balcony is full (30 people).');
  if(room.config.rating==='adult'&&!adultConfirmed)throw Error('Confirm you are 18 or older to watch After Dark.');
  const safe=validateName(name);
  if([...room.players,...room.audience].some(p=>p.name.toLowerCase()===safe.toLowerCase()))throw Error('This nickname is already taken.');
  const id=randomId(),secret=SECRET();
  room.audience.push({id,name:safe,tokenHash:hash(secret),adultConfirmed:!!adultConfirmed,online:false,lastChaosAt:0});
  room.revision++;
  return {id,secret,role:'audience'};
}
function findAudience(room,secret) {
  if(typeof secret!=='string'||secret.length>100)return null;
  const digest=Buffer.from(hash(secret));
  return room.audience.find(p=>crypto.timingSafeEqual(digest,Buffer.from(p.tokenHash)))||null;
}
function consentAfterDark(room,person) {
  if(room.phase!=='LOBBY')throw Error('Rating consent is available only in the lobby.');
  person.adultConfirmed=true;room.revision++;
}
function setLobbyRating(room,rating) {
  if(room.phase!=='LOBBY')throw Error('Rating cannot change after the game has started.');
  if(!['clean','adult'].includes(rating))throw Error('Choose Family Friendly or After Dark.');
  if(rating==='adult'&&[...room.players,...room.audience].some(p=>!p.adultConfirmed))
    throw Error('Everyone must tap “I am 18+” on their own controller before After Dark can be enabled.');
  if(room.config.rating===rating)return;
  room.config.rating=rating;
  room.promptHistory=new Set();room.responseDeck=null;
  room.revision++;
}
const CHAOS_MODIFIERS=Object.freeze(['pudding-rain','pier-panic','crowd-roar']);
const CHAOS_ACTIONS=Object.freeze(['pudding','wrench','shake']);
// Cosmetic-only chaos: no score, phase, deadline, RNG or submission mutation.
function audienceChaos(room,person,kind,targetId) {
  if(!['SEED','SUBMIT','VOTE','RESULTS'].includes(room.phase))throw Error('Wait for the show to begin.');
  if(!CHAOS_ACTIONS.includes(kind))throw Error('Unknown chaos trick.');
  if(targetId!==undefined&&targetId!==null&&!room.players.some(p=>p.id===targetId))throw Error('Choose a current contestant.');
  const now=Date.now();
  if(now-person.lastChaosAt<8000)throw Error('Give the black pudding a rest for eight seconds!');
  person.lastChaosAt=now;
  const event={id:++room.chaosSerial,kind,targetId:targetId||null,by:person.name,at:now};
  room.chaosEvents.push(event);
  room.chaosEvents=room.chaosEvents.filter(e=>now-e.at<11000).slice(-8);
  room.revision++;
}
function audienceVote(room,person,modifier) {
  if(!['SEED','SUBMIT','VOTE'].includes(room.phase))throw Error('Audience votes open during active rounds.');
  if(!CHAOS_MODIFIERS.includes(modifier))throw Error('Unknown chaos modifier.');
  const now=Date.now();
  if(person.lastVoteAt&&now-person.lastVoteAt<1800)throw Error('The audience poll needs a moment.');
  if(room.chaosVotes.get(person.id)===modifier)return;
  person.lastVoteAt=now;room.chaosVotes.set(person.id,modifier);room.revision++;
}
function chaosSummary(room) {
  const tally=Object.fromEntries(CHAOS_MODIFIERS.map(k=>[k,0]));
  for(const vote of room.chaosVotes.values())if(vote in tally)tally[vote]++;
  const result=CHAOS_MODIFIERS.reduce((best,key)=>tally[key]>tally[best]?key:best,CHAOS_MODIFIERS[0]);
  return {options:CHAOS_MODIFIERS,tally,leader:room.chaosVotes.size?result:null,events:room.chaosEvents.filter(e=>Date.now()-e.at<11000).slice(-6)};
}
function setAvatar(room, player,avatar){if(room.phase!=='LOBBY')throw Error('Avatars can only be changed between matches.');player.avatar=validateAvatar(avatar);room.revision++;}
function removePlayer(room, id) {
  if(room.phase!=='LOBBY') throw Error('Players can only be removed between games.');
  if(id===room.ownerId) throw Error('The host cannot remove themselves.');
  const index=room.players.findIndex(p=>p.id===id);
  if(index<0) throw Error('That friend is not in the room.');
  room.players.splice(index,1);room.revision++;
  return id;
}
function findPlayer(room, secret) {
  if (typeof secret!=='string' || secret.length>100) return null;
  const digest=hash(secret);
  return room.players.find(p => crypto.timingSafeEqual(Buffer.from(digest),Buffer.from(p.tokenHash))) || null;
}
function verifyDisplay(room,secret) {
  if (typeof secret!=='string' || secret.length>100) return false;
  const digest=Buffer.from(hash(secret));
  return room.displayHashes.some(stored=>crypto.timingSafeEqual(digest,Buffer.from(stored)));
}
function mintDisplay(room) {
  const secret=SECRET();
  room.displayHashes.push(hash(secret));
  // Private games nights can have a TV at each home. Creating another link never
  // invalidates earlier ones until the five-link limit is exceeded.
  if(room.displayHashes.length>5)room.displayHashes.shift();
  return secret;
}
function allSubmitted(room) {return room.players.every(p => room.round.entries.some(e => e.authorId===p.id));}
function liveCandidates(room) {return room.round.entries.filter(e=>!e.hidden);}
// One shuffled response deck per private room. Refill only after exhaustion,
// excluding cards already dealt in the current round. Keeps every player's
// private hand disjoint even at the shuffle boundary.
function drawResponses(room, count, exclude=new Set()) {
  const pool=getPool(responses,room.config.rating);
  if (pool.length<count) throw Error(`Content pool needs ${count} unique response cards.`);
  if (!room.responseDeck) room.responseDeck=mix([...new Set(pool)]);
  const drawn=[];
  while (drawn.length<count) {
    if (!room.responseDeck.length) room.responseDeck=mix(pool.filter(text=>!drawn.includes(text)&&!exclude.has(text)));
    const text=room.responseDeck.shift();
    if (exclude.has(text)) continue;
    if (text&&!drawn.includes(text)) drawn.push(text);
  }
  room.responseDealt=(room.responseDealt||0)+count;
  return drawn;
}
function promptFrom(room, pool) {
  const unused=pool.filter(p=>!room.promptHistory.has(p));
  const next=randomPick(unused.length ? unused:pool);room.promptHistory.add(next);return next;
}
const LABELS={CARD:'CARD CLASH',WIT:'QUICK WIT',CONTEXT:'CONTEXT COLLAPSE',DOUBLE:'DOUBLE TROUBLE',FINAL:'THE LAST LAUGH'};
function roundClock(room,type,stage='SUBMIT') {
  const relaxed=room.config.pace==='relaxed';
  if(stage==='SEED') return relaxed?80:45;
  if(type==='CARD')return relaxed?90:45;
  if(type==='DOUBLE')return relaxed?140:85;
  if(type==='CONTEXT')return relaxed?125:75;
  if(type==='FINAL')return relaxed?140:85;
  return relaxed?120:70;
}
function startRound(room) {
  const type=room.playlist[room.roundIndex],rating=room.config.rating;
  const prompts={CARD:cardPrompts,WIT:witPrompts,CONTEXT:contextPrompts,DOUBLE:doublePrompts,FINAL:finalPrompts};
  const prompt=promptFrom(room,getPool(prompts[type],rating));
  const hands={};
  if (type==='CARD'||type==='DOUBLE') {
    const count=type==='CARD'?7:5;
    const allCards=drawResponses(room,room.players.length*count);
    for(let pos=0;pos<room.players.length;pos++) {
      const p=room.players[pos],hand=allCards.slice(pos*count,(pos+1)*count);
      hands[p.id]=hand.map((text,i)=>({id:hash(`${room.code}:${room.roundIndex}:${p.id}:${i}:${text}`).slice(0,18),text}));
    }
  }
  const stage=type==='CONTEXT'?'SEED':'SUBMIT';
  const requiredWord=type==='FINAL'?promptFrom(room,getPool(finalWords,rating)):null;
  const contractText=requiredWord?`Your answer MUST contain: ${requiredWord.toUpperCase()}`:
    type==='WIT'?promptFrom(room,getPool(contracts,rating)):null;
  room.chaosVotes.clear();room.chaosEvents=[];
  room.round={id:randomId(),type,prompt,contract:contractText,requiredWord,
    hands,swaps:new Set(),seeds:new Map(),assignments:new Map(),entries:[],ballots:new Map(),readyForNext:new Set(),awards:[],startedAt:Date.now(),scored:false,skipReason:null,
    multiplier:type==='FINAL'?2:1};
  room.paused=false;room.pauseRemaining=null;room.phase=stage;room.deadline=Date.now()+roundClock(room,type,stage)*1000;
  powers.atRoundStart(room,drawResponses,(r,id,text,key)=>hash(`${r.code}:${r.roundIndex}:${id}:${key}:${text}`).slice(0,18));
  telemetry.record(room,'round_started');room.revision++;
}
function startGame(room) {
  if(room.phase!=='LOBBY')throw Error('The game has already started.');
  if(room.players.length<3)throw Error('You need at least three players to start.');
  room.playlist=room.config.length==='quick'?['CARD','WIT']:
    room.config.length==='standard'?['CARD','WIT','CONTEXT','FINAL']:
    ['CARD','WIT','CONTEXT','DOUBLE','CARD','FINAL'];
  powers.onMatchStart(room);room.roundIndex=0;startRound(room);
}
function swapCard(room,player,cardId) {
  if (room.phase!=='SUBMIT'||room.paused||!['CARD','DOUBLE'].includes(room.round.type)) throw Error('Card swap unavailable now.');
  if (room.round.entries.some(e=>e.authorId===player.id))throw Error('Your answer has already been submitted.');
  if (room.round.swaps.has(player.id))throw Error('You have used your one swap this round.');
  const hand=room.round.hands[player.id];
  const index=hand?.findIndex(card=>card.id===cardId);
  if(index===undefined||index<0)throw Error('Select one of your own cards to swap.');
  const allVisibleCards=new Set(Object.values(room.round.hands).flat().map(x=>x.text));
  const text=drawResponses(room,1,allVisibleCards)[0];
  hand[index]={id:hash(`${room.code}:${room.roundIndex}:${player.id}:swap:${text}`).slice(0,18),text};
  room.round.swaps.add(player.id);
  room.revision++;
}
function acceptSeed(room,player,value) {
  if(room.phase!=='SEED'||room.paused)throw Error('It is not time to write a starter line.');
  if(room.round.type!=='CONTEXT')throw Error('This is not a context round.');
  if(room.round.seeds.has(player.id))throw Error('Your innocent line is already locked in.');
  const text=validateAnswer(value,room.config.rating);
  room.round.seeds.set(player.id,text);room.revision++;
  if(room.round.seeds.size===room.players.length)beginContextRewrite(room);
}
function beginContextRewrite(room) {
  if(room.phase!=='SEED')return;
  // A shuffled circular derangement guarantees that nobody receives their own line.
  const players=mix(room.players);
  for(let i=0;i<players.length;i++) {
    const owner=players[(i+1)%players.length];
    const seed=room.round.seeds.get(owner.id)||randomPick(seedFallbacks);
    room.round.assignments.set(players[i].id,{seed,authorId:owner.id});
  }
  room.phase='SUBMIT';room.deadline=Date.now()+roundClock(room,'CONTEXT')*1000;powers.atRewriteStart(room);room.revision++;
}
function acceptAnswer(room,player,value) {
  if(room.phase!=='SUBMIT'||room.paused)throw Error('It is not time to submit an answer.');
  const round=room.round;
  if(round.entries.some(e=>e.authorId===player.id))throw Error('Your answer is already locked in.');
  let text,seedAuthorId=null,authoredText=null;
  if(round.type==='CARD') {
    const found=round.hands[player.id]?.find(c=>c.id===value);
    if(!found)throw Error('That card is not in your hand.');
    text=found.text;authoredText=found.text;
  } else if(round.type==='DOUBLE') {
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Choose a card and write your punchline.');
    const found=round.hands[player.id]?.find(c=>c.id===value.cardId);
    if(!found)throw Error('That card is not in your hand.');
    const line=validateAnswer(value.line,room.config.rating);
    text=`${found.text} — ${line}`;authoredText=line;
  } else if(round.type==='CONTEXT') {
    const given=round.assignments.get(player.id);
    if(!given)throw Error('No starter line assigned.');
    const line=validateAnswer(value,room.config.rating);
    text=`“${given.seed}” — ${line}`;authoredText=line;
    seedAuthorId=given.authorId;
  } else {
    text=validateAnswer(value,room.config.rating);authoredText=text;
    if(round.type==='FINAL'&&!text.toLowerCase().includes(round.requiredWord))throw Error(`Your finale answer must include: ${round.requiredWord.toUpperCase()}`);
  }
  round.entries.push({id:randomId(),authorId:player.id,seedAuthorId,text,authoredText,hidden:false,auto:false});
  powers.atSubmit(room,player);
  if(allSubmitted(room))enterVoting(room);
  else room.revision++;
}
function enterVoting(room) {
  if(room.phase!=='SUBMIT')return;
  if(liveCandidates(room).length<3)return finishRound(room,'Not enough valid entries to score this round.');
  room.phase='VOTE';room.deadline=Date.now()+(room.config.pace==='relaxed'?75:45)*1000;room.revision++;
}
function acceptVote(room, player, gold,silver) {
  if(room.phase!=='VOTE' || room.paused) throw Error('Voting is not open.');
  if(typeof gold!=='string' || typeof silver!=='string'||gold===silver) throw Error('Choose two different answers.');
  const candidates=liveCandidates(room);
  if(candidates.length<3 || !candidates.some(e=>e.id===gold) || !candidates.some(e=>e.id===silver)) throw Error('One of those entries is not available.');
  if(candidates.some(e=>e.authorId===player.id && (e.id===gold||e.id===silver))) throw Error('You cannot vote for your own answer.');
  if(!candidates.some(e=>e.authorId===player.id)) throw Error('Only entrants can vote this round.');
  room.round.ballots.set(player.id,{voterId:player.id,gold,silver});
  telemetry.record(room,'vote_cast');room.revision++;
  if(room.players.filter(p=>candidates.some(e=>e.authorId===p.id)).every(p=>room.round.ballots.has(p.id))) finishRound(room,null);
}
function finishRound(room,skipReason) {
  if(!['SEED','SUBMIT','VOTE'].includes(room.phase)) return;
  const round=room.round;
  if(round.scored) return;
  round.scored=true; round.skipReason=skipReason;room.paused=false;room.pauseRemaining=null;
  if(!skipReason && liveCandidates(room).length>=3) {
    round.awards=scoreEntries(liveCandidates(room),[...round.ballots.values()],round.multiplier);
    for(const award of round.awards) {
      const p=room.players.find(p=>p.id===award.authorId);
      p.score+=award.points;p.golds+=award.gold;p.silvers+=award.silver;
      if(award.rank===1 && !award.isJoint)p.firsts++;
    }
  }
  powers.onResults(room);
  telemetry.record(room,'round_finished',{durationMs:Date.now()-round.startedAt-(round.pausedMs||0)-(round.pausedAt?Date.now()-round.pausedAt:0),challenge:round.type});
  room.results.push({index:room.roundIndex,type:round.type,prompt:round.prompt,awards:round.awards,skipped:!!skipReason,
    highlights:round.entries.filter(e=>!e.hidden).filter(e=>round.awards.some(a=>a.entryId===e.id&&a.rank===1)).map(e=>({
      text:e.text, authorName:room.players.find(p=>p.id===e.authorId)?.name||'Player',
      points:round.awards.find(a=>a.entryId===e.id)?.points||0,
      weight:round.awards.find(a=>a.entryId===e.id)?.weight||0,
      avatar:room.players.find(p=>p.id===e.authorId)?.avatar||'adult-01'
    }))});
  // Relaxed games wait for the host: no automatic countdown during chatting/laughter.
  room.phase='RESULTS';room.deadline=room.config.pace==='relaxed'?null:Date.now()+4500;room.revision++;
}
function markReady(room, player) {
  if(room.phase!=='RESULTS')throw Error('Wait until the results are shown.');
  if(!room.round.readyForNext)room.round.readyForNext=new Set();
  if(!room.round.readyForNext.has(player.id)){
    room.round.readyForNext.add(player.id);room.revision++;
  }
}
function nextRound(room) {
  if(room.phase!=='RESULTS') throw Error('Finish this round first.');
  if(room.roundIndex===room.playlist.length-1) {
    room.phase='COMPLETE';room.deadline=null;room.finishedAt=Date.now();room.revision++;
    return;
  }
  room.roundIndex++; startRound(room);
}
function playAgain(room) {
  if(room.phase!=='COMPLETE') throw Error('Finish the current game before playing again.');
  room.players.forEach(p=>{p.score=0;p.firsts=0;p.golds=0;p.silvers=0;});
  room.phase='LOBBY';room.playlist=[];room.roundIndex=-1;room.round=null;
  room.deadline=null;room.paused=false;room.pauseRemaining=null;room.pauses=0;
  // Retain prompt history and undrawn response cards between matches in this room.
  room.results=[];room.reports=[];room.finishedAt=null;room.chaosVotes.clear();room.chaosEvents=[];
  powers.init(room);
  for(const player of room.players)player.lastFeedback=new Set();
  room.revision++;
}
function tick(room) {
  if(room.paused || !room.deadline || Date.now()<room.deadline) return false;
  if(room.phase==='SEED') {
    for(const p of room.players)if(!room.round.seeds.has(p.id))room.round.seeds.set(p.id,randomPick(seedFallbacks));
    beginContextRewrite(room);return true;
  }
  if(room.phase==='SUBMIT') {
    for(const p of room.players)if(!room.round.entries.some(e=>e.authorId===p.id))telemetry.record(room,'submission_timed_out');
    if(room.round.type==='CARD') for(const p of room.players) {
      if(room.round.entries.some(e=>e.authorId===p.id)) continue;
      if(p.online) {
        const card=randomPick(room.round.hands[p.id]);
        room.round.entries.push({id:randomId(),authorId:p.id,text:card.text,hidden:false,auto:true});
      }
    }
    enterVoting(room);return true;
  }
  if(room.phase==='VOTE') {finishRound(room,null);return true;}
  if(room.phase==='RESULTS') {nextRound(room);return true;}
  return false;
}
function sortedPlayers(room) {
  return [...room.players].sort((a,b)=>b.score-a.score || b.firsts-a.firsts || b.golds-a.golds || b.silvers-a.silvers || a.joined-b.joined);
}
function snapshot(room, viewerId, isTV=false) {
  const viewer=room.players.find(p=>p.id===viewerId);
  const spectator=room.audience.find(p=>p.id===viewerId);
  const round=room.round;
  const base={code:room.code,revision:room.revision,serverNow:Date.now(),phase:room.phase,paused:room.paused,
    deadline:room.deadline,config:room.config,playerCount:room.players.length,maxPlayers:12,
    audienceCount:room.audience.length,chaos:chaosSummary(room),gameCards:powers.publicView(room,viewerId,isTV),
    adultConsents:[...room.players,...room.audience].filter(p=>p.adultConfirmed).length,
    adultConsentNeeded:room.players.length+room.audience.length,
    roundNumber:room.roundIndex+1,totalRounds:room.playlist.length,
    players:sortedPlayers(room).map(p=>({id:p.id,name:p.name,avatar:p.avatar,score:p.score,online:p.online,ready:p.ready,firsts:p.firsts,golds:p.golds,silvers:p.silvers})),
    you:isTV?null: spectator?{id:spectator.id,name:spectator.name,role:'audience',adultConfirmed:spectator.adultConfirmed}:
      {id:viewer?.id,name:viewer?.name,avatar:viewer?.avatar,isHost:room.ownerId===viewerId,score:viewer?.score,adultConfirmed:viewer?.adultConfirmed},
    tv:isTV,
  };
  if(round) {
    const common={id:round.id,type:round.type,label:LABELS[round.type],prompt:round.prompt,contract:round.contract,multiplier:round.multiplier,
      submissionCount:room.phase==='SEED'?round.seeds.size:round.entries.length,voteCount:round.ballots.size,eligibleVotes:liveCandidates(room).length,
      submitted:room.phase==='SEED'?round.seeds.has(viewerId):!!round.entries.find(e=>e.authorId===viewerId),swapUsed:!isTV&&round.swaps.has(viewerId),voted:round.ballots.has(viewerId),skipReason:round.skipReason,
      readyCount:round.readyForNext?.size||0,
      youReady:!isTV&&!!round.readyForNext?.has(viewerId),
      nextChallenge:room.playlist[room.roundIndex+1]?LABELS[room.playlist[room.roundIndex+1]]:'CHAMPION REVEAL'};
    if(room.phase==='SUBMIT' && !isTV) {
      if(round.type==='CARD'||round.type==='DOUBLE') common.hand=viewer?round.hands[viewerId]||[]:[];
      if(round.type==='CONTEXT') common.assignedSeed=round.assignments.get(viewerId)?.seed||null;
    }
    if(room.phase==='VOTE') {
      const candidates=liveCandidates(room)
        .map(e=>({id:e.id,text:e.text,isOwn:!isTV && e.authorId===viewerId,
          ...(!isTV && viewerId===room.ownerId ? {reportCount:room.reports.filter(report=>report.roundId===round.id && report.entryId===e.id).length}: {})}));
      // Stable but different per player; no author attribution before the reveal.
      const salt = isTV?'stage':viewerId;
      common.candidates=candidates.sort((a,b)=>hash(`${round.id}:${salt}:${a.id}`).localeCompare(hash(`${round.id}:${salt}:${b.id}`)));
      if(!isTV)common.myVote=round.ballots.get(viewerId)||null;
    }
    if(['RESULTS','COMPLETE'].includes(room.phase)) {
      common.entries=round.entries.filter(e=>!e.hidden).map(e=>({id:e.id,text:e.text,authorName:room.players.find(p=>p.id===e.authorId)?.name||'Player',
        authorAvatar:room.players.find(p=>p.id===e.authorId)?.avatar||'adult-01',
        seedAuthorName:e.seedAuthorId?room.players.find(p=>p.id===e.seedAuthorId)?.name:null,
        award:round.awards.find(a=>a.entryId===e.id)||null})).sort((a,b)=>(a.award?.rank??999)-(b.award?.rank??999));
    }
    base.round=common;
  }
  if(room.phase==='COMPLETE') {
    const candidates=room.results.flatMap(result=>result.highlights||[]);
    candidates.sort((a,b)=>b.weight-a.weight || b.points-a.points);
    base.nightRecap={roundsPlayed:room.results.length, topMoments:candidates.slice(0,3),
      answersSubmitted:room.results.reduce((total,r)=>total+(r.awards?.length||0),0),
      totalBallots:room.results.reduce((total,r)=>total+(r.awards||[]).reduce((sub,a)=>sub+a.gold,0),0)};
    const ordered=sortedPlayers(room);
    const top=ordered[0];
    base.champions=ordered.filter(p=>p.score===top.score && p.firsts===top.firsts && p.golds===top.golds && p.silvers===top.silvers).map(p=>({id:p.id,name:p.name,avatar:p.avatar}));
  }
  return base;
}

// These wrappers keep response-card RNG, prompt rotation and IDs controlled by the engine.
function playGameCard(room,player,cardId,options={}) {
  try{return powers.play(room,player,cardId,options,{
    shuffle:mix,roundMs:(r,type)=>roundClock(r,type)*1000,
    cardId:(r,id,text,key)=>hash(`${r.code}:${r.roundIndex}:${id}:${key}:${text}`).slice(0,18),
    freshWit:r=>promptFrom(r,getPool(witPrompts,r.config.rating)),drawResponses
  });}catch(error){telemetry.record(room,'card_invalid',{cardId});throw error;}
}
function chooseGameExtra(room,player,drawId,replaceId) {
  return powers.chooseExtra(room,player,drawId,replaceId,(r,id,text,key)=>hash(`${r.code}:${r.roundIndex}:${id}:${key}:${text}`).slice(0,18));
}
function setGameCards(room,enabled){return powers.setEnabled(room,enabled);}
function resumeCardTimers(room,pausedMs){return powers.onResume(room,pausedMs);}
function rerollGameCard(room,player,cardId){return powers.reroll(room,player,cardId);}
module.exports={playGameCard,chooseGameExtra,setGameCards,rerollGameCard,resumeCardTimers, swapCard,acceptSeed, newRoom,addPlayer,setAvatar,removePlayer,findPlayer,mintDisplay,verifyDisplay,startGame,playAgain,acceptAnswer,acceptVote,finishRound,nextRound,tick,snapshot,
  scoreEntries,validateName,validateAnswer,hash,randomId,sortedPlayers,markReady,
  addAudience,findAudience,consentAfterDark,setLobbyRating,audienceChaos,audienceVote,chaosSummary };
