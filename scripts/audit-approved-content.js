'use strict';
const c=require('../server/content');
const result={approved:c.approvedPack.entries.length,byType:{},premiumContentOnly:/^(?:1|true)$/i.test(process.env.PREMIUM_CONTENT_ONLY||''),originalSourceEntries:c.expansion.entries.length};
for(const e of c.approvedPack.entries){const key=e.rating+'/'+e.kind;result.byType[key]=(result.byType[key]||0)+1;}
if(result.approved!==650||result.originalSourceEntries!==1200)throw Error('Unexpected approved or source catalogue size.');
console.log(JSON.stringify(result,null,2));
