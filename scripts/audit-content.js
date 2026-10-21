'use strict';
/** Editorial lint is deliberately strict about identifiers and duplication,
 * but does not auto-approve or auto-rewrite jokes or sensitive adult content.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const entries=JSON.parse(fs.readFileSync(path.join(root,'server/packs/after-dark-v09.json'),'utf8')).entries;
const cardPack=JSON.parse(fs.readFileSync(path.join(root,'server/packs/game-cards-v1.json'),'utf8')).cards;
const ids=new Set(), phrases=new Set();
const issues=[];
const editorial={};
const forbidden=/\b(?:favorite|favorites|colorful|neighbor|neighbors|neighborhood|humor|apologize|organize|organizer|realize|traveling|traveler|canceling|canceled|defense|toward)\b/i;
for(const entry of entries){
  if(ids.has(entry.id))issues.push(`Repeated entry ID: ${entry.id}`);
  ids.add(entry.id);
  if(typeof entry.text!=='string'||entry.text.trim().length<2)issues.push(`Empty or short text: ${entry.id}`);
  if(typeof entry.text==='string'&&forbidden.test(entry.text))issues.push(`UK English candidate: ${entry.id}`);
  const key=`${entry.kind}:${entry.rating}:${String(entry.text).toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu,' ').trim()}`;
  if(phrases.has(key))issues.push(`Repeated text in rating and challenge: ${entry.id}`);
  phrases.add(key);
  editorial[entry.editorialStatus||'unmarked']=(editorial[entry.editorialStatus||'unmarked']||0)+1;
}
const byTier={};for(const card of cardPack){byTier[card.tier]=(byTier[card.tier]||0)+1;}
if(entries.length!==1200)issues.push(`Expected 1,200 content entries, found ${entries.length}`);
if(cardPack.length!==15||Object.values(byTier).some(x=>x!==5))issues.push('Game Card tiers must contain five cards each');
const report={contentEntries:entries.length,uniqueIds:ids.size,exactUniqueTieredText:phrases.size,editorial,gameCardTiers:byTier,issueCount:issues.length,issues};
console.log(JSON.stringify(report,null,2));
if(issues.length)process.exitCode=1;
