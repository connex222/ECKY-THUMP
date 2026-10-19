from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
content=root/'server/content.js';text=content.read_text()
assert "require('./packs/after-dark-v09.json')" not in text
needle='module.exports = { cardPrompts, witPrompts, contextPrompts, doublePrompts, finalPrompts, seedFallbacks, responses, contract, getPool };'
assert needle in text
text=text.replace(needle,"""// Curated editorial draft: 1,200 ORIGINAL additions, grouped by challenge and rating.
// All text is stored locally. No scraped or third-party licensed card decks.
const expansion=require('./packs/after-dark-v09.json');
const finalWords={clean:['custard','pigeon','marmalade','banjo','wombat','toaster','rubber duck','traffic cone'],cheeky:[],adult:[]};
const contracts={clean:[contract],cheeky:[],adult:[]};
const buckets={cardPrompts,witPrompts,contextPrompts,doublePrompts,finalPrompts,responses,finalWords,contracts};
for (const item of expansion.entries) {
  const pool=buckets[item.kind];
  if (!pool || !pool[item.rating] || !item.text || !item.id) throw Error('Invalid expansion content '+item.id);
  pool[item.rating].push(item.text);
}
module.exports = { cardPrompts, witPrompts, contextPrompts, doublePrompts, finalPrompts, seedFallbacks, responses, finalWords, contracts, expansion, contract, getPool };""")
content.write_text(text)

game=root/'server/game.js';g=game.read_text()
g=g.replace('responses, contract, getPool }','responses, finalWords, contracts, getPool }')
needle='function promptFrom(room, pool) {'
assert needle in g
additional="""// One shuffled response deck per private room. Refill only after exhaustion,
// excluding cards already dealt in the current round. Keeps every player's
// private hand disjoint even at the shuffle boundary.
function drawResponses(room, count) {
  const pool=getPool(responses,room.config.rating);
  if (pool.length<count) throw Error(`Content pool needs ${count} unique response cards.`);
  if (!room.responseDeck) room.responseDeck=mix([...new Set(pool)]);
  const drawn=[];
  while (drawn.length<count) {
    if (!room.responseDeck.length) room.responseDeck=mix(pool.filter(text=>!drawn.includes(text)));
    const text=room.responseDeck.shift();
    if (text&&!drawn.includes(text)) drawn.push(text);
  }
  room.responseDealt=(room.responseDealt||0)+count;
  return drawn;
}
"""
g=g.replace(needle,additional+needle)
g=g.replace('revision:1, promptHistory:new Set(), results:[], events:new Set(), reports:[], finishedAt:null,','revision:1, promptHistory:new Set(), responseDeck:null, responseDealt:0, results:[], events:new Set(), reports:[], finishedAt:null,')
old="""  if (type==='CARD'||type==='DOUBLE') {
    const pool=mix(getPool(responses,rating));
    for(const p of room.players) {
      const count=type==='CARD'?7:5;
      const offset=p.joined*count;
      const hand=pool.slice(offset,offset+count);
      if(hand.length<count) {
        for(const item of mix(getPool(responses,rating))) if(!hand.includes(item)&&hand.length<count)hand.push(item);
      }
      hands[p.id]=hand.map((text,i)=>({id:hash(`${room.code}:${room.roundIndex}:${p.id}:${i}:${text}`).slice(0,18),text}));
    }
  }
  const stage=type==='CONTEXT'?'SEED':'SUBMIT';
  const requiredWord=type==='FINAL'?randomPick(['custard','pigeon','marmalade','banjo','wombat','toaster','rubber duck','traffic cone']):null;
  room.round={id:randomId(),type,prompt,contract:requiredWord?`Your answer MUST contain: ${requiredWord.toUpperCase()}`:type==='WIT'&&room.roundIndex>1?contract:null,requiredWord,
"""
new="""  if (type==='CARD'||type==='DOUBLE') {
    const count=type==='CARD'?7:5;
    const allCards=drawResponses(room,room.players.length*count);
    for(let pos=0;pos<room.players.length;pos++) {
      const p=room.players[pos],hand=allCards.slice(pos*count,(pos+1)*count);
      hands[p.id]=hand.map((text,i)=>({id:hash(`${room.code}:${room.roundIndex}:${p.id}:${i}:${text}`).slice(0,18),text}));
    }
  }
  const stage=type==='CONTEXT'?'SEED':'SUBMIT';
  const requiredWord=type==='FINAL'?promptFrom(room,getPool(finalWords,rating)):null;
  const contractText=requiredWord?`Your answer MUST contain: ${requiredWord.toUpperCase()}`:
    type==='WIT'?promptFrom(room,getPool(contracts,rating)):null;
  room.round={id:randomId(),type,prompt,contract:contractText,requiredWord,
"""
assert old in g
#g preserves existing system/rules

g=g.replace(old,new)
old='room.promptHistory=new Set();room.results=[];room.reports=[];room.finishedAt=null;'
assert old in g
g=g.replace(old,"// Retain prompt history and undrawn response cards between matches in this room.\n  room.results=[];room.reports=[];room.finishedAt=null;")
game.write_text(g)

for rel in ['README.md','READ-ME-FIRST.md','docs/CHANGES_v0.8.md','public/assets/app.js','public/assets/tv.js']:
 p=root/rel
 if p.exists():p.write_text(p.read_text().replace('v0.8','v0.9'))
p=root/'package.json';pkg=json.loads(p.read_text());pkg['version']='0.9.0';pkg['description']='ECKEY THUMP private games night with 1,200 original Cheeky/Adult-heavy comedy entries and no-repeat shuffle decks';p.write_text(json.dumps(pkg,indent=2)+'\n')
