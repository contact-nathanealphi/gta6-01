// @vertex
precision highp float;
attribute vec3 aPos;attribute vec3 aNor;attribute vec3 aCol;attribute vec2 aUv;attribute float aEmi;
uniform mat4 uVP;uniform mat4 uSP;uniform vec3 uCam;
varying vec3 vNor;varying vec3 vCol;varying vec2 vUv;varying float vEmi;varying vec3 vWp;varying float vDist;varying vec4 vSh;
void main(){vWp=aPos;vNor=aNor;vCol=aCol;vUv=aUv;vEmi=aEmi;vDist=distance(uCam,aPos);vSh=uSP*vec4(aPos,1.);gl_Position=uVP*vec4(aPos,1.);}
// @fragment
precision highp float;
varying vec3 vNor;varying vec3 vCol;varying vec2 vUv;varying float vEmi;varying vec3 vWp;varying float vDist;varying vec4 vSh;
uniform sampler2D uTex;uniform sampler2D uSH;
uniform vec3 uSD;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFC;
uniform float uFogDen;uniform float uSoft;uniform float uSHO;uniform vec3 uCam;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
vec3 env(vec3 r){vec3 sd=normalize(uSD);float s=max(dot(r,sd),0.);vec3 c=mix(vec3(.45,.1,.22),vec3(.85,.32,.08),pow(max(r.y,0.),.5));c=mix(vec3(.08,.05,.16),c,smoothstep(-.05,.25,r.y));c+=vec3(1.,.5,.15)*pow(s,180.)*6.+vec3(1.,.75,.4)*pow(s,8.)*.35;return c;}
void main(){
vec3 base=texture2D(uTex,vUv).rgb*vCol;
vec3 n=normalize(vNor),sd=normalize(uSD),v=normalize(uCam-vWp);
float dif=max(dot(n,sd),0.),sh=1.;
if(uSHO>.5){vec3 sp=vSh.xyz/vSh.w;if(sp.x>0.&&sp.x<1.&&sp.y>0.&&sp.y<1.){float bias=max(.004*(1.-dot(n,sd)),.001),s2=0.;for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)s2+=step(sp.z-bias,texture2D(uSH,sp.xy+vec2(float(i),float(j))/1024.).r);sh=s2/9.;}}
vec3 amb=mix(uAmb*vec3(.55,.42,.38),uAmb,n.y*.5+.5);
vec3 col=base*(amb+uSunCol*dif*sh*1.7);
vec3 h=normalize(sd+v);
col+=uSunCol*pow(max(dot(n,h),0.),32.)*.45*(.4+.6*sh);
vec3 r=reflect(-v,n);
float fres=pow(1.-max(dot(n,v),0.),5.),lum=dot(base,vec3(.33));
float pd=smoothstep(.8,.95,vn(vWp.xz*.045));
float wet=step(.9,n.y)*pd*step(lum,.12);
col+=env(r)*(fres*.06+wet*.25);
col+=vec3(1.,.55,.2)*pow(max(dot(r,sd),0.),60.)*wet*.6;
vec3 toSun=normalize(vec3(sd.x,0.,sd.z)),toCam=normalize(vec3(vWp.x-uCam.x,0.,vWp.z-uCam.z));
float path=pow(max(dot(toSun,toCam),0.),6.);
col+=vec3(1.,.35,.45)*path*wet*.25+vec3(.35,.55,1.)*path*wet*.2;
vec3 fc=mix(uFC,vec3(1.,.55,.25),pow(max(dot(normalize(vWp-uCam),sd),0.),3.)*.5);
float f=1.-exp(-uFogDen*uFogDen*vDist*vDist);
col=mix(col,fc,clamp(f,0.,1.));
col=mix(col,base*2.2,vEmi);
float ll=dot(col,vec3(.33));
col=mix(vec3(ll),col,1.18);
vec2 q=(vUv-vec2(.25,.6875))/.0625;
float rad=pow(clamp(1.-length(q-.5)*2.,0.,1.),2.2);
float fa=uSoft<.5?1.:rad;
gl_FragColor=vec4(col,vEmi*fa);}
