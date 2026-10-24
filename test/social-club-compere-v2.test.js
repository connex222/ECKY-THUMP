'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const manifest=JSON.parse(read('server/packs/voice-lines.json'));

const events=['lobby','round-intro','submit','reveal','vote','vote-close',
  'unanimous-win','comeback','last-orders','champion','idle-nudge','awaiting-answers'];

test('Our Maureen manifest has precisely 60 distinctive, short UK voice lines and 12 triggers',()=>{
  assert.equal(manifest.compereName,'Our Maureen');
  assert.equal(manifest.language,'en-GB');
  assert.equal(manifest.lines.length,60);
  assert.deepEqual([...new Set(manifest.lines.map(x=>x.trigger))].sort(),events.slice().sort());
  assert.equal(new Set(manifest.lines.map(x=>x.id)).size,60);
  assert.equal(new Set(manifest.lines.map(x=>x.caption)).size,60);
  for(const trigger of events)assert.ok(manifest.lines.filter(x=>x.trigger===trigger).length>=3,trigger);
  for(const line of manifest.lines){
    assert.ok(line.caption.match(/[A-Za-z]/));
    assert.ok(line.caption.match(/[.!?]$/));
    assert.ok(line.caption.split(/\s+/).length<12,`${line.id}: ${line.caption}`);
    assert.equal(typeof line.recorded,'boolean');
    if(line.recorded)assert.ok(fs.existsSync(path.join(root,'public',line.audio)),`Missing recorded audio ${line.id}`);
    assert.equal(line.audio,`/assets/audio/maureen/${line.id}.ogg`);
    assert.doesNotMatch(line.caption,/[<>]/);
  }
  assert.deepEqual(manifest,JSON.parse(read('public/assets/voice-lines.json')));
  assert.match(read('VOICE-LINES.md'),/60 original lines/);
});

const three=[{id:'a',name:'A',score:200},{id:'b',name:'B',score:100},{id:'c',name:'C',score:50}];
const snap=(phase,overrides={})=>({phase,round:{id:'x01',type:'WIT',answerCount:1,visibleAnswers:[]},
  players:three,code:'ABC234',...overrides});
function mock({available=true}={}){
  let resolveFetch,fetches=0,audioPlays=0;
  const handlers={};
  const window={ECKEY_SFX:{setVolume(value){this.volume=value;}},ECKEY_AUDIO:{setVolume(value){this.volume=value;}},
    addEventListener(){},Audio:function(){audioPlays++;}};
  const node={textContent:''};
  const document={hidden:false,addEventListener(){},querySelector(){return node;},dispatchEvent(){}};
  const fetch=()=>{fetches++;return new Promise(resolve=>{resolveFetch=resolve;});};
  const sandbox={window,document,fetch,Date,Math,Number,Audio:function(){audioPlays++;}};
  vm.runInNewContext(read('public/assets/compere.js'),sandbox);
  const load=async(customManifest=manifest)=>{
    if(available)resolveFetch({ok:true,json:async()=>customManifest});
    else resolveFetch({ok:false});
    await new Promise(setImmediate);
  };
  return {api:window.ECKY_COMPERE,load,node,fetches:()=>fetches,audioPlays:()=>audioPlays,window};
}

test('A caption always exists before and after manifest loading; selection is stable for one scene',async()=>{
  const h=mock(),s=snap('REVEAL');
  h.api.onScene(s,'x01:REVEAL:0:1');
  assert.ok(h.api.display(s).caption.length>10);
  await h.load();
  const caption=h.api.display(s).caption;
  assert.ok(manifest.lines.some(x=>x.caption===caption));
  h.api.onScene(s,'x01:REVEAL:0:1');
  assert.equal(h.api.display(s).caption,caption);
  assert.equal(h.api.voiceEnabled,false);
  assert.equal(h.audioPlays(),0);
  assert.equal(h.fetches(),1);
});

test('Missing manifest leaves readable captions and never fails the TV scene',async()=>{
  const h=mock({available:false});
  h.api.onScene(snap('CHAMPION'),'x01:CHAMPION');
  await h.load();
  assert.match(h.api.display(snap('CHAMPION')).caption,/champion/i);
  assert.equal(h.audioPlays(),0);
});

test('Voice requires a user-controlled toggle and a recorded, locally named clip',async()=>{
  const h=mock();await h.load();
  h.api.onScene(snap('ROUND_INTRO'),'x01:INTRO');
  assert.equal(h.api.voiceEnabled,false);
  assert.equal(h.api.toggleVoice(),manifest.lines.some(line=>line.recorded),'Voice toggling reflects installed files');
  if(h.api.voiceEnabled)h.api.toggleVoice();
  const noRecorded=JSON.parse(JSON.stringify(manifest));
  noRecorded.lines.forEach(line=>line.recorded=false);
  const empty=mock();await empty.load(noRecorded);
  assert.equal(empty.api.toggleVoice(),false,'No installed audio must not falsely report VOICE ON');
  const withOneRecording=JSON.parse(JSON.stringify(manifest));
  withOneRecording.lines.forEach(line=>line.recorded=false);
  withOneRecording.lines[0].recorded=true;
  const n=mock();await n.load(withOneRecording);
  assert.equal(n.api.recordingsAvailable,1);
  assert.equal(n.api.toggleVoice(),true);
  h.api.onScene(snap('REVEAL'),'x01:REVEAL:0:1');
  assert.equal(h.audioPlays(),0,'Unrecorded sounds must not request files');
  assert.equal(n.api.toggleVoice(),false);
  assert.equal(n.api.voiceEnabled,false);
  h.api.setVolume(.35);
  assert.equal(h.api.volume,.35);
  assert.equal(h.window.ECKEY_SFX.volume,.35);
  assert.equal(h.window.ECKEY_AUDIO.volume,.35);
});

test('Unanimous slams and Last Orders choose their own themed caption groups',async()=>{
  const h=mock();await h.load();
  const slam=snap('MATCHUP_RESULT',{round:{id:'r03',type:'WIT',result:{slam:true}}});
  h.api.onScene(slam,'r03:MATCHUP_RESULT:0:2');
  assert.ok(manifest.lines.some(x=>x.trigger==='unanimous-win'&&x.caption===h.api.display(slam).caption));
  const finale=snap('ROUND_INTRO',{round:{id:'r05',type:'FINAL'}});
  h.api.onScene(finale,'r05:ROUND_INTRO:0:0');
  assert.ok(manifest.lines.some(x=>x.trigger==='last-orders'&&x.caption===h.api.display(finale).caption));
});

test('Late answer warning updates the always-present caption without speaking',async()=>{
  const h=mock();await h.load();
  const s=snap('SUBMIT',{round:{id:'r4',answerCount:1},players:three});
  h.api.onScene(s,'r4:SUBMIT');
  h.api.onClock(s,10);
  assert.ok(manifest.lines.some(x=>x.trigger==='awaiting-answers'&&x.caption===h.node.textContent));
  h.api.onClock(s,10);
  assert.equal(h.audioPlays(),0);
});

test('TV includes local compère assets and dedicated controls without changing phone',()=>{
  const html=read('public/tv/index.html'),tv=read('public/assets/tv.js');
  const renderer=read('public/assets/social-club-tv.js'),css=read('public/assets/social-club-tv.css');
  const sfx=read('public/assets/show-sfx.js');
  assert.match(html,/compere\.js\?v=2\.0\.0/);
  assert.match(html,/social-club-tv\.js\?v=2\.0\.0/);
  assert.match(tv,/ECKY_COMPERE\?\.onScene/);
  assert.match(tv,/data-master-volume/);
  assert.match(renderer,/data-voice-toggle/);
  assert.match(renderer,/RECORDINGS NEEDED/);
  assert.match(renderer,/data-maureen-caption/);
  assert.match(renderer,/data-master-volume/);
  assert.match(css,/club-volume-control/);
  assert.match(sfx,/case 'bell'/);
  assert.match(sfx,/case 'brass'/);
  assert.match(sfx,/case 'slam'/);
  assert.match(sfx,/case 'vote-close'/);
  assert.doesNotMatch(read('public/index.html'),/compere\.js/);
  assert.doesNotMatch(tv,/innerHTML\s*=\s*.*caption/);
});

test('TV marks voice action unavailable without audio and unlocks it after verified audio exists',()=>{
  const vm=require('node:vm');
  const make=(count)=>{
    const win={ECKY_COMPERE:{voiceEnabled:false,recordingsAvailable:count,display(){return {speaker:'Our Maureen',caption:'Hello!'};}},ECKEY_SFX:{enabled:false},ECKEY_AUDIO:{enabled:false}};
    vm.runInNewContext(read('public/assets/social-club-tv.js'),{window:win,location:{host:'localhost'},Date,Math,Number});
    return win.ECKY_SOCIAL_TV.render({code:'ACD234',phase:'LOBBY',players:[],roundNumber:0,totalRounds:5});
  };
  assert.match(make(0),/data-voice-toggle[^>]*disabled/);
  assert.match(make(0),/RECORDINGS NEEDED/);
  assert.doesNotMatch(make(1),/data-voice-toggle[^>]*disabled/);
  assert.match(make(1),/ENABLE VOICE/);
});
