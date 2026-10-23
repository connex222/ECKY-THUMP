'use strict';
// Isolated child process for real service-restart integration tests.
const {server,rooms}=require('../../server/index');
const social=require('../../server/social-club');
const persistence=require('../../server/persistence');
server.listen(0,'127.0.0.1',()=>process.send?.({kind:'ready',port:server.address().port,rooms:rooms.size}));
process.on('message',message=>{
  if(message.kind==='advance-intro'){
    const room=rooms.get(message.code);
    try{social.startSubmit(room);persistence.store(room);process.send?.({kind:'advanced',phase:room.phase});}
    catch(err){process.send?.({kind:'error',error:err.message});}
  }
});
