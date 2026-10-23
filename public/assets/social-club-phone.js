'use strict';
/* ECKY THUMP Social Club phone controller — no bundler, no external dependencies.
 * The server snapshot is the only source of phase, tasks and voting eligibility.
 * The existing v1.8.3 phone app remains untouched for non-Social-Club rooms.
 */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const count = value => typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('en-GB', {granularity:'grapheme'}).segment(value)].length
    : Array.from(value).length;
  const checkAnswer = value => {
    const text=String(value ?? '').trim().replace(/\s+/g,' ');
    return count(text) >= 3 && count(text) <= 160 && !/[<>\u0000-\u001f]/.test(text);
  };
  const state={roundId:null,taskId:null,values:new Map(),picked:new Map(),busy:false};
  const rating={clean:'FAMILY',cheeky:'CHEEKY',adult:'AFTER DARK · 18+'};
  const lengths={quick:'QUICK · 3 ROUNDS',standard:'STANDARD · 5 ROUNDS',party:'LONG · 6 ROUNDS'};
  const avatar=id=>{
    const member=(window.ECKEY_AVATARS || []).find(a=>a.id===id);
    return member ? `<img class="club-phone-avatar" alt="" src="${esc(member.image)}" loading="lazy">` : '';
  };
  const b=(action, label, cls='',attrs='')=>`<button type="button" class="club-phone-button ${cls}" data-club-action="${esc(action)}" ${attrs}>${label}</button>`;
  const badge = text=>`<span class="club-phone-tag">${esc(text)}</span>`;
  const host=s=>!!s.you?.isHost;
  const frame=(s,body)=>{
    const phase=s.phase||'LOBBY',intro=phase==='LOBBY'||phase==='COMPLETE';
    const line=intro?'SATURDAY NIGHT AT THE SOCIAL CLUB':`ROUND ${s.roundNumber} OF ${s.totalRounds} · ${s.title || 'SOCIAL CLUB'}`;
    return `<div class="club-phone" data-club-phase="${esc(phase)}">
      <header class="club-phone-top"><img src="/assets/branding/ecky-thump-logo.webp" alt="ECKY THUMP" class="club-phone-logo"><div><strong>SOCIAL CLUB</strong><span>${esc(s.code)}</span></div></header>
      <div class="club-phone-header"><span>${esc(line)}</span><span id="connection-status" role="status" aria-live="polite">● Connected</span></div>
      <main class="club-phone-main" id="club-main">${s.paused?`<div class="club-phone-warning" role="status">Our Maureen has called a breather. Game paused.</div>`:''}${body}</main>
      ${host(s)?controls(s):''}
      <footer class="club-phone-footer">GOOD FRIENDS. TERRIBLE ANSWERS. · PRIVATE GAME NIGHT</footer>
    </div>`;
  };
  function controls(s){
    const active=['ROUND_INTRO','SUBMIT','REVEAL','VOTE','MATCHUP_RESULT'].includes(s.phase);
    return `<details class="club-phone-tools"><summary>HOST CONTROLS</summary><div class="club-phone-tool-grid">
      ${b('tv','OPEN THE TV','secondary')}${b('copy-tv','COPY TV LINK','secondary')}
      ${active?b(s.paused?'resume':'pause',s.paused?'RESUME SHOW':'PAUSE SHOW','secondary'):''}
      ${active?b('skip','SKIP ROUND','secondary'):''}
      ${b('copy-link','COPY INVITE','secondary')}
    </div></details>`;
  }
  function lobby(s){
    const players=s.players||[],need=3-players.length;
    return `<section class="club-phone-panel club-phone-lobby"><div class="club-phone-eyebrow">YOU'RE IN THE GREEN ROOM</div>
      <h1>Saturday at the Social Club</h1><p class="club-phone-lead">Get your mates in. Scan the TV code or share your link.</p>
      <div class="club-phone-room">${esc(s.code)}</div>
      <div class="club-phone-tool-grid">${b('copy-link','COPY INVITE LINK')}${host(s)?b('tv','OPEN TV','secondary'):''}</div>
      <div class="club-phone-tally">${badge(rating[s.config?.rating]||'FAMILY')}${badge(lengths[s.config?.length]||'STANDARD')}${badge(`${players.length} / 12 PLAYERS`)}</div>
      <h2>Who's here?</h2><div class="club-phone-players">${players.map(p=>`<div class="club-phone-person">${avatar(p.avatar)}<span>${esc(p.name)}${p.id===s.you?.id?' · YOU':''}</span><small>${p.online?'IN':'AWAY'}</small>
        ${host(s)&&p.id!==s.you?.id?b('remove-player','REMOVE','minor',`data-club-id="${esc(p.id)}" aria-label="Remove ${esc(p.name)}"`):''}</div>`).join('')}</div>
      ${host(s)?`<div class="club-phone-lobby-options"><h2>Club rules</h2><p>The host sets the humour level. After Dark requires everyone to confirm they are 18+.</p>
        <div class="club-phone-tool-grid">${['clean','cheeky','adult'].map(key=>b('rating',rating[key],s.config?.rating===key?'is-current':'secondary',`data-club-id="${key}" aria-pressed="${s.config?.rating===key}"`)).join('')}</div>
        ${need>0?`<p class="club-phone-note">Waiting for ${need} more ${need===1?'player':'players'}. You need at least three.</p>`:''}
        ${b('start','START THE SHOW','primary',need>0?'disabled':'')}
      </div>`:`<p class="club-phone-note">${need>0?'Waiting for the host and more players.':'Ready when the host is!'}</p>`}
      ${s.config?.rating==='adult'?b('adult-consent','I CONFIRM I AM 18+','secondary'):''}
      <details class="club-phone-avatar-picker"><summary>CHANGE YOUR CHARACTER</summary><div id="lobby-avatar-picker"></div></details>
    </section>`;
  }
  const watch=(s,title,message)=>`<section class="club-phone-panel club-phone-watch"><span class="club-phone-eyebrow">${esc(s.title||'SOCIAL CLUB')}</span>
    <h1>${esc(title)}</h1><p class="club-phone-lead">${esc(message)}</p>
    <div class="club-phone-tv">↗ LOOK AT THE TELLY!</div>${s.deadline?'<div class="club-phone-timer" id="timer" role="timer">--:--</div>':''}
    </section>`;
  const getTask=s=>{
    const tasks=s.round?.tasks||[];
    const pending=tasks.filter(t=>!t.submitted);
    const prefer=pending.find(t=>t.id===state.taskId);
    return {task:prefer||pending[0]||null,tasks,pending};
  };
  const keyFor=(s,task)=>`${s.code}:${s.round?.id||''}:${s.round?.stage||''}:${task.id}`;
  function submit(s){
    const {task,tasks,pending}=getTask(s),r=s.round;
    if(!task)return watch(s,'Locked in!','Your answers are safely on the list. Our Maureen will take it from here.');
    state.taskId=task.id;
    const key=keyFor(s,task),value=state.values.get(key)||'',selected=state.picked.get(key)||'';
    const usesCards=['CARD','DOUBLE'].includes(r.type);
    const hasText=r.stage==='seed'||!usesCards||r.type==='DOUBLE';
    const valid=(!hasText||checkAnswer(value))&&(!usesCards||!!selected)&&
      (r.type!=='FINAL'||new RegExp(`(?:^|\\W)${String(r.requiredWord||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|\\W)`,'iu').test(value));
    return `<section class="club-phone-panel club-phone-submit"><div class="club-phone-eyebrow">${esc(s.title)} ${tasks.length>1?`· ANSWER ${tasks.length-pending.length+1} OF ${tasks.length}`:''}</div>
      <h1>${r.stage==='seed'?'Start an innocent rumour':r.type==='CARD'?'Pick your funniest card':r.type==='DOUBLE'?'Sell us something daft':'Your turn to write'}</h1>
      <p class="club-phone-lead">${esc(task.prompt||r.prompt)}</p>
      ${r.requiredWord?`<div class="club-phone-must">MUST INCLUDE: <strong>${esc(r.requiredWord)}</strong></div>`:''}
      ${usesCards?`<fieldset class="club-phone-hand"><legend>Choose one of your cards</legend><div class="club-phone-cards">${(r.hand||[]).map(c=>`<button type="button" class="club-phone-card ${selected===c.id?'is-picked':''}" data-club-action="pick" data-club-id="${esc(c.id)}" aria-pressed="${selected===c.id}">${esc(c.text)}</button>`).join('')}</div></fieldset>`:''}
      ${hasText?`<label for="club-answer">${r.stage==='seed'?'YOUR INNOCENT LINE':r.type==='DOUBLE'?'YOUR ONE-LINE SALES PITCH':'YOUR ANSWER'}</label>
        <textarea id="club-answer" class="club-phone-input" rows="3" maxlength="320" autocomplete="off" autocapitalize="sentences" aria-describedby="club-count club-writing-guide" placeholder="${r.stage==='seed'?'Nothing suspicious here…':'Make your mates laugh…'}">${esc(value)}</textarea>
        <div class="club-phone-input-meta"><span id="club-writing-guide">3–160 characters. No personal details or links.</span><span id="club-count">${count(value)} / 160</span></div>`:''}
      ${b('submit',r.stage==='seed'?'LOCK IN INNOCENT LINE':pending.length>1?'LOCK IN & NEXT PROMPT':'LOCK IN MY ANSWER','primary',!valid||s.paused||state.busy?'disabled':'')}
      ${tasks.length>1?`<p class="club-phone-note">${tasks.length-pending.length} of ${tasks.length} answers safely locked in. Finish both to complete your turn.</p>`:''}
      ${s.deadline?'<div class="club-phone-timer" id="timer" role="timer">--:--</div>':''}
    </section>`;
  }
  function vote(s){
    const ballot=s.round?.vote,answers=ballot?.choices||[],isDuel=['WIT','CONTEXT','DOUBLE'].includes(s.round?.type);
    if(ballot?.voted)return watch(s,'Ballot locked!','Your vote is in. Eyes on the TV for the result.');
    if(!ballot?.eligible)return watch(s,`You're up!`,'Keep a straight face. This matchup is yours, so you cannot vote.');
    if(!answers.length)return watch(s,'No safe entries to vote for','Our Maureen is sorting it out. Keep watching the TV.');
    return `<section class="club-phone-panel club-phone-vote"><div class="club-phone-eyebrow">${esc(s.title)} · ${isDuel?'HEAD TO HEAD':'YOUR ONE VOTE'}</div>
      <h1>Who gets your vote?</h1><p class="club-phone-lead">${isDuel?'Tap A or B. You get one vote.':'Choose one answer. No voting for yourself.'}</p>
      <div class="club-phone-choices ${isDuel?'is-duel':''}">${answers.map((a,i)=>`<div class="club-phone-choice">
        ${b('vote',`<strong>${esc(a.letter||String.fromCharCode(65+i))}</strong><span>${esc(a.text)}</span>`,'vote',`data-club-id="${esc(a.id)}" ${state.busy||s.paused?'disabled':''}`)}
        ${b('report','REPORT','minor',`data-club-id="${esc(a.id)}" aria-label="Report answer ${i+1}"`)}
        ${host(s)?b('hide','HIDE ENTRY','minor',`data-club-id="${esc(a.id)}" aria-label="Hide answer ${i+1}"`):''}</div>`).join('')}</div>
      <p class="club-phone-note">Voting closes automatically. You can only vote once.</p><div class="club-phone-timer" id="timer" role="timer">--:--</div>
    </section>`;
  }
  function result(s){
    const r=s.round||{},wins=new Map((r.result?.awards||[]).map(a=>[a.entryId,a]));
    return `<section class="club-phone-panel club-phone-result"><div class="club-phone-eyebrow">THE CLUB HAS SPOKEN</div>
      <h1>${r.result?.slam?'ECKY THUMP!':'The verdict is in'}</h1>
      <div class="club-phone-results">${(r.visibleAnswers||[]).map(a=>`<div class="club-phone-result-row">${avatar(a.avatar)}<div><strong>${esc(a.authorName||'A club regular')}</strong><p>${esc(a.text)}</p></div><span>+${Number(wins.get(a.id)?.points||0).toLocaleString('en-GB')}</span></div>`).join('')}</div>
      <p class="club-phone-lead">${r.result?.slam?'A unanimous thumping. Someone ring the bell!':'Next up on the Social Club stage…'}</p>
    </section>`;
  }
  function standings(s){
    const people=s.round?.standings||[...(s.players||[])].sort((a,b)=>b.score-a.score);
    return `<div class="club-phone-standings">${people.map((p,i)=>`<div class="club-phone-standing"><span>${i+1}</span>${avatar(p.avatar)}<strong>${esc(p.name)}</strong><b>${Number(p.score||0).toLocaleString('en-GB')} pts</b></div>`).join('')}</div>`;
  }
  function scores(s){
    return `<section class="club-phone-panel"><div class="club-phone-eyebrow">ROUND ${s.roundNumber} COMPLETE</div><h1>The leaderboard</h1>${standings(s)}
      ${host(s)?b('next','NEXT ROUND →','primary'):watchHint('Waiting for the host to start the next round.')}</section>`;
  }
  const watchHint=text=>`<p class="club-phone-note">${esc(text)}</p>`;
  function champion(s){
    const winner=(s.players||[]).find(p=>p.id===s.champion)||s.round?.standings?.[0];
    return `<section class="club-phone-panel club-phone-finale"><div class="club-phone-eyebrow">THE CLUB HAS A CHAMPION</div><h1>ECKY THUMP!</h1>
      <div class="club-phone-winner">${avatar(winner?.avatar)}<h2>${esc(winner?.name||'The champion')}</h2><p>${Number(winner?.score||0).toLocaleString('en-GB')} POINTS</p></div>${standings(s)}
      ${host(s)&&s.phase==='CHAMPION'?b('next','FINISH THE SHOW','primary'):''}
      ${host(s)&&s.phase==='COMPLETE'?b('play-again','PLAY AGAIN WITH THE SAME MATES','primary'):''}
      ${b('leave','BACK TO TITLE','secondary')}</section>`;
  }
  function render(s){
    if(state.roundId!==s.round?.id){state.roundId=s.round?.id||null;state.taskId=null;state.values.clear();state.picked.clear();}
    const phase=s.phase;
    const body=phase==='LOBBY'?lobby(s):phase==='ROUND_INTRO'?watch(s,'Eyes on the telly!',s.rule||'Our Maureen is about to introduce the round.'):
      phase==='SUBMIT'?(s.you?.role==='audience'?watch(s,'Enjoy the show','Contestants are writing their answers.'):submit(s)):
      phase==='REVEAL'?watch(s,'Here come the answers','Watch the stage for the big reveal.'):
      phase==='VOTE'?vote(s):phase==='MATCHUP_RESULT'?result(s):phase==='ROUND_SCORES'?scores(s):champion(s);
    return frame(s,body);
  }
  function capture(root){
    const input=root.querySelector('#club-answer');
    if(!input)return null;
    const focus=document.activeElement===input,position=focus?{start:input.selectionStart,end:input.selectionEnd}:null;
    return {focus,position};
  }
  function restore(root,saved){
    if(!saved?.focus)return;
    const input=root.querySelector('#club-answer');
    if(input){input.focus({preventScroll:true});if(saved.position)input.setSelectionRange(saved.position.start,saved.position.end);}
  }
  function updateInput(root,s){
    const input=root.querySelector('#club-answer');if(!input)return;
    const task=getTask(s).task;if(!task)return;
    state.values.set(keyFor(s,task),input.value);
    const length=count(input.value),selected=!!state.picked.get(keyFor(s,task));
    const valid=checkAnswer(input.value) && (s.round.type!=='DOUBLE'||selected) &&
      (s.round.type!=='FINAL'||new RegExp(`(?:^|\\W)${String(s.round.requiredWord||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|\\W)`,'iu').test(input.value));
    const button=root.querySelector('[data-club-action="submit"]');
    if(button)button.disabled=!valid||s.paused||state.busy;
    const label=root.querySelector('#club-count');if(label)label.textContent=`${length} / 160`;
  }
  async function handle(name,id,ctx){
    const {s,send,legacy,toast}=ctx;
    const task=getTask(s).task;
    if(name==='pick'){
      if(!task)return;
      const key=keyFor(s,task);state.picked.set(key,state.picked.get(key)===id?'':id);
      const remembered=state.values.get(key)||'';
      ctx.rerender();
      const input=ctx.root.querySelector('#club-answer');if(input){input.value=remembered;updateInput(ctx.root,s);}
      return;
    }
    if(name==='submit'){
      if(!task||state.busy)return;
      const key=keyFor(s,task),selected=state.picked.get(key),text=state.values.get(key)||'';
      const r=s.round;
      const value=r.type==='CARD'?selected:r.type==='DOUBLE'?{cardId:selected,line:text}:text;
      if(r.type!=='CARD'&&!checkAnswer(text))return toast('Write between 3 and 160 characters.');
      if(['CARD','DOUBLE'].includes(r.type)&&!selected)return toast('Choose a card first.');
      state.busy=true;
      try{const success=await send(r.stage==='seed'?'social-seed':'social-submit',r.stage==='seed'?{value}:{taskId:task.id,value});
        if(success){state.values.delete(key);state.picked.delete(key);state.taskId=null;}}
      finally{state.busy=false;}
      return;
    }
    if(name==='vote'){
      if(state.busy)return;
      state.busy=true;
      try{await send(s.you?.role==='audience'?'social-audience-vote':'social-vote',{entryId:id});}
      finally{state.busy=false;}
      return;
    }
    if(name==='rating')return send('set-lobby-rating',{rating:id});
    if(name==='next')return send('social-next');
    if(name==='start'||name==='play-again'||name==='pause'||name==='resume'||name==='adult-consent')return send(name);
    if(name==='remove-player'||name==='skip'||name==='report'||name==='hide'){
      const prompts={
        'remove-player':'Remove this friend from the room?',
        'skip':'Skip this round? Already awarded matchup points remain.',
        'report':'Report this answer to the host?',
        'hide':'Hide this answer and restart voting?'
      };
      if(!window.confirm(prompts[name]))return;
      return send(name,name==='remove-player'?{playerId:id}:name==='skip'?{}:{entryId:id});
    }
    return legacy(name,id);
  }
  function onSnapshot(next,prev){
    // A persistent live region is more reliable than recreating it on each SSE render.
    let announcer=document.getElementById('club-live-announce');
    if(!announcer){
      announcer=document.createElement('div');
      announcer.id='club-live-announce';announcer.setAttribute('role','status');
      announcer.setAttribute('aria-live','polite');announcer.setAttribute('aria-atomic','true');
      document.body.appendChild(announcer);
    }
    const changed=!prev||next.phase!==prev.phase||next.round?.groupIndex!==prev.round?.groupIndex;
    if(changed){
      const phrases={LOBBY:'Welcome to the Social Club lobby.',ROUND_INTRO:'New round. Look at the telly.',
        SUBMIT:'Your turn to answer. Check the prompt on your phone.',REVEAL:'Answers are being revealed on the TV.',
        VOTE:'Voting is open. Choose one answer if you are eligible.',MATCHUP_RESULT:'The votes are in.',
        ROUND_SCORES:'Round finished. Check the scores.',CHAMPION:'Our champion is being crowned.',COMPLETE:'Show complete.'};
      announcer.textContent=phrases[next.phase]||'Social Club updated.';
    }
    if(changed&&['SUBMIT','VOTE'].includes(next.phase)){
      try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)navigator.vibrate?.([25,35,25]);}catch(_){/* optional */}
    }
  }
  window.ECKY_SOCIAL_PHONE={render,capture,restore,updateInput,handle,onSnapshot,checkAnswer,state,available:false};
})();
