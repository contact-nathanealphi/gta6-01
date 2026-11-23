// @vertex
precision highp float;
attribute vec3 aPos;uniform mat4 uVP;varying vec3 vWp;
void main(){vWp=aPos;gl_Position=uVP*vec4(aPos,1.);}
// @fragment
precision highp float;
varying vec3 vWp;
uniform vec3 uSD;uniform vec3 uCam;uniform float uTime;uniform vec3 uFC;
float wv(vec2 p){float t=uTime;return sin(p.x*.05+t*1.1)*.9+sin(p.y*.07-t*.8)*.7+sin((p.x+p.y)*.16+t*1.6)*.45;}
void main(){
vec2 p=vWp.xz;float e=2.;
float hx=wv(p+vec2(e,0.))-wv(p-vec2(e,0.)),hz=wv(p+vec2(0.,e))-wv(p-vec2(0.,e));
vec3 n=normalize(vec3(-hx/(2.*e),1.,-hz/(2.*e)));
vec3 v=normalize(uCam-vWp),sd=normalize(uSD),r=reflect(-v,n);
float fres=pow(1.-max(dot(v,n),0.),5.);
vec3 skyRef=mix(vec3(.45,.1,.22),vec3(.85,.32,.08),pow(max(r.y,0.),.5));
skyRef=mix(vec3(.08,.05,.16),skyRef,smoothstep(-.05,.25,r.y));
float s=max(dot(r,sd),0.);
vec3 col=mix(vec3(.01,.2,.32),vec3(.02,.42,.5),.5+.5*sin(wv(p)*1.4));
col=mix(col,skyRef,clamp(fres*.85+.08,0.,1.));
col+=vec3(1.,.55,.2)*pow(s,300.)*6.+vec3(1.,.68,.28)*pow(s,24.)*.7;
vec3 toSun=normalize(vec3(sd.x,0.,sd.z)),toCam=normalize(vec3(vWp.x-uCam.x,0.,vWp.z-uCam.z));
float path=pow(max(dot(toSun,toCam),0.),6.)*smoothstep(.9,.2,abs(dot(normalize(vec3(-toSun.z,0.,toSun.x)),toCam)));
float glit=pow(.5+.5*sin(p.x*.9+uTime*2.)*sin(p.y*1.1-uTime*1.6),8.);
col+=vec3(1.,.68,.28)*path*(.6+2.2*glit);
float d=length(uCam-vWp);
col=mix(col,skyRef,clamp(1.-exp(-.00008*d),0.,1.)*.6);
gl_FragColor=vec4(col,1.);}
