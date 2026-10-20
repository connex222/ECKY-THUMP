'use strict';
/* ECKEY THUMP Show FX 1.0 — consent-based original WebAudio cue generator.
   No sounds play before the device owner clicks ENABLE SHOW SFX. */
(() => {
  let enabled=false, ctx=null;
  // Even after an earlier opt-in, no new AudioContext is created until the user clicks.
  let unlocked=false;
  const AC=window.AudioContext||window.webkitAudioContext;
  function setup(){
    if(!AC)return false;
    try{if(!ctx)ctx=new AC();unlocked=true;if(ctx.state==='suspended')void ctx.resume();return true;}
    catch(_){return false;}
  }
  function note(freq,start,length,type='sine',gain=.10,endFreq=null){
    if(!ctx)return;
    const o=ctx.createOscillator(),vol=ctx.createGain();o.type=type;
    o.frequency.setValueAtTime(freq,start);
    if(endFreq&&endFreq!==freq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),start+length);
    vol.gain.setValueAtTime(.0001,start);
    vol.gain.exponentialRampToValueAtTime(gain,start+.015);
    vol.gain.exponentialRampToValueAtTime(.0001,start+length);
    o.connect(vol).connect(ctx.destination);o.start(start);o.stop(start+length+.025);
  }
  function play(cue){
    if(!enabled||!unlocked||!ctx||document.hidden)return;
    try{
      const t=ctx.currentTime+.012;
      switch(cue){
        case 'tap':note(490,t,.075,'triangle',.048,700);break;
        case 'pick':note(320,t,.09,'triangle',.065,510);note(620,t+.07,.13,'sine',.065,850);break;
        case 'submit':note(350,t,.11,'triangle',.075,510);note(620,t+.12,.15,'triangle',.07,830);break;
        case 'gold':note(660,t,.08,'sine',.065);note(990,t+.07,.16,'triangle',.075);break;
        case 'silver':note(420,t,.11,'sine',.06);note(610,t+.07,.12,'triangle',.055);break;
        case 'countdown':note(480,t,.12,'square',.039,410);break;
        case 'round':[[392,0],[523,.12],[659,.24],[784,.36]].forEach(([f,d])=>note(f,t+d,.2,'triangle',.075));break;
        case 'vote':note(510,t,.15,'sawtooth',.053,760);note(860,t+.16,.16,'triangle',.07,590);break;
        case 'reveal':[[261,0],[329,.14],[392,.28],[523,.45]].forEach(([f,d])=>note(f,t+d,.24,'triangle',.085));break;
        case 'champion':[[392,0],[494,.15],[587,.30],[784,.46],[988,.64],[1175,.83]].forEach(([f,d])=>note(f,t+d,.45,'triangle',.095));break;
        case 'skip':note(400,t,.15,'sawtooth',.053,220);break;
      }
    }catch(_){/* WebAudio is an optional enhancement: never break a game action. */}
  }
  window.ECKEY_SFX={
    get enabled(){return enabled;},get unlocked(){return unlocked;},
    toggle(){enabled=!enabled;
      if(enabled&&!setup()){enabled=false;return false;}
      if(enabled)play('pick');return enabled;},
    play,
  };
})();
