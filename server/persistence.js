'use strict';
/** Atomic JSON persistence for Social Club private preview rooms only.
 * File permissions are private but JSON is NOT encrypted. Configure a private
 * persistent disk and retention policy before use outside controlled testing.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const VERSION=1,MAX_AGE=6*60*60*1000;
const filename=/^[A-HJ-NP-Z2-9]{6}\.json$/;
function directory(){return path.resolve(process.env.ROOM_DATA_DIR||path.join(__dirname,'../data/rooms'));}
function encode(_key,value){
  if(value instanceof Map)return {__eckyCollection:'Map',values:[...value]};
  if(value instanceof Set)return {__eckyCollection:'Set',values:[...value]};
  return value;
}
function decode(_key,value){
  if(!value||typeof value!=='object'||!Array.isArray(value.values))return value;
  if(value.__eckyCollection==='Map')return new Map(value.values);
  if(value.__eckyCollection==='Set')return new Set(value.values);
  return value;
}
function store(room){
  if(!room?.config?.socialClub||!filename.test(room.code+'.json'))return false;
  const dir=directory();fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const target=path.join(dir,room.code+'.json');
  const tmp=target+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';
  const json=JSON.stringify({version:VERSION,savedAt:Date.now(),room},encode);
  try{
    fs.writeFileSync(tmp,json,{mode:0o600,flag:'wx'});
    fs.renameSync(tmp,target);fs.chmodSync(target,0o600);
  }catch(err){try{fs.unlinkSync(tmp);}catch{}throw err;}
  return true;
}
function remove(code){if(!filename.test(code+'.json'))return;try{fs.unlinkSync(path.join(directory(),code+'.json'));}catch(err){if(err.code!=='ENOENT')throw err;}}
function restore(now=Date.now()){
  const result=new Map(),dir=directory();
  if(!fs.existsSync(dir))return result;
  for(const file of fs.readdirSync(dir)){
    if(!filename.test(file))continue;
    const full=path.join(dir,file);
    try{
      const obj=JSON.parse(fs.readFileSync(full,'utf8'),decode),room=obj.room;
      if(obj.version!==VERSION||!room||room.code!==file.slice(0,-5)||!room.config?.socialClub||!room.social||
         !Number.isFinite(room.created)||room.created>now||now-room.created>=MAX_AGE||
         !Array.isArray(room.players)||room.players.length<1||room.players.length>12||
         !Array.isArray(room.audience)||!Array.isArray(room.playlist)||!(room.promptHistory instanceof Set)){
        // Old games and invalid records never recover. Stale files are erased.
        if(room?.created&&now-room.created>=MAX_AGE)remove(file.slice(0,-5));
        continue;
      }
      for(const participant of [...room.players,...room.audience]){
        if(typeof participant.tokenHash!=='string'||!/^[a-f0-9]{64}$/.test(participant.tokenHash))throw Error('Invalid hashed session.');
        participant.online=false;participant.hasConnected=false;
      }
      if(room.round&&(!Array.isArray(room.round.groups)||!(room.round.prompts instanceof Map)||
        !(room.round.seeds instanceof Map)||!(room.round.hands instanceof Map)))continue;
      room.lastActivity=now;
      result.set(room.code,room);
    }catch(_){/* Do not load corrupted or untrusted room files. */}
  }
  return result;
}
module.exports={store,remove,restore,encode,decode,directory,MAX_AGE};
