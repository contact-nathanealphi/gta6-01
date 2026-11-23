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
  vec3 n=normalize(vec3(sin(vWp.x*0.08+uTime)*0.12,1.0,cos(vWp.z*0.07+uTime*0.8)*0.12));
  vec3 v=normalize(uCam-vWp);
  vec3 r=reflect(-normalize(uSunDir),n);
  float sp=pow(max(dot(r,v),0.0),60.0);
  vec3 col=mix(vec3(0.05,0.2,0.35),vec3(0.1,0.45,0.55),0.5+0.5*vWave*0.4);
  col+=vec3(1.0,0.55,0.25)*sp*1.5;
  float d=length(uCam-vWp);
  float f=1.0-exp(-0.00012*d*d);
  col=mix(col,vec3(0.45,0.2,0.4),clamp(f,0.0,1.0));
  gl_FragColor=vec4(col,1.0);
}
