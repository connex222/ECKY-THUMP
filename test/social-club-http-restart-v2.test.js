'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {fork}=require('node:child_process');
const fixture=path.join(__dirname,'fixtures/social-server.js');
function message(child,kind,timeoutMs=5000){return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(Error('Timed out waiting for '+kind));},timeoutMs);
  function cleanup(){clearTimeout(timer);child.off('message',handle);child.off('exit',exited);}
  function handle(data){if(data.kind==='error'){cleanup();reject(Error(data.error));}
    if(data.kind===kind){cleanup();resolve(data);}}
  function exited(code){cleanup();reject(Error('Child exited '+code));}
  child.on('message',handle);child.once('exit',exited);
});}
async function launch(dir){
  const child=fork(fixture,[],{env:{...process.env,SOCIAL_CLUB_PREVIEW:'1',ROOM_DATA_DIR:dir},stdio:['ignore','pipe','pipe','ipc']});
  try{const info=await message(child,'ready');return {child,port:info.port,loaded:info.rooms};}
  catch(err){child.kill();throw err;}
}
async function stop(child){if(!child||child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');setTimeout(resolve,1000).unref();});}
async function request(port,pathname,method='GET',body,token){
  const response=await fetch('http://127.0.0.1:'+port+pathname,{method,headers:{
    ...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})
  },body:body?JSON.stringify(body):undefined});
  return {status:response.status,data:await response.json()};
}
test('HTTP v2 room survives a real Node restart mid-round with the same token and submissions',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-restart-'));
  let first,second;
  try{
    first=await launch(dir);
    const create=await request(first.port,'/api/rooms','POST',{name:'Host',socialClub:true,length:'quick'});
    assert.equal(create.status,201);
    const code=create.data.code;
    const joined=[];
    for(const name of ['Mate One','Mate Two']){
      const reply=await request(first.port,'/api/rooms/'+code+'/join','POST',{name});
      assert.equal(reply.status,201);joined.push(reply.data);
    }
    assert.equal((await request(first.port,'/api/rooms/'+code+'/action','POST',{type:'start'},create.data.secret)).status,200);
    const advanced=message(first.child,'advanced');first.child.send({kind:'advance-intro',code});
    assert.equal((await advanced).phase,'SUBMIT');
    const before=await request(first.port,'/api/rooms/'+code+'/snapshot','GET',undefined,create.data.secret);
    const card=before.data.round.hand[0];
    assert.equal((await request(first.port,'/api/rooms/'+code+'/action','POST',{
      type:'social-submit',taskId:before.data.round.tasks[0].id,value:card.id
    },create.data.secret)).status,200);
    const committed=await request(first.port,'/api/rooms/'+code+'/snapshot','GET',undefined,create.data.secret);
    assert.equal(committed.data.round.tasks[0].submitted,true);
    await stop(first.child);
    second=await launch(dir);
    assert.equal(second.loaded,1);
    const recovered=await request(second.port,'/api/rooms/'+code+'/snapshot','GET',undefined,create.data.secret);
    assert.equal(recovered.status,200);
    assert.equal(recovered.data.mode,'social-club-v2');
    assert.equal(recovered.data.phase,'SUBMIT');
    assert.equal(recovered.data.round.tasks[0].submitted,true);
    assert.equal(recovered.data.round.hand[0].id,card.id);
    const friend=await request(second.port,'/api/rooms/'+code+'/snapshot','GET',undefined,joined[0].secret);
    assert.equal(friend.status,200);
    assert.equal(friend.data.round.tasks[0].submitted,false);
    const unrecoverable=await request(second.port,'/api/rooms/'+code+'/snapshot','GET',undefined,'wrong-token');
    assert.equal(unrecoverable.status,401);
  }finally{await stop(first?.child);await stop(second?.child);fs.rmSync(dir,{recursive:true,force:true});}
});
test('public service rejects Social Club preview creation unless explicitly enabled',async()=>{
  const {server}=require('../server/index');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const res=await request(server.address().port,'/api/rooms','POST',{name:'Host',socialClub:true});
    assert.equal(res.status,400);assert.match(res.data.error,/not enabled/);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
