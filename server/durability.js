'use strict';
/** Fail-open game play and truthful recovery reporting for private Social Club rooms.
 * A full/unavailable disk must never crash the Node process or turn a valid
 * submission into an HTTP error after it has already changed in-memory state.
 * Durable restart recovery still REQUIRES a real persistent private disk.
 */
const persistence=require('./persistence');
let lastFailureAt=null,lastSuccessAt=null,lastWarningAt=0,failures=0;
const WARN_INTERVAL_MS=60000;
function failed(operation,error){
  failures++;
  lastFailureAt=Date.now();
  // No player data, filesystem paths, tokens or private answers in public logs.
  if(lastFailureAt-lastWarningAt>=WARN_INTERVAL_MS){
    lastWarningAt=lastFailureAt;
    console.warn(`ECKY THUMP: private room ${operation} failed; gameplay continues without guaranteed restart recovery (${String(error?.code||'IO_ERROR').replace(/[^A-Z0-9_]/g,'').slice(0,24)}).`);
  }
}
function restored(){
  try{return persistence.restore();}
  catch(error){failed('restore',error);return new Map();}
}
function store(room){
  if(!room?.config?.socialClub)return false;
  try{const saved=persistence.store(room);if(saved){lastSuccessAt=Date.now();lastFailureAt=null;}return saved;}
  catch(error){failed('save',error);return false;}
}
function remove(code){
  try{persistence.remove(code);return true;}
  catch(error){failed('delete',error);return false;}
}
function status(){
  const configured=!!process.env.ROOM_DATA_DIR;
  return {
    mode:configured?'configured-private-directory':'ephemeral-local-directory',
    state:lastFailureAt?'degraded':configured?'best-effort':'not-durable',
    // A configured path is not proof that the hosting provider supplies a disk.
    guaranteed:false,
    lastFailureAt,lastSuccessAt,
  };
}
module.exports={restore:restored,store,remove,status};
