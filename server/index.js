'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const game=require('./game');
const telemetry=require('./telemetry');
const persistence=require('./persistence');
const {qrSVG}=require('./qr');
const ROOT=path.resolve(__dirname,'../public');
const rooms=process.env.SOCIAL_CLUB_PREVIEW==='1'?persistence.restore():new Map();
const connections=new Map();
const allowed='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const port=Number(process.env.PORT||3000);
const mime={'.ogg':'audio/ogg','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const RATE_WINDOW=60000, perIp=new Map();
const creationRates=new Map(),joinRates=new Map();
function budget(map,ip,limit){const now=Date.now();const prior=map.get(ip);const entry=prior&&now-prior.start<RATE_WINDOW?prior:{start:now,count:0};entry.count++;map.set(ip,entry);if(entry.count>limit){const e=Error('Too many requests. Try again shortly.');e.statusCode=429;throw e;}}
function code() {let str='';for(let i=0;i<6;i++)str+=allowed[crypto.randomInt(allowed.length)];return str;}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function bad(res,error,status=400){send(res,status,{error:error.message||String(error)});}
function touch(room){room.lastActivity=Date.now();}
function broadcast(room) {
  if(room.config.socialClub)persistence.store(room);
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
  let size=0,done=false;const chunks=[];
  const fail=err=>{if(done)return;done=true;req.resume();reject(err);};
  // Do not tear down the socket when a payload is too large: return HTTP 413,
  // drain further data without allocating it, and keep the client responsive.
  req.on('data',chunk=>{
    if(done)return;
    size+=chunk.length;
    if(size>12000){const err=Error('The request is too large.');err.statusCode=413;return fail(err);}
    chunks.push(chunk);
  });
  req.on('end',()=>{
    if(done)return;done=true;
    try{const body=Buffer.concat(chunks).toString('utf8');resolve(body?JSON.parse(body):{});}
    catch(_){reject(Error('Invalid JSON.'));}
  });
  req.on('aborted',()=>fail(Error('Request interrupted.')));
  req.on('error',fail);
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
  if(pathname==='/api/health'&&req.method==='GET')return send(res,200,{status:'ok',service:'ECKY THUMP',version:require('../package.json').version,uptime:process.uptime(),socialClubPreviewAvailable:process.env.SOCIAL_CLUB_PREVIEW==='1'});
  if(pathname==='/api/rooms'&&req.method==='POST')return (async()=>{
    requireOrigin(req);const body=await readBodyOrEmpty(req);
    if(body.socialClub){
      if(process.env.SOCIAL_CLUB_PREVIEW!=='1')throw Error('Social Club preview is not enabled on this server.');
      budget(creationRates,req.socket.remoteAddress||'unknown',5);
    }
    const created=game.newRoom(body);let c;do{c=code();}while(rooms.has(c));created.room.code=c;
    rooms.set(c,created.room);touch(created.room);
    if(created.room.config.socialClub)persistence.store(created.room);
    send(res,201,{code:c,seatId:created.id,secret:created.secret});
  })();
  const match=pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|snapshot|events|display-token|action|join-qr.svg|telemetry))?$/);
  if(match){const room=getRoom(match[1]),endpoint=match[2];
    if(endpoint==='join'&&req.method==='POST')return (async()=>{
      requireOrigin(req);const body=await readBodyOrEmpty(req);
      if(room.config.socialClub)budget(joinRates,req.socket.remoteAddress||'unknown',40);
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
    if(endpoint==='telemetry'&&req.method==='GET') {
      const who=authorize(req,room);host(who,room);return send(res,200,telemetry.report(room));
    }
    if(endpoint==='snapshot'&&req.method==='GET') {
      const who=authorize(req,room);return send(res,200,game.snapshot(room,who.player?.id||who.audience?.id,who.tv));
    }
    if(endpoint==='events'&&req.method==='GET'){
      const who=authorize(req,room);
      // Multiple TVs have separate bearer tokens; viewerId is undefined for
      // them all and must never be used to deduplicate TV streams.
      const streamKey=who.tv
        ? 'tv:'+crypto.createHash('sha256').update(req.headers.authorization||'').digest('hex')
        : 'seat:'+(who.player?.id||who.audience?.id);
      if(!connections.has(room.code))connections.set(room.code,new Set());
      const streams=connections.get(room.code);
      for(const stale of [...streams])if(stale.streamKey===streamKey){
        streams.delete(stale);stale.res.end();
      }
      if(streams.size>=100)return send(res,429,{error:'Too many live viewers in this room.'});
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
      res.write(': connected\n\n');
      const channel={res,streamKey,viewerId:who.player?.id||who.audience?.id,tv:who.tv};
      streams.add(channel);
      if(who.player&&!who.player.online&&who.player.hasConnected)telemetry.record(room,'sse_rejoined');
      if(who.player){who.player.online=true;who.player.hasConnected=true;}
      if(who.audience)who.audience.online=true;
      res.write('event: snapshot\ndata: '+JSON.stringify(game.snapshot(room,channel.viewerId,channel.tv))+'\n\n');
      broadcast(room);
      const timer=setInterval(()=>{
        if(res.destroyed||res.writableEnded)return;
        try{res.write(': heartbeat\n\n');}catch(_){res.end();}
      },18000);
      // Request.close can indicate a completed GET before SSE disconnects.
      res.once('close',()=>{
        clearInterval(timer);
        const channels=connections.get(room.code);
        channels?.delete(channel);
        if(channels?.size===0)connections.delete(room.code);
        const participant=who.player||who.audience;
        if(participant){
          const still=channels&&[...channels].some(ch=>!ch.tv&&ch.viewerId===participant.id);
          participant.online=!!still;
          if(!still)telemetry.record(room,'sse_disconnected');
          broadcast(room);
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
      // A television link may view content but must not mutate the lobby.
      if(who.tv)throw Error('Television links are read-only.');
      if(who.audience){
        if(room.config.socialClub&&body.type==='social-audience-vote'){
          game.social.vote(room,who.audience,body.entryId,{audience:true});touch(room);
          send(res,200,{ok:true,revision:room.revision});broadcast(room);return;
        }
        if(body.type==='adult-consent')game.consentAfterDark(room,who.audience);
        else if(body.type==='chaos')game.audienceChaos(room,who.audience,body.kind,body.targetId);
        else if(body.type==='chaos-vote')game.audienceVote(room,who.audience,body.modifier);
        else throw Error('Audience members can only heckle, vote on chaos, and confirm age.');
        touch(room);send(res,200,{ok:true,revision:room.revision});broadcast(room);return;
      }
      if(room.config.socialClub&&['social-seed','social-submit','social-vote','social-next','social-play-card','social-set-cards','social-set-house-cards','social-add-house-card','social-remove-house-card'].includes(body.type)){
        switch(body.type){
          case 'social-seed':game.social.submitSeed(room,p,body.value,game.validateAnswer);break;
          case 'social-submit':game.social.submit(room,p,body.taskId,body.value,game.validateAnswer);break;
          case 'social-vote':game.social.vote(room,p,body.entryId);break;
          case 'social-next':host(who,room);game.social.nextRound(room);break;
          case 'social-set-cards':host(who,room);game.social.setGameCards(room,body.enabled);break;
          case 'social-set-house-cards':host(who,room);game.social.setHouseCards(room,body.enabled);break;
          case 'social-add-house-card':game.social.addHouseCard(room,p,body.text,game.validateAnswer);break;
          case 'social-remove-house-card':game.social.removeHouseCard(room,p,body.cardId);break;
          case 'social-play-card':game.social.playGameCard(room,p,body.cardId,{entryId:body.entryId,taskId:body.taskId,value:body.value,text:body.text},game.validateAnswer);break;
        }
        touch(room);send(res,200,{ok:true,revision:room.revision});broadcast(room);return;
      }
      if(room.config.socialClub&&['report','hide','skip'].includes(body.type)){
        if(body.type==='report')game.social.report(room,p,body.entryId);
        if(body.type==='hide'){host(who,room);game.social.hide(room,body.entryId);}
        if(body.type==='skip'){host(who,room);game.social.skip(room);}
        touch(room);send(res,200,{ok:true,revision:room.revision});broadcast(room);return;
      }
      if(room.config.socialClub&&!['avatar','adult-consent','set-lobby-rating','start','play-again','remove-player','pause','resume','next','client-diagnostic'].includes(body.type))
        throw Error('This action is unavailable in the Social Club preview.');
      switch(body.type) {
        case 'avatar':game.setAvatar(room,p,body.avatar);break;
        case 'adult-consent':game.consentAfterDark(room,p);break;
        case 'set-lobby-rating':host(who,room);game.setLobbyRating(room,body.rating);break;
        case 'set-game-cards':host(who,room);game.setGameCards(room,body.enabled);break;
        case 'play-game-card':game.playGameCard(room,p,body.cardId,{prediction:body.prediction});break;
        case 'reroll-game-card':game.rerollGameCard(room,p,body.cardId);break;
        case 'choose-game-extra':game.chooseGameExtra(room,p,body.drawId,body.replaceId);break;
        case 'card-feedback': {
          if(room.gameCards?.enabled&&room.gameCards?.lastEffect?.id===body.cardId&&['fun','frustrating'].includes(body.rating)
            &&Date.now()-room.gameCards.lastEffect.at<=30000) {
            p.lastFeedback??=new Set();
            const key=String(room.gameCards.lastEffect.serial);
            // Exactly one feedback response per effect per player, independent of rating.
            if(!p.lastFeedback.has(key)){
              p.lastFeedback.add(key);
              telemetry.record(room,'feedback_'+body.rating,{cardId:body.cardId});
            }
          }break;
        }
        case 'client-diagnostic': {
          if(['render','network','action','uncaught'].includes(body.errorType)) {
            p.lastDiagnosticAt??=0;if(Date.now()-p.lastDiagnosticAt>15000){p.lastDiagnosticAt=Date.now();telemetry.record(room,'client_error',{errorType:body.errorType,cardId:room.gameCards?.lastEffect&&Date.now()-room.gameCards.lastEffect.at<=10000?room.gameCards.lastEffect.id:undefined});}
          }break;
        }
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
        case 'next':host(who,room);if(room.config.socialClub)game.social.nextRound(room);else game.nextRound(room);break;
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
          if(room.config.socialClub){host(who,room);game.social.pause(room);break;}
          host(who,room);if(room.paused || !['SEED','SUBMIT','VOTE'].includes(room.phase) || room.pauses>=3)throw Error('Pause unavailable (maximum three per match).');
          room.pauseRemaining=Math.max(1000,room.deadline-Date.now());room.paused=true;room.deadline=null;room.pauses++;room.round.pausedAt=Date.now();room.revision++;break;
        }
        case 'resume':{
          if(room.config.socialClub){host(who,room);game.social.resume(room);break;}
          host(who,room);if(!room.paused)throw Error('The game is not paused.');
          const pausedFor=room.round?.pausedAt?Date.now()-room.round.pausedAt:0;
          if(room.round?.pausedAt){room.round.pausedMs=(room.round.pausedMs||0)+pausedFor;room.round.pausedAt=null;}
          game.resumeCardTimers(room,pausedFor);
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
  const stream=fs.createReadStream(file);
  stream.on('error',()=>res.destroy());
  stream.pipe(res);
}
const server=http.createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if(!cleanRate(req.socket.remoteAddress||'unknown'))return send(res,429,{error:'Too many requests. Try again shortly.'});
  Promise.resolve().then(()=>route(req,res)).catch(err=>{if(!res.headersSent)bad(res,err,err.statusCode||(err.message.startsWith('This room session')?401:400));else res.end();});
});
const timer=setInterval(()=>{
  const now=Date.now();
  for(const [c,room] of rooms){
    if(game.tick(room))broadcast(room);
    // Preserve an active games night with at least one live SSE controller.
    // Hard-cap room lifetime to 24 hours to avoid indefinite retention of ghosts.
    if((now-room.lastActivity>6*60*60*1000 && !(connections.get(c)?.size)) || now-room.created>(room.config.socialClub?6:24)*60*60*1000){for(const ch of connections.get(c)||[])ch.res.end();connections.delete(c);rooms.delete(c);if(room.config.socialClub)persistence.remove(c);}
  }
  for(const [key,value] of perIp)if(now-value.start>2*RATE_WINDOW)perIp.delete(key);
},300);
const snapshotTimer=setInterval(()=>{
  for(const room of rooms.values())if(room.config.socialClub)persistence.store(room);
  for(const map of [creationRates,joinRates])for(const [ip,item] of map)if(Date.now()-item.start>2*RATE_WINDOW)map.delete(ip);
},5000);
server.on('close',()=>{clearInterval(timer);clearInterval(snapshotTimer);});
if(require.main===module)server.listen(port,'0.0.0.0',()=>console.log(`ECKY THUMP Game Night v${require('../package.json').version} running at http://localhost:${port}`));
module.exports={server,rooms,connections};
