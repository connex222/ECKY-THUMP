'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {server,rooms}=require('../server/index');
test('HTTP rejects oversized, malformed and cross-origin game requests without losing health',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const oversize=await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Host',message:'Z'.repeat(13_000)})});
  assert.equal(oversize.status,413);
  assert.match((await oversize.json()).error,/too large/);
  const malformed=await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken JSON!'});
  assert.equal(malformed.status,400);
  assert.match((await malformed.json()).error,/Invalid JSON/);
  const crossOrigin=await fetch(base+'/api/rooms',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({name:'Host'})});
  assert.equal(crossOrigin.status,400);
  const health=await fetch(base+'/api/health');
  assert.equal(health.status,200);assert.equal((await health.json()).version,'1.8.2');
 }finally{rooms.clear();await new Promise(resolve=>server.close(resolve));}
});
