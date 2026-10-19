
'use strict';
const QR=require('./vendor/QRCode');
const ECC=require('./vendor/QRCode/QRErrorCorrectLevel');
function qrSVG(text){
  const qr=new QR(-1,ECC.M);qr.addData(text);qr.make();
  const count=qr.getModuleCount(),size=count+8;
  const shapes=[];
  for(let r=0;r<count;r++){
    let start=-1;
    for(let c=0;c<=count;c++){
      const dark=c<count && qr.isDark(r,c);
      if(dark&&start<0)start=c;
      if(!dark&&start>=0){shapes.push(`<rect x="${start+4}" y="${r+4}" width="${c-start}" height="1"/>`);start=-1;}
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="384" height="384" shape-rendering="crispEdges" role="img" aria-label="Scan the code to join ECKEY THUMP"><path fill="#fff" d="M0 0h${size}v${size}H0z"/><g fill="#141022">${shapes.join('')}</g></svg>`;
}
module.exports={qrSVG};
