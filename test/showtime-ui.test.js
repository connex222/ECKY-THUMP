'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('landing and TV use the chosen transparent neon logo, with the avatar helpers retained',()=>{
 const js=read('public/assets/app.js'),tv=read('public/assets/tv.js');
 const logo=path.join(root,'public/assets/branding/ecky-thump-logo.webp');
 assert.ok(fs.statSync(logo).size>20000);
 assert.match(js,/branding\/ecky-thump-logo\.webp/);
 assert.match(tv,/branding\/ecky-thump-logo\.webp/);
 assert.match(js,/function nav\(\)\{return '';\}/);
 assert.match(js,/lobby-stage-cast/);
 assert.match(js,/v14-big-qr/);
 assert.match(tv,/v16-tv-qr-panel/);
});
test('lobby music ships locally, can be toggled by player or TV, and will not auto-start',()=>{
 const audio=read('public/assets/lobby-audio.js');
 const app=read('public/assets/app.js');
 const tv=read('public/assets/tv.js');
 for(const page of ['public/index.html','public/tv/index.html']){
   const html=read(page);
   assert.match(html,/lobby-audio\.js\?v=1\.1\.0/);
   assert.match(html,/social-club-v2\.css\?v=2\.0\.0/);
   assert.match(read('public/assets/modern-v1.5.css'),/showtime\.css\?v=1\.1\.0/);
 }
 assert.match(audio,/enabled:false/);
 assert.match(audio,/new Audio\('\/assets\/audio\/lobby-theme\.ogg'\)/);
 assert.match(audio,/state\.scene!=='LOBBY'/);
 assert.match(app,/toggle-sound/);
 assert.match(tv,/data-sound-toggle/);
 assert.ok(fs.statSync(path.join(root,'public/assets/audio/lobby-theme.ogg')).size>15000);
});
test('web server serves local lobby theme with browser-compatible audio MIME type',async()=>{
 const {server}=require('../server/index.js');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
   const origin=`http://127.0.0.1:${server.address().port}`;
   const sound=await fetch(origin+'/assets/audio/lobby-theme.ogg');
   assert.equal(sound.status,200);
   assert.match(sound.headers.get('content-type'),/^audio\/ogg/);
   assert.ok((await sound.arrayBuffer()).byteLength>15000);
   const logo=await fetch(origin+'/assets/ecky-logo.svg');
   assert.equal(logo.status,200);
   assert.match(logo.headers.get('content-type'),/^image\/svg\+xml/);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
