'use strict';
/* Regression coverage for v1.6 presentation. Do not modify the avatar registry
 * or avatar renderer implementations for UI-only upgrades. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('the chosen neon logo ships with real transparency and is loaded in both pages',()=>{
 const img=fs.readFileSync(path.join(root,'public/assets/branding/eckey-thump-logo.webp'));
 assert.ok(img.length>20000&&img.subarray(0,4).toString()==='RIFF');
 for(const page of ['public/index.html','public/tv/index.html']){
  const html=read(page);
  assert.match(html,/modern-v1\.5\.css\?v=1\.6\.0/);
  assert.match(html,/neon-arena-v1\.6\.css\?v=1\.6\.0/);
  assert.ok(html.indexOf('modern-v1.5.css')<html.indexOf('neon-arena-v1.6.css'));
  assert.match(html,/avatars\.js\?v=1\.1\.0/);
 }
 assert.match(read('public/assets/app.js'),/v16-logo--/);
 assert.match(read('public/assets/tv.js'),/branding\/eckey-thump-logo\.webp/);
});
test('avatars, IDs and assets are byte-for-byte identical to the original baseline',()=>{
 const expected=require('./avatar-baseline-v11.json');
 for(const [file,sha] of Object.entries(expected)){
  const digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
  assert.equal(digest,sha,`${file} must remain unchanged`);
 }
});
test('new design has distinct home, lobby, TV, voting and mobile presentation hooks',()=>{
 const app=read('public/assets/app.js'),tv=read('public/assets/tv.js');
 const css=read('public/assets/neon-arena-v1.6.css');
 for(const name of ['v16-hero','v16-hero-character','v16-join-row','v16-lobby-grid','v16-lobby-bottom','v16-mobile-room-head']) assert.ok(app.includes(name),name);
 for(const name of ['v16-tv-lobby','v16-tv-cast','v16-tv-room-code','v16-tv-qr-panel','v16-tv-scene'])assert.ok(tv.includes(name),name);
 for(const name of ['stage-show-heading','prompt-box','candidate.gold-selected','tv-card.win','v16-tv-cast .tv-player','v16-hero-glow'])assert.ok(css.includes(name),name);
});
test('player settings and input actions remain connected to the existing game API',()=>{
 const app=read('public/assets/app.js');
 for(const cmd of ['go-host','go-join','create-form','join-form','adult-consent','change-avatar','select-card','submit','seed','gold','silver','vote','ready-next','play-again']) assert.ok(app.includes(cmd),cmd);
 assert.match(app,/rating:chosen\('humour'\)/);
 assert.match(app,/length:chosen\('length'\)/);
 assert.match(app,/pace:chosen\('pace'\)/);
 assert.match(app,/join-qr\.svg/);
 assert.match(app,/eckey-session-/);
});
test('responsive, keyboard and reduced-motion accommodations remain present',()=>{
 const css=read('public/assets/neon-arena-v1.6.css');
 assert.match(css,/max-width:1120px/);
 assert.match(css,/max-width:720px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(read('public/assets/modern-v1.5.css'),/focus-visible/);
});
test('server sends the new logo and stylesheet and reports v1.6',async()=>{
 const {server}=require('../server/index');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const health=await fetch(base+'/api/health');assert.equal(health.status,200);assert.equal((await health.json()).version,'1.6.0');
  const logo=await fetch(base+'/assets/branding/eckey-thump-logo.webp');assert.equal(logo.status,200);assert.match(logo.headers.get('content-type'),/image\/webp/);assert.ok((await logo.arrayBuffer()).byteLength>20000);
  const css=await fetch(base+'/assets/neon-arena-v1.6.css');assert.equal(css.status,200);assert.match(await css.text(),/NEON ARENA/);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
