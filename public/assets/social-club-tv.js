'use strict';
/** ECKY THUMP Social Club — Stage 3 television scenes.
 * Presentation only: server snapshots decide phases, anonymity and scores.
 * This is intentionally a separate optional renderer; v1 games are untouched.
 */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, chr => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[chr]));
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const avatars = () => window.ECKEY_AVATARS || [];
  const artwork = (id, winning = false) => {
    const entry = avatars().find(item => item.id === id);
    if (!entry) return '<span class="club-avatar club-avatar-empty" aria-hidden="true">★</span>';
    const path = winning && entry.celebration ? entry.celebration : entry.image;
    // The trusted, bundled avatar manifest is the only source of image URLs.
    if (typeof path !== 'string' || !path.startsWith('/assets/')) return '';
    return `<img class="club-avatar" src="${esc(path)}" alt="">`;
  };
  const names = {CARD:'THE MEAT RAFFLE',WIT:'THE TURN',CONTEXT:'CROSSED WIRES',DOUBLE:'THE HARD SELL',FINAL:'LAST ORDERS'};
  const moods = {LOBBY:'THE DOORS ARE OPEN',ROUND_INTRO:'NEXT ON STAGE',SUBMIT:'THE ROOM IS WRITING',
    REVEAL:'THE BIG REVEAL',VOTE:'MAKE YOUR CHOICE',MATCHUP_RESULT:'THE VERDICT',
    ROUND_SCORES:'THE LEADERBOARD',CHAMPION:'THE STAR OF THE NIGHT',COMPLETE:'ONE MORE ROUND?'};
  const clock = (s, offset = 0) => {
    if (s.paused) return 'PAUSED';
    if (s.deadline == null) return '—';
    const seconds = Math.max(0, Math.ceil((number(s.deadline) - Date.now() - offset) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };
  const stageHeader = s => `<header class="club-header">
    <div class="club-brand"><img src="/assets/branding/ecky-thump-logo.webp" alt="ECKY THUMP"><span>SOCIAL CLUB</span></div>
    <span class="club-room">ROOM ${esc(s.code)}</span>
    <span class="club-round">${s.phase === 'LOBBY' ? 'SATURDAY NIGHT' : `ROUND ${number(s.roundNumber)} / ${number(s.totalRounds)}`}</span>
  </header>`;
  const hostCue = s => {
    const cue=window.ECKY_COMPERE?.display(s) || {speaker:'Our Maureen',caption:'Eyes on the telly!'};
    return `<aside class="club-caption" aria-live="polite" aria-label="The compère's captions"><strong>${esc(cue.speaker)}</strong><span data-maureen-caption>${esc(cue.caption)}</span></aside>`;
  };
  const stageFoot = s => `<footer class="club-footer"><span>GOOD FRIENDS. TERRIBLE ANSWERS.</span>
    <span>${esc(moods[s.phase] || 'SOCIAL CLUB')}</span><span class="club-timer" id="tv-timer" role="timer">${clock(s)}</span>
    <button class="club-audio" data-fx-toggle aria-pressed="${!!window.ECKEY_SFX?.enabled}" type="button"><span aria-hidden="true">${window.ECKEY_SFX?.enabled ? '🔊':'🔇'}</span><strong>${window.ECKEY_SFX?.enabled ? 'SHOW SFX ON':'ENABLE SHOW SFX'}</strong></button>
    <button class="club-audio" data-sound-toggle aria-pressed="${!!window.ECKEY_AUDIO?.enabled}" type="button"><span aria-hidden="true">♫</span><strong>${window.ECKEY_AUDIO?.enabled ? 'MUSIC ON':'PLAY LOBBY MUSIC'}</strong></button>
    <button class="club-audio" data-voice-toggle aria-pressed="${!!window.ECKY_COMPERE?.voiceEnabled}" type="button"><span aria-hidden="true">🎙</span><strong>${window.ECKY_COMPERE?.voiceEnabled ? 'VOICE ON':'ENABLE VOICE'}</strong></button>
    <label class="club-volume-control">MASTER VOLUME <input type="range" data-master-volume min="0" max="100" step="5" value="${Math.round((window.ECKY_COMPERE?.volume??0.7)*100)}" aria-label="Social Club master volume"></label>
  </footer>`;
  const playerLine = (s, showScore = false) => {
    const submitted = new Set(s.round?.submittedPlayerIds || []);
    return `<div class="club-lineup">${(s.players || []).map(p => `<div class="club-contestant ${submitted.has(p.id) ? 'club-answered':''}">
      ${artwork(p.avatar)}<span>${esc(p.name)}</span>${showScore ? `<strong>${number(p.score).toLocaleString('en-GB')}</strong>` :
      `<small>${submitted.has(p.id) ? '✓ IN' : p.online ? 'WRITING' : 'OFFLINE'}</small>`}</div>`).join('')}</div>`;
  };
  const roundLabel = s => `<div class="club-kicker">ROUND ${number(s.roundNumber)} · ${esc(s.title || names[s.round?.type] || '')}</div>`;
  const lobby = s => `<main class="club-centre club-lobby">
    <div class="club-neon">ECKY THUMP</div><p class="club-kicker">SATURDAY NIGHT AT THE SOCIAL CLUB</p>
    <div class="club-roomcode" aria-label="Join code ${esc(s.code)}">${esc(s.code)}</div>
    <div class="club-join"><img src="/api/rooms/${encodeURIComponent(s.code)}/join-qr.svg" alt="Scan this QR code to join the room">
      <div><strong>JOIN WITH YOUR PHONE</strong><span>${esc(location.host)}/join/</span><span>Friends only · ${s.players?.length || 0} / 12 contestants</span></div></div>
    ${playerLine(s, false)}</main>`;
  const intro = s => `<main class="club-centre club-intro">${roundLabel(s)}
    <div class="club-marquee">${esc(s.title)}</div>
    <p class="club-rule">${esc(s.rule)}</p>
    <div class="club-event">${s.round?.type === 'FINAL' ? 'LAST ORDERS · DOUBLE POINTS':'READY YOUR BEST WORST ANSWER'}</div></main>`;
  const submission = s => `<main class="club-centre club-submit">${roundLabel(s)}
    <h1 class="club-main-title">${s.round?.stage === 'seed' ? 'WRITE SOMETHING INNOCENT' : 'IT’S YOUR TURN'}</h1>
    <p class="club-rule">${esc(s.round?.stage === 'seed' ? 'Your words will land in somebody else’s hands.' : s.rule)}</p>
    <div class="club-progress"><strong>${number(s.round?.answerCount)}</strong><span>ANSWERS LOCKED IN</span></div>
    ${playerLine(s, false)}<p class="club-hint">Write on your phone. We’ll show the answers in a moment.</p></main>`;
  const reveal = s => {
    const answers = s.round?.visibleAnswers || [];
    const active = answers.at(-1);
    return `<main class="club-centre club-reveal">${roundLabel(s)}
      <p class="club-kicker">ANSWER ${answers.length} ${s.round?.totalGroups > 1 ? `· SET ${number(s.round.groupIndex)+1} OF ${number(s.round.totalGroups)}` : ''}</p>
      <div class="club-reveal-frame"><span class="club-letter">${esc(active?.letter || '…')}</span>
      <blockquote class="club-answer">${esc(active?.text || 'Here comes your answer…')}</blockquote></div>
      <p class="club-hint">NO NAMES UNTIL THE VOTE IS OVER</p></main>`;
  };
  const vote = s => {
    const entries = s.round?.visibleAnswers || [],isPair=entries.length === 2;
    return `<main class="club-centre club-vote">${roundLabel(s)}
      <h1 class="club-main-title">MAKE YOUR CHOICE</h1>
      <div class="club-matchups ${isPair ? 'club-two-up':'club-raffle'}">${entries.map(e => `<article class="club-matchup">
      <span class="club-option-letter">${esc(e.letter)}</span><p>${esc(e.text)}</p></article>`).join('')}</div>
      <p class="club-vote-nudge">VOTE ON YOUR PHONE ${s.round?.voteProgress ? `· ${number(s.round.voteProgress.cast)} OF ${number(s.round.voteProgress.eligible)} BALLOTS` : ''}</p>
    </main>`;
  };
  const result = s => {
    const entries=s.round?.visibleAnswers || [],data=s.round?.result || {},counts=data.counts || {};
    const total=entries.reduce((n,e)=>n+number(counts[e.id]),0);
    const awards=new Map((data.awards || []).map(x=>[x.entryId,x]));
    const sorted=[...entries].sort((a,b)=>number(awards.get(b.id)?.points)-number(awards.get(a.id)?.points));
    return `<main class="club-centre club-result">${roundLabel(s)}
      ${data.slam ? '<h1 class="club-slam">ECKY THUMP!</h1><p class="club-kicker">UNANIMOUS · +250 BONUS</p>' : '<h1 class="club-main-title">THE VERDICT</h1>'}
      <div class="club-results-list ${sorted.length > 2 ? 'club-results-many':''}">${sorted.map(e=>{
        const award=awards.get(e.id),share=total>0?100*number(counts[e.id])/total:0;
        return `<article class="club-result-row">${artwork(e.avatar,!!award?.unanimous)}
          <div class="club-result-body"><div class="club-result-author">${esc(e.authorName || 'One of the club regulars')} <span>+${number(award?.points).toLocaleString('en-GB')} PTS</span></div>
          <p>${esc(e.text)}</p><div class="club-meter" aria-label="${Math.round(share)} percent of weighted votes"><span style="width:${Math.min(100,Math.max(0,share)).toFixed(1)}%"></span></div></div></article>`;
      }).join('')}</div></main>`;
  };
  const scores = s => {
    const people=s.round?.standings || [...(s.players || [])].sort((a,b)=>number(b.score)-number(a.score));
    return `<main class="club-centre club-scores">${roundLabel(s)}<h1 class="club-main-title">THE CLUB LEADERBOARD</h1>
      <div class="club-scores-list">${people.map((p,i)=>`<div class="club-score-row"><span class="club-position">${i+1}</span>${artwork(p.avatar)}
        <strong>${esc(p.name)}</strong><span class="club-score">${number(p.score).toLocaleString('en-GB')} PTS</span></div>`).join('')}</div>
      <p class="club-hint">${s.config?.pace === 'relaxed'?'HOST TO START THE NEXT ROUND':'NEXT ROUND COMING UP'}</p></main>`;
  };
  const champion = s => {
    const person=(s.players || []).find(p=>p.id===s.champion) || s.round?.standings?.[0];
    return `<main class="club-centre club-champion"><p class="club-kicker">THE ECKY THUMP SOCIAL CLUB PRESENTS</p>
      <h1 class="club-slam">ECKY THUMP!</h1><div class="club-trophy">${artwork(person?.avatar,true)}</div>
      <h2 class="club-winner">${esc(person?.name || 'The champion')}</h2>
      <p class="club-rule">${number(person?.score).toLocaleString('en-GB')} POINTS · CHAMPION OF THE CLUB</p>
      <p class="club-hint">Good friends. Terrible answers. Another round?</p></main>`;
  };
  function render(s){
    const screens={LOBBY:lobby,ROUND_INTRO:intro,SUBMIT:submission,REVEAL:reveal,VOTE:vote,
      MATCHUP_RESULT:result,ROUND_SCORES:scores,CHAMPION:champion,COMPLETE:champion};
    const body=(screens[s.phase] || intro)(s);
    return `<div class="social-club club-${esc((s.phase||'LOBBY').toLowerCase())}" data-club-phase="${esc(s.phase)}">
      <div class="club-curtain club-curtain-left" aria-hidden="true"></div><div class="club-curtain club-curtain-right" aria-hidden="true"></div>
      ${stageHeader(s)}${body}${hostCue(s)}${stageFoot(s)}
      ${s.paused ? '<div class="club-pause-banner" role="status">OUR MAUREEN HAS CALLED A BREATHER · SHOW PAUSED</div>':''}
    </div>`;
  }
  function sceneKey(s){return [s.round?.id || 'lobby',s.phase,s.round?.groupIndex ?? 0,s.round?.visibleAnswers?.length ?? 0].join(':');}
  function cue(s){
    if(s.phase==='ROUND_INTRO')return s.round?.type==='FINAL'?'bell':'brass';
    return {REVEAL:'reveal',VOTE:'vote',MATCHUP_RESULT:s.round?.result?.slam?'slam':'vote-close',
      CHAMPION:'champion',ROUND_SCORES:'tap'}[s.phase]||'tap';
  }
  window.ECKY_SOCIAL_TV={render,sceneKey,cue};
})();
