import{lineBlocked}from'../city.js';
import{createViceDuskTextureAtlas as AT}from'./textures3d.js';
import{VICE_VERT_STRIDE,buildAdd,buildStatic,buildDyn,buildSmk,viceCreateMesh}from'./meshes3d.js';
async function lS(url){const r=await fetch(url),s=await r.text(),p=s.split('// @fragment');return{vsrc:p[0].replace('// @vertex','').trim(),fsrc:p[1].trim()};}
function program(gl,vs,fs){const C=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){console.error('shader error:',gl.getShaderInfoLog(x));return null;}return x;},a=C(gl.VERTEX_SHADER,vs),b=C(gl.FRAGMENT_SHADER,fs);if(!a||!b)return null;const p=gl.createProgram();gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.error('link error:',gl.getProgramInfoLog(p));return null;}return p;}
const DEPTH_VS='attribute vec3 aPos;uniform mat4 uVP;void main(){gl_Position=uVP*vec4(aPos,1.0);}';
const DEPTH_FS='precision mediump float;void main(){}';
function persp(fov,asp,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return[f/asp,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0];}
function lookAt(e,t,up){const n=(x,y,z)=>{const l=Math.hypot(x,y,z);return[x/l,y/l,z/l];},[zx,zy,zz]=n(e[0]-t[0],e[1]-t[1],e[2]-t[2]),[xx,xy,xz]=n(up[1]*zz-up[2]*zy,up[2]*zx-up[0]*zz,up[0]*zy-up[1]*zx),yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;return[xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1];}
function mul(a,b){const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
function duskSun(hour){const t=((hour-6)/12)*Math.PI,el=Math.max(0.08,Math.sin(t)),w=1-Math.min(1,el*2.5),dir=[-Math.cos(t),el,0.3],l=Math.hypot(dir[0],dir[1],dir[2]);return{dir:[dir[0]/l,dir[1]/l,dir[2]/l],col:[1,1-0.45*w,1-0.75*w],amb:[0.48,0.34,0.36],fog:[0.42,0.15,0.2]};}
function skyCube(){const s=4000,v=[];for(let i=0;i<8;i++)v.push([(i+3)%4<2?s:-s,i&2?s:-s,i&4?s:-s]);const f=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]],out=new Float32Array(36*3);let n=0;for(const[a,b,c,d]of f)for(const[i,j,k]of[[a,b,c],[a,c,d]])for(const idx of[i,j,k]){out[n]=v[idx][0];out[n+1]=v[idx][1];out[n+2]=v[idx][2];n+=3;}return out;}
function waterGrid(){return new Float32Array([-12000,0,2600,16000,0,2600,16000,0,14000,-12000,0,2600,16000,0,14000,-12000,0,14000]);}
export async function createWebGL3DViceDuskRenderer(c2){
const gc=document.createElement('canvas');
gc.style.cssText='position:fixed;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
c2.parentNode.insertBefore(gc,c2);
const gl=gc.getContext('webgl2',{antialias:true,alpha:false});
if(!gl){gc.remove();return null;}
const hF=!!gl.getExtension('EXT_color_buffer_float');
const base=new URL('../shaders/',import.meta.url);
let sky,city,water,post;
try{sky=await lS(new URL('dusk-sky.glsl',base));city=await lS(new URL('city-pbr.glsl',base));water=await lS(new URL('ocean-water.glsl',base));post=await lS(new URL('post-fx.glsl',base));}catch{gc.remove();return null;}
const skyP=program(gl,sky.vsrc,sky.fsrc),cityP=program(gl,city.vsrc,city.fsrc),waterP=program(gl,water.vsrc,water.fsrc),postP=program(gl,post.vsrc,post.fsrc),depP=program(gl,DEPTH_VS,DEPTH_FS);
if(!skyP||!cityP||!waterP||!postP||!depP){gc.remove();return null;}
const U=(p,ns)=>{const o={};for(const n of ns)o[n]=gl.getUniformLocation(p,n);return o;};
const cU=U(cityP,['uVP','uSP','uCam','uSD','uSunCol','uAmb','uFC','uFogDen','uSoft','uTex','uSH','uSHO']);
const kU=U(skyP,['uVP','uSD','uTime','uCam']),wU=U(waterP,['uVP','uTime','uSD','uCam','uFC']),pU=U(postP,['uScene','uBloom','uMode','uTexel']),dU=U(depP,['uVP']);
const uM=(l,v)=>gl.uniformMatrix4fv(l,false,v),u3=(l,v)=>gl.uniform3fv(l,v),u1=(l,v)=>gl.uniform1f(l,v),uI=(l,v)=>gl.uniform1i(l,v);
const atlas=AT(gl);
const dynM=viceCreateMesh(20000),addM=viceCreateMesh(6000),smkM=viceCreateMesh(4000);
let sB=null,sN=0,kB=null,wB=null,dB=null,tB=null,vW=0,vH=0,dp=1,md=0,vs=true,fb=null;
const se=[0,0,0];let ei=false;
function tex(w,h,fmt,type){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,fmt,w,h,0,fmt===gl.DEPTH_COMPONENT24?gl.DEPTH_COMPONENT:gl.RGBA,type,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
function mkFBO(){
if(fb){for(const k of['hdrTex','bATex','bBTex','shTex'])gl.deleteTexture(fb[k]);for(const k of['hdr','bA','bB','sh'])gl.deleteFramebuffer(fb[k]);gl.deleteRenderbuffer(fb.hdrRb);}
const w=gc.width,h=gc.height,bw=Math.max(1,w>>2),bh=Math.max(1,h>>2);
let hT=tex(w,h,hF?gl.RGBA16F:gl.RGBA8,hF?gl.HALF_FLOAT:gl.UNSIGNED_BYTE);
const hR=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,hR);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);
const hdr=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,hdr);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,hT,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,hR);
let ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
if(!ok){gl.deleteTexture(hT);hT=tex(w,h,gl.RGBA8,gl.UNSIGNED_BYTE);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,hT,0);ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;}
const bAT=tex(bw,bh,gl.RGBA8,gl.UNSIGNED_BYTE),bA=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,bA);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,bAT,0);
const bBT=tex(bw,bh,gl.RGBA8,gl.UNSIGNED_BYTE),bB=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,bB);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,bBT,0);
const shT=tex(1024,1024,gl.DEPTH_COMPONENT24,gl.UNSIGNED_INT),sh=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,sh);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shT,0);gl.drawBuffers([gl.NONE]);
const shOk=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
gl.bindFramebuffer(gl.FRAMEBUFFER,null);
fb={hdr,hdrTex:hT,hdrRb:hR,bA,bATex:bAT,bB,bBTex:bBT,sh,shTex:shT,shOk,bw,bh,w,h};}
function bA(prog,buf,stride,defs){gl.bindBuffer(gl.ARRAY_BUFFER,buf);for(const[nm,sz,off]of defs){const loc=gl.getAttribLocation(prog,nm);if(loc<0)continue;gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,sz,gl.FLOAT,false,stride*4,off*4);}}
function resize(){dp=window.devicePixelRatio||1;vW=window.innerWidth;vH=window.innerHeight;gc.width=Math.round(vW*dp);gc.height=Math.round(vH*dp);}
function initB(cityData){const mk=d=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);return b;};const st=buildStatic(cityData);sN=st.length/VICE_VERT_STRIDE;sB=mk(st);kB=mk(skyCube());wB=mk(waterGrid());dB=gl.createBuffer();tB=mk(new Float32Array([-1,-1,3,-1,-1,3]));}
function chaseCam(st,ct){const p=st.player,car=st.cars.find(c=>c.driver==='player'),o=car&&!p.onFoot?car:p,px=o.x,pz=o.y,fx=Math.cos(o.angle),fz=Math.sin(o.angle),sp=car&&!p.onFoot?Math.abs(car.speed):0,onF=p.onFoot;let dist=onF?58:115;const ht=onF?28:55,ah=onF?45:85;let ex=px-fx*dist,ez=pz-fz*dist;if(ct){while(dist>30&&lineBlocked(ct.buildings,px,pz,ex,ez)){dist*=0.7;ex=px-fx*dist;ez=pz-fz*dist;}}return{eye:[ex,ht,ez],target:[px+fx*ah,onF?4:6,pz+fz*ah],fov:(62+Math.min(10,sp*0.012))*Math.PI/180};}
function cineCam(st){const p=st.player,t=st.time*0.08,R=280,H=130;return{eye:[p.x+Math.cos(t)*R,H,p.y+Math.sin(t)*R],target:[p.x,12,p.y],fov:58*Math.PI/180};}
function shotCam(st){const p=st.player,car=st.cars.find(c=>c.driver==='player'),o=car&&!p.onFoot?car:p,cx=o.x,cz=o.y,fx=Math.cos(o.angle),fz=Math.sin(o.angle),D=180/Math.PI;if(st.shotCam==='drone')return{eye:[550,330,3040],target:[2850,0,2430],fov:58/D};if(st.shotCam==='hero')return{eye:[3000,85,170],target:[3000,30,460],fov:60/D};if(st.shotCam==='action')return{eye:[cx-fx*150,55,cz-fz*150],target:[cx+fx*90,12,cz+fz*90],fov:62/D};if(st.shotCam==='low'){const px=-fz,pz=fx;return{eye:[cx-fx*62+px*13,20,cz-fz*62+pz*13],target:[cx+fx*130,8,cz+fz*130],fov:66/D};}if(st.shotCam==='race')return{eye:[cx-fx*68,22,cz-fz*68],target:[cx+fx*130,8,cz+fz*130],fov:66/D};return{eye:[cx-fx*115,55,cz-fz*115],target:[cx+fx*110,6,cz+fz*110],fov:62/D};}
window.addEventListener('keydown',e=>{if(e.code==='KeyV'&&!e.repeat)md=(md+1)%3;});
window.addEventListener('resize',resize);
resize();
return{
get mode(){return md;},
get canvas(){return gc;},
setVisible(v){if(v===vs)return;vs=v;gc.style.display=v?'block':'none';},
init(cd){initB(cd);},
draw(st,ct,sc){
if(md===2||!vs)return;
if(!sB)initB(ct);
if(gc.width!==Math.round(vW*dp))resize();
if(!fb||fb.w!==gc.width||fb.h!==gc.height)mkFBO();
const hour=(8+st.time/10)%24,sun=duskSun(hour);
const cam=st.shotCam?shotCam(st):(sc==='title'||md===1)?cineCam(st):chaseCam(st,ct);
const dx=cam.eye[0]-se[0],dy=cam.eye[1]-se[1],dz=cam.eye[2]-se[2],d=Math.hypot(dx,dy,dz);
if(st.shotCam||!ei||d>200){se[0]=cam.eye[0];se[1]=cam.eye[1];se[2]=cam.eye[2];ei=true;}
else{se[0]+=dx*0.5;se[1]+=dy*0.5;se[2]+=dz*0.5;}
const vp=mul(persp(cam.fov,vW/vH,1,9000),lookAt(se,cam.target,[0,1,0]));
const dyn=buildDyn(st,dynM),add=buildAdd(st,addM),smk=buildSmk(st,smkM);
const defs=[['aPos',3,0],['aNor',3,3],['aCol',3,6],['aUv',2,9],['aEmi',1,11]];
const tg=[st.player.x,0,st.player.y],lE=[tg[0]+sun.dir[0]*900,tg[1]+sun.dir[1]*900,tg[2]+sun.dir[2]*900];
const sVP=mul([1/380,0,0,0,0,1/380,0,0,0,0,-2/1999,0,0,0,-2001/1999,1],lookAt(lE,tg,[0,1,0]));
gl.bindFramebuffer(gl.FRAMEBUFFER,fb.sh);
gl.viewport(0,0,1024,1024);
gl.clear(gl.DEPTH_BUFFER_BIT);
gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
gl.useProgram(depP);uM(dU.uVP,sVP);
bA(depP,sB,VICE_VERT_STRIDE,[['aPos',3,0]]);
gl.drawArrays(gl.TRIANGLES,0,sN);
gl.bindBuffer(gl.ARRAY_BUFFER,dB);gl.bufferData(gl.ARRAY_BUFFER,dyn,gl.DYNAMIC_DRAW);
bA(depP,dB,VICE_VERT_STRIDE,[['aPos',3,0]]);
gl.drawArrays(gl.TRIANGLES,0,dyn.length/VICE_VERT_STRIDE);
gl.bindFramebuffer(gl.FRAMEBUFFER,fb.hdr);
gl.viewport(0,0,gc.width,gc.height);
gl.clear(gl.DEPTH_BUFFER_BIT);
gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
gl.useProgram(skyP);uM(kU.uVP,vp);u3(kU.uSD,sun.dir);u1(kU.uTime,st.time);u3(kU.uCam,se);
bA(skyP,kB,3,[['aPos',3,0]]);
gl.drawArrays(gl.TRIANGLES,0,36);
gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
gl.useProgram(waterP);uM(wU.uVP,vp);u1(wU.uTime,st.time);u3(wU.uSD,sun.dir);u3(wU.uCam,se);u3(wU.uFC,sun.fog);
bA(waterP,wB,3,[['aPos',3,0]]);
gl.drawArrays(gl.TRIANGLES,0,6);
gl.useProgram(cityP);
uM(cU.uVP,vp);uM(cU.uSP,sVP);u3(cU.uCam,se);u3(cU.uSD,sun.dir);u3(cU.uSunCol,sun.col);u3(cU.uAmb,sun.amb);u3(cU.uFC,sun.fog);u1(cU.uFogDen,0.00012);u1(cU.uSoft,0);u1(cU.uSHO,fb.shOk?1:0);
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,atlas);uI(cU.uTex,0);
gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,fb.shTex);uI(cU.uSH,1);
bA(cityP,sB,VICE_VERT_STRIDE,defs);
gl.drawArrays(gl.TRIANGLES,0,sN);
gl.bindBuffer(gl.ARRAY_BUFFER,dB);
bA(cityP,dB,VICE_VERT_STRIDE,defs);
gl.drawArrays(gl.TRIANGLES,0,dyn.length/VICE_VERT_STRIDE);
gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);u1(cU.uSoft,1);
gl.bindBuffer(gl.ARRAY_BUFFER,dB);gl.bufferData(gl.ARRAY_BUFFER,add,gl.DYNAMIC_DRAW);
bA(cityP,dB,VICE_VERT_STRIDE,defs);
gl.drawArrays(gl.TRIANGLES,0,add.length/VICE_VERT_STRIDE);
gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
gl.bindBuffer(gl.ARRAY_BUFFER,dB);gl.bufferData(gl.ARRAY_BUFFER,smk,gl.DYNAMIC_DRAW);
bA(cityP,dB,VICE_VERT_STRIDE,defs);
gl.drawArrays(gl.TRIANGLES,0,smk.length/VICE_VERT_STRIDE);
gl.depthMask(true);gl.disable(gl.BLEND);
gl.useProgram(postP);
gl.uniform2f(pU.uTexel,1/fb.bw,1/fb.bh);
gl.bindBuffer(gl.ARRAY_BUFFER,tB);
const pl=gl.getAttribLocation(postP,'aPos');
gl.enableVertexAttribArray(pl);gl.vertexAttribPointer(pl,2,gl.FLOAT,false,0,0);
gl.bindFramebuffer(gl.FRAMEBUFFER,fb.bA);gl.viewport(0,0,fb.bw,fb.bh);
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,fb.hdrTex);uI(pU.uScene,0);u1(pU.uMode,1);
gl.drawArrays(gl.TRIANGLES,0,3);
gl.bindFramebuffer(gl.FRAMEBUFFER,fb.bB);gl.viewport(0,0,fb.bw,fb.bh);
gl.bindTexture(gl.TEXTURE_2D,fb.bATex);u1(pU.uMode,2);
gl.drawArrays(gl.TRIANGLES,0,3);
gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gc.width,gc.height);
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,fb.hdrTex);uI(pU.uScene,0);
gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,fb.bBTex);uI(pU.uBloom,1);u1(pU.uMode,0);
gl.drawArrays(gl.TRIANGLES,0,3);
},
};}
