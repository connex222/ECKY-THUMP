#!/usr/bin/env node
'use strict';
/**
 * Private, zero-npm-dependency audio pipeline for Our Maureen's 60 lines.
 * No generation, recording, uploads or paid services. Invoked by a human only
 * after the voice actor has supplied sound files they are authorised to use.
 */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const DEFAULT_ROOT=path.resolve(__dirname,'..');
const EXTENSIONS=new Set(['.wav','.mp3','.flac','.m4a','.ogg']);
const ID=/^maureen-[a-z0-9-]+-\d{2}$/;
const MAX_SOURCE_BYTES=20*1024*1024;
const MAX_OGG_BYTES=2*1024*1024;
const MAX_DURATION_SEC=20;
function requiredFiles(root){return [path.join(root,'server/packs/voice-lines.json'),path.join(root,'public/assets/voice-lines.json')];}
function validateManifest(root){
  const [privateFile,publicFile]=requiredFiles(root);
  const privateManifest=JSON.parse(fs.readFileSync(privateFile,'utf8'));
  const publicManifest=JSON.parse(fs.readFileSync(publicFile,'utf8'));
  if(JSON.stringify(privateManifest)!==JSON.stringify(publicManifest))throw Error('The two voice-line manifests disagree. Correct both first.');
  if(privateManifest.schemaVersion!==1||privateManifest.language!=='en-GB'||privateManifest.lines?.length!==60)throw Error('Unexpected 60-line UK English manifest.');
  const ids=new Set();
  for(const line of privateManifest.lines){
    if(!ID.test(line.id)||ids.has(line.id)||line.audio!==`/assets/audio/maureen/${line.id}.ogg`||typeof line.recorded!=='boolean')throw Error(`Invalid or repeated recording identifier: ${line.id}`);
    ids.add(line.id);
  }
  return privateManifest;
}
function runBinary(binary,args){
  const result=cp.spawnSync(binary,args,{encoding:'utf8',timeout:90000,maxBuffer:1024*1024,windowsHide:true});
  if(result.error)throw Error(`${binary} could not run (${result.error.code||'FAILED'}). Install FFmpeg and ensure it is on PATH.`);
  if(result.status!==0)throw Error(`${binary} could not process audio: ${(result.stderr||'').trim().slice(0,350)}`);
  return result.stdout;
}
function probe(file){
  const out=runBinary(process.env.FFPROBE_BIN||'ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,channels','-of','json',file]);
  const metadata=JSON.parse(out);
  const audio=(metadata.streams||[]).filter(x=>x.codec_type==='audio');
  const duration=Number(metadata.format?.duration);
  if(audio.length!==1||!Number.isFinite(duration)||duration<0.15||duration>MAX_DURATION_SEC)throw Error(`Expected one recording 0.15–20 seconds long: ${path.basename(file)}`);
  return {duration,codec:audio[0].codec_name,channels:audio[0].channels};
}
function check({root=DEFAULT_ROOT}={}){
  const manifest=validateManifest(root);
  const dir=path.join(root,'public/assets/audio/maureen');
  const present=[],unrecorded=[],problems=[];
  for(const line of manifest.lines){
    const filename=path.join(dir,`${line.id}.ogg`);
    if(!line.recorded){unrecorded.push(line.id);continue;}
    try{
      if(!fs.existsSync(filename)||!fs.statSync(filename).isFile()||fs.statSync(filename).size>MAX_OGG_BYTES)throw Error('Missing, oversized, or invalid audio file');
      if(fs.readFileSync(filename).subarray(0,4).toString('ascii')!=='OggS')throw Error('Not an Ogg container');
      const info=probe(filename);
      if(!['opus','vorbis'].includes(info.codec)||info.channels!==1)throw Error('Expected mono Ogg Opus/Vorbis audio');
      present.push(line.id);
    }catch(error){problems.push({id:line.id,reason:error.message});}
  }
  return {total:manifest.lines.length,recorded:present.length,remaining:unrecorded.length,problems};
}
function importAudio({root=DEFAULT_ROOT,inputDir,dryRun=false}={}){
  if(!inputDir)throw Error('Supply a recording folder. Example: npm run audio:import -- C:\\recordings\\maureen');
  const manifest=validateManifest(root),directory=path.resolve(inputDir);
  if(!fs.statSync(directory).isDirectory())throw Error('Recording source must be a folder.');
  const supported=fs.readdirSync(directory).filter(x=>EXTENSIONS.has(path.extname(x).toLowerCase()));
  const filesById=new Map(),validIds=new Set(manifest.lines.map(x=>x.id));
  for(const file of supported){
    const id=path.parse(file).name;
    if(!validIds.has(id))throw Error(`Unknown filename ${file}. Rename it to one of the 60 IDs from VOICE-LINES.md.`);
    if(filesById.has(id))throw Error(`Two recordings were supplied for ${id}. Keep only one per ID.`);
    const absolute=path.join(directory,file),stat=fs.lstatSync(absolute);
    if(!stat.isFile()||stat.size>MAX_SOURCE_BYTES||stat.size<128)throw Error(`Not a usable recording: ${file}`);
    filesById.set(id,absolute);
  }
  if(!filesById.size)throw Error('No matching .wav, .mp3, .flac, .m4a or .ogg voice recordings were found.');
  const plan=[...filesById].map(([id,filename])=>({id,source:path.basename(filename),...probe(filename)}));
  if(dryRun)return {mode:'dry-run',found:plan.length,clips:plan,updated:false};
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-maureen-audio-'));
  const target=path.join(root,'public/assets/audio/maureen');
  const [privateFile,publicFile]=requiredFiles(root);
  const backup=[fs.readFileSync(privateFile,'utf8'),fs.readFileSync(publicFile,'utf8')];
  let manifestsUpdated=false;
  try{
    for(const item of plan){
      const src=filesById.get(item.id),out=path.join(temp,`${item.id}.ogg`);
      runBinary(process.env.FFMPEG_BIN||'ffmpeg',[
        '-nostdin','-v','error','-y','-i',src,'-vn','-map','0:a:0',
        '-af','highpass=f=75,lowpass=f=12000,loudnorm=I=-18:TP=-2:LRA=11',
        '-ac','1','-ar','48000','-c:a','libopus','-b:a','64k','-f','ogg',out
      ]);
      const stat=fs.statSync(out),info=probe(out);
      if(stat.size>MAX_OGG_BYTES||stat.size<128||info.codec!=='opus'||info.channels!==1||fs.readFileSync(out).subarray(0,4).toString('ascii')!=='OggS')throw Error(`Invalid converted audio: ${item.id}`);
    }
    // All sources must be valid BEFORE any published flags can be changed.
    fs.mkdirSync(target,{recursive:true});
    for(const item of plan){
      const out=path.join(target,`${item.id}.ogg`),stage=out+`.${crypto.randomBytes(4).toString('hex')}.tmp`;
      fs.copyFileSync(path.join(temp,`${item.id}.ogg`),stage);
      fs.renameSync(stage,out);
    }
    const ids=new Set(filesById.keys());
    for(const line of manifest.lines)if(ids.has(line.id))line.recorded=true;
    const json=JSON.stringify(manifest,null,2)+'\n';
    for(const file of [privateFile,publicFile]){
      const tmp=file+`.${crypto.randomBytes(4).toString('hex')}.tmp`;
      fs.writeFileSync(tmp,json,'utf8');fs.renameSync(tmp,file);
    }
    manifestsUpdated=true;
    const audit=check({root});
    if(audit.problems.length)throw Error('The audio audit failed after importing: '+JSON.stringify(audit.problems));
    return {mode:'import',converted:plan.length,recorded:audit.recorded,remaining:audit.remaining,clips:plan.map(x=>x.id)};
  }catch(error){
    if(!manifestsUpdated){for(let i=0;i<2;i++)fs.writeFileSync([privateFile,publicFile][i],backup[i]);}
    throw error;
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
function cli(argv=process.argv.slice(2)){
  const command=argv[0];
  if(command==='--check'){
    const result=check();console.log(JSON.stringify(result,null,2));if(result.problems.length)process.exitCode=1;
  }else if(command==='--import'||command==='--dry-run'){
    try{console.log(JSON.stringify(importAudio({inputDir:argv[1],dryRun:command==='--dry-run'}),null,2));}
    catch(error){console.error(error.message);process.exitCode=1;}
  }else {console.error('Usage: node scripts/import-maureen-audio.js --check | --dry-run FOLDER | --import FOLDER');process.exitCode=2;}
}
if(require.main===module)cli();
module.exports={validateManifest,probe,check,importAudio,cli};
