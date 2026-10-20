'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('v1.3 postcard art is available to the home page and both lobby screens',()=>{
  const app=source('public/assets/app.js');
  const tv=source('public/assets/tv.js');
  const css=source('public/assets/seaside-postcard.css');
  const art='public/assets/ui/ecky-seaside-poster-reference.webp';
  assert.ok(fs.statSync(path.join(root,art)).size>100000);
  assert.ok(fs.statSync(path.join(root,art)).size<900000);
  assert.match(app,/postcard-splash-grid/);
  assert.match(app,/postcard-lobby-stage/);
  assert.match(tv,/tv-poster-hero/);
  assert.match(app,/ecky-seaside-poster-reference\.webp/);
  assert.match(tv,/ecky-seaside-poster-reference\.webp/);
  assert.match(css,/ecky-seaside-poster-reference\.webp/);
});

test('host setup submits real rating, length and pace fields and preserves avatar chooser initialization',()=>{
  const app=source('public/assets/app.js');
  assert.match(app,/rating:chosen\('humour'\)/);
  assert.match(app,/length:chosen\('length'\)/);
  assert.match(app,/pace:chosen\('pace'\)/);
  assert.match(app,/getElementById\('host-avatar-picker'\)\.innerHTML=avatarPicker\(\)/);
  assert.match(app,/getElementById\('join-avatar-picker'\)\.innerHTML=avatarPicker\(\)/);
  assert.match(app,/getElementById\('host-adult-wrap'\)\.classList\.toggle\('hidden',chosen\('humour'\)!=='adult'\)/);
  assert.doesNotMatch(app,/config:\{rating:/);
});

test('server responds with correct version and delivers the optimised poster art',async()=>{
  const {server}=require('../server/index');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const origin=`http://127.0.0.1:${server.address().port}`;
    const health=await fetch(origin+'/api/health');
    assert.equal(health.status,200);
    assert.equal((await health.json()).version,'1.3.0');
    const poster=await fetch(origin+'/assets/ui/ecky-seaside-poster-reference.webp');
    assert.equal(poster.status,200);
    assert.match(poster.headers.get('content-type'),/^image\/webp/);
    assert.ok((await poster.arrayBuffer()).byteLength>100000);
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
});
