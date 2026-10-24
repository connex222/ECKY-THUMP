#!/usr/bin/env node
'use strict';
/** Recover approved synthetic Maureen recordings and import through the validated Stage 10 pipeline. */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {importAudio,check}=require('./import-maureen-audio');
const root=path.resolve(__dirname,'..');
const sources=JSON.parse(fs.readFileSync(path.join(root,'docs/maureen-production-sources.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'server/packs/voice-lines.json'),'utf8'));
if(sources.schemaVersion!==1||sources.language!=='en-GB'||sources.voiceCharacterId!=='5d672f52-20b5-41c8-96c8-c83169415d7c'||sources.recordings?.length!==60)throw Error('Unexpected source manifest or selected character');
if(manifest.lines.length!==60)throw Error('Unexpected game manifest length');
const allowed='cdn.creativeclaw.co',seen=new Set();
for(let i=0;i<60;i++){
 const src=sources.recordings[i],line=manifest.lines[i];
 if(src.id!==line.id||src.text!==line.caption||seen.has(src.id))throw Error('Audio script mismatch, duplicate or changed line: '+src.id);
 seen.add(src.id);
 const url=new URL(src.url);
 if(url.protocol!=='https:'||url.hostname!==allowed||!url.pathname.startsWith('/u/f3e7a3b1/audio/')||!url.pathname.endsWith('.mp3')||url.username||url.password)throw Error('Unapproved source address: '+src.id);
}
async function download(url){
 const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),20000);
 try{
  const response=await fetch(url,{signal:ctl.signal,redirect:'error'});
  if(!response.ok)throw Error(`Download HTTP ${response.status}`);
  const size=Number(response.headers.get('content-length'));
  if(size>20*1024*1024)throw Error('Oversized recording');
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<128||bytes.length>20*1024*1024)throw Error('Invalid recording byte size');
  return bytes;
 }finally{clearTimeout(timer)}
}
async function main(){
 const target=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-maureen-voice1-'));
 try{
  // Fetch conservatively; fail the entire operation rather than marking unverified files as recorded.
  for(let i=0;i<sources.recordings.length;i++){
   const a=sources.recordings[i],filename=path.join(target,a.id+'.mp3');
   let data;
   for(let retry=0;retry<3;retry++){
    try{data=await download(a.url);break}
    catch(error){if(retry===2)throw Error(`Cannot retrieve ${a.id}: ${error.message}`);await new Promise(r=>setTimeout(r,750*(retry+1)))}
   }
   fs.writeFileSync(filename,data,{flag:'wx',mode:0o600});
   if((i+1)%10===0)console.log(`Downloaded ${i+1}/60 approved clips`);
  }
  const checked=importAudio({root,inputDir:target,dryRun:true});
  if(checked.found!==60)throw Error('Could not verify all 60 source MP3 files');
  const result=importAudio({root,inputDir:target});
  const audit=check({root});
  if(result.converted!==60||audit.recorded!==60||audit.problems.length)throw Error('Post-import audit not clean');
  console.log(JSON.stringify({imported:result.converted,recorded:audit.recorded,remaining:audit.remaining},null,2));
 }finally{fs.rmSync(target,{recursive:true,force:true})}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});