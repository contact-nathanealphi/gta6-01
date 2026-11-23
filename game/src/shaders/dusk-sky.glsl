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
  vec3 hor=vec3(1.0,0.52,0.22);
  vec3 mid=vec3(0.72,0.22,0.42);
  vec3 top=vec3(0.10,0.07,0.28);
  vec3 col=mix(hor,mid,smoothstep(0.0,0.28,h));
  col=mix(col,top,smoothstep(0.22,0.75,h));
  col=mix(vec3(0.16,0.10,0.24),col,smoothstep(-0.12,0.02,h));
  float s=dot(d,normalize(uSunDir));
  col+=vec3(1.0,0.72,0.42)*smoothstep(0.9982,0.9996,s)*3.0;
  col+=vec3(1.0,0.45,0.18)*pow(max(s,0.0),20.0)*0.55;
  float c=sin(d.x*5.0+uTime*0.02)*sin(d.z*7.0-uTime*0.013);
  col+=vec3(0.85,0.45,0.55)*smoothstep(0.72,0.96,c)*smoothstep(0.04,0.3,h)*0.22;
  gl_FragColor=vec4(col,1.0);
}
