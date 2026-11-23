import{AVENUES,CAR_KINDS,STREETS,WORLD}from'../tune.js';
import{VICE_ASPHALT_UV as AV,VICE_CASINO_UV as CV,VICE_FACADE_UV as FV,VICE_GRASS_UV as GV,VICE_ROOF_UV as RV,VICE_SAND_UV as SV,VICE_WALK_UV as WV,VICE_WHITE_UV as U}from'./textures3d.js';
import{StreetRaceCircuit}from'../crew-garage-race.js';
const X=viceHex;
export const VICE_VERT_STRIDE=12;
export function viceHex(h){const o=[];for(let i=1;i<6;i+=2)o.push(parseInt(h.slice(i,i+2),16)/255);return o;}
export function viceCreateMesh(cap){
const data=new Float32Array(cap*VICE_VERT_STRIDE);let n=0;
function v(){const o=n*VICE_VERT_STRIDE;for(let i=0;i<12;i++)data[o+i]=arguments[i];n++;}
function q(a,b,c,d,nx,ny,nz,col,uv,emi){const P=[a,b,c,a,c,d];for(let i=0;i<6;i++)v(P[i][0],P[i][1],P[i][2],nx,ny,nz,col[0],col[1],col[2],(i===0||i===3||i===5)?uv[0]:uv[2],(i===0||i===1||i===3)?uv[1]:uv[3],emi);}
function tr(a,b,c,nx,ny,nz,col,uv,emi){v(a[0],a[1],a[2],nx,ny,nz,col[0],col[1],col[2],uv[0],uv[1],emi);v(b[0],b[1],b[2],nx,ny,nz,col[0],col[1],col[2],uv[2],uv[1],emi);v(c[0],c[1],c[2],nx,ny,nz,col[0],col[1],col[2],uv[2],uv[3],emi);}
function gq(x0,z0,x1,z1,y,col,emi){q([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],0,1,0,col,U,emi);}
function gt(x0,z0,x1,z1,y,col,t,emi){const uu=x=>t[0]+(((x/140)%1)+1)%1*(t[2]-t[0]),vv=z=>t[1]+(((z/140)%1)+1)%1*(t[3]-t[1]);q([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],0,1,0,col,[uu(x0),vv(z0),uu(x1),vv(z1)],emi);}
function b(cx,cy,cz,sx,sy,sz,yaw,col,uv,emi,rUv,rEm){const co=Math.cos(yaw),si=Math.sin(yaw),hx=sx/2,hy=sy/2,hz=sz/2,L=[];for(let i=0;i<8;i++)L.push([(i+3)%4<2?hx:-hx,i&4?hy:-hy,i&2?hz:-hz]);const P=L.map(p=>[cx+p[0]*co+p[2]*si,cy+p[1],cz-p[0]*si+p[2]*co]),N=[[0,1,0],[co,0,-si],[-co,0,si],[si,0,co],[-si,0,-co]],u2=rUv||uv,e2=rEm===undefined?emi:rEm;q(P[4],P[5],P[6],P[7],...N[0],col,u2,e2);q(P[1],P[2],P[6],P[5],...N[1],col,uv,emi);q(P[3],P[0],P[4],P[7],...N[2],col,uv,emi);q(P[2],P[3],P[7],P[6],...N[3],col,uv,emi);q(P[0],P[1],P[5],P[4],...N[4],col,uv,emi);}
function tb(cx,cy,cz,ax,ay,az,r0,r1,len,col,cc,uv,emi,sg){const al=Math.hypot(ax,ay,az)||1;ax/=al;ay/=al;az/=al;const t=Math.abs(ay)<.9?[0,1,0]:[1,0,0];let ux=ay*t[2]-az*t[1],uy=az*t[0]-ax*t[2],uz=ax*t[1]-ay*t[0];const ul=Math.hypot(ux,uy,uz)||1;ux/=ul;uy/=ul;uz/=ul;const vx=ay*uz-az*uy,vy=az*ux-ax*uz,vz=ax*uy-ay*ux,c0=[cx-ax*len/2,cy-ay*len/2,cz-az*len/2],c1=[cx+ax*len/2,cy+ay*len/2,cz+az*len/2],c2=cc||col;sg=sg||6;for(let i=0;i<sg;i++){const a0=i/sg*Math.PI*2,a1=(i+1)/sg*Math.PI*2,d0=[ux*Math.cos(a0)+vx*Math.sin(a0),uy*Math.cos(a0)+vy*Math.sin(a0),uz*Math.cos(a0)+vz*Math.sin(a0)],d1=[ux*Math.cos(a1)+vx*Math.sin(a1),uy*Math.cos(a1)+vy*Math.sin(a1),uz*Math.cos(a1)+vz*Math.sin(a1)],p00=[c0[0]+d0[0]*r0,c0[1]+d0[1]*r0,c0[2]+d0[2]*r0],p01=[c0[0]+d1[0]*r0,c0[1]+d1[1]*r0,c0[2]+d1[2]*r0],p10=[c1[0]+d0[0]*r1,c1[1]+d0[1]*r1,c1[2]+d0[2]*r1],p11=[c1[0]+d1[0]*r1,c1[1]+d1[1]*r1,c1[2]+d1[2]*r1];q(p00,p10,p11,p01,(d0[0]+d1[0])/2,(d0[1]+d1[1])/2,(d0[2]+d1[2])/2,col,uv,emi);tr(c0,[c0[0]+d1[0]*r0,c0[1]+d1[1]*r0,c0[2]+d1[2]*r0],p00,-ax,-ay,-az,c2,uv,emi);tr(c1,p10,[c1[0]+d1[0]*r1,c1[1]+d1[1]*r1,c1[2]+d1[2]*r1],ax,ay,az,c2,uv,emi);}}
function ba(cx,cy,cz,rx,ry,rz,col,emi){const T=[cx,cy+ry,cz],B=[cx,cy-ry,cz],E=[[cx+rx,cy,cz],[cx,cy,cz+rz],[cx-rx,cy,cz],[cx,cy,cz-rz]];for(let i=0;i<4;i++){const a=E[i],b2=E[(i+1)%4],mx=(a[0]+b2[0])/2-cx,mz=(a[2]+b2[2])/2-cz;tr(T,a,b2,mx/rx,1,mz/rz,col,U,emi);tr(B,b2,a,mx/rx,-1,mz/rz,col,U,emi);}}
function pr(pts,hw,cx,cy,cz,yaw,col,uv,emi){const co=Math.cos(yaw),si=Math.sin(yaw),X=(lx,lz)=>[cx+lx*co+lz*si,cz-lx*si+lz*co];for(let i=0;i<pts.length;i++){const p0=pts[i],p1=pts[(i+1)%pts.length],dx=p1[0]-p0[0],dy=p1[1]-p0[1],ln=Math.hypot(dx,dy)||1,nn=[dy/ln,-dx/ln],w0=X(p0[0],-hw),w1=X(p1[0],-hw),w2=X(p1[0],hw),w3=X(p0[0],hw);q([w0[0],cy+p0[1],w0[1]],[w1[0],cy+p1[1],w1[1]],[w2[0],cy+p1[1],w2[1]],[w3[0],cy+p0[1],w3[1]],nn[0]*co,nn[1],-nn[0]*si,col,uv,emi);}let gx=0,gy=0;for(const p of pts){gx+=p[0];gy+=p[1];}gx/=pts.length;gy/=pts.length;const g0=X(gx,hw),g1=X(gx,-hw);for(let i=0;i<pts.length;i++){const p0=pts[i],p1=pts[(i+1)%pts.length],a0=X(p0[0],hw),a1=X(p1[0],hw),b0=X(p0[0],-hw),b1=X(p1[0],-hw);tr([g0[0],cy+gy,g0[1]],[a0[0],cy+p0[1],a0[1]],[a1[0],cy+p1[1],a1[1]],si,0,co,col,uv,emi);tr([g1[0],cy+gy,g1[1]],[b1[0],cy+p1[1],b1[1]],[b0[0],cy+p0[1],b0[1]],-si,0,-co,col,uv,emi);}}
return{data,reset(){n=0;},slice(){return data.subarray(0,n*VICE_VERT_STRIDE);},q,tr,gq,gt,b,tb,ba,pr};}
export function viceBuildingHeight(b){const h=(((b.x*7+b.y*13)%100)+100)%100/100,cx=b.x+b.w/2,cy=b.y+b.h/2;return(60+h*140)*(cx>1200&&cx<3000&&cy>600&&cy<2000?1.5:1)*(cy>2300?.6:1);}
const NT=[[1,.18,.47],[0,.9,1],[1,.82,.24],[1,.48,.18]];
export function buildStatic(city){
const m=viceCreateMesh(96000),wh=[1,1,1],sd=X('#e8cf9a'),as=X('#1e1d28'),ln=X('#e6d47a');
m.gt(0,0,WORLD.width,WORLD.height,0,viceHex('#6f9c58'),GV,0);
m.gt(0,2440,WORLD.width,WORLD.height,.1,sd,SV,0);
for(const ax of AVENUES){m.gt(ax-86,0,ax+86,WORLD.height,.12,viceHex('#b8ab98'),WV,0);m.gt(ax-60,0,ax+60,WORLD.height,.15,as,AV,0);for(let y=60;y<WORLD.height-30;y+=120){m.gq(ax-6,y,ax-3,y+30,.18,ln,0);m.gq(ax+3,y,ax+6,y+30,.18,ln,0);for(const s of[-32,29])m.gq(ax+s,y,ax+s+3,y+30,.18,wh,0);}}
for(const sy of STREETS){m.gt(0,sy-86,WORLD.width,sy+86,.12,viceHex('#b8ab98'),WV,0);m.gt(0,sy-60,WORLD.width,sy+60,.15,as,AV,0);for(let x=60;x<WORLD.width-30;x+=120){m.gq(x,sy-6,x+30,sy-3,.18,ln,0);m.gq(x,sy+3,x+30,sy+6,.18,ln,0);}}
for(const b of city.buildings){
const cx=b.x+b.w/2,cz=b.y+b.h/2,ti=Math.floor(b.x*3+b.y*5)%4,tm=NT[Math.floor(b.x+b.y)%4];
if(b.kind==='casino'){const fz=cz-b.h/2;m.gt(cx-260,fz-170,cx+260,fz,.22,viceHex('#cfc4ae'),WV,0);m.gq(cx-38,fz-64,cx+38,fz,.26,viceHex('#a31f34'),0);m.b(cx,30,cz,b.w,60,b.h,0,wh,FV[2],.4,RV,0);m.b(cx,82,cz,b.w*.7,45,b.h*.7,0,wh,FV[2],.5,RV,0);m.b(cx,40,fz-3,b.w*.42,36,4,0,wh,CV,.9,U,0);m.b(cx,60,fz-3,b.w*.42+8,3,5,0,[1,.82,.24],U,1);m.b(cx,20,fz-3,b.w*.42+8,3,5,0,[1,.82,.24],U,1);m.b(cx,105,cz,b.w*.7+4,3,b.h*.7+4,0,tm,U,1);m.b(cx,14,fz-12,b.w*.5,3,10,0,[1,.82,.24],U,1);for(const s of[-140,140])m.b(cx+s,40,fz-12,10,80,10,0,wh,CV,.6,U,0);continue;}
if(b.kind==='stadium'){m.b(cx,18,cz,b.w,36,b.h,0,wh,FV[1],.3,RV,0);continue;}
if(b.kind==='lighthouse'){m.tb(cx,45,cz,0,1,0,17,17,90,viceHex('#c94f43'),null,U,.15,8);m.tb(cx,135,cz,0,1,0,15,15,90,wh,null,U,.3,8);m.ba(cx,185,cz,11,6,11,[1,.82,.24],1);continue;}
const hg=viceBuildingHeight(b);
m.b(cx,hg/2,cz,b.w,hg,b.h,0,wh,FV[ti],.12,RV,0);
m.b(cx,hg-2,cz,b.w+4,4,b.h+4,0,tm,U,1);
if(hg>150){const th=hg*.32;m.b(cx,hg+th/2,cz,b.w*.55,th,b.h*.55,0,wh,FV[ti],.15,RV,0);m.b(cx,hg+th-1,cz,b.w*.55+4,3,b.h*.55+4,0,tm,U,1);}
}
const tr2=X('#6b4a2f'),lf=X('#5f7a33'),lf2=X('#74903f');
for(const palm of city.palms){
const lean=((palm.x*7+palm.y*3)%10)/10*.6-.3,lx=Math.sin(lean),lz=Math.cos(lean)*.4;
m.tb(palm.x+lx*7,20,palm.y+lz*7,lx*.35,1,lz*.35,2.4,1.7,40,tr2,null,U,0,6);
const cxp=palm.x+lx*16,czp=palm.y+lz*16;
for(let f=0;f<10;f++){const a=f/10*Math.PI*2+lean,ca=Math.cos(a),sa=Math.sin(a),lc=f%2?lf:lf2,px=-sa,pz=ca,x1=cxp+ca*13,z1=czp+sa*13,x2=cxp+ca*26,z2=czp+sa*26;m.q([cxp+px*3,40,czp+pz*3],[x1+px*3,39,z1+pz*3],[x1-px*3,39,z1-pz*3],[cxp-px*3,40,czp-pz*3],0,1,0,lc,U,0);m.q([x1+px*3,39,z1+pz*3],[x2+px*1.5,30,z2+pz*1.5],[x2-px*1.5,30,z2-pz*1.5],[x1-px*3,39,z1-pz*3],0,1,0,lc,U,0);}
}
let lamp=0;
for(const ax of AVENUES)for(const sy of STREETS){lamp++;if(lamp%2===0)continue;m.tb(ax+70,13,sy+70,0,1,0,1.6,1.2,26,[.15,.15,.17],null,U,0,6);m.tb(ax+66,26,sy+70,-.7,.25,0,1,1,11,[.15,.15,.17],null,U,0,5);m.ba(ax+62,27,sy+70,3.5,2.5,3.5,[1,.85,.55],1);for(let z=0;z<3;z++)m.gq(ax-56,sy-78+z*10,ax+56,sy-72+z*10,.2,wh,0);}
m.gq(0,2624,WORLD.width,2646,.25,viceHex('#8a6f4d'),0);
const dk=X('#4a3f35');
for(let s=0;s<3;s++){const bx=800+s*1000;m.b(bx,10,2780,1000,4,26,0,dk,U,0);}
for(const[bx,bz,by]of[[900,2720,.3],[1500,2720,.15],[2400,2720,-.2]]){m.pr([[-20,0],[18,0],[23,3],[10,5],[-16,5],[-20,2]],8,bx,0,bz,by,X('#e8e2d4'),U,.1);m.pr([[-8,5],[6,5],[8,10],[-6,10]],5,bx,0,bz,by,X('#2f6fd0'),U,.2);}
return m.slice();}
function carBody(m,x,z,angle,L,W,col,kind,wheels){
const yaw=-angle,co=Math.cos(angle),si=Math.sin(angle),hL=L/2,hw=W/2-1;
const P=(a,y,b)=>[x+co*a-si*b,y,z+si*a+co*b];
const pts=[[hL,1.5],[hL,6],[L*.42,7.5],[L*.30,8],[L*.10,9.5],[-L*.10,16.5],[-L*.30,16.5],[-L*.44,9.5],[-hL,7],[-hL,1.5]];
m.pr(pts,hw,x,0,z,yaw,col,U,0);
const gl2=X('#0e1a26');
const gN=(ax,ay)=>{const l=Math.hypot(ax,ay);return[ax/l*co,ay/l,-ax/l*si];};
const g1=gN(7,L*.2),g2=gN(-7,L*.14);
const off=(a,y,b,nn)=>{const qq=P(a,y,b);return[qq[0]+nn[0]*.8,qq[1]+nn[1]*.8,qq[2]+nn[2]*.8];};
m.q(off(L*.10,9.5,-(hw-1),g1),off(L*.10,9.5,hw-1,g1),off(-L*.10,16.5,hw-1,g1),off(-L*.10,16.5,-(hw-1),g1),g1[0],g1[1],g1[2],gl2,U,.45);
m.q(off(-L*.30,16.5,-(hw-1),g2),off(-L*.30,16.5,hw-1,g2),off(-L*.44,9.5,hw-1,g2),off(-L*.44,9.5,-(hw-1),g2),g2[0],g2[1],g2[2],gl2,U,.45);
for(const s of[-1,1])m.q(P(-L*.28,10.5,s*(hw+.4)),P(L*.06,10.5,s*(hw+.4)),P(L*.06,15.5,s*(hw+.4)),P(-L*.28,15.5,s*(hw+.4)),-si*s,0,co*s,gl2,U,.45);
if(wheels)for(const[lx,lz]of[[L*.32,hw+.5],[L*.32,-(hw+.5)],[-L*.32,hw+.5],[-L*.32,-(hw+.5)]]){const w2=P(lx,4.5,lz);m.tb(w2[0],4.5,w2[2],-si,0,co,4.5,4.5,3,[.08,.08,.1],[.75,.75,.78],U,0,6);}
m.q(P(hL+.2,5,-(hw-3)),P(hL+.2,5,hw-3),P(hL+.2,9,hw-3),P(hL+.2,9,-(hw-3)),co,0,si,[1,.9,.6],U,1);
m.q(P(-hL-.2,5,hw-3),P(-hL-.2,5,-(hw-3)),P(-hL-.2,9,-(hw-3)),P(-hL-.2,9,hw-3),-co,0,-si,[.9,.1,.1],U,.5);
if(kind==='muscle'||kind==='sports'){const s2=P(-L*.46,12.5,0);m.b(s2[0],12.5,s2[2],3,1.5,W*.92,yaw,[.08,.08,.1],U,.2);}}
export function buildDyn(state,m){
m.reset();
const skin=X('#e8b98a'),px=state.player.x,pz=state.player.y;
for(const car of state.cars){
const dx=car.x-px,dz=car.y-pz;
if(dx*dx+dz*dz>1200*1200)continue;
const spec=CAR_KINDS[car.kind]||CAR_KINDS.sedan,col=X(car.color||spec.color),L=spec.length,W=spec.width;
carBody(m,car.x,car.y,car.angle,L,W,col,car.kind,true);
if(car.driver==='police'){const fl=Math.floor(state.time*3)%2===0,co=Math.cos(car.angle),si=Math.sin(car.angle);m.ba(car.x-co*4-si*6,19.5,car.y-si*4+co*6,4,2.5,3,fl?[1,.2,.2]:[.2,.4,1],1);m.ba(car.x-co*4+si*6,19.5,car.y-si*4-co*6,4,2.5,3,fl?[.2,.4,1]:[1,.2,.2],1);}
if(car.kind==='taxi')m.b(car.x,22,car.y,14,4,8,-car.angle,[1,.82,.24],U,.8);}
function person(x,y,shirt,angle,phase,hr){
const yaw=-angle,fx=Math.cos(angle),fz=Math.sin(angle),sw=Math.sin(state.time*6+(phase||0))*4,pn=[.15,.15,.18],hc=hr||X('#241a12');
m.b(x+fx*sw,4.5,y+fz*sw,4,9,4,yaw,pn,U,0);
m.b(x-fx*sw,4.5,y-fz*sw,4,9,4,yaw,pn,U,0);
m.b(x,15.5,y,11,13,8,yaw,shirt,U,0);
m.b(x+fx*-sw*.7-fz*7,15,y+fz*-sw*.7+fx*7,3,11,3,yaw,shirt,U,0);
m.b(x+fx*-sw*.7+fz*7,15,y+fz*-sw*.7-fx*7,3,11,3,yaw,shirt,U,0);
m.tb(x,25,y,0,1,0,4.5,7.5,6,skin,null,U,0,8);
m.tb(x,30,y,0,1,0,7.5,4.5,6,skin,null,U,0,8);
m.tb(x,33,y,0,1,0,7.4,4.5,5,hc,null,U,0,8);}
for(const ped of state.peds){if(ped.down>0)continue;const dx=ped.x-px,dz=ped.y-pz;if(dx*dx+dz*dz>1200*1200)continue;person(ped.x,ped.y,X(ped.shirt||'#e8e2d4'),ped.angle||0,ped.x*.7);}
for(const cop of state.cops)person(cop.x,cop.y,X('#2f6fd0'),cop.angle||0,cop.x*.7,X('#16233f'));
for(const rival of state.rivals)person(rival.x,rival.y,X('#a83232'),rival.angle||0,rival.x*.7);
const p=state.player;
if(p.onFoot)person(p.x,p.y,X('#ff5a3c'),p.angle,0);
for(const b of state.bullets)m.b(b.x,2,b.y,10,2,2,-Math.atan2(b.vy,b.vx),[1,.9,.6],U,1);
for(const s of state.skids){const dx=s.x-px,dz=s.y-pz;if(dx*dx+dz*dz>1200*1200)continue;m.gq(s.x-7,s.y-2,s.x+7,s.y+2,.2,[.08,.08,.08],0);}
if(state.objective){const o=state.objective,bob=30+Math.sin(state.time*3)*4,gd=[1,.82,.24];m.q([o.x,bob+14,o.y],[o.x+10,bob,o.y],[o.x,bob-14,o.y],[o.x-10,bob,o.y],0,0,1,gd,U,1);m.q([o.x,bob+14,o.y],[o.x,bob,o.y+10],[o.x,bob-14,o.y],[o.x,bob,o.y-10],1,0,0,gd,U,1);}
const air=state.air;
if(air&&air.heli){const h=air.heli,st=Math.floor(state.time*3)%2===0,fx=Math.cos(h.angle),fz=Math.sin(h.angle),lx=-fz,lz=fx,nv=[.18,.21,.34];
m.ba(h.x,h.z,h.y,36,9,15,nv,.15);
m.ba(h.x,h.z+2,h.y,31,2,16,[.92,.92,.94],.4);
m.ba(h.x+fx*24,h.z+3,h.y+fz*24,14,6,12,X('#0e1a26'),.65);
m.tb(h.x-fx*38,h.z+5,h.y-fz*38,-fx,.08,-fz,5,1.8,45,nv,null,U,.2,6);
const tx=h.x-fx*60,tz=h.y-fz*60;
m.tr([tx,h.z+3,tz],[tx-fx*8,h.z+3,tz-fz*8],[tx-fx*4,h.z+13,tz-fz*4],lx,0,lz,nv,U,.2);
m.tr([tx,h.z+3,tz],[tx-fx*4,h.z+13,tz-fz*4],[tx-fx*8,h.z+3,tz-fz*8],-lx,0,-lz,nv,U,.2);
m.tb(h.x,h.z+11,h.y,0,1,0,2.2,2.2,6,[.1,.1,.12],null,U,0,5);
for(let k=0;k<2;k++){const ra=h.rotor+k*Math.PI/2,bx=Math.cos(ra),bz=Math.sin(ra),px2=-bz,pz2=bx;m.q([h.x+bx*36+px2*1.5,h.z+15,h.y+bz*36+pz2*1.5],[h.x-bx*36+px2*1.5,h.z+15,h.y-bz*36+pz2*1.5],[h.x-bx*36-px2*1.5,h.z+15,h.y-bz*36-pz2*1.5],[h.x+bx*36-px2*1.5,h.z+15,h.y+bz*36-pz2*1.5],0,1,0,[.4,.4,.46],U,.3);}
for(const s of[-10,10]){m.tb(h.x+lx*s,h.z-11,h.y+lz*s,fx,0,fz,1.2,1.2,60,[.15,.15,.17],null,U,0,5);m.tb(h.x+lx*s,h.z-6,h.y+lz*s,0,1,0,1,1,10,[.15,.15,.17],null,U,0,5);}
m.ba(h.x+fx*28,h.z-8,h.y+fz*28,4,3,4,[1,.95,.8],1);
m.ba(tx,h.z+8,tz,3,3,3,st?[1,.2,.2]:[.2,.4,1],1);}
for(const w of state.wrecks||[])carBody(m,w.x,w.y,w.angle-.22,52,24,[.28,.26,.26],'sedan',false);
if(state.race&&state.race.active){const circ=StreetRaceCircuit.CIRCUITS[state.race.circuit];if(!circ)return m.slice();const cg=circ.gates;for(let i=0;i<cg.length;i++){const g=cg[i],col=i===state.race.gate?[1,.18,.55]:[0,.9,1];for(const s of[-30,30])m.tb(g[0]+s,22,g[1],0,1,0,3,2,44,col,null,U,1,6);m.tb(g[0],44,g[1],1,0,0,2.5,2.5,66,col,null,U,1,5);m.gq(g[0]-33,g[1]-4,g[0]+33,g[1]+4,.3,col,.9);}}
return m.slice();}
export function buildAdd(state,m){
m.reset();
function bm(a,b,c,d,e,f,r0,r1,col,emi){const dx=d-a,dy=e-b,dz=f-c,L=Math.hypot(dx,dy,dz)||1,px=-dz/L,pz=dx/L,qx=dy/L*pz,qy=dz/L*px-dx/L*pz,qz=-dy/L*px;m.q([a+px*r0,b,c+pz*r0],[d+px*r1,e,f+pz*r1],[d-px*r1,e,f-pz*r1],[a-px*r0,b,c-pz*r0],0,1,0,col,U,emi);m.q([a+qx*r0,b+qy*r0,c+qz*r0],[d+qx*r1,e+qy*r1,f+qz*r1],[d-qx*r1,e-qy*r1,f-qz*r1],[a-qx*r0,b-qy*r0,c-qz*r0],0,1,0,col,U,emi);}
function vb(x,y,h,w,col,emi){m.q([x-w,0,y],[x+w,0,y],[x+w,h,y],[x-w,h,y],0,0,1,col,U,emi);m.q([x,0,y-w],[x,0,y+w],[x,h,y+w],[x,h,y-w],1,0,0,col,U,emi);}
const p=state.player;
for(const car of state.cars){
const dx=car.x-p.x,dz=car.y-p.y;
if(dx*dx+dz*dz>1200*1200)continue;
const spec=CAR_KINDS[car.kind]||CAR_KINDS.sedan,L=spec.length,co=Math.cos(car.angle),si=Math.sin(car.angle),X=(a,b)=>car.x+co*a-si*b,Z=(a,b)=>car.y+si*a+co*b;
m.tr([X(L/2,0),.5,Z(L/2,0)],[X(L/2+48,16),.5,Z(L/2+48,16)],[X(L/2+48,-16),.5,Z(L/2+48,-16)],0,1,0,[1,.85,.5],U,.22);
if(car.driver==='player'&&state.upgrades&&state.upgrades.glow>0)m.gq(car.x-22,car.y-16,car.x+22,car.y+16,.4,[0,.55,.6],.35);
if(car.driver==='race')m.gq(car.x-22,car.y-16,car.x+22,car.y+16,.4,[.6,.1,.32],.35);
if(car.driver==='police'){const fl=Math.floor(state.time*3)%2===0,fc=fl?[1,.15,.15]:[.15,.35,1],fc2=fl?[1,.35,.35]:[.35,.55,1];m.gq(car.x-60,car.y-45,car.x+60,car.y+45,.35,fc,.5);m.gq(car.x-30,car.y-22,car.x+30,car.y+22,.4,fc2,.45);}
if(car.driver==='player'&&state.nitrousT>0)for(const s of[-6,6]){const ex=car.x-co*(L/2+2)-si*s,ez=car.y-si*(L/2+2)+co*s;bm(ex,3,ez,ex-co*62,3,ez-si*62,2.5,6,[.2,.55,1],.55);bm(ex,3,ez,ex-co*38,3,ez-si*38,1.5,3.5,[.5,.85,1],.65);}}
let dn=0;
for(const pt of state.particles){if(dn>=30)break;const dx=pt.x-p.x,dz=pt.y-p.y;if(dx*dx+dz*dz>1200*1200)continue;const s=pt.size||3;m.gq(pt.x-s,pt.y-s,pt.x+s,pt.y+s,1,X(pt.color||'#ffd23d'),.6);dn++;}
if(state.objective)vb(state.objective.x,state.objective.y,150,5,[1,.82,.24],.3);
const air=state.air;
if(air&&air.heli){const h=air.heli;bm(h.x,h.z-2,h.y,h.spotX,1,h.spotY,10,45,[1,.8,.4],.5);bm(h.x,h.z-2,h.y,h.spotX,1,h.spotY,5,24,[1,.9,.6],.6);m.gq(h.spotX-60,h.spotY-60,h.spotX+60,h.spotY+60,.3,[1,.9,.6],.5);}
for(const w of state.wrecks||[]){const fl=1+Math.sin(state.time*9+w.x)*.15;m.gq(w.x-46,w.y-46,w.x+46,w.y+46,.35,[1,.32,.06],.5);for(let k=0;k<3;k++){const fx=w.x+(k-1)*9,fw=(26-k*3)*fl,fh=(48-k*6)*fl,fc=k===0?[1,.28,.02]:k===1?[1,.52,.06]:[1,.82,.28];m.q([fx-fw,10,w.y],[fx+fw,10,w.y],[fx+fw,10+fh,w.y],[fx-fw,10+fh,w.y],0,0,1,fc,U,.95);m.q([fx,10,w.y-fw],[fx,10,w.y+fw],[fx,10+fh,w.y+fw],[fx,10+fh,w.y-fw],1,0,0,fc,U,.95);}}
return m.slice();}
export function buildSmk(state,m){
m.reset();
const p=state.player;
for(const w of state.wrecks||[]){const dx=w.x-p.x,dz=w.y-p.y;if(dx*dx+dz*dz>1200*1200)continue;const dr=Math.sin(state.time*.7+w.x)*6;for(let k=0;k<5;k++){const sy=22+k*20,sr=16+k*8,sa=.5-k*.06,sx=w.x-10-k*4+dr,sz=w.y-2+k*2,g2=.08+k*.02,sc=[g2,g2,g2+.02];m.q([sx-sr,sy,sz],[sx+sr,sy,sz],[sx+sr,sy+sr*1.6,sz],[sx-sr,sy+sr*1.6,sz],0,0,1,sc,U,sa);m.q([sx,sy,sz-sr],[sx,sy,sz+sr],[sx,sy+sr*1.6,sz+sr],[sx,sy+sr*1.6,sz-sr],1,0,0,sc,U,sa);}}
return m.slice();}
