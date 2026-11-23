// @vertex
precision highp float;
attribute vec3 aPos;
uniform mat4 uVP;
uniform float uTime;
varying vec3 vWp;
varying float vWave;
void main(){
  vec3 p=aPos;
  float w=sin(p.x*0.02+uTime*1.2)*1.1+cos(p.z*0.025+uTime*0.9)*1.1;
  p.y+=w;
  vWp=p;
  vWave=w;
  gl_Position=uVP*vec4(p,1.0);
}
// @fragment
precision highp float;
varying vec3 vWp;
varying float vWave;
uniform vec3 uSunDir;
uniform vec3 uCam;
uniform float uTime;
void main(){
  vec3 n=normalize(vec3(sin(vWp.x*0.08+uTime)*0.16+sin(vWp.x*0.31-uTime*1.7)*0.07,1.0,cos(vWp.z*0.07+uTime*0.8)*0.16+cos(vWp.z*0.27+uTime*1.3)*0.07));
  vec3 v=normalize(uCam-vWp);
  vec3 sd=normalize(uSunDir);
  vec3 r=reflect(-sd,n);
  float sp=pow(max(dot(r,v),0.0),60.0);
  vec3 deep=vec3(0.02,0.16,0.28);
  vec3 shal=vec3(0.05,0.38,0.44);
  vec3 col=mix(deep,shal,0.5+0.5*vWave*0.4);
  float d=length(uCam-vWp);
  float f=1.0-exp(-0.00012*d*d);
  col=mix(col,vec3(0.10,0.30,0.38),clamp(f,0.0,1.0));
  vec3 toSun=normalize(vec3(sd.x,0.0,sd.z));
  vec3 toCam=normalize(vec3(vWp.x-uCam.x,0.0,vWp.z-uCam.z));
  float path=pow(max(dot(toSun,toCam),0.0),3.0)*smoothstep(0.9,0.2,abs(dot(normalize(vec3(-toSun.z,0.0,toSun.x)),toCam)));
  float glit=pow(0.5+0.5*sin(vWp.x*0.9+uTime*2.0)*sin(vWp.z*1.1-uTime*1.6),8.0);
  col+=vec3(1.0,0.55,0.20)*sp*1.6;
  col+=vec3(1.0,0.60,0.22)*path*(0.35+0.65*glit);
  gl_FragColor=vec4(col,1.0);
}
