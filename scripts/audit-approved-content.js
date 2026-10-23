'use strict';
const c=require('../server/content');
const result={approved:c.approvedPack.entries.length,byType:{},premiumContentOnly:/^(?:1|true)$/i.test(process.env.PREMIUM_CONTENT_ONLY||''),originalSourceEntries:c.expansion.entries.length};
for(const e of c.approvedPack.entries){const key=e.rating+'/'+e.kind;result.byType[key]=(result.byType[key]||0)+1;}
if(result.approved!==850||result.originalSourceEntries!==1200)throw Error('Unexpected approved or source catalogue size.');
const imported=c.approvedPack.entries.filter(e=>e.id.startsWith('etsc-more-'));
if(imported.length!==200||new Set(imported.map(e=>e.sourceId)).size!==200)throw Error('Unexpected newly imported card count or ID clash');
if(!imported.every(e=>e.editorialStatus==='approved'))throw Error('New entries must be approved');
result.additionalImported=imported.length;
console.log(JSON.stringify(result,null,2));
