export const VICE_FACADE_UV=[[.0,.75,.25,1.0],[.25,.75,.5,1.0],[.5,.75,.75,1.0],[.75,.75,1.0,1.0]];
export const VICE_ROOF_UV=[.0,.5,.25,.75];
export const VICE_WHITE_UV=[.25,.6875,.3125,.75];
export const VICE_CASINO_UV=[.5,.625,.9375,.75];
export const VICE_ASPHALT_UV=[.0,.25,.25,.5];
export const VICE_WALK_UV=[.25,.25,.5,.5];
export const VICE_SAND_UV=[.5,.25,.75,.5];
export const VICE_GRASS_UV=[.75,.25,1.0,.5];
export function createViceDuskTextureAtlas(gl){
const c=document.createElement('canvas');c.width=1024;c.height=1024;
const g=c.getContext('2d');
const F=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
const walls=['#dfb48c','#d47a6a','#cfa06e','#b98a5e'],trims=['#ff2d78','#00e5ff','#ffd23d','#ff7a2d'];
for(let t=0;t<4;t++){const x0=t*256;F(walls[t],x0,0,256,256);
F('rgba(255,255,255,.12)',x0,0,256,64);F('rgba(0,0,0,.14)',x0,190,256,66);
for(let r=0;r<6;r++){const y=16+r*30;F('rgba(8,12,22,.92)',x0+12,y,232,17);F('rgba(255,255,255,.22)',x0+12,y,232,2);
for(let q=0;q<6;q++){const k=((t*13+r*31+q*17)%100)/100;if(k<.40)F(k<.2?'#ffd27a':'#ff9d5c',x0+20+q*38,y+3,16,11);}}
for(let q=0;q<3;q++)F(trims[t],x0+52+q*76,8,5,196);
F(trims[t],x0,208,256,9);F('rgba(12,10,22,.9)',x0,217,256,39);F('#3a2f4a',x0+104,224,48,32);F(trims[t],x0,0,256,5);}
F('#160b26',512,256,448,128);
g.strokeStyle='#f2c94c';g.lineWidth=5;g.strokeRect(518,262,436,116);g.fillStyle='#f2c94c';
for(let i=0;i<20;i++){F('#f2c94c',536+i*22,269,5,5);F('#f2c94c',536+i*22,371,5,5);}
g.textAlign='center';g.font='bold 56px sans-serif';g.shadowBlur=22;
g.save();g.translate(1280,0);g.scale(-1,1);
g.shadowColor='#00e5ff';g.fillStyle='#8ef4ff';g.fillText('NEON',430,338);
g.shadowColor='#ff9d00';g.fillStyle='#ffd23d';g.fillText('CASINO',660,338);
g.restore();g.shadowBlur=0;
F('#33302e',0,256,256,256);
F('rgba(255,255,255,.07)',0,256,256,10);F('rgba(0,0,0,.25)',0,500,256,12);
F('#4a4642',24,300,40,26);F('#4a4642',180,340,52,30);F('#5d5852',90,420,36,24);
F('#fff',256,256,64,64);
F('#1e1d28',0,512,256,256);
for(let i=0;i<160;i++)F(i%3?'rgba(255,255,255,.05)':'rgba(0,0,0,.22)',(i*37)%256,512+(i*53)%256,2,2);
for(let i=0;i<6;i++)F('rgba(255,255,255,.03)',(i*97)%256,512+(i*61)%256,60,14);
F('#b8ab98',256,512,256,256);
for(let i=0;i<4;i++)for(let j=0;j<4;j++)F((i+j)%2?'rgba(0,0,0,.13)':'rgba(255,255,255,.09)',256+i*64,512+j*64,64,64);
g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=3;
for(let i=0;i<=4;i++){g.beginPath();g.moveTo(256+i*64,512);g.lineTo(256+i*64,768);g.stroke();g.beginPath();g.moveTo(256,512+i*64);g.lineTo(512,512+i*64);g.stroke();}
F('#e8cf9a',512,512,256,256);
for(let i=0;i<160;i++)F(i%2?'rgba(0,0,0,.08)':'rgba(255,255,255,.09)',512+(i*41)%256,512+(i*67)%256,2,2);
F('#5d8a48',768,512,256,256);
for(let i=0;i<40;i++)F(i%2?'rgba(0,0,0,.12)':'rgba(255,255,255,.06)',768+(i*53)%256,512+(i*89)%256,14+(i%3)*8,10+(i%2)*8);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
return tex;}
