'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('modern home has one dominant message, functional actions and no postcard collage',()=>{
 const app=read('public/assets/app.js'),tv=read('public/assets/tv.js');
 for(const item of ['e15-hero','e15-main-button','go-host','go-join','e15-showcase','e15-lobby-grid','e15-code-block'])assert.ok(app.includes(item));
 for(const item of ['e15-tv-code','e15-tv-scan','e15-tv-cast'])assert.ok(tv.includes(item));
 assert.doesNotMatch(app,/donkey-poster|hen-poster|seagull-poster|postcard-poster-art/);
});
test('host setup submits real rating, length and pace and uses existing avatar chooser',()=>{
 const app=read('public/assets/app.js');
 for(const item of ["rating:chosen('humour')","length:chosen('length')","pace:chosen('pace')","getElementById('host-avatar-picker').innerHTML=avatarPicker()","getElementById('join-avatar-picker').innerHTML=avatarPicker()"])assert.ok(app.includes(item));
});
test('server reports v1.5 and serves the modern stylesheet',async()=>{
 const {server}=require('../server/index');await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const origin=`http://127.0.0.1:${server.address().port}`;
  const health=await fetch(origin+'/api/health');assert.equal(health.status,200);assert.equal((await health.json()).version,'1.5.0');
  const css=await fetch(origin+'/assets/modern-v1.5.css');assert.equal(css.status,200);assert.match(await css.text(),/NIGHT SHIFT/);
 }finally{await new Promise(r=>server.close(r));}
});
