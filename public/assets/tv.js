'use strict';
(() => {
  const LEGACY_LOGO_SVG='/assets/ecky-logo.svg';
  const el=document.getElementById('tv-app');
  const q=new URLSearchParams(location.search),code=(q.get('room')||'').toUpperCase();
  const frag=new URLSearchParams(location.hash.slice(1));
  const AVATARS=window.ECKEY_AVATARS||[];const avatar=id=>{const a=AVATARS.find(x=>x.id===id)||AVATARS[0];return a?`<img class="player-avatar" src="${a.image}" alt="">`:'';};
  const celebration=id=>{const a=AVATARS.find(x=>x.id===id)||AVATARS[0];return a?`<img class="spotlight-art ${a.celebration?'has-poster':'portrait-only'}" src="${a.celebration||a.image}" alt="${a.name}">`:'';};
  function tvWinners(s){const r=s.round||{},winners=(r.entries||[]).filter(e=>e.award?.rank===1).slice(0,3);if(!winners.length)return '';return `<div class="tv-winners">${winners.map(e=>`<div class="tv-winner-card">${celebration(e.authorAvatar)}<div class="tv-winner-details"><span>ROUND ${s.roundNumber} ★ ${e.award.isJoint?'JOINT WINNER':'WINNER'}</span><strong>${esc(e.authorName)}</strong><small>+${e.award.points} POINTS</small></div></div>`).join('')}</div>`;}
  const store=`tnl-stage-${code}`;
  const secret=frag.get('key')||sessionStorage.getItem(store);
  if(secret)sessionStorage.setItem(store,secret);
  history.replaceState(null,'',`/tv/?room=${encodeURIComponent(code)}`);
  let current=null,connected=false,lastSoundKey=null,lastTick=null,lastSceneKey=null,scenePulse=false,clockOffset=0;
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const joinLink=`${location.origin}/join/?room=${encodeURIComponent(code)}`;
  const showFx=()=>`<button type="button" class="sound-switch show-sfx-switch" data-fx-toggle aria-pressed="${!!window.ECKEY_SFX?.enabled}"><span aria-hidden="true">${window.ECKEY_SFX?.enabled?'🔊':'🔇'}</span><strong>${window.ECKEY_SFX?.enabled?'SHOW SFX ON':'ENABLE SHOW SFX'}</strong></button>`;
  const tvHead=s=>`<div class="tv-show-top"><span class="tv-show-round">ROUND ${s.roundNumber}/${s.totalRounds}</span><span class="tv-show-mode">${esc(s.phase==='SEED'?'CONTEXT COLLAPSE':s.phase==='VOTE'?'CAST YOUR VOTES':s.phase==='RESULTS'?'THE VERDICT':s.round?.label||'SHOWTIME')}</span></div>`;
  const tvConfetti=()=>`<div class="fx-confetti" aria-hidden="true">${Array.from({length:22},(_,i)=>`<i style="--x:${i*43%95+3}%;--d:${(i*11)%18/10}s;--r:${i*47}deg;--drift:${(i%5-2)*38}px;--c:${['#ffd970','#ff48c8','#37eaff','#a6fe7c'][i%4]}"></i>`).join('')}</div>`;
  function header(s){return s.phase==='LOBBY'?'':`<header class="tv-minimal-head"><img class="v16-logo v16-logo--tv-small" src="/assets/branding/ecky-thump-logo.webp" alt="ECKY THUMP"><span>ROOM ${esc(s.code)}</span>${showFx()}</header>`;}
  const tvPackSwitch=s=>`<div class="postcard-tv-pack e15-tv-rating" role="status" aria-label="Content rating"><strong>CONTENT RATING · ${esc(s.config.rating.toUpperCase())}</strong><small>${s.adultConsents}/${s.adultConsentNeeded} guests confirmed 18+ · Change rating on the host phone before starting</small></div>`;
  const soundControl=()=>`<button type="button" class="sound-switch tv-sound-switch" data-sound-toggle aria-pressed="${window.ECKEY_AUDIO?.enabled?'true':'false'}"><span aria-hidden="true">♫</span><strong>${window.ECKEY_AUDIO?.enabled?'MUSIC ON':'PLAY LOBBY MUSIC'}</strong></button>`;
  function footer(s){return `<footer class="tv-footer"><span>${esc(s.config.rating.toUpperCase())} HUMOUR · ${s.players.length} CONTESTANTS</span><span>JOIN ON YOUR PHONE · ${esc(location.host)}/join/ · CODE ${esc(s.code)}</span></footer>`;}
  function leaderboard(s,amount=6){return `<div class="tv-board">${s.players.slice(0,amount).map((p,i)=>`<div class="tv-board-item"><span class="tv-with-avatar">${avatar(p.avatar)}${i+1}. ${esc(p.name)}</span><strong>${p.score} POINTS</strong></div>`).join('')}</div>`;}
  function intro(s){return `<section class="tv-center v14-tv-lobby e15-tv-lobby v16-tv-lobby">
      <div class="v16-tv-top"><img class="v16-logo v16-logo--tv" src="/assets/branding/ecky-thump-logo.webp" alt="ECKY THUMP" width="1506" height="1014"><div class="v16-tv-topline"><strong>JOIN THE GAME!</strong><span>GOOD FRIENDS. TERRIBLE ANSWERS.</span></div><div class="tv-sound-toolbar">${soundControl()}${showFx()}</div></div>
      <div class="v16-tv-join-main"><div class="v16-tv-join-copy"><span>GO TO <strong>${esc(location.host)}/join/</strong></span><small>ROOM CODE</small><div class="v16-tv-room-code">${esc(s.code)}</div><p>PLAY ON YOUR PHONE. NO DOWNLOAD REQUIRED.</p></div>
      <div class="v16-tv-qr-panel"><img class="tv-qr" src="/api/rooms/${esc(s.code)}/join-qr.svg" alt="Scan to join ECKY THUMP room ${esc(s.code)}"><strong>SCAN TO JOIN</strong></div></div>
      <div class="v16-tv-cast"><div class="v16-tv-cast-heading"><strong>THE LINE-UP</strong><span>${s.players.length} / 12 PLAYERS · ${s.audienceCount||0} WATCHING</span></div>
      <div class="tv-names">${s.players.map(p=>`<div class="tv-player">${avatar(p.avatar)}<strong>${esc(p.name)}</strong><small>${p.online?'● READY':'◌ OFFLINE'}</small></div>`).join('')}${Array.from({length:Math.min(3,Math.max(0,3-s.players.length))},()=>'<div class="v16-tv-empty"><b>+</b><small>JOIN NEXT</small></div>').join('')}</div></div>
      ${tvPackSwitch(s)}<div class="v16-tv-bottom-tag">✦ FIVE GAMES. ONE RIDICULOUS CHAMPION.</div></section>`;}
  // Pure stage ordering: never changes avatar registry, player identity or score order.
  function stagePlayers(s){
    const order=s.gameCards?.stageOrder;
    if(!Array.isArray(order))return s.players;
    const lookup=new Map(s.players.map(p=>[p.id,p]));
    return [...order.map(id=>lookup.get(id)).filter(Boolean),...s.players.filter(p=>!order.includes(p.id))];
  }
  function submission(s){const r=s.round;return `<section class="tv-center">${tvHead(s)}<div class="eyebrow">ROUND ${s.roundNumber} OF ${s.totalRounds} · ${esc(r.label)}</div>
    <h1 class="tv-prompt tv-active-prompt">${esc(r.prompt)}</h1>${r.multiplier>1?'<div class="finale-multiplier">⚡ DOUBLE POINTS FINALE ⚡</div>':''}${r.contract?`<div class="contract">✦ ${esc(r.contract)}</div>`:''}
    <div class="tv-status">${r.type==='CARD'?'PICK YOUR FUNNIEST CARD':r.type==='CONTEXT'?'REWRITE THE INNOCENT LINE':r.type==='DOUBLE'?'COMBINE A CARD WITH A RIDICULOUS PUNCHLINE':r.type==='FINAL'?'ONE FINAL JOKE. DOUBLE POINTS.':'WRITE A CRACKER FOR THE CROWD'}</div>
    <div class="tv-names">${stagePlayers(s).map(p=>`<span class="tv-player">${avatar(p.avatar)}${esc(p.name)} ${r.submissionCount===s.players.length?'✓':'•'}</span>`).join('')}</div>
    <div class="tv-status"><span id="tv-timer" class="timer">--</span> &nbsp; · &nbsp; ${r.submissionCount} / ${s.players.length} ANSWERS RECEIVED</div>
    ${s.paused?`<div class="notice alert">HOST HAS PAUSED THE GAME</div>`:''}</section>`;}
  function contextOpening(s){const r=s.round;return `<section class="tv-center">${tvHead(s)}<div class="eyebrow">ROUND ${s.roundNumber} OF ${s.totalRounds} · CONTEXT COLLAPSE · PART 1</div>
    <h1 class="tv-prompt">SAY SOMETHING COMPLETELY INNOCENT.</h1><p class="tv-subtitle">Everyone types a normal sentence on their own phone. Somebody else will turn it into the scandal of the century.</p>
    <div class="tv-status">${r.submissionCount} / ${s.players.length} LINES RECEIVED · <span id="tv-timer" class="timer">--</span></div>
    ${s.paused?'<div class="notice alert">HOST HAS PAUSED THE GAME</div>':''}</section>`;}
  function voting(s){const r=s.round;return `<section class="tv-center" style="justify-content:flex-start;padding-top:25px">${tvHead(s)}<div class="eyebrow">ROUND ${s.roundNumber} OF ${s.totalRounds} · TIME TO VOTE</div>
    <h1 class="tv-prompt tv-active-prompt tv-vote-prompt" style="font-size:clamp(2rem,3vw,3.4rem);margin:14px auto">${esc(r.prompt)}</h1>${r.multiplier>1?'<div class="finale-multiplier">⚡ DOUBLE POINTS FINALE ⚡</div>':''}
    <div class="tv-status">CAST GOLD & SILVER ON YOUR PHONE · CHEER, ARGUE, ACCUSE YOUR FRIENDS · <span id="tv-timer">--</span></div>
    <div class="tv-cards tv-show-cards">${(r.candidates||[]).map((c,i)=>`<div class="tv-card"><span><span class="eyebrow">ENTRY ${i+1}</span><br>${esc(c.text)}</span></div>`).join('')}</div>
    <div class="tv-status">${r.voteCount} / ${r.eligibleVotes} BALLOTS RECEIVED</div></section>`;}
  function results(s){const r=s.round;return `<section class="tv-center fx-fanfare" style="justify-content:flex-start;padding-top:14px">${tvHead(s)}${r.skipReason?"":scenePulse?tvConfetti():""}<div class="eyebrow">ROUND ${s.roundNumber} OF ${s.totalRounds} · THE VERDICT</div>
    <h1 class="tv-prompt tv-active-prompt tv-results-prompt" style="font-size:clamp(2rem,3vw,3.3rem);margin:15px auto">${r.skipReason?'ROUND SKIPPED':'WHO TAKES THE ROUND?'}</h1>
    ${r.skipReason?`<div class="notice alert">${esc(r.skipReason)}</div>`:''}
    <div class="tv-cards tv-show-cards">${(r.entries||[]).slice(0,12).map((e,i)=>`<div class="tv-card ${e.award?.rank===1?'win':''}"><span><span class="eyebrow">${e.award?`#${e.award.rank} · +${e.award.points} BASE${e.award.gameCardBonus?` · ${e.award.gameCardBonus>0?'+':''}${e.award.gameCardBonus} POWER`:''}`:'NO SCORE'}</span><br>${esc(e.text)}<small>BY ${esc(e.authorName)}</small></span></div>`).join('')}</div>
    ${s.gameCards?.stageOrder?`<div class="e17-stage-roster">${stagePlayers(s).map(p=>`<span>${avatar(p.avatar)}${esc(p.name)}</span>`).join('')}</div>`:''}${tvWinners(s)}${leaderboard(s)}<div class="tv-status">${r.readyCount||0} / ${s.players.length} FRIENDS READY · NEXT: ${esc(r.nextChallenge||'CHAMPION REVEAL')} · ${s.config.pace==='relaxed'?'HOST CONTROLS NEXT ROUND':'NEXT ROUND STARTS AUTOMATICALLY'}</div></section>`;}
  function finished(s){const names=s.champions.map(p=>p.name).join(' & ');return `<section class="tv-center fx-fanfare">${scenePulse?tvConfetti():""}
    <div class="eyebrow">THE CHAMPIONSHIP IS OVER</div><span style="font-size:7rem;margin:5px 0">♛</span><h1 class="tv-finale-title">ECKY THUMP!</h1><h2 class="tv-prompt">${esc(names)}</h2>
    <div class="tv-subtitle">${s.champions.length>1?'JOINT AGENTS OF CHAOS':'YOUR ECKY THUMP CHAMPION'}</div><div class="tv-finale-cast">${s.champions.slice(0,3).map(p=>`<div class="tv-finale-player">${celebration(p.avatar)}<strong>${esc(p.name)}</strong></div>`).join('')}</div>
    ${leaderboard(s,12)}${s.nightRecap?.topMoments?.length?`<div class="tv-recap"><strong>⭐ MOST-VOTED MOMENT OF THE NIGHT</strong><blockquote>${esc(s.nightRecap.topMoments[0].text)}</blockquote><small>BY ${esc(s.nightRecap.topMoments[0].authorName)}</small></div>`:''}<div class="tv-status">${s.nightRecap?.roundsPlayed||s.totalRounds} ROUNDS · ${s.nightRecap?.totalBallots||0} BALLOTS · PLAY AGAIN WITH THIS GROUP!</div></section>`;}
  function chaosStage(s){const chaos=s.chaos||{},events=chaos.events||[];const last=events.at(-1);const labels={'pudding':'BLACK PUDDING INCOMING!','wrench':'SOMEONE THREW A WRENCH!','shake':'THE STAGE IS SHAKING!'};const modifiers={'pudding-rain':'BLACK PUDDING RAIN','pier-panic':'PIER PANIC','crowd-roar':'CROWD ROAR'};
    return `<div class="postcard-heckle ${last?'postcard-heckle-live':''}" aria-live="polite">${last?`<strong>${esc(labels[last.kind]||'HECKLED!')}</strong><span>Courtesy of ${esc(last.by)}${last.targetId?' · '+esc(s.players.find(p=>p.id===last.targetId)?.name||'the contestants'):''}</span>`:''}${chaos.leader?`<small>THE BALCONY VOTES: ${esc(modifiers[chaos.leader]||'CHAOS')}</small>`:''}</div>`;}
  function render(s){
    // Stage 3: the Social Club renderer is opt-in and cannot affect v1 rooms.
    if(s.mode==='social-club-v2'){
      const club=window.ECKY_SOCIAL_TV;
      if(!club){el.textContent='Social Club stage could not load.';return;}
      const key=club.sceneKey(s);
      if(lastSoundKey!==null&&lastSoundKey!==key)window.ECKEY_SFX?.play(club.cue(s));
      if(typeof s.serverNow==='number')clockOffset=s.serverNow-Date.now();
      lastSoundKey=key;lastSceneKey=key;current=s;
      el.innerHTML=club.render(s);
      updateTimer();
      window.ECKEY_AUDIO?.setScene(s.phase==='LOBBY'?'LOBBY':'GAME');
      return;
    }
    const key=`${s.round?.id||'none'}:${s.phase}`;
    if(lastSoundKey!==null&&key!==lastSoundKey)window.ECKEY_SFX?.play(s.phase==='RESULTS'?(s.round?.skipReason?'skip':'reveal'):s.phase==='COMPLETE'?'champion':s.phase==='VOTE'?'vote':['SEED','SUBMIT'].includes(s.phase)?'round':'tap');
    const sceneChanged=lastSceneKey!==null&&lastSceneKey!==key;
    if(typeof s.serverNow==='number')clockOffset=s.serverNow-Date.now();
    lastSoundKey=key;lastSceneKey=key;scenePulse=sceneChanged;current=s;
    const body=s.phase==='LOBBY'?intro(s):s.phase==='SEED'?contextOpening(s):s.phase==='SUBMIT'?submission(s):s.phase==='VOTE'?voting(s):s.phase==='RESULTS'?results(s):finished(s);
    const lastChaos=(s.chaos?.events||[]).at(-1);
    const seen=Number(el.dataset.lastHeckle||0);
    const incoming=lastChaos&&lastChaos.id>seen;
    if(incoming)window.ECKEY_SFX?.play('tap');
    if(lastChaos)el.dataset.lastHeckle=String(lastChaos.id);
    const newest=s.gameCards?.latest;
    const effectBanner=newest&&s.phase!=='LOBBY'&&(Date.now()+clockOffset)-newest.at<6500?`<div class="e17-stage-effect" data-effect-expires="${newest.at+6500}">⚡ ${esc(newest.name)} · ${esc(newest.by)}</div>`:'';
    el.innerHTML=`<div class="tv-scene v16-tv-scene v16-tv-${s.phase.toLowerCase()} ${sceneChanged?'scene-enter':''} ${incoming?'postcard-thumped':''}">${header(s)+chaosStage(s)+effectBanner+body+footer(s)}</div>`;updateTimer();window.ECKEY_AUDIO?.setScene(s.phase==='LOBBY'?'LOBBY':'GAME');
  }
  function updateTimer(){
    // Remove short effect announcements without waiting for another SSE snapshot.
    const banner=el.querySelector('[data-effect-expires]');
    if(banner&&(Date.now()+clockOffset)>=Number(banner.dataset.effectExpires))banner.remove();
    const t=document.getElementById('tv-timer');if(!current||!t)return;
    const seconds=Math.max(0,Math.ceil(((current.deadline||Date.now()+clockOffset)-(Date.now()+clockOffset))/1000));
    t.textContent=current.paused?'PAUSED':`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    const key=`${current.round?.id}:${current.phase}:${seconds}`;
    if(!current.paused&&seconds>0&&seconds<=5&&['SEED','SUBMIT','VOTE'].includes(current.phase)&&key!==lastTick){lastTick=key;window.ECKEY_SFX?.play('countdown');}

  }
  el.addEventListener('click',e=>{if(!e.target.closest('[data-fx-toggle]'))return;const on=window.ECKEY_SFX?.toggle();el.querySelectorAll('[data-fx-toggle]').forEach(b=>{b.setAttribute('aria-pressed',String(!!on));b.querySelector('span').textContent=on?'🔊':'🔇';b.querySelector('strong').textContent=on?'SHOW SFX ON':'ENABLE SHOW SFX';});});
  el.addEventListener('click',async e=>{if(!e.target.closest('[data-sound-toggle]'))return;await window.ECKEY_AUDIO?.toggle();const control=el.querySelector('[data-sound-toggle]');if(control){control.setAttribute('aria-pressed',String(!!window.ECKEY_AUDIO?.enabled));control.querySelector('strong').textContent=window.ECKEY_AUDIO?.enabled?'MUSIC ON':'PLAY LOBBY MUSIC';}});
  setInterval(updateTimer,250);
  async function connect(){
    while(true){
      try{
        const res=await fetch(`/api/rooms/${code}/events`,{headers:{'Authorization':`Bearer ${secret}`},cache:'no-store'});
        if(!res.ok){const data=await res.json().catch(()=>({error:'Stage session unavailable.'}));throw Error(data.error);}
        connected=true;const reader=res.body.getReader();let buffer='';const decoder=new TextDecoder();
        for(;;){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true}).replace(/\r/g,'');
          let end;while((end=buffer.indexOf('\n\n'))!==-1){const block=buffer.slice(0,end);buffer=buffer.slice(end+2);const match=block.match(/^data: (.+)$/m);
            if(match)try{render(JSON.parse(match[1]));}catch(err){console.error(err);}
          }
        }
      }catch(err){connected=false;el.innerHTML=`<div class="loading-center"><div style="text-align:center"><h1>STAGE CONNECTION LOST</h1><p>${esc(err.message)}</p><p>Reopen a fresh TV display from the host’s phone.</p></div></div>`;
        if(/invalid|expired/i.test(err.message))return;
      }
      await new Promise(r=>setTimeout(r,2500));
    }
  }
  if(!/^[A-Z2-9]{6}$/.test(code)||!secret){el.innerHTML=`<div class="loading-center"><div style="text-align:center"><h1>OPEN FROM THE HOST'S PHONE</h1><p>Create a room, then press “TV DISPLAY” in your host controls.</p><a class="btn" href="/">START A ROOM →</a></div></div>`;return;}
  connect();
})();
