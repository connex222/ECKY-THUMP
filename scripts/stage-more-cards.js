'use strict';
/**
 * Review-only local import for ECKY THUMP CSV uploads. Never changes a playable
 * pack, never approves new wording and never exports it into public assets.
 * node scripts/stage-more-cards.js CARDS.csv MODES.csv OUTPUT_DIR
 */
const fs = require('node:fs');
const path = require('node:path');
const {parseCSV, normalise} = require('./stage-party-csv');
const root=path.resolve(__dirname,'..');
const DECKS={'Family-friendly':'clean','Cheeky':'cheeky','Very adult':'adult'};
const ordinaryHeaders=['id','deck','card_type','text','pick'];
const modeHeaders=['id','deck','kind','text'];
const modes=new Set(['witPrompts','contextPrompts','doublePrompts','finalPrompts','finalWords','contracts']);
const flagBrands=/\b(?:WhatsApp|Facebook|IKEA|Tinder|Amazon|OnlyFans|Ann Summers|Love Island|Netflix|Lidl|Red Bull|Countdown|Asda|eBay|Greggs|TikTok|Instagram)\b/i;
const stripBOM=s=>s.replace(/^\uFEFF/,'');
const opening=s=>normalise(s).split(' ').slice(0,4).join(' ');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escapeCSV=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
function readRows(filename, headers){
  const parsed=parseCSV(stripBOM(fs.readFileSync(filename,'utf8')));
  if(!parsed.length||JSON.stringify(parsed[0])!==JSON.stringify(headers))throw Error(`Bad header in ${filename}; expected ${headers.join(',')}`);
  return parsed.slice(1).map((row,index)=>{
    if(row.length!==headers.length)throw Error(`${filename}: row ${index+2} contains ${row.length} columns, expected ${headers.length}`);
    return Object.fromEntries(headers.map((h,i)=>[h,row[i]]));
  });
}
function obtainSources(input){
 const allApproved=JSON.parse(fs.readFileSync(path.join(input,'server/packs/social-club-approved-v1.json'),'utf8')).entries;
 // Previously imported cards must not count as duplicates of their own source CSV.
 const previouslyImported=allApproved.filter(e=>e.id?.startsWith('etsc-more-'));
 const importedTexts=new Set(previouslyImported.map(e=>normalise(e.text)));
 const accepted=allApproved.filter(e=>!e.id?.startsWith('etsc-more-'));
 const legacy=JSON.parse(fs.readFileSync(path.join(input,'server/packs/after-dark-v09.json'),'utf8')).entries;
 const {cardPrompts,witPrompts,contextPrompts,doublePrompts,finalPrompts,responses,finalWords,contracts}=require(path.join(input,'server/content.js'));
 const pools={cardPrompts,witPrompts,contextPrompts,doublePrompts,finalPrompts,responses,finalWords,contracts};
 const byText=new Map();const byId=new Set();const openings=new Map();
 const add=(text,source,id)=>{
  const key=normalise(text); if(!key)return;
  if(!byText.has(key))byText.set(key,[]);byText.get(key).push({source,id});
  const keyFour=opening(text);openings.set(keyFour,(openings.get(keyFour)||0)+1);
 };
 for(const e of [...accepted,...legacy]){byId.add(e.id);add(e.text,e===null?'':accepted.includes(e)?'approved':'legacy',e.id)}
 for(const [kind,tiers] of Object.entries(pools)) for(const [rating,values] of Object.entries(tiers)) for(const text of values) {
   // The runtime pools also contain approved imports; ignore those exact new strings
   // when re-running a historical review from the same source files.
   if(importedTexts.has(normalise(text)))continue;
   add(text,'playable:'+kind+'/'+rating,null);
 }
 return {byText,byId,openings};
}
function stage(cardsPath,modesPath,repoRoot=root){
 const ordinary=readRows(cardsPath,ordinaryHeaders);
 const special=readRows(modesPath,modeHeaders);
 const catalogue=obtainSources(repoRoot);
 const knownSourceIds=new Set(),knownIds=new Set(),seenText=new Map(),additions=[];
 function add(item,sourceFilename){
  const {id,deck,text}=item;
  if(!/^\d{6}$/.test(id))throw Error('Expected six-digit numeric ID, found '+id);
  if(knownSourceIds.has(id))throw Error('Repeated source ID across uploads: '+id);
  knownSourceIds.add(id);
  if(!(deck in DECKS))throw Error('Unknown deck '+deck+' at '+id);
  if(!text||!text.trim()||text!==text.trim())throw Error('Empty or untrimmed text at '+id);
  let kind;
  if(sourceFilename==='party_more_cards.csv'){
    kind=item.card_type==='Answer (white)'?'responses':item.card_type==='Start (black)'?'cardPrompts':null;
    if(!kind)throw Error('Invalid ordinary card type at '+id);
    if(kind==='cardPrompts'&&item.pick!=='1')throw Error('Black card pick must be exactly 1 at '+id);
    if(kind==='responses'&&item.pick!=='')throw Error('Answer card pick must be blank at '+id);
  }else{
    kind=item.kind;
    if(!modes.has(kind))throw Error('Invalid game mode kind at '+id);
  }
  const rating=DECKS[deck],sourceId=id,finalId='etsc-more-'+id;
  if(knownIds.has(finalId)||catalogue.byId.has(finalId))throw Error('ID collision '+finalId);
  knownIds.add(finalId);
  const flags=[];
  if(kind==='responses'&&(text.length>45||/:/.test(text)))flags.push('answer-length-or-colon');
  if(kind==='cardPrompts'&&((text.match(/_____/g)||[]).length!==1||text.length>90))flags.push('prompt-blank-or-length');
  if(['witPrompts','contextPrompts','doublePrompts','finalPrompts'].includes(kind)&&text.length>90)flags.push('mode-prompt-over-90');
  if(kind==='finalWords'&&(text.length>30||/\s/.test(text)))flags.push('final-word-not-short-single-word');
  if(kind==='contracts'&&text.length>90)flags.push('contract-too-long');
  if(flagBrands.test(text))flags.push('brand-reference');
  if(rating==='clean'&&/\bcocktail\b/i.test(text))flags.push('family-drink-reference-review');
  const n=normalise(text);
  if(catalogue.byText.has(n))flags.push('duplicates-existing-content');
  if(seenText.has(n))flags.push('duplicates-other-upload');
  seenText.set(n,id);
  const entry={id:finalId,sourceId,sourceFile:sourceFilename,kind,rating,originalText:text,proposedText:text,editorialStatus:'draft',approval:'pending',licence:'unverified',reviewFlags:flags,readyToPublish:false};
  additions.push(entry);
 }
 for(const row of ordinary)add(row,'party_more_cards.csv');
 for(const row of special)add(row,'party_more_modes.csv');
 // Repeat opening should be editorially reviewed, but do not reject a draft solely
 // because legacy content repeats the same opening too often.
 const starts=new Map();for(const e of additions){const k=opening(e.proposedText);starts.set(k,(starts.get(k)||0)+1)}
 for(const e of additions){const k=opening(e.proposedText);if((starts.get(k)||0)>3||((starts.get(k)||0)>0&&(catalogue.openings.get(k)||0)+(starts.get(k)||0)>3)){
   e.reviewFlags.push('repeated-four-word-opening');
 }}
 const breakdown={};const flags={};
 for(const e of additions){const key=e.rating+'/'+e.kind;breakdown[key]=(breakdown[key]||0)+1;for(const flag of e.reviewFlags)flags[flag]=(flags[flag]||0)+1;}
 return {formatVersion:1,name:'ECKY THUMP — October 2026 additional cards (review)',status:'draft',licenceStatus:'unverified — publication rights not separately confirmed',published:false,sourceFiles:['party_more_cards.csv','party_more_modes.csv'],entries:additions,summary:{total:additions.length,ordinary:ordinary.length,modes:special.length,readyForReview:additions.length,flagged:additions.filter(x=>x.reviewFlags.length).length,clearOfAutomaticFlags:additions.filter(x=>!x.reviewFlags.length).length,byKindAndRating:breakdown,flags,approved:0,published:0}};
}
function buildReviewCsv(p){
 const headings=['source_id','new_id','source_file','rating','kind','original_text','proposed_text','review_flags','editorial_status','editor_decision'];
 const rows=p.entries.map(e=>[e.sourceId,e.id,e.sourceFile,e.rating,e.kind,e.originalText,e.proposedText,e.reviewFlags.join('; '),e.editorialStatus,'']);
 return '\uFEFF'+[headings,...rows].map(row=>row.map(escapeCSV).join(',')).join('\r\n')+'\r\n';
}
function buildReviewHtml(p){
 const rows=p.entries.map(e=>`<tr data-file="${escapeHtml(e.sourceFile)}" data-kind="${escapeHtml(e.kind)}" data-rating="${escapeHtml(e.rating)}" data-flag="${e.reviewFlags.length?'yes':'no'}"><td>${escapeHtml(e.sourceId)}</td><td>${escapeHtml(e.rating)}</td><td>${escapeHtml(e.kind)}</td><td>${escapeHtml(e.originalText)}</td><td>${escapeHtml(e.reviewFlags.length?e.reviewFlags.join(', '):'No automated flags')}</td></tr>`).join('\n');
 return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ECKY THUMP — Additional content review</title><style>:root{font:16px/1.5 system-ui,sans-serif;color:#f2e9dc;background:#171425}*{box-sizing:border-box}body{margin:0;padding:1rem}main{max-width:1400px;margin:auto}h1{font-size:clamp(1.6rem,3vw,2.5rem)}.note{border:1px solid #ab9147;background:#34283a;border-radius:8px;padding:1rem}label{display:grid;gap:.2rem}input,select{font:inherit;min-height:44px;padding:.6rem;background:#fff;color:#111;border:1px solid #756a7d;border-radius:8px}section.filters{display:flex;gap:1rem;flex-wrap:wrap;margin:1.1rem 0}table{border-collapse:collapse;width:100%;font-size:.95rem}th,td{border-bottom:1px solid #443950;padding:.7rem;text-align:left;vertical-align:top}th{background:#362a45;position:sticky;top:0}tbody tr:nth-child(even){background:#241e31}tr[hidden]{display:none}@media(max-width:700px){table{font-size:.79rem}th,td{padding:.36rem}td:nth-child(4){min-width:190px}}@media print{*{background:white!important;color:black!important}section.filters{display:none}}</style></head><body><main><h1>ECKY THUMP — Additional content</h1><p class="note"><strong>200 draft entries, not approved or published.</strong> ${p.summary.flagged} require automated-flag checks; ${p.summary.clearOfAutomaticFlags} have no automatic flags. Even clear entries require editorial and usage-rights approval. No cards have been loaded into the game.</p><section class="filters"><label>Search<input type="search" id="search" placeholder="Search all card text"></label><label>CSV source<select id="file"><option value="">Both</option><option value="party_more_cards.csv">Ordinary cards</option><option value="party_more_modes.csv">Other modes</option></select></label><label>Rating<select id="rating"><option value="">All</option><option value="clean">Family</option><option value="cheeky">Cheeky</option><option value="adult">After Dark</option></select></label><label>Flag<select id="flag"><option value="">All</option><option value="yes">Flagged</option><option value="no">No automatic flags</option></select></label></section><p id="count" aria-live="polite">200 of 200 shown</p><table><thead><tr><th>Original ID</th><th>Rating</th><th>Type</th><th>Proposed text</th><th>Editorial flags</th></tr></thead><tbody>${rows}</tbody></table></main><script>const rows=[...document.querySelectorAll('tbody tr')];const inputs=['search','file','rating','flag'].map(id=>document.getElementById(id));const update=()=>{const [text,file,rating,flag]=inputs.map(x=>x.value.toLowerCase());let visible=0;rows.forEach(row=>{const ok=(!text||row.textContent.toLowerCase().includes(text))&&(!file||row.dataset.file===file)&&(!rating||row.dataset.rating===rating)&&(!flag||row.dataset.flag===flag);row.hidden=!ok;if(ok)visible++});document.getElementById('count').textContent=visible+' of '+rows.length+' shown'};inputs.forEach(e=>e.addEventListener('input',update));update();</script></body></html>`;
}
function write(p,dir){
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'candidates.json'),JSON.stringify(p,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'editorial-ledger.csv'),buildReviewCsv(p));
 fs.writeFileSync(path.join(dir,'review.html'),buildReviewHtml(p));
 fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(p.summary,null,2)+'\n');
}
if(require.main===module){const [cards,modes,dir]=process.argv.slice(2);if(!cards||!modes||!dir){console.error('Usage: node scripts/stage-more-cards.js CARDS.csv MODES.csv OUTPUT_DIR');process.exit(2)}const pack=stage(cards,modes);write(pack,dir);console.log(JSON.stringify(pack.summary,null,2))}
module.exports={stage,write,buildReviewCsv,buildReviewHtml,readRows};
