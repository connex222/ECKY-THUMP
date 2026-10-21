'use strict';
// Editorial triage, never an automatic joke approval or moderation system.
const fs=require('node:fs');
const path=require('node:path');
const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../server/packs/after-dark-v09.json'),'utf8')).entries;
const args=new Set(process.argv.slice(2));
const opening=new Map();
const normalise=text=>String(text||'').toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
for(const e of entries){
  const key=[e.kind,e.rating,normalise(e.text).split(' ').slice(0,4).join(' ')].join('|');
  opening.set(key,(opening.get(key)||0)+1);
}
const priority={adult:0,cheeky:1,clean:2};
const queue=entries.map(e=>{
  const key=[e.kind,e.rating,normalise(e.text).split(' ').slice(0,4).join(' ')].join('|');
  const flags=[];
  if((opening.get(key)||0)>=3)flags.push('repeated-opening');
  if(e.kind==='responses'&&e.text.length>90)flags.push('long-response');
  if(e.kind!=='finalWords'&&e.text.length<12)flags.push('very-short');
  if(/\b(?:TODO|TBD|PLACEHOLDER)\b/i.test(e.text))flags.push('placeholder-candidate');
  return {id:e.id,kind:e.kind,rating:e.rating,status:e.editorialStatus||'unmarked',flags};
}).sort((a,b)=>(priority[a.rating]??9)-(priority[b.rating]??9)||b.flags.length-a.flags.length||a.id.localeCompare(b.id));
const totals={},flags={},byRating={};
for(const item of queue){
  totals[item.status]=(totals[item.status]||0)+1;
  byRating[item.rating]=(byRating[item.rating]||0)+1;
  for(const flag of item.flags)flags[flag]=(flags[flag]||0)+1;
}
const outstanding=queue.filter(item=>item.status!=='approved');
const report={total:entries.length,status:totals,byRating,flags,awaitingApproval:outstanding.length,
  note:'Heuristics identify review candidates, not offensive or unfunny content. Every draft needs human sign-off.',
  reviewQueue:args.has('--all')?outstanding:outstanding.slice(0,25)};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(args.has('--fail-on-drafts')&&outstanding.length)process.exitCode=1;
