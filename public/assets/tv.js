'use strict';
(() => {
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
  let current=null,connected=false;
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const joinLink=`${location.origin}/join/?room=${encodeURIComponent(code)}`;
  function header(s){return `<header class="tv-head"><div class="brand"><span class="brand-mark">✸</span><span class="brand-words">ECKEY THUMP<small>THE GAMES NIGHT CHAOS SHOW</small></span></div>
    <div class="tv-room"><span class="eyebrow">JOIN ECKEY THUMP</span><strong>${esc(s.code)}</strong></div></header><div class="themed-marquee" aria-hidden="true">★ WELCOME TO THE CHAOS ARENA ★ PRIVATE GAMES NIGHT ★ ZERO DIGNITY · MAXIMUM LAUGHS ★</div>`;}
  function footer(s){return `<footer class="tv-footer"><span>${esc(s.config.rating.toUpperCase())} HUMOUR · ${s.players.length} CONTESTANTS</span><span>JOIN ON YOUR PHONE · ${esc(location.host)}/join/ · CODE ${esc(s.code)}</span></footer>`;}
  function leaderboard(s,amount=6){return `<div class="tv-board">${s.players.slice(0,amount).map((p,i)=>`<div class="tv-board-item"><span class="tv-with-avatar">${avatar(p.avatar)}${i+1}. ${esc(p.name)}</span><strong>${p.score} POINTS</strong></div>`).join('')}</div>`;}
  function intro(s){return `<section class="tv-center"><div class="eyebrow">LIVE FROM THE CHAOS ARENA · ZERO DIGNITY GUARANTEED</div>
    <h1 class="tv-title">GOOD FRIENDS.<br><em>VERY BAD IDEAS.</em></h1>
    <div class="tv-subtitle">Join on your phone. Cause a scene. One player leaves as the official nonsense champion.</div>
    <div class="tv-cast" aria-hidden="true">${['adult-06','adult-13','adult-18','adult-23'].map(id=>{const a=AVATARS.find(x=>x.id===id);return a?`<div class="tv-cast-tile"><img src="${a.image}" alt=""><span>${esc(a.name.toUpperCase())}</span></div>`:'';}).join('')}</div>
    <div style="margin:30px 0 8px">${s.players.length>=3?'<span class="badge gold">READY FOR THE SHOW</span>':'<span class="badge">WAITING FOR THREE PLAYERS</span>'}</div>
    <div class="tv-names">${s.players.map(p=>`<span class="tv-player">${avatar(p.avatar)}${esc(p.name)}${p.online?' ●':''}</span>`).join('')}</div>
    <div class="tv-status">${s.players.length} / 12 PLAYERS · ROOM ${esc(s.code)}</div>
    <div class="tv-scan-to-join"><img class="tv-qr" src="/api/rooms/${esc(s.code)}/join-qr.svg" alt="Scan to join room ${esc(s.code)} with your phone"><div><strong>SCAN TO JOIN</strong><span>Or visit ${esc(location.host)} and enter ${esc(s.code)}</span></div></div></section>`;}
  function submission(s){const r=s.round;return `<section class="tv-center"><div class="eyebrow">ROUND ${s.roundNumber} OF ${s.totalRounds} · ${esc(r.label)}</div>
    <h1 class="tv-prompt">${esc(r.prompt)}</h1>${r.multiplier>1?'<div class="finale-multiplier">⚡ DOUBLE POINTS FINALE ⚡</div>':''}${r.contract?`<div class="contract">✦ ${esc(r.contract)}</div>`:''}
    <div class="tv-status">${r.type==='CARD'?'PICK YOUR FUNNIEST CARD':r.type==='CONTEXT'?'REWRITE THE INNOCENT LINE':r.type==='DOUBLE'?'COMBINE A CARD WITH A RIDICULOUS PUNCHLINE':r.type==='FINAL'?'ONE FINAL JOKE. DOUBLE POINTS.':'TYPE YOUR FUNNIEST MASTERPIECE'}</div>
    <div class="tv-names">${s.players.map(p=>`<span class="tv-player">${avatar(p.avatar)}${esc(p.name)} ${r.submissionCount===s.players.length?'✓':'•'}</span>`).join('')}</div>
    <div class="tv-status"><span id="tv-timer" class="timer">--</span> &nbsp; · &nbsp; ${r.submissionCount} / ${s.players.length} ANSWERS RECEIVED</div>
    ${s.paused?`<div class="notice alert">HOST HAS PAUSED THE GAME</div>`:''}</section>`;}
  function contextOpening(s){const r=s.round;return `<section class="tv-center"><div class="eyebrow">ROUND ${s.roundNumber} OF ${s.totalRounds} · CONTEXT COLLAPSE · PART 1</div>
    <h1 class="tv-prompt">SAY SOMETHING COMPLETELY INNOCENT.</h1><p class="tv-subtitle">Everyone types a normal sentence on their own phone. Somebody else will turn it into the scandal of the century.</p>
    <div class="tv-status">${r.submissionCount} / ${s.players.length} LINES RECEIVED · <span id="tv-timer" class="timer">--</span></div>
    ${s.paused?'<div class="notice alert">HOST HAS PAUSED THE GAME</div>':''}</section>`;}
  function voting(s){const r=s.round;return `<section class="tv-center" style="justify-content:flex-start;padding-top:25px"><div class="eyebrow">ROUND ${s.roundNumber} OF ${s.totalRounds} · TIME TO VOTE</div>
    <h1 class="tv-prompt" style="font-size:clamp(2rem,3vw,3.4rem);margin:14px auto">${esc(r.prompt)}</h1>${r.multiplier>1?'<div class="finale-multiplier">⚡ DOUBLE POINTS FINALE ⚡</div>':''}
    <div class="tv-status">CHOOSE GOLD & SILVER ON YOUR PHONE · CHEER, ARGUE, ACCUSE YOUR FRIENDS · <span id="tv-timer">--</span></div>
    <div class="tv-cards">${(r.candidates||[]).map((c,i)=>`<div class="tv-card"><span><span class="eyebrow">ENTRY ${i+1}</span><br>${esc(c.text)}</span></div>`).join('')}</div>
    <div class="tv-status">${r.voteCount} / ${r.eligibleVotes} BALLOTS RECEIVED</div></section>`;}
  function results(s){const r=s.round;return `<section class="tv-center" style="justify-content:flex-start;padding-top:14px"><div class="eyebrow">ROUND ${s.roundNumber} OF ${s.totalRounds} · THE VERDICT</div>
    <h1 class="tv-prompt" style="font-size:clamp(2rem,3vw,3.3rem);margin:15px auto">${r.skipReason?'ROUND SKIPPED':'WHO CAUSED THE MOST CHAOS?'}</h1>
    ${r.skipReason?`<div class="notice alert">${esc(r.skipReason)}</div>`:''}
    <div class="tv-cards">${(r.entries||[]).slice(0,12).map(e=>`<div class="tv-card ${e.award?.rank===1?'win':''}"><span><span class="eyebrow">${e.award?`#${e.award.rank} · +${e.award.points} POINTS`:'NO SCORE'}</span><br>${esc(e.text)}<small>BY ${esc(e.authorName)}</small></span></div>`).join('')}</div>
    ${tvWinners(s)}${leaderboard(s)}<div class="tv-status">${s.config.pace==='relaxed'?'WAITING FOR THE HOST TO CONTINUE':'THE NEXT ROUND BEGINS SHORTLY'}</div></section>`;}
  function finished(s){const names=s.champions.map(p=>p.name).join(' & ');return `<section class="tv-center">
    <div class="eyebrow">THE CHAMPIONSHIP IS OVER</div><span style="font-size:7rem;margin:5px 0">♛</span><h1 class="tv-title">ECKEY <em>THUMP!</em></h1><h2 class="tv-prompt">${esc(names)}</h2>
    <div class="tv-subtitle">${s.champions.length>1?'JOINT AGENTS OF CHAOS':'YOUR ECKEY THUMP CHAMPION'}</div><div class="tv-finale-cast">${s.champions.slice(0,3).map(p=>`<div class="tv-finale-player">${celebration(p.avatar)}<strong>${esc(p.name)}</strong></div>`).join('')}</div>
    ${leaderboard(s,12)}<div class="tv-status">THANKS FOR PLAYING · ECKEY THUMP GAME NIGHT v0.9</div></section>`;}
  function render(s){current=s;
    const body=s.phase==='LOBBY'?intro(s):s.phase==='SEED'?contextOpening(s):s.phase==='SUBMIT'?submission(s):s.phase==='VOTE'?voting(s):s.phase==='RESULTS'?results(s):finished(s);
    el.innerHTML=header(s)+body+footer(s);updateTimer();
  }
  function updateTimer(){const t=document.getElementById('tv-timer');if(!current||!t)return;
    const seconds=Math.max(0,Math.ceil((current.deadline-Date.now())/1000));
    t.textContent=current.paused?'PAUSED':`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  }
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
