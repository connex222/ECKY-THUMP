'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const game=require('../server/game');
const root=path.resolve(__dirname,'..');
const file=name=>fs.readFileSync(path.join(root,name),'utf8');
function loadRenderer(){
  const window={ECKEY_AVATARS:[{id:'adult-01',image:'/assets/avatars/adult-01.webp',celebration:'/assets/celebrations/adult-01.webp'}],ECKEY_SFX:{enabled:false},ECKEY_AUDIO:{enabled:false}};
  vm.runInNewContext(file('public/assets/social-club-tv.js'),{window,location:{host:'example.test'},Date,URL,encodeURIComponent});
  return window.ECKY_SOCIAL_TV;
}
const players=Array.from({length:3},(_,i)=>({id:'p'+i,name:'Friend '+i,avatar:'adult-01',score:i*200,online:true}));
function snapshot(phase){
  return {mode:'social-club-v2',phase,code:'ABCD23',players,roundNumber:2,totalRounds:5,
    title:'THE TURN',rule:'Write two answers.',round:{id:'round',type:'WIT',groupIndex:0,totalGroups:3,
      visibleAnswers:[{id:'x',letter:'A',text:'My dad and his good shorts'},{id:'y',letter:'B',text:'The chippy on Sunday'}]}};
}
test('Stage 3 is conditionally loaded on TV without disrupting the established renderer',()=>{
  const html=file('public/tv/index.html');const js=file('public/assets/tv.js');
  assert.match(html,/social-club-tv\.js\?v=2\.0\.0/);
  assert.match(html,/social-club-v2\.css\?v=2\.0\.0/);
  assert.match(js,/if\(s\.mode==='social-club-v2'\)/);
  assert.match(js,/club\.render\(s\)/);
  assert.match(js,/classList\.add\('club-shell'\)/);
  assert.match(js,/classList\.remove\('club-shell'\)/);
  assert.match(js,/const body=s\.phase==='LOBBY'/);
  assert.doesNotMatch(file('public/index.html'),/social-club-tv\.js/);
});
test('Social Club lobby has visible join code and locally served QR',()=>{
  const html=loadRenderer().render({...snapshot('LOBBY'),round:undefined});
  assert.match(html,/ABCD23/);assert.match(html,/join-qr\.svg/);
  assert.match(html,/GOOD FRIENDS\. TERRIBLE ANSWERS\./);
  assert.match(html,/SOCIAL CLUB/);
});
test('anonymous reveal and voting never expose author identifiers',()=>{
  const renderer=loadRenderer();const s=snapshot('REVEAL');
  s.round.visibleAnswers=[{id:'x',letter:'A',text:'<script>alert(1)</script>'}];
  const html=renderer.render(s);
  assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>alert/);
  assert.doesNotMatch(html,/authorName|Friend 0/);
  assert.match(html,/NO NAMES UNTIL THE VOTE IS OVER/);
  const voting=renderer.render(snapshot('VOTE'));
  assert.match(voting,/MAKE YOUR CHOICE/);
  assert.match(voting,/My dad and his good shorts/);
  assert.doesNotMatch(voting,/authorName/);
});
test('matchup result uses server-authorised points and reveals winners with avatars',()=>{
  const renderer=loadRenderer(),s=snapshot('MATCHUP_RESULT');
  s.round.visibleAnswers[0].authorName='Pat';s.round.visibleAnswers[0].avatar='adult-01';
  s.round.visibleAnswers[1].authorName='Jo';s.round.visibleAnswers[1].avatar='adult-01';
  s.round.result={slam:true,counts:{x:2,y:0},awards:[{entryId:'x',points:1250,unanimous:true},{entryId:'y',points:0}]};
  const html=renderer.render(s);
  assert.match(html,/ECKY THUMP!/);assert.match(html,/1,250 PTS/);assert.match(html,/Pat/);
  assert.match(html,/celebrations\/adult-01\.webp/);
  assert.match(html,/width:100\.0%/);
});
test('scoreboard and champion are legible even when dynamic strings need escaping',()=>{
  const renderer=loadRenderer(),s=snapshot('ROUND_SCORES');
  s.round.standings=[{name:'Mike <M>',avatar:'adult-01',score:3000}];
  const scores=renderer.render(s);
  assert.match(scores,/Mike &lt;M&gt;/);assert.match(scores,/3,000 PTS/);
  s.phase='CHAMPION';s.champion='p2';
  assert.match(renderer.render(s),/Friend 2/);
});
test('stage CSS uses large-format type, 720p fallback, reduced motion and focus styles',()=>{
  const css=file('public/assets/social-club-tv.css');
  assert.match(css,/club-answer\{font-size:clamp\(72px/);
  assert.match(css,/max-height:780px/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/focus-visible/);
  assert.match(css,/prefers-contrast:more/);
});
test('TV status fields reveal only completed seat IDs and aggregated votes',()=>{
  const {room}=game.newRoom({name:'Host',socialClub:true,pace:'relaxed'});
  room.code='ABCD23';game.addPlayer(room,'Pat');game.addPlayer(room,'Jo');
  game.social.start(room);game.social.startSubmit(room);
  let tv=game.snapshot(room,null,true);
  assert.deepEqual(tv.round.submittedPlayerIds,[]);
  assert.equal(tv.round.tasks,undefined);
  const p=room.players[0];for(const t of game.social.expected(room,p.id)){
    game.social.submit(room,p,t.id,room.round.hands.get(p.id)[0].id,game.validateAnswer);
  }
  tv=game.snapshot(room,null,true);
  assert.deepEqual(tv.round.submittedPlayerIds,[p.id]);
  assert.equal(tv.round.hand,undefined);
  for(const rest of room.players.slice(1))game.social.submit(room,rest,room.round.id,room.round.hands.get(rest.id)[0].id,game.validateAnswer);
  while(room.phase==='REVEAL')game.social.revealNext(room);
  tv=game.snapshot(room,null,true);
  assert.equal(tv.round.voteProgress.cast,0);
  assert.equal(tv.round.voteProgress.eligible,3);
  assert.equal(tv.round.visibleAnswers.every(e=>!('authorId' in e)),true);
});
