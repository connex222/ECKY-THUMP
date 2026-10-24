'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const importer=require('../scripts/import-maureen-audio');
const root=path.resolve(__dirname,'..');
const ffmpegAvailable=cp.spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).status===0&&cp.spawnSync('ffprobe',['-version'],{encoding:'utf8'}).status===0;
const filename='maureen-lobby-01';
function temp(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecky-maureen-test-'));
 for(const p of ['server/packs','public/assets'])fs.mkdirSync(path.join(dir,p),{recursive:true});
 for(const p of ['server/packs/voice-lines.json','public/assets/voice-lines.json'])fs.copyFileSync(path.join(root,p),path.join(dir,p));
 const incoming=path.join(dir,'incoming');fs.mkdirSync(incoming);return {dir,incoming};
}
function makeWave(file){
 const rate=22050,frames=rate*1,buffer=Buffer.alloc(44+frames*2);
 buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);
 buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);
 buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);buffer.writeUInt16LE(2,32);
 buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(frames*2,40);
 for(let i=0;i<frames;i++)buffer.writeInt16LE(Math.round(7000*Math.sin(i*440*2*Math.PI/rate)),44+i*2);
 fs.writeFileSync(file,buffer);
}
test('Maureen source and public voice manifests remain identical with safe stable IDs',()=>{
 const result=importer.validateManifest(root);
 assert.equal(result.lines.length,60);
 assert.equal(new Set(result.lines.map(x=>x.id)).size,60);
 const audit=importer.check({root});assert.equal(audit.problems.length,0);
});
test('unknown and duplicate recording IDs fail before any manifest change',()=>{
 const {dir,incoming}=temp();try{
  makeWave(path.join(incoming,'maureen-impostor-01.wav'));
  assert.throws(()=>importer.importAudio({root:dir,inputDir:incoming}),/Unknown filename/);
  fs.rmSync(path.join(incoming,'maureen-impostor-01.wav'));
  makeWave(path.join(incoming,filename+'.wav'));
  fs.copyFileSync(path.join(incoming,filename+'.wav'),path.join(incoming,filename+'.mp3'));
  assert.throws(()=>importer.importAudio({root:dir,inputDir:incoming}),/Two recordings/);
  assert.equal(importer.validateManifest(dir).lines[0].recorded,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('normalises one authorised WAV to mono Ogg and atomically marks only its line recorded', {skip:!ffmpegAvailable},()=>{
 const {dir,incoming}=temp();try{
  makeWave(path.join(incoming,filename+'.wav'));
  const original=fs.readFileSync(path.join(dir,'server/packs/voice-lines.json'),'utf8');
  const plan=importer.importAudio({root:dir,inputDir:incoming,dryRun:true});
  assert.equal(plan.found,1);
  assert.equal(fs.readFileSync(path.join(dir,'server/packs/voice-lines.json'),'utf8'),original);
  const result=importer.importAudio({root:dir,inputDir:incoming});
  assert.equal(result.converted,1);assert.equal(result.recorded,1);assert.equal(result.remaining,59);
  const updated=importer.validateManifest(dir);
  assert.equal(updated.lines.filter(x=>x.recorded).length,1);
  assert.equal(updated.lines[0].recorded,true);
  const out=path.join(dir,'public/assets/audio/maureen',filename+'.ogg');
  assert.ok(fs.statSync(out).size>1000);assert.equal(fs.readFileSync(out).toString('ascii',0,4),'OggS');
  assert.equal(importer.check({root:dir}).problems.length,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
