// @vertex
precision highp float;
attribute vec3 aPos;uniform mat4 uVP;varying vec3 vWp;
void main(){vWp=aPos;gl_Position=uVP*vec4(aPos,1.0);}
// @fragment
precision highp float;
varying vec3 vWp;
uniform vec3 uSD;uniform vec3 uCam;uniform float uTime;uniform vec3 uFC;
float wv(vec2 p){float t=uTime;return sin(p.x*0.05+t*1.1)*0.9+sin(p.y*0.07-t*0.8)*0.7+sin((p.x+p.y)*0.16+t*1.6)*0.45;}
void main(){
vec2 p=vWp.xz;float e=2.0;
float hx=wv(p+vec2(e,0.0))-wv(p-vec2(e,0.0)),hz=wv(p+vec2(0.0,e))-wv(p-vec2(0.0,e));
vec3 n=normalize(vec3(-hx/(2.0*e),1.0,-hz/(2.0*e)));
vec3 v=normalize(uCam-vWp),sd=normalize(uSD),r=reflect(-v,n);
float fres=pow(1.0-max(dot(v,n),0.0),5.0);
vec3 skyRef=mix(vec3(0.45,0.10,0.22),vec3(0.85,0.32,0.08),pow(max(r.y,0.0),0.5));
skyRef=mix(vec3(0.08,0.05,0.16),skyRef,smoothstep(-0.05,0.25,r.y));
float s=max(dot(r,sd),0.0);
vec3 col=mix(vec3(0.02,0.14,0.26),vec3(0.03,0.30,0.40),0.5+0.5*sin(wv(p)*1.4));
col=mix(col,skyRef,clamp(fres*0.85+0.08,0.0,1.0));
col+=vec3(1.0,0.55,0.20)*pow(s,300.0)*4.0+vec3(1.0,0.68,0.28)*pow(s,24.0)*0.5;
vec3 toSun=normalize(vec3(sd.x,0.0,sd.z)),toCam=normalize(vec3(vWp.x-uCam.x,0.0,vWp.z-uCam.z));
float path=pow(max(dot(toSun,toCam),0.0),6.0)*smoothstep(0.9,0.2,abs(dot(normalize(vec3(-toSun.z,0.0,toSun.x)),toCam)));
float glit=pow(0.5+0.5*sin(p.x*0.9+uTime*2.0)*sin(p.y*1.1-uTime*1.6),8.0);
col+=vec3(1.0,0.68,0.28)*path*(0.4+1.6*glit);
float foam=(1.0-smoothstep(2628.0,2652.0,vWp.z))*(0.5+0.5*sin(p.x*0.35+uTime*1.5));
col+=vec3(0.9,0.95,0.9)*foam*0.35;
float d=length(uCam-vWp);
col=mix(col,skyRef,clamp(1.0-exp(-0.00008*d),0.0,1.0)*0.85);
gl_FragColor=vec4(col,1.0);}
