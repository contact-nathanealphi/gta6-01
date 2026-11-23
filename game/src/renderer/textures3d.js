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
for(let r=0;r<9;r++){const y=18+r*21;F('rgba(0,0,0,.16)',x0,y+14,256,2);if(r%3===2)F(trims[t],x0,y+15,256,3);
for(let q=0;q<10;q++){const k=((t*13+r*31+q*17)%100)/100,wx=x0+10+q*24;F('rgba(0,0,0,.28)',wx-2,y-2,17,14);F(k<.34?'#ffd27a':k<.5?'#ff9d5c':k<.62?'#ffe9b0':t===1?'rgba(120,170,220,.5)':'rgba(24,18,36,.6)',wx,y,13,10);if(t===1){F('rgba(10,16,26,.85)',wx,y,13,2);F('rgba(10,16,26,.85)',wx+5,y,2,10);}}}
if(t===2)for(let q=0;q<4;q++){F(q%2?'#ff2d78':'#00e5ff',x0+34+q*56,8,5,206);F('rgba(255,255,255,.35)',x0+34+q*56,8,2,206);}
F(trims[t],x0,214,256,8);F('rgba(12,10,22,.9)',x0,222,256,34);F('#3a2f4a',x0+104,228,48,28);F(trims[t],x0,0,256,5);}
F('#160b26',512,256,448,128);
g.strokeStyle='#f2c94c';g.lineWidth=5;g.strokeRect(518,262,436,116);g.fillStyle='#f2c94c';
for(let i=0;i<20;i++){F('#f2c94c',536+i*22,269,5,5);F('#f2c94c',536+i*22,371,5,5);}
g.textAlign='center';g.font='bold 56px sans-serif';g.shadowBlur=22;
g.save();g.translate(1280,0);g.scale(-1,1);
g.shadowColor='#00e5ff';g.fillStyle='#8ef4ff';g.fillText('NEON',430,338);
g.shadowColor='#ff9d00';g.fillStyle='#ffd23d';g.fillText('CASINO',660,338);
g.restore();g.shadowBlur=0;
F('#33302e',0,256,256,256);
F('#fff',256,256,64,64);
F('#1e1d28',0,512,256,256);
F('#b8ab98',256,512,256,256);
g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=2;
for(let i=0;i<=4;i++){g.beginPath();g.moveTo(256+i*64,512);g.lineTo(256+i*64,768);g.stroke();g.beginPath();g.moveTo(256,512+i*64);g.lineTo(512,512+i*64);g.stroke();}
F('#e8cf9a',512,512,256,256);
F('#5d8a48',768,512,256,256);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
return tex;}
