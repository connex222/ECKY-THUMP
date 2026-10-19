'use strict';
const avatars=require('../public/assets/avatars.json');
const IDs=new Set(avatars.map(a=>a.id));
function validateAvatar(id){if(id===undefined||id===null||id==='')return 'adult-01';if(typeof id!=='string'||!IDs.has(id))throw Error('Choose an avatar from the roster.');return id;}
module.exports={avatars,validateAvatar};
