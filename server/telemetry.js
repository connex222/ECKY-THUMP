'use strict';
/** Private, bounded, in-memory game-night telemetry: no nicknames, answer text, tokens or IPs. */
const ALLOWED=new Set(['round_started','round_finished','card_activated','card_resolved','card_offered','card_discarded','card_invalid','sse_disconnected','sse_rejoined','client_error','feedback_fun','feedback_frustrating','submission_timed_out','vote_cast']);
function record(room,type,values={}){
  if(!ALLOWED.has(type))return;
  const output={at:Date.now(),type,round:Math.max(0,room.roundIndex+1),phase:room.phase};
  if(typeof values.cardId==='string'&&/^(CHAOS|TACT|EQUAL)_[A-Z_]+$/.test(values.cardId))output.cardId=values.cardId.slice(0,42);
  if(typeof values.durationMs==='number'&&Number.isFinite(values.durationMs))output.durationMs=Math.max(0,Math.min(600000,Math.round(values.durationMs)));
  if(typeof values.challenge==='string'&&['CARD','WIT','CONTEXT','DOUBLE','FINAL'].includes(values.challenge))output.challenge=values.challenge;
  if(typeof values.errorType==='string'&&['render','network','action','uncaught'].includes(values.errorType))output.errorType=values.errorType;
  room.telemetry??=[];room.telemetry.push(output);
  if(room.telemetry.length>2500)room.telemetry.splice(0,room.telemetry.length-2500);
}
function report(room){
  const events=room.telemetry||[];
  const duration=events.filter(e=>e.type==='round_finished'&&e.durationMs!==undefined).map(e=>e.durationMs).sort((a,b)=>a-b);
  const cards={};
  for(const e of events)if(e.cardId){const row=cards[e.cardId]??={offered:0,played:0,resolved:0,discarded:0,fun:0,frustrating:0,invalid:0};
    if(e.type==='card_offered')row.offered++;
    if(e.type==='card_activated')row.played++;
    if(e.type==='card_resolved')row.resolved++;
    if(e.type==='card_discarded')row.discarded++;
    if(e.type==='feedback_fun')row.fun++;
    if(e.type==='feedback_frustrating')row.frustrating++;
    if(e.type==='card_invalid')row.invalid++;
  }
  for(const row of Object.values(cards)){
    row.activationRate=row.offered?Number((100*row.played/row.offered).toFixed(1)):null;
    row.frustrationRate=(row.fun+row.frustrating)?Number((100*row.frustrating/(row.fun+row.frustrating)).toFixed(1)):null;
  }
  const byChallenge={};
  for(const e of events){
    if(e.type!=='round_finished'||e.durationMs===undefined||!e.challenge)continue;
    const row=byChallenge[e.challenge]??={count:0,totalMs:0,avgMs:0};
    row.count++;row.totalMs+=e.durationMs;row.avgMs=Math.round(row.totalMs/row.count);
  }
  const sum=duration.reduce((a,b)=>a+b,0);
  return {version:1,rounds:duration.length,avgRoundMs:duration.length?Math.round(sum/duration.length):null,p95RoundMs:duration.length?duration[Math.ceil(duration.length*.95)-1]:null,byChallenge,cards,reconnects:events.filter(e=>e.type==='sse_rejoined').length,disconnections:events.filter(e=>e.type==='sse_disconnected').length,clientErrors:events.filter(e=>e.type==='client_error').length,submissionTimeouts:events.filter(e=>e.type==='submission_timed_out').length,votes:events.filter(e=>e.type==='vote_cast').length,events:events.slice(-500)};
}
module.exports={record,report};
