'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,statSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const root=join(__dirname,'..');
const read=file=>readFileSync(join(root,file),'utf8');

test('both play surfaces load new game FX and Showdown styles in safe script order',()=>{
 for(const page of ['public/index.html','public/tv/index.html']){
  const html=read(page);
  const sfx=html.indexOf('/assets/show-sfx.js');
  const runtime=html.indexOf(page.includes('/tv/')?'/assets/tv.js':'/assets/app.js');
  assert.ok(sfx>0&&sfx<runtime,'sound script must load before runtime');
  assert.match(html,/modern-v1\.5\.css\?v=1\.5\.0/);
  assert.match(read('public/assets/modern-v1.5.css'),/showdown\.css\?v=1\.1\.0/);
  assert.match(html,/lobby-audio\.js\?v=1\.1\.0/);
 }
});
test('player UI showcases all five challenges and the voting and champion scenes',()=>{
 const app=read('public/assets/app.js'),tv=read('public/assets/tv.js');
 for(const name of ['CARD CLASH','QUICK WIT','CONTEXT COLLAPSE','DOUBLE TROUBLE','THE LAST LAUGH']){
   assert.ok(app.includes(name),`missing ${name}`);
 }
 for(const stage of ['SEED','SUBMIT','VOTE','RESULTS','FINISHED'])assert.ok(app.includes(`stageHeader(s,"${stage}")`));
 assert.match(app,/stage-vote-tag/);
 assert.match(tv,/tv-vote-prompt/);
 assert.match(tv,/tv-results-prompt/);
 assert.match(tv,/tv-finale-title/);
 assert.match(app,/S\.scenePulse\?confetti\(\)/);
 assert.match(tv,/scenePulse\?tvConfetti\(\)/);
});
test('show FX are original local synthesis, initially silent, and independent of lobby music',()=>{
 const js=read('public/assets/show-sfx.js');
 assert.match(js,/let enabled=false/);
 assert.match(js,/if\(!enabled\|\|!unlocked/);
 assert.match(js,/if\(enabled&&!setup\(\)\)/);
 for(const cue of ['pick','submit','gold','silver','countdown','round','vote','reveal','champion']) assert.match(js,new RegExp(`case '${cue}'`));
 assert.match(read('public/assets/app.js'),/data-action="toggle-sfx"/);
 assert.match(read('public/assets/tv.js'),/data-fx-toggle/);
 assert.ok(statSync(join(root,'public/assets/audio/lobby-theme.ogg')).size>1000);
});
test('audio synthesis cannot generate sound until the listener interacts',()=>{
 let instances=0,notes=0;
 class MockAC{constructor(){instances++;this.state='running';this.currentTime=1;this.destination={};}
 createOscillator(){notes++;return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return {connect(){}}},start(){},stop(){}}}
 createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return {connect(){}}}}}
 }
 const sandbox={window:{AudioContext:MockAC},document:{hidden:false}};
 vm.runInNewContext(read('public/assets/show-sfx.js'),sandbox);
 const api=sandbox.window.ECKEY_SFX;
 assert.equal(api.enabled,false);api.play('round');assert.equal(notes,0);assert.equal(instances,0);
 assert.equal(api.toggle(),true);assert.ok(notes>0);const count=notes;
 api.toggle();api.play('champion');assert.equal(notes,count);
});
test('double-points finale truly doubles the once-rounded ordinary points',()=>{
 const g=require('../server/game.js');
 const entries=['p1','p2','p3'].map((authorId,i)=>({id:`entry${i}`,authorId,text:`answer${i}`}));
 const base=g.scoreEntries(entries,[]),double=g.scoreEntries(entries,[],2);
 assert.ok(base.length>0);for(const a of double)assert.equal(a.points,2*base.find(b=>b.entryId===a.entryId).points);
});

test('v1 show FX and stylesheet are directly served by the game server',async()=>{
 const {server}=require('../server/index.js');
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try{
  const url=`http://127.0.0.1:${server.address().port}`;
  for(const file of ['/assets/show-sfx.js','/assets/showdown.css']){
   const res=await fetch(url+file);assert.equal(res.status,200,file);
   const text=await res.text();assert.ok(text.length>1000);
  }
 }finally{await new Promise(done=>server.close(done));}
});
