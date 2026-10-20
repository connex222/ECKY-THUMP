'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const game=require('./game');
const {qrSVG}=require('./qr');
const ROOT=path.resolve(__dirname,'../public');
const rooms=new Map();
const connections=new Map();
const allowed='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const port=Number(process.env.PORT||3000);
const mime={'.ogg':'audio/ogg','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const RATE_WINDOW=60000, perIp=new Map();
function code() {let str='';for(let i=0;i<6;i++)str+=allowed[crypto.randomInt(allowed.length)];return str;}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function bad(res,error,status=400){send(res,status,{error:error.message||String(error)});}
function touch(room){room.lastActivity=Date.now();}
function broadcast(room) {
  const channels=connections.get(room.code);
  if(!channels)return;
  for(const channel of channels) {
    try{channel.res.write(`event: snapshot\ndata: ${JSON.stringify(game.snapshot(room,channel.viewerId,channel.tv))}\n\n`);}catch(_){channels.delete(channel);}
  }
}
function getRoom(code){const room=rooms.get(code);if(!room)throw Error('Room not found. Check the six-letter code.');return room;}
function credentials(req,room) {
  const auth=req.headers.authorization || '';
  if (!auth.startsWith('Bearer '))return null;
  const secret=auth.slice(7);
  const player=game.findPlayer(room,secret);
  if(player)return {player,tv:false,audience:null};
  const audience=game.findAudience(room,secret);
  if(audience)return {player:null,tv:false,audience};
  if(game.verifyDisplay(room,secret))return {player:null,tv:true,audience:null};
  return null;
}
function authorize(req,room){const who=credentials(req,room);if(!who)throw Error('This room session has expired or is invalid. Please join again.');return who;}
function host(who,room){if(!who.player || who.player.id!==room.ownerId)throw Error('Only the host can do that.');}
function readJSON(req) {return new Promise((resolve,reject)=>{
  let body=''; req.on('data',data=>{body+=data;if(Buffer.byteLength(body)>12000){reject(Error('The request is too large.'));req.destroy();}});
  req.on('end',()=>{try{resolve(body?JSON.parse(body):{});}catch(_){reject(Error('Invalid JSON.'));}});
  req.on('error',reject);
});}
function readBodyOrEmpty(req){return readJSON(req).catch(err=>{throw err;});}
function cleanRate(ip){const now=Date.now();const it=perIp.get(ip)||{start:now,count:0};if(now-it.start>RATE_WINDOW){it.start=now;it.count=0;}it.count++;perIp.set(ip,it);return it.count<=180;}
function requireOrigin(req) {
  const origin=req.headers.origin;
  if(!origin)return;
  let host;
  try{host=new URL(origin).host;}catch(_){throw Error('Invalid request origin.');}
  if(host!==req.headers.host)throw Error('Cross-origin requests are not permitted.');
}
function route(req,res) {
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  const pathname=url.pathname;
  if(pathname==='/api/health'&&req.method==='GET')return send(res,200,{status:'ok',service:'ECKEY THUMP',version:'1.3.0',uptime:process.uptime()});
  if(pathname==='/api/rooms'&&req.method==='POST')return (async()=>{
    requireOrigin(req);const body=await readBodyOrEmpty(req);
    const created=game.newRoom(body);let c;do{c=code();}while(rooms.has(c));created.room.code=c;
    rooms.set(c,created.room);touch(created.room);
    send(res,201,{code:c,seatId:created.id,secret:created.secret});
  })();
  const match=pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|snapshot|events|display-token|action|join-qr.svg))?$/);
  if(match){const room=getRoom(match[1]),endpoint=match[2];
    if(endpoint==='join'&&req.method==='POST')return (async()=>{
      requireOrigin(req);const body=await readBodyOrEmpty(req);
      // Full lobbies and matches accept viewers as audience, without stealing a player's seat.
      const participant=(room.phase==='LOBBY'&&room.players.length<12)
        ?game.addPlayer(room,body.name,body.adultConfirmed,body.avatar)
        :game.addAudience(room,body.name,body.adultConfirmed);
      touch(room);send(res,201,{code:room.code,seatId:participant.id,secret:participant.secret,role:participant.role||'player'});broadcast(room);
    })();
    if(endpoint==='join-qr.svg'&&req.method==='GET'){
      const protocol=req.headers['x-forwarded-proto']==='https'?'https':'http';
      const link=`${protocol}://${req.headers.host}/join/?room=${encodeURIComponent(room.code)}`;
      const svg=qrSVG(link);res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store'});res.end(svg);return;
    }
    if(endpoint==='snapshot'&&req.method==='GET') {
      const who=authorize(req,room);return send(res,200,game.snapshot(room,who.player?.id||who.audience?.id,who.tv));
    }
    if(endpoint==='events'&&req.method==='GET'){
      const who=authorize(req,room);
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
      res.write(': connected\n\n');
      const channel={res,viewerId:who.player?.id||who.audience?.id,tv:who.tv};
      if(!connections.has(room.code))connections.set(room.code,new Set());
      connections.get(room.code).add(channel);
      if(who.player)who.player.online=true;
      if(who.audience)who.audience.online=true;
      res.write(`event: snapshot\ndata: ${JSON.stringify(game.snapshot(room,channel.viewerId,channel.tv))}\n\n`);
      broadcast(room);
      const timer=setInterval(()=>{try{res.write(': heartbeat\n\n');}catch(_){res.end();}},18000);
      req.on('close',()=>{
        clearInterval(timer);const channels=connections.get(room.code);channels?.delete(channel);
        const participant=who.player||who.audience;
        if(participant) {
          const still=channels&&[...channels].some(ch=>ch.viewerId===participant.id);
          participant.online=!!still;broadcast(room);
        }
      });
      return;
    }
    if(endpoint==='display-token'&&req.method==='POST') {
      requireOrigin(req);const who=authorize(req,room);host(who,room);
      const secret=game.mintDisplay(room);touch(room);return send(res,200,{secret});
    }
    if(endpoint==='action'&&req.method==='POST')return (async()=>{
      requireOrigin(req);const who=authorize(req,room);
      const p=who.player,body=await readBodyOrEmpty(req);
      if(typeof body.type!=='string')throw Error('Missing action type.');
      // The host-minted TV link may only change the lobby content switch.
      // All participants must have consented individually before Adult mode is permitted.
      if(who.tv){if(body.type!=='set-lobby-rating')throw Error('Television controls cannot play the game.');
        game.setLobbyRating(room,body.rating);touch(room);send(res,200,{ok:true,revision:room.revision});broadcast(room);return;}
      if(who.audience){
        if(body.type==='adult-consent')game.consentAfterDark(room,who.audience);
        else if(body.type==='chaos')game.audienceChaos(room,who.audience,body.kind,body.targetId);
        else if(body.type==='chaos-vote')game.audienceVote(room,who.audience,body.modifier);
        else throw Error('Audience members can only heckle, vote on chaos, and confirm age.');
        touch(room);send(res,200,{ok:true,revision:room.revision});broadcast(room);return;
      }
      switch(body.type) {
        case 'avatar':game.setAvatar(room,p,body.avatar);break;
        case 'adult-consent':game.consentAfterDark(room,p);break;
        case 'set-lobby-rating':host(who,room);game.setLobbyRating(room,body.rating);break;
        case 'start':host(who,room);game.startGame(room);break;
        case 'play-again':host(who,room);game.playAgain(room);break;
        case 'remove-player': {
          host(who,room);const removed=game.removePlayer(room,body.playerId);
          // Existing streams authenticated before removal must not keep receiving room data.
          const channels=connections.get(room.code);
          for(const channel of channels||[])if(channel.viewerId===removed){channel.res.end();channels.delete(channel);}
          break;
        }
        case 'seed':game.acceptSeed(room,p,body.value);break;
        case 'swap-card':game.swapCard(room,p,body.cardId);break;
        case 'submit':game.acceptAnswer(room,p,body.value);break;
        case 'vote':game.acceptVote(room,p,body.gold,body.silver);break;
        case 'ready-next':game.markReady(room,p);break;
        case 'next':host(who,room);game.nextRound(room);break;
        case 'skip':host(who,room);if(!['SEED','SUBMIT','VOTE'].includes(room.phase))throw Error('Nothing to skip.');game.finishRound(room,'Round skipped by host.');break;
        case 'report': {
          if(room.phase!=='VOTE')throw Error('Reports are available while submissions are being voted on.');
          const entry=room.round.entries.find(e=>e.id===body.entryId&&!e.hidden);
          if(!entry)throw Error('Answer not available.');
          if(room.reports.filter(x=>x.by===p.id && x.roundId===room.round.id).length>=3)throw Error('Report limit reached for this round.');
          room.reports.push({by:p.id,roundId:room.round.id,entryId:entry.id,at:Date.now(),reason:'inappropriate answer'});
          break;
        }
        case 'hide': {
          host(who,room);if(room.phase!=='VOTE')throw Error('You can only hide entries before scoring.');
          const entry=room.round.entries.find(e=>e.id===body.entryId&&!e.hidden);
          if(!entry)throw Error('Answer not available.');entry.hidden=true;room.round.ballots.clear();
          if(room.round.entries.filter(e=>!e.hidden).length<3)game.finishRound(room,'Too few safe entries to score.');
          else {room.deadline=Date.now()+45000;room.revision++;}
          break;
        }
        case 'pause': {
          host(who,room);if(room.paused || !['SEED','SUBMIT','VOTE'].includes(room.phase) || room.pauses>=3)throw Error('Pause unavailable (maximum three per match).');
          room.pauseRemaining=Math.max(1000,room.deadline-Date.now());room.paused=true;room.deadline=null;room.pauses++;room.revision++;break;
        }
        case 'resume':{
          host(who,room);if(!room.paused)throw Error('The game is not paused.');
          room.deadline=Date.now()+room.pauseRemaining;room.paused=false;room.pauseRemaining=null;room.revision++;break;
        }
        default:throw Error('Unknown action.');
      }
      touch(room);send(res,200,{ok:true,revision:room.revision});broadcast(room);
    })();
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed.'});
  const requestPath=pathname==='/'?'/index.html':pathname==='/join'||pathname==='/join/'?'/index.html':pathname==='/tv'||pathname==='/tv/'?'/tv/index.html':pathname;
  const file=path.resolve(ROOT,'.'+requestPath);
  if(!file.startsWith(ROOT+path.sep))return send(res,403,{error:'Forbidden.'});
  try{if(!fs.statSync(file).isFile())throw Error();}catch(_){return send(res,404,{error:'File not found.'});}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':requestPath.endsWith('.html')?'no-cache':'public,max-age=1800'});
  if(req.method==='HEAD'){res.end();return;}
  fs.createReadStream(file).pipe(res);
}
const server=http.createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if(!cleanRate(req.socket.remoteAddress||'unknown'))return send(res,429,{error:'Too many requests. Try again shortly.'});
  Promise.resolve().then(()=>route(req,res)).catch(err=>{if(!res.headersSent)bad(res,err,err.message.startsWith('This room session')?401:400);else res.end();});
});
const timer=setInterval(()=>{
  const now=Date.now();
  for(const [c,room] of rooms){
    if(game.tick(room))broadcast(room);
    if(now-room.lastActivity>6*60*60*1000){for(const ch of connections.get(c)||[])ch.res.end();connections.delete(c);rooms.delete(c);}
  }
  for(const [key,value] of perIp)if(now-value.start>2*RATE_WINDOW)perIp.delete(key);
},300);
server.on('close',()=>clearInterval(timer));
if(require.main===module)server.listen(port,'0.0.0.0',()=>console.log(`ECKEY THUMP Game Night v1.3 running at http://localhost:${port}`));
module.exports={server,rooms};
