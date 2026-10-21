'use strict';
/* ECKY THUMP original game-night lobby theme. Audio never auto-plays.
 * Opt in with a real click; sound pauses on active challenges and on page hide.
 * Each TV / phone is independent: play sound on one display to avoid echo. */
(() => {
  const music = new Audio('/assets/audio/lobby-theme.ogg');
  music.loop = true;
  music.preload = 'auto';
  music.volume = 0.28;
  const state={enabled:false,scene:'LOBBY'};
  async function sync(){
    if (!state.enabled||state.scene!=='LOBBY'||document.hidden){music.pause();return;}
    try { await music.play(); }catch(err){
      music.pause();state.enabled=false;
      document.dispatchEvent(new CustomEvent('eckey-audio-blocked',{detail:{message:err.message}}));
    }
  }
  window.ECKEY_AUDIO={
    get enabled(){return state.enabled;},
    async toggle(){state.enabled=!state.enabled;await sync();return state.enabled;},
    setScene(scene){const next=scene==='LOBBY'?'LOBBY':'GAME';if(state.scene===next)return;state.scene=next;
      if(next==='GAME'){music.pause();music.currentTime=0;}else void sync();},
    stop(){state.enabled=false;music.pause();music.currentTime=0;},
    get playing(){return !music.paused;},
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)music.pause();else if(state.enabled)void sync();});
  window.addEventListener('pagehide',()=>music.pause());
})();
