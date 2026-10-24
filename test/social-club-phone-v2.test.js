'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'public/assets/social-club-phone.js'),'utf8');
function controller(){
  const sandbox={window:{ECKEY_AVATARS:[{id:'portrait-1',image:'/assets/avatar.webp'}]},Intl,navigator:{}};
  vm.runInNewContext(source,sandbox,{filename:'social-club-phone.js'});
  return sandbox.window.ECKY_SOCIAL_PHONE;
}
const base={mode:'social-club-v2',code:'ABC234',roundNumber:1,totalRounds:5,
  config:{rating:'clean',length:'standard',pace:'relaxed'},
  players:[{id:'alice',name:'Alice',avatar:'portrait-1',score:0,online:true},
    {id:'bob',name:'Bob',avatar:'portrait-1',score:0,online:true},
    {id:'pat',name:'Pat',avatar:'portrait-1',score:0,online:false}],
  you:{id:'alice',name:'Alice',isHost:true,role:'player'}};
const snapshot=(updates={})=>({...base,...updates});

test('Stage 4 entrypoint loads the phone controller before existing app.js',()=>{
  const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'public/assets/app.js'),'utf8');
  assert.ok(html.indexOf('social-club-phone.js')<html.indexOf('/assets/app.js'));
  assert.match(html,/social-club-phone\.css\?v=2\.0\.0-stage7/);
  assert.match(html,/social-club-phone\.js\?v=2\.0\.0-stage7/);
  assert.match(app,/s\.mode==='social-club-v2'/);
  assert.match(app,/club\?\.handle\(/);
  assert.match(app,/socialClub:!!document\.getElementById\('social-club-choice'\)\.checked/);
});

test('Social Club host is opt-in and refused on servers without the feature flag',()=>{
  const app=fs.readFileSync(path.join(root,'public/assets/app.js'),'utf8');
  const server=fs.readFileSync(path.join(root,'server/index.js'),'utf8');
  assert.match(app,/id="social-club-choice" type="checkbox" disabled/);
  assert.match(app,/data\.socialClubPreviewAvailable===true/);
  assert.match(server,/socialClubPreviewAvailable:process\.env\.SOCIAL_CLUB_PREVIEW==='1'/);
  assert.match(server,/Social Club preview is not enabled on this server/);
});

test('Lobby provides live 3–12 player preview start and one consistent tagline',()=>{
  const html=controller().render(snapshot({phase:'LOBBY'}));
  assert.match(html,/START THE SHOW/);
  assert.match(html,/GOOD FRIENDS\. TERRIBLE ANSWERS\./);
  assert.match(html,/3 \/ 12 PLAYERS/);
  assert.match(html,/data-club-action="start"/);
  assert.match(html,/data-club-action="rating"/);
  assert.doesNotMatch(html,/PLAY GAME CARD|GOLD VOTE|SILVER VOTE/);
});

test('Two assigned writing tasks show only one editable job and preserve privacy',()=>{
  const c=controller();
  const s=snapshot({phase:'SUBMIT',title:'THE TURN',round:{id:'round1',type:'WIT',stage:'answer',prompt:'Generic prompt',
    tasks:[{id:'a',prompt:'What goes wrong at the gala?',kind:'WIT',submitted:false},
      {id:'b',prompt:'Who nicked the buffet?',kind:'WIT',submitted:false}]}});
  const html=c.render(s);
  assert.match(html,/What goes wrong at the gala\?/);
  assert.doesNotMatch(html,/Who nicked the buffet\?/);
  assert.match(html,/LOCK IN &amp; NEXT PROMPT|LOCK IN & NEXT PROMPT/);
  assert.match(html,/data-club-action="submit"[^>]*disabled/);
  assert.equal(c.checkAnswer('Good'),true);
  assert.equal(c.checkAnswer('No'),false);
  assert.equal(c.checkAnswer('a'.repeat(161)),false);
});

test('Card choice is centred, without labels on each card',()=>{
  const s=snapshot({phase:'SUBMIT',title:'THE MEAT RAFFLE',round:{id:'round2',type:'CARD',stage:'answer',prompt:'The mascot is',
    tasks:[{id:'round2',prompt:'The mascot is _____',kind:'CARD',submitted:false}],
    hand:[{id:'h1',text:'a wonky garden gnome'},{id:'h2',text:'my dad’s best shorts'}]}});
  const html=controller().render(s);
  assert.match(html,/my dad’s best shorts/);
  assert.match(html,/data-club-action="pick"/);
  assert.doesNotMatch(html,/>CARD<|>POWER-UPS</);
});

test('Voting uses single large choices and never offers a vote to a contestant in a duel',()=>{
  const c=controller();const round={id:'r',type:'WIT',visibleAnswers:[{id:'entry1',letter:'A',text:'One funny line'}],
    vote:{groupId:'pair1',eligible:false,voted:false,choices:[{id:'entry1',text:'One funny line'}]}};
  const blocked=c.render(snapshot({phase:'VOTE',title:'THE TURN',round}));
  assert.match(blocked,/You&#39;re up!/);
  assert.doesNotMatch(blocked,/data-club-action="vote"/);
  const allowed=c.render(snapshot({phase:'VOTE',title:'THE TURN',round:{...round,
    vote:{...round.vote,eligible:true,choices:[{id:'entry1',text:'First'},{id:'entry2',text:'Second'}]}}}));
  assert.match(allowed,/Who gets your vote\?/);
  assert.equal((allowed.match(/data-club-action="vote"/g)||[]).length,2);
  assert.doesNotMatch(allowed,/GOLD|SILVER/);
});

test("Voting letters match the TV even when a player’s own raffle entry is excluded",()=>{
  const c=controller();
  const html=c.render(snapshot({phase:'VOTE',title:'THE MEAT RAFFLE',round:{id:'raffle',type:'CARD',
    vote:{eligible:true,voted:false,choices:[{id:'e2',text:'Other entry',letter:'B'},{id:'e3',text:'Third entry',letter:'C'}]}}}));
  assert.match(html,/<strong>B<\/strong>/);
  assert.match(html,/<strong>C<\/strong>/);
  assert.doesNotMatch(html,/<strong>A<\/strong>/);
  const server=fs.readFileSync(path.join(root,'server/social-club.js'),'utf8');
  assert.match(server,/letter:String\.fromCharCode\(65\+i\)/);
});

test('Answer text and names are HTML escaped, and results show authors only after voting',()=>{
  const c=controller();
  const html=c.render(snapshot({phase:'VOTE',title:'THE TURN',round:{id:'r',type:'WIT',
    vote:{eligible:true,voted:false,choices:[{id:'x',text:'<img src=x onerror=alert(1)>'}]}}}));
  assert.doesNotMatch(html,/<img src=x/);
  assert.match(html,/&lt;img/);
  const results=c.render(snapshot({phase:'MATCHUP_RESULT',title:'THE TURN',round:{id:'r',type:'WIT',
    visibleAnswers:[{id:'x',authorName:'<script>alert(1)</script>',text:'The gala went wrong'}],result:{awards:[{entryId:'x',points:250}]}}}));
  assert.doesNotMatch(results,/<script>/);
  assert.match(results,/&lt;script&gt;/);
});

test('A/B votes and audience votes reach correct server-owned action names',async()=>{
  const c=controller();const requests=[];
  const s=snapshot({phase:'VOTE',round:{id:'r',type:'WIT',vote:{eligible:true,voted:false,choices:[{id:'e1',text:'A'},{id:'e2',text:'B'}]}}});
  await c.handle('vote','e1',{s,send:async(...args)=>{requests.push(args);return true;},legacy:()=>{},toast:()=>{}});
  assert.equal(JSON.stringify(requests[0]),JSON.stringify(['social-vote',{entryId:'e1'}]));
  await c.handle('vote','e2',{s:{...s,you:{id:'aud',role:'audience'}},send:async(...args)=>{requests.push(args);return true;},legacy:()=>{},toast:()=>{}});
  assert.equal(JSON.stringify(requests[1]),JSON.stringify(['social-audience-vote',{entryId:'e2'}]));
});

test('The host can advance scores without exposing voting controls to everyone',async()=>{
  const c=controller();const captured=[];const s=snapshot({phase:'ROUND_SCORES',title:'THE TURN',round:{id:'r',standings:base.players}});
  assert.match(c.render(s),/NEXT ROUND/);
  assert.doesNotMatch(c.render({...s,you:{id:'bob',role:'player',isHost:false}}),/NEXT ROUND →/);
  await c.handle('next',undefined,{s,send:async(...args)=>captured.push(args),legacy:()=>{},toast:()=>{}});
  assert.deepEqual(captured[0],['social-next']);
});
