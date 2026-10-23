'use strict';
(() => {
  const LEGACY_LOGO_SVG='/assets/ecky-logo.svg';
  const app=document.getElementById('app'),toast=document.getElementById('toast');
  const S={code:null,secret:null,snap:null,selected:null,gold:null,silver:null,draft:'',roundId:null,stage:null,connected:false,stream:null,scenePulse:false,lastTick:null,clockOffset:0,powerDrawerOpen:false};
  // Send only a predefined error category; never send scripts, player answers or personal data.
  function diagnostic(errorType){
    if(!S.code||!S.secret)return;
    fetch(`/api/rooms/${S.code}/action`,{method:'POST',headers:{Authorization:`Bearer ${S.secret}`,'Content-Type':'application/json'},body:JSON.stringify({type:'client-diagnostic',errorType})}).catch(()=>{});
  }
  window.addEventListener('error',()=>diagnostic('uncaught'));
  window.addEventListener('unhandledrejection',()=>diagnostic('uncaught'));
  const q=new URLSearchParams(location.search);
  const AVATARS=window.ECKEY_AVATARS||[];let choice='adult-01';
  const avatar=(id,extra='')=>{const a=AVATARS.find(x=>x.id===id)||AVATARS[0];return a?`<img class="player-avatar ${extra}" src="${a.image}" alt="" loading="lazy">`:'';};
  const gallery=[...AVATARS].sort((a,b)=>Number(!!b.spotlight)-Number(!!a.spotlight));
  const avatarPicker=()=>`<div class="avatar-picker"><span class="eyebrow">PICK YOUR ALTER EGO · 32 TO CHOOSE FROM</span><p class="avatar-help">Seven refreshed headliners first, then the full original cast. Swipe or scroll to see everyone.</p><div class="avatar-scroll" role="group" aria-label="Choose an avatar">${gallery.map(a=>`<button type="button" class="avatar-tile ${choice===a.id?'picked':''}" data-pick-avatar="${a.id}" aria-pressed="${choice===a.id}" title="${esc(a.name)}"><img src="${a.image}" alt="" loading="lazy" decoding="async">${a.spotlight?'<span class="avatar-new">NEW LOOK</span>':''}<span>${esc(a.name)}</span></button>`).join('')}</div></div>`;
  const celebration=(id)=>{const a=AVATARS.find(x=>x.id===id)||AVATARS[0];return a?`<img class="spotlight-art ${a.celebration?'has-poster':'portrait-only'}" src="${esc(a.celebration||a.image)}" alt="${esc(a.name)}" loading="lazy" decoding="async">`:'';};
  const resultWinner=(s)=>{const first=s.round?.entries?.filter(e=>e.award?.rank===1)||[];if(!first.length)return '';return `<div class="round-winners"><div class="eyebrow">★ TONIGHT'S ROUND HEADLINER${first.length>1?'S':''}</div><div class="winner-cast">${first.slice(0,3).map(e=>`<div class="winner-spotlight">${celebration(e.authorAvatar)}<div class="winner-spotlight-copy"><strong>${esc(e.authorName)}</strong><span>+${e.award.points} POINTS${e.award.isJoint?' · JOINT WINNER':''}</span></div></div>`).join('')}</div></div>`;};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>{const seconds=Math.max(0,Math.ceil(n/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
  const joinUrl=code=>`${location.origin}/join/?room=${encodeURIComponent(code)}`;
  const num=n=>Number(n||0);
  const copyText=async text=>{if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.left='-10000px';document.body.appendChild(field);field.select();const ok=document.execCommand('copy');field.remove();if(!ok)throw Error('Clipboard unavailable.');};
  const toastShow=text=>{toast.textContent=text;toast.classList.add('show');clearTimeout(toast._timer);toast._timer=setTimeout(()=>toast.classList.remove('show'),3500);};
  const tag=(text,extra='')=>`<span class="badge ${extra}">${esc(text)}</span>`;
  const btn=(action,label,cls='',attrs='')=>`<button type="button" class="btn ${cls}" data-action="${esc(action)}" ${attrs}>${label}</button>`;
  const storageKey=code=>`eckey-session-${code}`;
  function saveSession(code,secret){localStorage.setItem(storageKey(code),secret);localStorage.setItem('eckey-last-room',code);}
  // Browsers may ignore vibration (desktop/iOS/reduced accessibility settings).
  const thump=(pattern=15)=>{try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)navigator.vibrate?.(pattern);}catch(_){}};
  const draftKey=(room,round,stage)=>`eckey-draft-${room}-${round}-${stage}`;
  function restoreDraft(snap){const key=draftKey(S.code,snap.round?.id,snap.phase);S.draft=localStorage.getItem(key)||'';}
  function rememberDraft(){if(S.code&&S.roundId&&S.stage)localStorage.setItem(draftKey(S.code,S.roundId,S.stage),S.draft);}
  function discardDraft(){if(S.code&&S.roundId&&S.stage)localStorage.removeItem(draftKey(S.code,S.roundId,S.stage));}
  function headers(){return {'Authorization':`Bearer ${S.secret}`,'Content-Type':'application/json'};}
  async function api(path,method='GET',body,auth=true){
    const res=await fetch(path,{method,headers:auth?headers():{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
    const data=await res.json().catch(()=>({error:'Server returned an invalid response.'}));
    if(!res.ok)throw Error(data.error||'Could not complete this request.');return data;
  }
  async function action(type,data={}) {
    try{await api(`/api/rooms/${S.code}/action`,'POST',{type,...data});if(['submit','seed','vote','swap-card'].includes(type)){window.ECKEY_SFX?.play('submit');thump([20,30,30]);if(['submit','seed'].includes(type))discardDraft();}}
    catch(err){toastShow(err.message);}
  }
  function startSession(code,secret){
    if(S.stream)S.stream.abort();
    S.code=code;S.secret=secret;S.snap=null;S.roundId=null;S.stage=null;S.selected=null;S.gold=null;S.silver=null;S.draft='';S.powerDrawerOpen=false;
    saveSession(code,secret);
    history.replaceState(null,'',`/join/?room=${encodeURIComponent(code)}`);
    render(); connect();
  }
  function endSession(){if(S.stream)S.stream.abort();S.code=null;S.secret=null;S.snap=null;history.replaceState(null,'','/');render();}
  async function connect(){
    const code=S.code,secret=S.secret;
    if(S.stream)S.stream.abort();
    const ctrl=new AbortController();S.stream=ctrl;
    let retryMs=500;
    while(S.code===code && S.secret===secret && !ctrl.signal.aborted){
      try{
        const res=await fetch(`/api/rooms/${code}/events`,{headers:{'Authorization':`Bearer ${secret}`},cache:'no-store',signal:ctrl.signal});
        if(!res.ok){const d=await res.json().catch(()=>({error:'Session unavailable.'}));throw Error(d.error);}
        S.connected=true;retryMs=500;
        const reader=res.body.getReader(),decoder=new TextDecoder();let buffer='';
        for(;;){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true}).replace(/\r/g,'');
          let pos;while((pos=buffer.indexOf('\n\n'))!==-1){const block=buffer.slice(0,pos);buffer=buffer.slice(pos+2);const match=block.match(/^data: (.+)$/m);
            if(match){try{const snap=JSON.parse(match[1]);onSnapshot(snap);}catch(err){console.error('Invalid state snapshot',err);}}
          }
        }
      }catch(err){if(ctrl.signal.aborted)return;S.connected=false;document.body.classList.add('net-offline');if(S.snap)updateConnection();
        if(/invalid|expired/i.test(err.message)){toastShow('Your room session expired. Join again.');localStorage.removeItem(storageKey(code));endSession();return;}
      }
      S.connected=false;if(S.snap){document.body.classList.add('net-offline');updateConnection();}
      if(S.code===code && !ctrl.signal.aborted)await new Promise(r=>setTimeout(r,retryMs));
      retryMs=Math.min(8000,retryMs*2);
    }
  }
  function onSnapshot(snap){
    if(typeof snap.serverNow==='number') S.clockOffset=snap.serverNow-Date.now();
    if(!S.snap || S.roundId!==snap.round?.id || S.stage!==snap.phase){S.roundId=snap.round?.id||null;S.selected=null;S.gold=null;S.silver=null;S.powerDrawerOpen=false;restoreDraft(snap);}
    const prev=S.snap;
    const oldKey=prev?`${prev.round?.id||'none'}:${prev.phase}`:null;
    const newKey=`${snap.round?.id||'none'}:${snap.phase}`;
    if(oldKey && oldKey!==newKey){
      if(snap.phase==='RESULTS'&&snap.round?.entries?.some(e=>e.authorName===snap.you?.name&&e.award?.rank===1))thump([40,40,80,50,140]);
      window.ECKEY_SFX?.play(snap.phase==='RESULTS'?(snap.round?.skipReason?'skip':'reveal'):snap.phase==='COMPLETE'?'champion':snap.phase==='VOTE'?'vote':snap.phase==='SEED'||snap.phase==='SUBMIT'?'round':'tap');
      S.scenePulse=true;
    }
    S.stage=snap.phase;
    // Hand swapping powers invalidate a previously selected private response ID.
    // Never submit an obsolete ID if another contestant shuffled the hand.
    if(snap.phase==='SUBMIT'&&S.selected&&snap.round?.hand&&!snap.round.hand.some(card=>card.id===S.selected)){
      S.selected=null;toastShow('Your hand changed — choose a new card.');
    }
    if(S.snap?.round?.id===snap.round?.id&&S.snap?.phase==='SUBMIT'&&snap.phase==='SUBMIT'&&S.snap.round?.prompt!==snap.round?.prompt){
      toastShow('The prompt has changed! Check your answer.');
    }
    if(snap.phase==='VOTE'&&snap.round?.myVote){if(!S.gold)S.gold=snap.round.myVote.gold;if(!S.silver)S.silver=snap.round.myVote.silver;}
    const oldChaos=prev?.chaos?.events?.at(-1)?.id||0;
    const hits=(snap.chaos?.events||[]).filter(ev=>ev.id>oldChaos&&(ev.targetId===snap.you?.id));
    if(hits.length){thump([35,40,65]);toastShow('THUMP! A heckler has lobbed something at you!');}
    S.snap=snap;choice=snap.you?.avatar||choice;S.connected=true;document.body.classList.remove('net-offline');render();
  }
  function updateConnection(){const el=document.getElementById('connection-status');if(el){el.textContent=S.connected?'● Connected':'◌ Reconnecting…';el.style.color=S.connected?'#b3f1c8':'#ffbbaf';}}
  // A responsive logo asset; avatar rendering helpers above remain unchanged.
  const wordmark=(mode='big')=>`<img class="v16-logo v16-logo--${mode}" src="/assets/branding/ecky-thump-logo.webp" alt="ECKY THUMP" width="1506" height="1014" decoding="async">`;
  const soundControl=()=>`<button type="button" class="sound-switch" data-action="toggle-sound" aria-pressed="${window.ECKEY_AUDIO?.enabled?'true':'false'}" aria-label="${window.ECKEY_AUDIO?.enabled?'Mute lobby music':'Play lobby music'}"><span aria-hidden="true">${window.ECKEY_AUDIO?.enabled?'♫':'♪'}</span><strong>${window.ECKEY_AUDIO?.enabled?'MUSIC ON':'PLAY LOBBY MUSIC'}</strong></button>`;
  const sfxControl=()=>`<button type="button" class="sound-switch show-sfx-switch" data-action="toggle-sfx" aria-pressed="${!!window.ECKEY_SFX?.enabled}" aria-label="${window.ECKEY_SFX?.enabled?'Turn off show sound effects':'Enable show sound effects'}"><span aria-hidden="true">${window.ECKEY_SFX?.enabled?'🔊':'🔇'}</span><strong>${window.ECKEY_SFX?.enabled?'SHOW SFX ON':'ENABLE SHOW SFX'}</strong></button>`;
  const sceneCopy={CARD:['CARD CLASH','PICK THE MOST RIDICULOUS ANSWER'],WIT:['QUICK WIT','FAST THINKING. BETTER PUNCHLINES.'],CONTEXT:['CONTEXT COLLAPSE','FROM PERFECTLY INNOCENT TO FRONT-PAGE SCANDAL'],DOUBLE:['DOUBLE TROUBLE','BUY ONE DISASTER, GET ANOTHER FREE'],FINAL:['THE LAST LAUGH','YOUR FINAL SHOT AT GLORY']};
  const phaseCopy={SEED:['KEEP IT INNOCENT, DUCK','WRITE A NORMAL LINE — SOMEONE ELSE WILL RUIN IT'],VOTE:['THE PEOPLE HAVE SPOKEN','GOLD AND SILVER. NO VOTING FOR YOURSELF.'],RESULTS:['THE VERDICT IS IN','THE POINTS ARE OUT AND SO ARE THE EXCUSES'],FINISHED:['ONE LAST CHAMPION','ONE LEGEND. SEVERAL QUESTIONABLE DECISIONS.']};
  function stageHeader(s,phase){const label=phaseCopy[phase]||sceneCopy[s.round?.type]||['ROUND TIME','GET READY FOR NONSENSE'];return `<div class="stage-show-heading ${phase==='VOTE'?'is-vote':phase==='RESULTS'?'is-result':s.round?.type==='FINAL'?'is-final':s.round?.type==='CONTEXT'?'is-context':''}"><div class="stage-kicker"><span class="stage-counter">${String(s.roundNumber).padStart(2,'0')}</span><span>ROUND ${s.roundNumber} OF ${s.totalRounds} · ${esc(s.round?.label||'THE SHOW')}</span></div><div class="stage-name">${label[0]}</div><div class="stage-tagline">${label[1]}</div></div>`;}
  function confetti(){const colors=['#ffe76a','#ff60c9','#5ce8ff','#a8ff79'];return `<div class="fx-confetti" aria-hidden="true">${Array.from({length:22},(_,i)=>`<i style="--x:${(i*43)%96+2}%;--d:${(i*17)%15/10}s;--r:${i*37}deg;--drift:${((i%5)-2)*28}px;--c:${colors[i%4]}"></i>`).join('')}</div>`;}
  function nav(){return '';}
  function syncScene(){window.ECKEY_AUDIO?.setScene(!S.snap||S.snap.phase==='LOBBY'?'LOBBY':'GAME');}
  // The title screen is a cover, not a form. Both calls-to-action open the
  // corresponding accessible dialog, with no duplicated or inactive buttons.
  function renderLanding(){
    const entry=esc(q.get('room')||'');
    const lastCode=localStorage.getItem('eckey-last-room');
    const previousSession=lastCode&&/^[A-Z2-9]{6}$/.test(lastCode)&&localStorage.getItem(storageKey(lastCode));
    app.innerHTML=nav()+`<div class="e15-home v14-home">
      <header class="e15-header"><a class="e15-brand v16-navbar-brand" href="/" aria-label="ECKY THUMP home">${wordmark('mini')}</a><div class="e15-header-right"><span class="e15-live-pill"><i></i> PRIVATE GAME NIGHT</span><div class="e15-audio">${soundControl()}${sfxControl()}</div></div></header>
      <main class="e15-hero v16-hero" aria-label="Play ECKY THUMP"><div class="v16-hero-glow" aria-hidden="true"></div>
        <section class="e15-hero-copy v16-hero-copy">
          <span class="e15-overline">● THE BROWSER PARTY GAME FOR CHAOTIC MINDS</span>
          <h1 class="visually-hidden">ECKY THUMP — The browser party game</h1>
          ${wordmark('hero')}
          <p class="v16-hero-tag">SAME FRIENDS. <strong>WORSE ANSWERS.</strong></p>
          <p class="v16-hero-description">Ridiculous challenges, ruthless voting, and the sort of answers that get brought up at Christmas.</p>
          <div class="e15-hero-buttons v16-hero-actions"><button class="e15-main-button e15-primary" type="button" data-action="go-host"><span aria-hidden="true">▶</span><span>PLAY NOW<small>HOST A NEW GAME</small></span><b aria-hidden="true">↗</b></button>
          <button class="e15-main-button e15-secondary" type="button" data-action="go-join"><span aria-hidden="true">↗</span><span>JOIN GAME<small>ENTER A ROOM CODE</small></span><b aria-hidden="true">↗</b></button></div>
          <div class="e15-rating-inline v16-home-rating"><span>CHOOSE YOUR VIBE</span><div class="e15-rating-buttons"><button type="button" data-action="home-family" class="v14-mode is-on" aria-pressed="true">EVERYONE</button><button type="button" data-action="home-adult" class="v14-mode" aria-pressed="false">AFTER DARK · 18+</button></div></div>
          <div class="e15-hero-meta v16-hero-meta"><span>⚡ QUICK TO START</span><span>♛ 5 RIDICULOUS GAMES</span><span>◉ NO DOWNLOADS</span></div>
        </section><aside class="v16-hero-stage" aria-label="Contestants appearing on the show"><div class="v16-stage-lights" aria-hidden="true"></div>
          <span class="v16-stage-topline">◉ YOU AND YOUR MATES, ON THE MAIN STAGE</span>
          <div class="v16-hero-cast"><div class="v16-hero-character v16-hero-character-one">${avatar('adult-06')}<b>THE GEEZER</b></div>
          <div class="v16-hero-character v16-hero-character-two">${avatar('adult-13')}<b>DRAMA QUEEN</b></div>
          <div class="v16-hero-character v16-hero-character-three">${avatar('adult-18')}<b>THE SOCIALITE</b></div>
          <div class="v16-hero-character v16-hero-character-four">${avatar('adult-23')}<b>GLAM GRAN</b></div></div>
          <div class="v16-stage-footer"><strong>32 CHARACTERS TO CHOOSE</strong><span>YOUR GAMES NIGHT. YOUR LEGENDS.</span></div></aside>
      </main>
      <section class="e15-lower-strip v16-lower-strip"><span>✦ FUNNIER WITH FRIENDS</span><span>⚡ PHONES ARE CONTROLLERS</span><span>✧ VOTE · LAUGH · REPEAT</span></section>
      <section class="v14-get-started" id="game-setup" aria-label="Start playing">
        <form id="create-form" class="v14-entry" hidden><div class="v14-entry-head"><div><span class="v14-section-label">01 / HOST</span><h2>GET THE MATES IN!</h2><p>Set the tone, pick your alter ego, then share your code.</p></div><button type="button" class="v14-close" data-action="close-setup" aria-label="Close">✕</button></div>
          <label class="label" for="host-name">YOUR NAME</label><input class="field" id="host-name" maxlength="22" placeholder="Captain Chaos" required autocomplete="nickname">
          <details class="v14-avatar-details"><summary>CHOOSE YOUR CHARACTER <span>32 available ▾</span></summary><div id="host-avatar-picker"></div></details>
          <fieldset class="setup-group" aria-describedby="humour-description"><legend class="label">HUMOUR LEVEL</legend><p class="setup-help" id="humour-description">All players in an Adult room must confirm they are 18+.</p>
            <div class="setup-options" role="group" aria-label="Humour level choices">
              <label class="setup-choice"><input type="radio" name="humour" value="clean" checked><span class="setup-choice-face"><span class="setup-choice-icon" aria-hidden="true">☀</span><strong>Family</strong><small>Keep it clean</small></span></label>
              <label class="setup-choice"><input type="radio" name="humour" value="cheeky"><span class="setup-choice-face"><span class="setup-choice-icon" aria-hidden="true">😉</span><strong>Cheeky</strong><small>A bit saucy</small></span></label>
              <label class="setup-choice"><input type="radio" name="humour" value="adult"><span class="setup-choice-face"><span class="setup-choice-icon" aria-hidden="true">♥</span><strong>After Dark</strong><small>Adults only</small></span></label>
            </div></fieldset>
          <fieldset class="setup-group"><legend class="label">GAME LENGTH</legend><div class="setup-options" role="group" aria-label="Game length choices">
              <label class="setup-choice"><input type="radio" name="length" value="quick"><span class="setup-choice-face"><strong>QUICK</strong><small>2 rounds</small></span></label>
              <label class="setup-choice"><input type="radio" name="length" value="standard"><span class="setup-choice-face"><strong>CLASSIC</strong><small>4 rounds</small></span></label>
              <label class="setup-choice"><input type="radio" name="length" value="party" checked><span class="setup-choice-face"><strong>EPIC</strong><small>6 rounds</small></span></label>
            </div></fieldset>
          <fieldset class="setup-group"><legend class="label">PACE OF PLAY</legend><div class="setup-options setup-options-two" role="group" aria-label="Pace of play choices">
              <label class="setup-choice"><input type="radio" name="pace" value="relaxed" checked><span class="setup-choice-face"><strong>🍻 CHILLED</strong><small>Host controls breaks</small></span></label>
              <label class="setup-choice"><input type="radio" name="pace" value="lively"><span class="setup-choice-face"><strong>⚡ CHAOTIC</strong><small>Quick automatic rounds</small></span></label>
            </div></fieldset>
          <label class="checkline hidden" id="host-adult-wrap"><input id="host-adult" type="checkbox">I confirm I am 18+ and understand every player must confirm individually.</label>
          <button type="submit" class="btn wide v14-submit v14-submit-host">CREATE MY ROOM →</button>
        </form>
        <form id="join-form" class="v14-entry" hidden><div class="v14-entry-head"><div><span class="v14-section-label">02 / JOIN</span><h2>YOU'RE ONE OF US!</h2><p>Enter the six-character code your mate sent.</p></div><button type="button" class="v14-close" data-action="close-setup" aria-label="Close">✕</button></div>
          <label class="label" for="join-code">YOUR ROOM CODE</label><input class="field" id="join-code" maxlength="6" placeholder="ABC123" value="${entry}" required autocapitalize="characters" autocomplete="off">
          <label class="label" for="join-name">YOUR NAME</label><input class="field" id="join-name" maxlength="22" placeholder="Disco Donna" required autocomplete="nickname">
          <details class="v14-avatar-details"><summary>CHOOSE YOUR CHARACTER <span>32 available ▾</span></summary><div id="join-avatar-picker"></div></details>
          <label id="join-adult-wrap" class="checkline"><input id="join-adult" type="checkbox">I confirm I am 18+ (required in After Dark rooms).</label>
          <button type="submit" class="btn wide v14-submit v14-submit-join">JOIN THE MAYHEM →</button></form>
      </section>
      ${previousSession?`<div class="v14-rejoin">Still knocking about in room <strong>${esc(lastCode)}</strong>? ${btn('rejoin','REJOIN LAST GAME','dark small')}</div>`:''}
      <footer class="v14-footer">GAMES · MATES · MAYHEM &nbsp; | &nbsp; PRIVATE INVITES ONLY &nbsp; | &nbsp; BAD JOKES ENCOURAGED</footer>
    </div>`;
    // Keep avatarPicker and all original avatar mappings exactly as before.
    document.getElementById('host-avatar-picker').innerHTML=avatarPicker();document.getElementById('join-avatar-picker').innerHTML=avatarPicker();
    const chosen=name=>document.querySelector(`input[name="${name}"]:checked`)?.value;
    document.querySelectorAll('input[name="humour"]').forEach(input=>input.addEventListener('change',()=>{
      document.getElementById('host-adult-wrap').classList.toggle('hidden',chosen('humour')!=='adult');
      const adult=chosen('humour')==='adult';document.querySelectorAll('[data-action="home-adult"]').forEach(b=>{b.classList.toggle('is-on',adult);b.setAttribute('aria-pressed',String(adult));});document.querySelectorAll('[data-action="home-family"]').forEach(b=>{b.classList.toggle('is-on',!adult);b.setAttribute('aria-pressed',String(!adult));});
    }));
    document.getElementById('create-form').addEventListener('submit',async ev=>{
      ev.preventDefault();const button=ev.submitter;button.disabled=true;
      try{const data=await api('/api/rooms','POST',{name:document.getElementById('host-name').value,rating:chosen('humour'),length:chosen('length'),pace:chosen('pace'),avatar:choice,adultConfirmed:document.getElementById('host-adult').checked},false);startSession(data.code,data.secret);}
      catch(err){toastShow(err.message);}finally{button.disabled=false;}
    });
    document.getElementById('join-form').addEventListener('submit',async ev=>{
      ev.preventDefault();const button=ev.submitter;button.disabled=true;
      const code=document.getElementById('join-code').value.toUpperCase().trim().replace(/[^A-Z2-9]/g,'');
      try{const data=await api(`/api/rooms/${code}/join`,'POST',{name:document.getElementById('join-name').value,avatar:choice,adultConfirmed:document.getElementById('join-adult').checked},false);startSession(data.code,data.secret);}
      catch(err){toastShow(err.message);}finally{button.disabled=false;}
    });
    if(entry){document.querySelector('[data-action="go-join"]')?.click();}
  }
  function shareControls(s){return `<div class="utility-actions">${btn('copy-code','Copy code','dark small')}${btn('copy-link','Copy invite','dark small')}${s.you?.isHost?btn('tv','↗ OPEN TV','small')+btn('copy-tv','Copy TV link','dark small'):''}</div>`;}
  function scoreRows(players){return `<div class="player-list">${players.map((p,i)=>`<div class="player-row"><span class="identity">${avatar(p.avatar)}<strong>${i===0&&p.score?'♛ ':''}${esc(p.name)}</strong></span><span class="right"><span class="${p.online?'online-dot':'online-dot offline-dot'}"></span><strong class="stat">${num(p.score)} pts</strong></span></div>`).join('')}</div>`;}
  function roomTop(s){return `<div class="room-head v16-mobile-room-head"><div class="v16-room-identity">${wordmark('phone')}<div><span class="eyebrow">ROOM · ${s.phase==='LOBBY'?'GREEN ROOM':'MAIN EVENT'}</span>
    <div class="room-code">${esc(s.code)}</div><div class="sub"><span id="connection-status">● Connected</span> · ${s.players.length} PLAYERS</div></div></div><details class="v16-room-tools" ${window.innerWidth>720?'open':''}><summary>TOOLS · SOUND · INVITE</summary><div class="show-audio-controls">${sfxControl()}${shareControls(s)}</div></details></div>`;}
  const ratingSwitch=s=>`<section class="postcard-pack-switch e15-rating-panel" aria-label="Lobby humour pack"><strong>CONTENT RATING</strong><div class="postcard-pack-buttons">${btn('rating-family','EVERYONE',s.config.rating==='clean'?'selected-pack':'dark small',s.you?.isHost?'':'disabled')}${btn('rating-adult','AFTER DARK · 18+',s.config.rating==='adult'?'selected-pack':'dark small',s.you?.isHost?'':'disabled')}</div><small>Adults must confirm individually to enable After Dark · ${s.adultConsents} / ${s.adultConsentNeeded} confirmed</small></section>`;
  const gameCardSwitch=s=>`<section class="e17-lobby-cards" aria-label="Game Cards setting"><div><strong>GAME CARDS · OPTIONAL</strong><small>Power-ups, pranks and comeback challenges. Separate from comedy response cards.</small></div>${s.you?.isHost?btn('toggle-game-cards',s.gameCards?.enabled?'✓ GAME CARDS ON':'ENABLE GAME CARDS',s.gameCards?.enabled?'mint small':'dark small'):`<b>${s.gameCards?.enabled?'ENABLED':'OFF'}</b>`}</section>`;
  function gameCardTray(s){
    const g=s.gameCards;
    if(!g?.enabled||!['SUBMIT','RESULTS'].includes(s.phase))return '';
    const alive=s.phase==='SUBMIT'&&!s.round.submitted&&!g.playedThisRound&&g.playsUsed<2;
    return `<section class="e17-card-tray" aria-label="Your Game Cards"><div class="e17-card-head"><strong>⚡ YOUR GAME CARDS</strong><span>${g.playsUsed} / 2 USED THIS MATCH · ${g.bonusRemaining??40} BONUS POINTS LEFT</span></div>
      ${g.equaliser?`<div class="e17-equaliser"><strong>★ UNDERDOG BOOST: ${esc(g.equaliser.name)}</strong><p>${esc(g.equaliser.description)}</p>${g.contractWord?`<p>Include the word <b>${esc(g.contractWord.toUpperCase())}</b> and earn a Gold vote.</p>`:''}</div>`:''}
      ${g.extra?`<div class="e17-extra-options"><strong>EXTRA HELPING — PICK AN EXTRA CARD</strong><p>First select an existing response card in your hand to replace. Then choose one of these.</p><div class="e17-option-grid">${g.extra.choices.map(c=>btn('take-extra',esc(c.text),'e17-option',`data-id="${esc(c.id)}" ${!S.selected?'disabled':''}`)).join('')}</div></div>`:''}
      ${['SUBMIT','RESULTS'].includes(s.phase)?`<div class="e17-card-list">${(g.inventory||[]).map(c=>{const canPlay=c.playable===true;return `<article class="e17-power"><div class="e17-tier e17-${esc(c.tier.toLowerCase())}">${esc(c.tier)}</div><strong>${esc(c.name)}</strong><p>${esc(c.description)}</p>${!canPlay?`<small class="e18-power-reason">${esc(c.reason||'Unavailable right now')}</small>`:''}${c.id==='TACT_BULLSEYE'?`<div class="e17-prediction"><span>PREDICT GOLD VOTES:</span>${btn('power-predict-1','1 GOLD','dark small',`data-id="${esc(c.id)}" ${!canPlay?'disabled':''}`)}${btn('power-predict-2','2 GOLD','dark small',`data-id="${esc(c.id)}" ${!canPlay?'disabled':''}`)}</div>`:btn('play-power','PLAY CARD','small',`data-id="${esc(c.id)}" ${!canPlay?'disabled':''}`)}${s.phase==='SUBMIT'&&!s.round.submitted&&!g.playedThisRound&&!g.rerolledThisRound&&g.playsUsed<2?btn('reroll-power','↻ REPLACE CARD','ghost small',`data-id="${esc(c.id)}"`):''}</article>`;}).join('')||'<p class="sub">No power-ups currently held. New ones arrive before eligible rounds.</p>'}</div>`:''}
      <div class="e17-fx-feedback">${g.latest?`<span>LATEST: ${esc(g.latest.name)} · ${esc(g.latest.by)}</span>${['fun','frustrating'].map(kind=>btn('feedback-'+kind,kind==='fun'?'👍 FUN':'👎 TOO MUCH','ghost small',`data-id="${esc(g.latest.id)}"`)).join('')}`:''}</div>
    </section>`;
  }
  // Keep timed Game Cards available, but do not bury the primary answer input
  // under two paragraphs of instructions and an open power-up panel on phones.
  function gameCardDrawer(s){
    const g=s.gameCards;
    if(!g?.enabled||s.round?.type==='FINAL')return '';
    const total=g.inventory?.length||0;
    // Immediate, readable quick-play controls prevent 5-10 second effects from being
    // hidden in an initially closed tray; the full details panel remains optional.
    const eligible=s.phase==='SUBMIT'&&!s.round.submitted?(g.inventory||[]).filter(c=>c.playable).slice(0,2):[];
    const quick=eligible.length?`<div class="e18-quickbar" aria-label="Quick-play power-ups"><div class="e18-quickhead"><strong>⚡ POWER-UPS READY</strong><small>One tap to play · one power per round</small></div><div class="e18-quickcards">${eligible.map(c=>c.id==='TACT_BULLSEYE'?btn('open-power-drawer',`🎯 ${esc(c.name)} · CHOOSE BET`,'e18-quick-action e18-bet'):
      btn('play-power',`⚡ ${esc(c.name)}${c.expiresAt?` <span class="e18-countdown" data-power-expires="${c.expiresAt}">READY</span>`:''}`,'e18-quick-action',`data-id="${esc(c.id)}" data-expires="${c.expiresAt||0}"`)).join('')}</div></div>`:'';
    const speed=g.speedBonusUntil?`<div class="e18-speed-warning" role="status">⚡ FAST FINGERS ACTIVE — SUBMIT TO CLAIM THE +20 SHOT <strong id="e18-speed-timer">--</strong></div>`:'';
    return `${speed}${quick}<details id="e171-powers" class="e171-powers" ${S.powerDrawerOpen||g.extra?'open':''}><summary><span>⚡ POWER-UPS <b>${total} HELD</b></span><small>${g.playedThisRound?'USED THIS ROUND':g.playsUsed>=2?'ALL PLAYS USED':g.extra?'CHOOSE YOUR EXTRA CARD':'TAP TO PLAY OR REPLACE'}</small></summary>${gameCardTray(s)}</details>`;
  }
  const consentCallout=s=>s.you?.adultConfirmed?'':`<div class="postcard-consent">Unlock After Dark prompts: ${btn('adult-consent','I AM 18+ · CONFIRM','dark small')}<small>Only enable for adults. Everyone mode is available without confirmation.</small></div>`;
  function renderAudience(s){const opts=[['pudding','🥮 LOB A BLACK PUDDING'],['wrench','🔧 THROW A WRENCH'],['shake','💥 RATTLE THE STAGE']];
    return `<main class="audience-layout"><section class="panel postcard-audience"><span class="eyebrow">THE CHAOS LOUNGE · AUDIENCE MODE</span><h1>HEAR THAT? IT'S THE HECKLERS!</h1><div class="room-code">ROOM ${esc(s.code)}</div><p>Welcome, ${esc(s.you?.name)}. You are watching, not competing. Your tricks are cosmetic; no scores or timers are changed.</p>
    ${s.phase==='LOBBY'?`<p>Polishing the flatcaps, hang on a tick… ${s.players.length}/12 contestants ready.</p>${consentCallout(s)}`:`<div class="chaos-console"><h2>LET 'EM HAVE IT!</h2><div class="chaos-options">${opts.map(([kind,label])=>btn('chaos-'+kind,label,'small')).join('')}</div><span class="eyebrow">TARGET (OPTIONAL)</span><select id="chaos-target" class="field"><option value="">The whole stage</option>${s.players.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select><small>One trick every eight seconds. Effects won't interrupt player inputs.</small></div>
    <div class="postcard-poll"><h2>VOTE ON THE STAGE NONSENSE</h2><p>Audience-only atmosphere poll — purely visual, no scores affected.</p>${[['pudding-rain','BLACK PUDDING RAIN'],['pier-panic','PIER PANIC'],['crowd-roar','CROWD ROAR']].map(([key,label])=>btn('chaos-vote-'+key,`${label} (${s.chaos?.tally?.[key]||0})`,'dark small')).join('')}</div>`}
    <div class="utility-actions">${btn('copy-link','COPY INVITE','dark small')}${btn('leave','LEAVE','ghost small')}</div></section></main>`;
  }
  function renderLobby(s){const waiting=Math.max(0,3-s.players.length);const chips=(s.config.length==='quick'?['CARD CLASH','QUICK WIT']:s.config.length==='standard'?['CARD CLASH','QUICK WIT','CONTEXT COLLAPSE','THE LAST LAUGH']:['CARD CLASH','QUICK WIT','CONTEXT COLLAPSE','DOUBLE TROUBLE','CARD CLASH','THE LAST LAUGH']);
    return `<section class="panel stage-panel v14-lobby e15-lobby v16-lobby"><div class="e15-lobby-heading v16-lobby-heading"><div class="v16-lobby-ident">${wordmark('lobby')}<div><span class="e15-overline">● THE GREEN ROOM / ${s.players.length} CONTESTANTS</span><h1>${waiting?'GET YOUR MATES IN.':'LET THE MAYHEM BEGIN.'}</h1><p>${waiting?`Waiting for ${waiting} more ${waiting===1?'player':'players'} to get started.`:'All set. Kick things off when your group is ready.'}</p></div></div><div class="show-audio-controls">${soundControl()}${sfxControl()}</div></div>
      <div class="v14-lobby-join e15-join-row v16-join-row"><div class="v14-big-room e15-code-block"><span>SHARE THIS GAME CODE</span><strong>${esc(s.code)}</strong><div class="utility-actions">${btn('copy-code','COPY CODE','dark small')}${btn('copy-link','COPY INVITE LINK','small')}</div></div><div class="v14-big-qr e15-qr-block"><img src="/api/rooms/${esc(s.code)}/join-qr.svg" alt="Scan to join ECKY THUMP room ${esc(s.code)}"><span>SCAN TO JOIN</span></div></div>
      <div class="v14-lobby-columns e15-lobby-grid v16-lobby-grid"><div class="v14-players-panel e15-players-panel"><div class="v14-panel-heading"><h2>THE LINE-UP <small>${s.players.length} / 12</small></h2><span>${s.players.length>=3?'READY TO ROLL':'MINIMUM 3 PLAYERS'}</span></div><div class="lobby-stage-cast" aria-label="Players in the lobby">${s.players.map((p,i)=>`<div class="stage-contestant" style="--i:${i%5}">${avatar(p.avatar)}<strong>${esc(p.name)}</strong><span>${p.online?'● ONLINE':'◌ OFFLINE'}</span></div>`).join('')}${Array.from({length:Math.min(3,Math.max(0,3-s.players.length))},()=>'<div class="v14-empty-seat"><span aria-hidden="true">+</span><small>OPEN SLOT</small></div>').join('')}</div></div>
       <aside class="v14-settings-panel e15-settings-panel"><h2>TONIGHT'S SETTINGS</h2><div class="v14-setting-line"><span>CONTENT</span><strong>${esc(s.config.rating==='adult'?'AFTER DARK':s.config.rating==='cheeky'?'CHEEKY':'EVERYONE')}</strong></div><div class="v14-setting-line"><span>GAME LENGTH</span><strong>${chips.length} ROUNDS</strong></div><div class="v14-setting-line"><span>PLAY SPEED</span><strong>${esc(s.config.pace==='lively'?'LIVELY':'RELAXED')}</strong></div>${ratingSwitch(s)}${gameCardSwitch(s)}${consentCallout(s)}</aside></div>
      <div class="v14-lobby-bottom e15-lobby-bottom v16-lobby-bottom"><div class="your-avatar"><span class="eyebrow">YOUR CHARACTER</span><div>${avatar(s.you.avatar)} <strong>${esc(AVATARS.find(a=>a.id===s.you.avatar)?.name||'Choose your character')}</strong> ${btn('change-avatar','CHANGE','small dark')}</div><div id="lobby-avatar-picker" class="hidden"></div></div>${s.you.isHost?`${btn('start',waiting?'WAITING FOR PLAYERS':'START THE GAME →','wide showtime-start v14-start',waiting?'disabled':'')}<div class="utility-actions v14-tv-actions">${btn('tv','↗ OPEN TV DISPLAY','dark small')}${btn('copy-tv','COPY TV LINK','dark small')}</div>`:`<div class="v14-waiting-note">YOU'RE IN. THE HOST WILL START THE GAME.</div>`}</div>
      <details class="v14-more-details"><summary>ROUND LINE-UP &amp; HOST CONTROLS</summary><div class="challenge-sequence">${chips.map((name,i)=>`<span class="challenge-chip">${i+1}. ${name}</span>`).join('')}</div>${s.you.isHost?`<div class="lobby-friends">${s.players.map(p=>`<div class="lobby-friend"><span>${avatar(p.avatar)} ${esc(p.name)}</span>${p.id!==s.you.id?btn('remove-player','Remove','ghost small',`data-id="${esc(p.id)}"`):''}</div>`).join('')}</div>`:''}</details></section>`;
  }
  const directions={
    CARD:['PICK ONE CARD','Choose your funniest response from the seven cards in your hand.','Choose a different card only if you have not submitted yet.'],
    WIT:['WRITE YOUR OWN JOKE','Write a short, original answer to the question.','A Chaos Contract may give your answer an extra twist.'],
    CONTEXT:['MAKE A SCANDAL','First submit an innocent line; then twist someone else’s line into a ridiculous scandal.','The author of the innocent line is not revealed until results.'],
    DOUBLE:['CARD + YOUR PUNCHLINE','Pick an absurd product card, then write the worst possible sales pitch.','Your card and your line appear together in the vote.'],
    FINAL:['ONE LAST LAUGH','Write your strongest punchline and include the required word or phrase.','All points in this round are doubled.']};
  function roundGuide(s){const info=directions[s.round?.type]||directions.CARD;
    const phase=s.phase==='VOTE'?['VOTE FOR THE FUNNIEST','Give Gold to your favourite and Silver to a different answer.','You cannot vote for yourself.']:
      s.phase==='SEED'?['PART ONE: BE INNOCENT','Write a normal sentence. Do not write a joke yet.','The next stage gives it to someone else to twist.']:
      s.phase==='SUBMIT'&&s.round.type==='CONTEXT'?['PART TWO: RUIN IT','Use the innocent line you have been given to invent a scandal.','Make it a fictional headline or spectacular misunderstanding.']:info;
    return `<div class="round-guide" aria-label="How to play this round"><span class="round-guide-icon" aria-hidden="true">⚡</span><div><strong>${phase[0]}</strong><p>${phase[1]}</p><small>${phase[2]}</small></div></div>`;}
  function readyPanel(s){const r=s.round, ready=r.readyCount||0,total=s.players.length, all=ready>=total;
    return `<div class="ready-zone"><div class="ready-top"><div><span class="eyebrow">NEXT UP</span><strong>${esc(r.nextChallenge||'CHAMPION REVEAL')}</strong></div><div class="ready-count">${ready} / ${total} READY</div></div>
      <progress class="ready-meter" value="${ready}" max="${total}" aria-label="Players ready for next round">${ready} / ${total}</progress>
      ${r.youReady?'<div class="ready-thanks">✓ You’re ready — enjoy the banter.</div>':btn('ready-next','✓ I’M READY FOR THE NEXT ROUND','mint wide')}
      ${s.you.isHost?`<div class="ready-host-note">${all?'Everyone is ready!':`You can continue at any time, or give friends another moment (${total-ready} still waiting).`}</div>${btn('next',s.roundNumber===s.totalRounds?'🏆 REVEAL THE CHAMPION →':'⚡ NEXT ROUND →','wide')}`:`<div class="ready-host-note">${s.config.pace==='relaxed'?'The host advances after the laughs.':'Lively mode advances automatically after the results countdown, or when the host continues.'}</div>`}
    </div>`;}
  function cardChoose(s){const r=s.round;
    return `${r.submitted?`<div class="notice">✓ Answer locked in. Waiting for ${Math.max(0,s.players.length-r.submissionCount)} other player(s).</div>`:
      `<div class="eyebrow">YOUR PRIVATE HAND · PICK ONE</div><div class="card-grid">${(r.hand||[]).map(card=>`<button class="pick-card ${S.selected===card.id?'selected':''}" data-action="select-card" data-id="${esc(card.id)}" aria-pressed="${S.selected===card.id}">${esc(card.text)}</button>`).join('')}</div>${r.swapUsed?'<div class="status-note">↻ You have used your card swap for this round.</div>':btn('swap-card',S.selected?'↻ SWAP THE SELECTED CARD':'↻ SELECT A CARD TO SWAP','dark small',!S.selected?'disabled':'')}${btn('submit',S.selected?'LOCK IN MY CARD →':'CHOOSE A CARD FIRST','wide',!S.selected?'disabled':'')}`}`;
  }
  function witWrite(s){const r=s.round;
    if(r.submitted)return `<div class="notice">✓ Your masterpiece is submitted. Waiting for ${Math.max(0,s.players.length-r.submissionCount)} player(s).</div>`;
    return `${r.contract?`<div class="contract">✦ CHAOS CONTRACT: ${esc(r.contract)}</div>`:''}<label class="label" for="answer-input">YOUR FUNNIEST ORIGINAL ANSWER</label>
      <textarea class="textarea" id="answer-input" maxlength="250" placeholder="Write your finest nonsense…" aria-describedby="answer-counter"></textarea>
      <div class="inline-counter"><span class="sub">Others won't see your name until after voting.</span><span class="sub" id="answer-counter">0 / 160</span></div>
      ${btn('submit','SUBMIT ANSWER →','wide')}`;
  }
  function doubleWrite(s){const r=s.round;
    if(r.submitted)return `<div class="notice">✓ Your cursed advert is locked in. Awaiting the rest of the gang.</div>`;
    return `<div class="eyebrow">STEP 1 · CHOOSE YOUR ABSURD PRODUCT</div><div class="card-grid">${(r.hand||[]).map(card=>`<button class="pick-card ${S.selected===card.id?'selected':''}" data-action="select-card" data-id="${esc(card.id)}" aria-pressed="${S.selected===card.id}">${esc(card.text)}</button>`).join('')}</div>
      ${r.swapUsed?'<div class="status-note">↻ Card swap used.</div>':btn('swap-card',S.selected?'↻ SWAP THE SELECTED CARD':'↻ SELECT A CARD TO SWAP','dark small',!S.selected?'disabled':'')}<label class="label" for="answer-input">STEP 2 · WRITE THE TERRIBLE SALES PITCH</label><textarea class="textarea" id="answer-input" maxlength="160" placeholder="The slogan no advertiser would ever approve…"></textarea>
      <div class="inline-counter"><span class="sub">Your card + your punchline will be shown together.</span><span class="sub" id="answer-counter">0 / 160</span></div>
      ${btn('submit',S.selected?'SUBMIT THIS MONSTROSITY →':'PICK A CARD FIRST','wide',!S.selected?'disabled':'')}`;
  }
  function contextSeed(s){const r=s.round;
    return `<section class="panel stage-panel">${stageHeader(s,"SEED")}<div class="room-head"><div><div class="eyebrow">ROUND ${s.roundNumber} / ${s.totalRounds} · CONTEXT COLLAPSE · PART 1</div><h2 class="section-title">SAY SOMETHING INNOCENT.</h2></div><span class="timer" id="timer">--</span></div>
      <div class="prompt-box"><p>${esc(r.prompt)}</p></div><div class="contract">🗞 Next, somebody else will turn your harmless line into a scandalous headline. Don't write the joke yet!</div>
      <div class="progress"><span style="width:${Math.round(100*r.submissionCount/s.players.length)}%"></span></div>
      ${roundGuide(s)}${gameCardTray(s)}${s.paused?'<div class="notice alert">⏸ The host has paused the round.</div>':''}
      ${r.submitted?'<div class="notice">✓ Your innocent line is in. You’ll be given somebody else’s line shortly.</div>':`<label class="label" for="answer-input">YOUR INNOCENT LINE</label><textarea class="textarea" id="answer-input" maxlength="160" placeholder="I thought it was for the neighbours…"></textarea><div class="inline-counter"><span class="sub">Only your eventual rewrite is scored.</span><span id="answer-counter" class="sub">0 / 160</span></div>${btn('seed','HAND OVER MY LINE →','wide')}`}
      <div class="status-note">${r.submissionCount}/${s.players.length} innocent lines collected</div></section>`;
  }
  function contextRewrite(s){const r=s.round;
    if(r.submitted)return `<div class="notice">✓ Scandal created. Waiting for other contestants.</div>`;
    return `<div class="eyebrow">SOMEONE ELSE WROTE THIS INNOCENT LINE</div><div class="context-seed">“${esc(r.assignedSeed||'The truth will come out.') }”</div><div class="contract">💥 Turn it into a ridiculous fictional headline or explain the scandalous situation. Your rewrite is judged; not the original line.</div>
      <label class="label" for="answer-input">YOUR TWISTED CONTEXT</label><textarea class="textarea" id="answer-input" maxlength="160" placeholder="BREAKING: local council forced to apologise after…"></textarea>
      <div class="inline-counter"><span class="sub">Names stay hidden until the votes are in.</span><span class="sub" id="answer-counter">0 / 160</span></div>${btn('submit','PUBLISH THE SCANDAL →','wide')}`;
  }
  function renderSubmit(s){const r=s.round;
    return `<section class="panel stage-panel">${stageHeader(s,"SUBMIT")}<div class="room-head"><div><span class="eyebrow">ROUND ${s.roundNumber} / ${s.totalRounds} · ${esc(r.label)}</span><h2 class="section-title">${r.type==='CARD'?'PLAY YOUR STAR CARD!':r.type==='DOUBLE'?'SELL THE IMPOSSIBLE!':r.type==='CONTEXT'?'TWIST THE TRUTH!':r.type==='FINAL'?'ONE LAST SHOT!':'WIN THE CROWD!'}</h2></div><span class="timer" id="timer" role="timer">--</span></div>
      <div class="prompt-box"><p>${esc(r.prompt)}</p></div>${r.multiplier>1?`<div class="finale-multiplier">⚡ FINAL ROUND · DOUBLE POINTS ⚡</div>`:""}<div class="progress"><span style="width:${Math.round(100*r.submissionCount/s.players.length)}%"></span></div>
      <div class="inline-counter"><span class="sub">${r.submissionCount} of ${s.players.length} answers received</span>${tag('PRIVATE SUBMISSIONS')}</div>
      ${roundGuide(s)}${gameCardDrawer(s)}${s.paused?`<div class="notice alert">⏸ The host has paused the game.</div>`:''}
      ${r.type==='CARD'?cardChoose(s):r.type==='DOUBLE'?doubleWrite(s):r.type==='CONTEXT'?contextRewrite(s):witWrite(s)}
      </section>`;
  }
  function ballotCard(s,c,i){const r=s.round,own=c.isOwn,selectedGold=S.gold===c.id,selectedSilver=S.silver===c.id;
    return `<article class="candidate ${own?'mine':''} ${selectedGold?'gold-selected':''} ${selectedSilver?'silver-selected':''}">
      <div><div class="eyebrow">ENTRY ${String(i+1).padStart(2,'0')} ${own?'· YOURS':''}${c.reportCount?' · ⚑ '+c.reportCount+' REPORT(S)':''}</div><div class="candidate-text" style="margin-top:10px">${esc(c.text)}</div></div>
      <div class="candidate-actions">${own?tag('NO SELF-VOTING'):`<button class="candidate-action gold-pick ${selectedGold?'on':''}" data-action="gold" data-id="${esc(c.id)}" ${s.round.voted?'disabled':''}>★ GOLD</button>
      <button class="candidate-action silver-pick ${selectedSilver?'on':''}" data-action="silver" data-id="${esc(c.id)}" ${s.round.voted?'disabled':''}>◇ SILVER</button>`}
      ${!own?`<button class="candidate-action" data-action="report" data-id="${esc(c.id)}" title="Report inappropriate answer">⚑ Report</button>`:''}
      ${s.you?.isHost?`<button class="candidate-action" data-action="hide" data-id="${esc(c.id)}" title="Hide inappropriate answer and reset votes">Hide</button>`:''}</div></article>`;
  }
  function renderVote(s){const r=s.round;
    return `<section class="panel stage-panel">${stageHeader(s,"VOTE")}<div class="room-head"><div><div class="eyebrow">ROUND ${s.roundNumber} / ${s.totalRounds} · VOTING</div><h2 class="section-title">NO MERCY. ONLY LAUGHS!</h2></div><span class="timer" id="timer">--</span></div>
       <div class="prompt-box"><p>${esc(r.prompt)}</p></div>${r.multiplier>1?`<div class="finale-multiplier">⚡ DOUBLE POINTS FINALE ⚡</div>`:""}<div class="stage-vote-tag">★ GOLD = 2× VOTE WEIGHT &nbsp; ◇ SILVER = 1× VOTE WEIGHT</div>${roundGuide(s)}<p class="sub">Choose two <strong>different</strong> other players. You cannot vote for yourself. Your ballot is anonymous.</p>
       <div class="ballot-tracker" aria-live="polite"><span>★ GOLD <strong>${S.gold?'SELECTED':'PICK ONE'}</strong></span><span>◇ SILVER <strong>${S.silver?'SELECTED':'PICK ONE'}</strong></span></div><div class="candidate-grid">${(r.candidates||[]).map((c,i)=>ballotCard(s,c,i)).join('')}</div>
       <div class="notice">${r.voted?'✓ Ballot locked in. One vote per player, per round.':'Make your selections then submit your ballot.'} &nbsp; ${r.voteCount} / ${r.eligibleVotes} ballots received.</div>
       ${btn('vote',r.voted?'✓ BALLOT LOCKED':'LOCK IN MY VOTES →','wide',r.voted||!(S.gold&&S.silver)?'disabled':'')}
     </section>`;
  }
  function renderResults(s){const r=s.round, entries=r.entries||[];
    return `<section class="panel stage-panel">${stageHeader(s,"RESULTS")}<div class="eyebrow">ROUND ${s.roundNumber} / ${s.totalRounds} · THE VERDICT</div><h2 class="section-title">${r.skipReason?'This round collapsed beautifully.':'AND THE WINNER IS…'}</h2>
      <div class="prompt-box"><p>${esc(r.prompt)}</p></div>${r.skipReason?`<div class="notice alert">${esc(r.skipReason)}</div>`:''}
      <div class="stage-result-winner fx-fanfare">${resultWinner(s)}${r.skipReason?"":S.scenePulse?confetti():""}</div><div class="result-grid">${entries.map(e=>`<div class="result-entry"><span class="rank">${e.award?`#${e.award.rank}`:'—'}</span><div><div class="text">${esc(e.text)}</div><div class="by">${avatar(e.authorAvatar,"result-avatar")} by ${esc(e.authorName)}${e.seedAuthorName?` · original line by ${esc(e.seedAuthorName)}`:''}${e.award?` · ${e.award.gold} gold, ${e.award.silver} silver`:''}</div></div><span class="points">${e.award?'+'+e.award.points:'0'}${e.award?.gameCardBonus?` <small class="e17-bonus">${e.award.gameCardBonus>0?'+':''}${e.award.gameCardBonus} POWER</small>`:''}</span></div>`).join('')||'<div class="status-note">No eligible entries to show.</div>'}</div>
      ${gameCardTray(s)}${readyPanel(s)}
      </section>`;
  }
  function renderComplete(s){const names=s.champions.map(p=>p.name).join(' & ');
    return `<section class="panel stage-panel fx-fanfare">${stageHeader(s,"FINISHED")}${S.scenePulse?confetti():""}<div class="champion-banner"><span class="trophy" aria-hidden="true">♛</span><div class="eyebrow">THE CHAMPIONSHIP IS COMPLETE</div><div class="hero-ribbon chaos-ribbon" style="justify-content:center"><span class="ribbon-chip sticker gold">CROWN THE MENACE</span><span class="ribbon-chip sticker alt">ABSOLUTE SCENES</span></div><h2>${esc(names)}</h2><p>${s.champions.length>1?'Joint champions of the nonsense.':'ECKY THUMP HAS A NEW LEGEND.'}</p></div>
    <div class="final-cast">${s.champions.slice(0,3).map(p=>`<div class="final-cast-player">${celebration(p.avatar)}<strong>${esc(p.name)}</strong></div>`).join('')}</div><div class="eyebrow">FINAL LEADERBOARD</div>${scoreRows(s.players)}<div class="night-recap"><div class="eyebrow">THE NIGHT IN NUMBERS</div><div class="recap-stats"><div><b>${s.nightRecap?.roundsPlayed||s.totalRounds}</b><span>ROUNDS PLAYED</span></div><div><b>${s.nightRecap?.answersSubmitted||0}</b><span>ENTRIES SCORED</span></div><div><b>${s.nightRecap?.totalBallots||0}</b><span>VOTES CAST</span></div></div>${s.nightRecap?.topMoments?.length?`<div class="eyebrow">TOP-VOTED MOMENTS</div>${s.nightRecap.topMoments.map(m=>`<div class="recap-quote"><strong>${esc(m.authorName)} · ${m.points} POINTS</strong><p>${esc(m.text)}</p></div>`).join('')}`:''}</div><div class="notice" style="margin-top:20px">Want a rematch? Keep your friends and room code — but the cards and prompts keep rotating.</div>
    ${s.you.isHost?btn('play-again','PLAY AGAIN WITH THIS GROUP ↻','wide'):''}
    ${btn('leave','BACK TO THE TITLE SCREEN','dark wide')}</section>`;
  }
  function sidePanel(s){return `<aside class="panel side-panel"><details class="e15-score-details" ${window.innerWidth>1040?'open':''}><summary>LIVE SCORES & HOST TOOLS</summary><div class="e15-score-inner"><span class="eyebrow">THE STANDINGS</span><h2 style="margin-top:7px">LIVE SCOREBOARD</h2>
    ${scoreRows(s.players)}
    <div class="divider"></div><div class="eyebrow">YOUR GAME</div><div class="pill-grid"><span class="pill">${s.roundNumber>0?'ROUND '+s.roundNumber+'/'+s.totalRounds:'WAITING ROOM'}</span><span class="pill">${esc(s.config.rating.toUpperCase())}</span></div>
    ${['SEED','SUBMIT','VOTE'].includes(s.phase)?`<div class="status-note">${s.round.type==='CARD'?'Pick from your seven private cards.':s.round.type==='CONTEXT'?'Write a harmless line, then rewrite somebody else’s.':s.round.type==='DOUBLE'?'Pick a card, then add your own absurd sales pitch.':s.round.type==='FINAL'?'This is the double-points finale.':'Invent a fresh punchline.'} Then vote for the other players’ best answers.</div>`:''}
    ${s.you.isHost&&['SEED','SUBMIT','VOTE'].includes(s.phase)?`<div class="divider"></div><div class="eyebrow">HOST TOOLS</div><div class="utility-actions" style="margin-top:11px">${btn(s.paused?'resume':'pause',s.paused?'Resume':'Pause','dark small')}${btn('skip','Skip round','ghost small')}</div>`:''}
    <div class="divider"></div><div class="disclaimer">Private games night: only invite friends you trust. Rooms disappear on server restart. Avoid private information in answers. The host can hide inappropriate entries. At another home, everyone needs the same public HTTPS URL.</div></div></details></aside>`;}
  function renderGame(){const oldPowers=document.getElementById('e171-powers');if(oldPowers)S.powerDrawerOpen=oldPowers.open;const s=S.snap;if(!s){app.innerHTML=nav()+`<div class="loading-center">Joining room ${esc(S.code)}…</div>`;return;}
    const previousInput=document.getElementById('answer-input');
    // Do not overwrite a restored draft with a textarea from the previous phase.
    const sameStage=S.renderedStage===s.phase&&S.renderedRound===s.round?.id;
    if(previousInput&&sameStage)S.draft=previousInput.value;
    const active=sameStage&&document.activeElement?.id==='answer-input';
    let ss=0,se=0;if(active){ss=previousInput.selectionStart;se=previousInput.selectionEnd;}
    if(s.you?.role==='audience'){app.innerHTML=renderAudience(s);S.scenePulse=false;updateConnection();syncScene();return;}
    const main=s.phase==='LOBBY'?renderLobby(s):s.phase==='SEED'?contextSeed(s):s.phase==='SUBMIT'?renderSubmit(s):s.phase==='VOTE'?renderVote(s):s.phase==='RESULTS'?renderResults(s):renderComplete(s);
    app.innerHTML=nav()+(s.phase==='LOBBY'?'':roomTop(s))+`<main class="room-layout ${s.phase==='LOBBY'?'showtime-room':''} ${S.scenePulse?'scene-enter':''}">${main}${s.phase==='LOBBY'?'':sidePanel(s)}</main><div class="footer-note">ECKY THUMP v1.8.3 · PRIVATE GAME NIGHT</div>`;
    const input=document.getElementById('answer-input');if(input){input.value=S.draft;updateCounter();if(active){input.focus();input.setSelectionRange(ss,se);}}
    S.renderedStage=s.phase;S.renderedRound=s.round?.id;
    S.scenePulse=false;updateTimer();updateConnection();syncScene();
  }
  function render(){if(S.code)renderGame();else renderLanding();syncScene();}
  function updateCounter(){const text=document.getElementById('answer-input');const counter=document.getElementById('answer-counter');if(text&&counter)counter.textContent=`${[...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(text.value)].length} / 160`;}
  function updateTimer(){const el=document.getElementById('timer'),s=S.snap;
    const mirror=s?.gameCards?.activeEffects?.some(e=>e.id==='CHAOS_MIRROR'&&(s.paused||e.until>Date.now()+S.clockOffset));
    document.querySelector('.stage-panel')?.classList.toggle('e17-mirror-active',!!mirror);
    if(!el||!s)return;
    if(s.paused){el.textContent='PAUSED';el.classList.add('expiring');return;}
    const left=Math.max(0,(s.deadline||Date.now()+S.clockOffset)-(Date.now()+S.clockOffset));el.textContent=fmt(left);el.classList.toggle('expiring',left<=10000);
    const speedClock=document.getElementById('e18-speed-timer');
    if(speedClock&&s.gameCards?.speedBonusUntil){
      const speedLeft=Math.max(0,Math.ceil((s.gameCards.speedBonusUntil-(Date.now()+S.clockOffset))/1000));
      speedClock.textContent=speedLeft?`${speedLeft}s`:'TIME UP';
    }
    for(const button of document.querySelectorAll('.e18-quick-action[data-expires]')){
      const expire=Number(button.dataset.expires||0);
      if(!expire)continue;
      const remaining=Math.max(0,Math.ceil((expire-(Date.now()+S.clockOffset))/1000));
      button.disabled=remaining<=0||left<=0;
      const label=button.querySelector('.e18-countdown');
      if(label)label.textContent=remaining?`${remaining}s LEFT`:'EXPIRED';
    }
    const seconds=Math.ceil(left/1000),key=`${s.round?.id}:${s.phase}:${seconds}`;
    if(seconds>0&&seconds<=5&&['SEED','SUBMIT','VOTE'].includes(s.phase)&&S.lastTick!==key){S.lastTick=key;window.ECKEY_SFX?.play('countdown');}

  }
  setInterval(updateTimer,250);
  async function click(actionName,id){const s=S.snap;
    thump(12);
    if(actionName==='open-power-drawer'){
      const drawer=document.getElementById('e171-powers');
      if(drawer){drawer.open=true;S.powerDrawerOpen=true;drawer.querySelector('.e17-prediction')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
      return;
    }
    if(actionName==='play-power')return action('play-game-card',{cardId:id});
    if(actionName==='reroll-power')return action('reroll-game-card',{cardId:id});
    if(actionName.startsWith('power-predict-'))return action('play-game-card',{cardId:id,prediction:Number(actionName.slice(-1))});
    if(actionName==='take-extra'){if(!S.selected)return toastShow('Select the original response card you want to replace.');const replaceId=S.selected;S.selected=null;return action('choose-game-extra',{drawId:id,replaceId});}
    if(actionName.startsWith('feedback-'))return action('card-feedback',{cardId:id,rating:actionName.slice(9)});
    if(actionName.startsWith('chaos-vote-'))return action('chaos-vote',{modifier:actionName.slice(11)});
    if(actionName.startsWith('chaos-'))return action('chaos',{kind:actionName.slice(6),targetId:document.getElementById('chaos-target')?.value||null});
    switch(actionName){
      case 'go-host':
      case 'go-join': {const which=actionName==='go-host'?'create-form':'join-form';for(const id of ['create-form','join-form'])document.getElementById(id)?.toggleAttribute('hidden',id!==which);document.getElementById('game-setup')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById(which==='create-form'?'host-name':'join-code')?.focus({preventScroll:true});return;}
      case 'close-setup':for(const id of ['create-form','join-form'])document.getElementById(id)?.setAttribute('hidden','');window.scrollTo({top:0,behavior:'smooth'});return;
      case 'home-family':
      case 'home-adult': {const value=actionName==='home-adult'?'adult':'clean';const input=document.querySelector(`input[name="humour"][value="${value}"]`);if(input){input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));}return;}
      case 'toggle-sfx':{const on=window.ECKEY_SFX?.toggle();document.querySelectorAll('[data-action="toggle-sfx"]').forEach(b=>{b.setAttribute('aria-pressed',String(!!on));b.setAttribute('aria-label',on?'Turn off show sound effects':'Enable show sound effects');b.querySelector('span').textContent=on?'🔊':'🔇';b.querySelector('strong').textContent=on?'SHOW SFX ON':'ENABLE SHOW SFX';});return;}
      case 'toggle-sound':{await window.ECKEY_AUDIO?.toggle();document.querySelectorAll('[data-action="toggle-sound"]').forEach(b=>{const on=!!window.ECKEY_AUDIO?.enabled;b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Mute lobby music':'Play lobby music');b.querySelector('strong').textContent=on?'MUSIC ON':'PLAY LOBBY MUSIC';b.querySelector('span').textContent=on?'♫':'♪';});return;}
      case 'rejoin':{const code=localStorage.getItem('eckey-last-room');const secret=code&&localStorage.getItem(storageKey(code));if(secret)startSession(code,secret);return;}
      case 'adult-consent':return action('adult-consent');
      case 'rating-family':return action('set-lobby-rating',{rating:'clean'});
      case 'rating-adult':return action('set-lobby-rating',{rating:'adult'});
      case 'change-avatar':{const wrap=document.getElementById('lobby-avatar-picker');if(wrap){wrap.innerHTML=avatarPicker();wrap.classList.toggle('hidden');}return;}
      case 'toggle-game-cards':return action('set-game-cards',{enabled:!S.snap?.gameCards?.enabled});
      case 'start':return action('start');
      case 'play-again':return action('play-again');
      case 'remove-player':if(confirm('Remove this player from the lobby? They can rejoin using your invite link.'))return action('remove-player',{playerId:id});return;
      case 'ready-next':return action('ready-next');
      case 'next':return action('next');
      case 'pause':return action('pause');
      case 'resume':return action('resume');
      case 'skip':if(confirm('Skip this round without awarding points?'))return action('skip');return;
      case 'select-card':S.selected=id;window.ECKEY_SFX?.play('pick');return render();
      case 'swap-card':if(!S.selected)return toastShow('Choose a card to swap first.');{const selectedId=S.selected;S.selected=null;return action('swap-card',{cardId:selectedId});}
      case 'submit':{
        const value=s.round.type==='CARD'?S.selected:s.round.type==='DOUBLE'?{cardId:S.selected,line:S.draft}:S.draft;
        if(!S.draft.trim()&&s.round.type!=='CARD')return toastShow('Write an answer first.');
        if((s.round.type==='CARD'||s.round.type==='DOUBLE')&&!S.selected)return toastShow('Choose a card first.');
        return action('submit',{value});
      }
      case 'seed':if(!S.draft.trim())return toastShow('Write your innocent line first.');return action('seed',{value:S.draft});
      case 'gold':if(S.silver===id)S.silver=null;S.gold=S.gold===id?null:id;window.ECKEY_SFX?.play('gold');return render();
      case 'silver':if(S.gold===id)S.gold=null;S.silver=S.silver===id?null:id;window.ECKEY_SFX?.play('silver');return render();
      case 'vote':if(!S.gold||!S.silver)return toastShow('Choose a Gold and a Silver.');return action('vote',{gold:S.gold,silver:S.silver});
      case 'report':if(confirm('Report this entry to the room host?')){await action('report',{entryId:id});toastShow('Report recorded. Ask your host to hide the entry if necessary.');}return;
      case 'hide':if(confirm('Hide this entry and restart voting?'))return action('hide',{entryId:id});return;
      case 'copy-code':await copyText(S.code).then(()=>toastShow('Room code copied.'),()=>toastShow('Your code is '+S.code));return;
      case 'copy-link':await copyText(joinUrl(S.code)).then(()=>toastShow('Invite link copied.'),()=>toastShow(joinUrl(S.code)));return;
      case 'tv':
      case 'copy-tv':{
        // Only a direct click can open a window reliably; the host shares
        // distinct read-only links with other homes.
        const win=actionName==='tv'?window.open('about:blank','_blank'):null;
        try{const data=await api(`/api/rooms/${S.code}/display-token`,'POST',{});const url=`${location.origin}/tv/?room=${S.code}#key=${encodeURIComponent(data.secret)}`;
          if(win)win.location.href=url;
          else{await copyText(url);toastShow('Private TV link copied. Share only with a trusted friend.');}
        }catch(err){if(win)win.close();toastShow(err.message);}return;
      }
      case 'leave':endSession();return;
    }
  }
  app.addEventListener('click',ev=>{const picked=ev.target.closest('[data-pick-avatar]');if(picked){choice=picked.dataset.pickAvatar;if(S.snap&&S.snap.phase==='LOBBY')return action('avatar',{avatar:choice});document.querySelectorAll('[data-pick-avatar]').forEach(b=>{b.classList.toggle('picked',b.dataset.pickAvatar===choice);b.setAttribute('aria-pressed',String(b.dataset.pickAvatar===choice));});return;}const button=ev.target.closest('[data-action]');if(!button||button.disabled)return;click(button.dataset.action,button.dataset.id);});
  app.addEventListener('input',ev=>{if(ev.target.id==='answer-input'){S.draft=ev.target.value;rememberDraft();updateCounter();}});
  const code=(q.get('room')||'').trim().toUpperCase();
  if(/^[A-Z2-9]{6}$/.test(code) && localStorage.getItem(storageKey(code)))startSession(code,localStorage.getItem(storageKey(code)));
  else renderLanding();
})();
