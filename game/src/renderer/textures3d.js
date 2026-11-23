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
const R=(t,r,q)=>((t*13+r*31+q*17)%100)/100;
const walls=['#e3c9a8','#2c3e55','#c98a7a','#a8c8b0'],trims=['#ff2d78','#00e5ff','#ffd23d','#ff7a2d'];
for(let t=0;t<4;t++){const x0=t*256;F(walls[t],x0,0,256,256);
for(let r=0;r<9;r++){const y=18+r*21;F('rgba(0,0,0,.16)',x0,y+14,256,2);if(r%3===2)F(trims[t],x0,y+15,256,3);
for(let q=0;q<10;q++){const k=R(t,r,q),wx=x0+10+q*24;F('rgba(0,0,0,.28)',wx-2,y-2,17,14);F(k<.34?'#ffd27a':k<.5?'#7fe3ff':k<.62?'#ffe9b0':t===1?'rgba(120,170,220,.5)':'rgba(24,18,36,.6)',wx,y,13,10);if(t===1){F('rgba(10,16,26,.85)',wx,y,13,2);F('rgba(10,16,26,.85)',wx+5,y,2,10);}}}
if(t===2)for(let q=0;q<4;q++){F(q%2?'#ff2d78':'#00e5ff',x0+34+q*56,8,5,206);F('rgba(255,255,255,.35)',x0+34+q*56,8,2,206);}
if(t!==1)for(let q=0;q<5;q++)F('rgba(255,255,255,.22)',x0+26+q*48,40,20,3);
F('rgba(12,10,22,.9)',x0,222,256,34);F('#3a2f4a',x0+104,228,48,28);F(trims[t],x0,0,256,5);}
F('#160b26',512,256,448,128);
g.strokeStyle='#f2c94c';g.lineWidth=5;g.strokeRect(518,262,436,116);g.fillStyle='#f2c94c';
for(let i=0;i<20;i++){const bx=536+i*22;g.beginPath();g.arc(bx,272,3,0,7);g.fill();g.beginPath();g.arc(bx,374,3,0,7);g.fill();}
g.textAlign='center';g.font='bold 56px sans-serif';g.shadowBlur=22;
g.save();g.translate(1280,0);g.scale(-1,1);
g.shadowColor='#00e5ff';g.fillStyle='#8ef4ff';g.fillText('NEON',430,338);
g.shadowColor='#ff9d00';g.fillStyle='#ffd23d';g.fillText('CASINO',660,338);
g.restore();g.shadowBlur=0;
F('#3a3f4a',0,256,256,256);F('#2e333d',8,264,240,240);
g.strokeStyle='#f2c94c';g.lineWidth=6;g.beginPath();g.arc(128,384,70,0,7);g.stroke();
g.fillStyle='#f2c94c';g.font='bold 60px sans-serif';g.textAlign='center';g.fillText('H',128,404);
F('#ffffff',256,256,64,64);
const sp=(x0,y0,base,dots,n)=>{F(base,x0,y0,256,256);for(let i=0;i<n;i++){const px=x0+((i*137)%256),py=y0+((i*211)%256);F(dots[i%dots.length],px,py,i%3===0?2:1,i%3===0?2:1);}};
sp(0,512,'#3d3c44',['#2e2d33','#4a4952','#55545e','#33323a'],900);
sp(256,512,'#b8ab98',['#a89a86','#c8bca8','#9a8c78'],500);
g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=2;
for(let i=0;i<=4;i++){g.beginPath();g.moveTo(256+i*64,512);g.lineTo(256+i*64,768);g.stroke();g.beginPath();g.moveTo(256,512+i*64);g.lineTo(512,512+i*64);g.stroke();}
sp(512,512,'#e8cf9a',['#d8bf8a','#f2dda8','#cbb27e'],600);
sp(768,512,'#5d8a48',['#4c7838','#6f9c58','#42682e'],800);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
return tex;}
