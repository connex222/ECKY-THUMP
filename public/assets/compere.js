'use strict';
/** ECKY THUMP — Our Maureen. TV-only, opt-in recorded voice and mandatory captions.
 * No speech synthesis and no third-party requests. The only network request is
 * for the local voice-line manifest; unrecorded clips never generate 404s.
 */
(() => {
  const FALLBACK = {
    LOBBY:'The doors are open. Come in, love.',
    ROUND_INTRO:'Eyes on the telly. Next act, please.',
    SUBMIT:'Get writing. The committee is watching.',
    REVEAL:'Here comes the next answer.',
    VOTE:'A or B? Cast your vote.',
    MATCHUP_RESULT:'The club has spoken.',
    ROUND_SCORES:'Have a look at that scoreboard.',
    CHAMPION:'Make some noise for our champion!',
    COMPLETE:'Last orders? Or shall we go again?'
  };
  const config={name:'Our Maureen',lines:[],voiceEnabled:false,volume:0.70};
  let chosen=null,scene=null,clip=null,leaderAtStart=null,lastLobbyPlayers=null,lastSnapshot=null;
  let lobbyUpdatedAt=Date.now(),lastPrompt=null;
  const clamp=value=>Math.min(1,Math.max(0,Number(value)||0));
  const hash=text=>{
    let h=2166136261;
    for(const char of text){h=Math.imul(h^char.charCodeAt(0),16777619);}
    return h>>>0;
  };
  const currentLeader=s=>(s.players||[]).slice().sort((a,b)=>(b.score||0)-(a.score||0))[0];
  function trigger(s){
    switch(s.phase){
      case 'LOBBY':return 'lobby';
      case 'ROUND_INTRO':return s.round?.type==='FINAL'?'last-orders':'round-intro';
      case 'SUBMIT':return 'submit';
      case 'REVEAL':return 'reveal';
      case 'VOTE':return 'vote';
      case 'MATCHUP_RESULT':return s.round?.result?.slam?'unanimous-win':'vote-close';
      case 'ROUND_SCORES':{
        const now=currentLeader(s);
        return leaderAtStart&&leaderAtStart.score>0&&now?.id!==leaderAtStart.id?'comeback':'vote-close';
      }
      case 'CHAMPION':case 'COMPLETE':return 'champion';
      default:return 'round-intro';
    }
  }
  function select(triggerName,key){
    const options=config.lines.filter(x=>x.trigger===triggerName);
    if(!options.length)return null;
    return options[hash(`${key}:${triggerName}`)%options.length];
  }
  function stopVoice(){
    if(!clip)return;
    try{clip.pause();clip.currentTime=0;}catch(_){}
    clip=null;
  }
  function speak(line){
    stopVoice();
    if(!config.voiceEnabled||!line?.recorded||document.hidden)return;
    const path=line.audio;
    if(typeof path!=='string'||!/^\/assets\/audio\/maureen\/[a-z0-9-]+\.ogg$/.test(path))return;
    try{
      const sound=new Audio(path);
      clip=sound;
      sound.preload='none';sound.volume=config.volume;
      sound.addEventListener('error',()=>{if(clip===sound)clip=null;},{once:true});
      const result=sound.play();
      if(result?.catch)result.catch(()=>{if(clip===sound)clip=null;});
    }catch(_){clip=null;}
  }
  function display(s){
    const name=s.phase==='COMPLETE'?'CHAMPION':s.phase;
    return {speaker:config.name,caption:chosen?.caption||FALLBACK[name]||'Eyes on the telly!'};
  }
  function onScene(s,key){
    if(scene===key)return;
    scene=key;lastSnapshot=s;
    if(s.phase==='ROUND_INTRO')leaderAtStart=currentLeader(s);
    if(s.phase==='LOBBY'){lastLobbyPlayers=s.players?.length||0;lobbyUpdatedAt=Date.now();}
    chosen=select(trigger(s),key);
    lastPrompt=null;
    speak(chosen);
  }
  function onClock(s,seconds){
    if(!scene||s.paused)return;
    let kind=null;
    if(s.phase==='LOBBY'){
      const count=s.players?.length||0;
      if(count!==lastLobbyPlayers){lastLobbyPlayers=count;lobbyUpdatedAt=Date.now();}
      if(Date.now()-lobbyUpdatedAt>90000)kind='idle-nudge';
    }
    if(s.phase==='SUBMIT'&&seconds===10&&
      (s.round?.answerCount||0)<(s.players?.length||0))kind='awaiting-answers';
    if(!kind||lastPrompt===`${scene}:${kind}`)return;
    lastPrompt=`${scene}:${kind}`;
    const selected=select(kind,`${scene}:${kind}`);
    if(!selected)return;
    chosen=selected;
    const el=document.querySelector('[data-maureen-caption]');
    if(el)el.textContent=selected.caption;
    speak(selected);
  }
  function setVolume(value){
    config.volume=clamp(value);
    if(clip)clip.volume=config.volume;
    window.ECKEY_AUDIO?.setVolume?.(config.volume);
    window.ECKEY_SFX?.setVolume?.(config.volume);
    return config.volume;
  }
  function toggleVoice(){
    config.voiceEnabled=!config.voiceEnabled;
    if(!config.voiceEnabled)stopVoice();
    // A click enables future voice cues. No playback until a recorded clip exists.
    return config.voiceEnabled;
  }
  const api={get name(){return config.name;},get voiceEnabled(){return config.voiceEnabled;},
    get volume(){return config.volume;},display,onScene,onClock,toggleVoice,setVolume,
    /** Trigger selection is pure and does not reveal the writer. */
    trigger,select,stop:stopVoice};
  window.ECKY_COMPERE=api;
  fetch('/assets/voice-lines.json',{cache:'no-store'}).then(response=>{
    if(!response.ok)throw Error('No compère manifest');
    return response.json();
  }).then(manifest=>{
    if(manifest?.schemaVersion!==1||!Array.isArray(manifest.lines))return;
    config.name=typeof manifest.compereName==='string'&&manifest.compereName.trim()?
      manifest.compereName.trim().slice(0,60):config.name;
    config.lines=manifest.lines.filter(item=>typeof item.id==='string'&&
      typeof item.trigger==='string'&&typeof item.caption==='string'&&
      item.caption.length<240);
    // Keep the line deterministic even if the first snapshot preceded the fetch.
    if(scene){
      const old=chosen;
      chosen=select(trigger(lastSnapshot),scene)||old;
    }
    document.dispatchEvent(new Event('ecky-compere-ready'));
  }).catch(()=>{/* Captions still show from FALLBACK. No audio or game error. */});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVoice();});
  window.addEventListener('pagehide',stopVoice);
})();
