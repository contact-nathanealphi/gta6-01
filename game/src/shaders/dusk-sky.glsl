// @vertex
precision highp float;
attribute vec3 aPos;
uniform mat4 uVP;
uniform vec3 uCam;
varying vec3 vDir;
void main(){
  vDir=aPos;
  vec4 p=uVP*vec4(aPos+uCam,1.0);
  gl_Position=p.xyww;
}
// @fragment
precision highp float;
varying vec3 vDir;
uniform vec3 uSunDir;
uniform float uTime;
void main(){
  vec3 d=normalize(vDir);
  float h=d.y;
  vec3 sd=normalize(uSunDir);
  float s=dot(d,sd);
  vec3 hor=vec3(1.0,0.55,0.20);
  vec3 mid=vec3(0.78,0.26,0.38);
  vec3 top=vec3(0.09,0.06,0.26);
  vec3 col=mix(hor,mid,smoothstep(0.0,0.28,h));
  col=mix(col,top,smoothstep(0.22,0.75,h));
  col=mix(vec3(0.14,0.09,0.22),col,smoothstep(-0.12,0.02,h));
  float disc=smoothstep(0.9985,0.9995,s);
  float halo=pow(max(s,0.0),6.0)*smoothstep(0.55,0.0,abs(h-0.06));
  col=mix(col,vec3(1.0,0.42,0.06),disc*0.95);
  col+=vec3(1.0,0.55,0.22)*halo*0.9;
  col+=vec3(1.0,0.45,0.18)*pow(max(s,0.0),20.0)*0.55;
  float c=sin(d.x*5.0+uTime*0.02)*sin(d.z*7.0-uTime*0.013);
  col+=vec3(0.85,0.45,0.55)*smoothstep(0.72,0.96,c)*smoothstep(0.04,0.3,h)*0.22;
  gl_FragColor=vec4(col,1.0);
}
