'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'public/assets/social-club-phone.js'),'utf8');
function controller(){const sandbox={window:{ECKEY_AVATARS:[]},Intl,navigator:{}};
  vm.runInNewContext(src,sandbox);return sandbox.window.ECKY_SOCIAL_PHONE;}
function lobby(role='host'){
 const host=role==='host',userId=host?'h':'p';
 const card={id:'k',authorId:'p',authorName:'Pat',text:'My nan and the bingo prize'};
 return {mode:'social-club-v2',code:'ABC123',phase:'LOBBY',players:[{id:'h',name:'Host',score:0,online:true},{id:'p',name:'Pat',score:0,online:true},{id:'o',name:'Mate',score:0,online:true}],
 config:{rating:'clean',length:'quick',pace:'relaxed',houseCards:true},you:{id:userId,name:host?'Host':'Pat',role:'player',isHost:host},
 houseCards:{enabled:true,limit:5,total:1,yours:host?[]:[{id:card.id,text:card.text}],moderation:host?[card]:[]}};
}
test('phone lobby offers opt-in House Cards, writing and per-card moderation without a tray',()=>{
 const ui=controller();const hostHtml=ui.render(lobby('host'));
 assert.match(hostHtml,/ENABLE HOUSE CARDS|TURN HOUSE CARDS OFF/);
 assert.match(hostHtml,/HOST REVIEW/);
 assert.match(hostHtml,/data-club-action="remove-house-card"/);
 assert.match(hostHtml,/club-house-text/);
 assert.match(hostHtml,/ADD HOUSE CARD/);
 assert.doesNotMatch(hostHtml,/POWER-UPS TRAY/);
 const member=ui.render(lobby('member'));
 assert.match(member,/My nan and the bingo prize/);
 assert.doesNotMatch(member,/HOST REVIEW/);
 assert.doesNotMatch(member,/toggle-house-cards/);
});
test('host and contestant views HTML-escape user-supplied data',()=>{
 const ui=controller();const s=lobby('host');s.houseCards.moderation[0].text='<img src=x onerror=alert(1)>';
 const result=ui.render(s);
 assert.match(result,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.doesNotMatch(result,/<img src=x onerror=/);
});
test('room-only House Cards are not rendered during live match phases',()=>{
 const ui=controller();const s=lobby('member');s.phase='ROUND_INTRO';s.roundNumber=1;s.totalRounds=3;s.title='THE MEAT RAFFLE';
 const html=ui.render(s);
 assert.doesNotMatch(html,/My nan and the bingo prize/);
 assert.doesNotMatch(html,/club-house-text/);
});
