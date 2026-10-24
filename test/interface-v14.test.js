'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('v1.6 neon arena extends the low-priority modern layer and avatars load first',()=>{
 for(const file of ['public/index.html','public/tv/index.html']){
  const html=read(file);
  assert.match(html,/social-club-v2\.css\?v=2\.0\.0/);
  assert.match(html,/e15-modern/);
  assert.doesNotMatch(html,/interface-v1\.4\.css|seaside-postcard\.css|postcard-reset/);
  assert.ok(html.indexOf('avatars.js')<html.indexOf(file.includes('tv/')?'tv.js':'app.js'));
 }
});
test('real Host and Join actions, all three ratings, rounds and pacing remain wired',()=>{
 const app=read('public/assets/app.js');
 for(const command of ['go-host','go-join','close-setup','home-family','home-adult'])assert.match(app,new RegExp("case '"+command+"'|data-action=\\\""+command+"\\\""));
 for(const [name,expected] of Object.entries({humour:['clean','cheeky','adult'],length:['quick','standard','party'],pace:['relaxed','lively']})){
  const found=[...app.matchAll(new RegExp('name="'+name+'" value="([^"]+)"','g'))].map(m=>m[1]);assert.deepEqual(found,expected);
 }
 for(const str of ["rating:chosen('humour')","length:chosen('length')","pace:chosen('pace')","getElementById('host-avatar-picker').innerHTML=avatarPicker()","getElementById('join-avatar-picker').innerHTML=avatarPicker()"])assert.ok(app.includes(str));
});
test('TV code and QR still render and offset is initialized for accurate countdown',()=>{
 const tv=read('public/assets/tv.js');
 for(const key of ['clockOffset=0','typeof s.serverNow', 'join-qr.svg','v16-tv-room-code','v16-tv-cast'])assert.ok(tv.includes(key));
});
test('modern UI supports narrow screens and reduced motion without postcard references',()=>{
 const css=read('public/assets/modern-v1.5.css');
 assert.match(css,/max-width:440px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 for(const key of ['e15-hero','e15-lobby-grid','tv-card','candidate'])assert.ok(css.includes(key));
 assert.doesNotMatch(css,/seaside-postcard|donkey-poster|hen-poster/);
});
