// @vertex
precision highp float;
attribute vec3 aPos;uniform mat4 uVP;uniform vec3 uCam;varying vec3 vDir;
void main(){vDir=aPos;vec4 p=uVP*vec4(aPos+uCam,1.0);gl_Position=p.xyww;}
// @fragment
precision highp float;
varying vec3 vDir;uniform vec3 uSD;uniform float uTime;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x),f.y);}
float fbm(vec2 p){return vn(p)*0.6+vn(p*2.3)*0.3+vn(p*5.1)*0.15;}
void main(){
vec3 d=normalize(vDir);float h=d.y;vec3 sd=normalize(uSD);float s=dot(d,sd);
vec3 col=mix(vec3(0.85,0.32,0.08),vec3(0.62,0.14,0.30),smoothstep(0.0,0.28,h));
col=mix(col,vec3(0.10,0.06,0.22),smoothstep(0.22,0.75,h));
col=mix(vec3(0.10,0.06,0.18),col,smoothstep(-0.12,0.02,h));
float disc=smoothstep(0.9993,0.9997,s);
col+=vec3(1.0,0.5,0.3)*pow(max(s,0.0),6.0)*smoothstep(0.55,0.0,abs(h-0.06))*0.9;
col+=vec3(1.0,0.45,0.18)*pow(max(s,0.0),24.0)*0.8;
col+=vec3(1.0,0.75,0.4)*pow(max(s,0.0),350.0)*3.0;
col=mix(col,vec3(1.0,0.85,0.45),disc*0.98);
vec2 cuv=d.xz/(abs(h)+0.18)*1.4+vec2(uTime*0.004,0.0);
float cm=smoothstep(0.55,0.78,fbm(cuv))*smoothstep(0.02,0.25,h)*smoothstep(0.85,0.45,h);
vec3 cc=mix(vec3(0.35,0.18,0.32),vec3(1.0,0.6,0.3),pow(max(s,0.0),2.0));
cc=mix(cc,vec3(1.0,0.55,0.25),smoothstep(0.5,0.8,fbm(cuv*2.7+vec2(0.0,uTime*0.002)))*0.6);
col=mix(col,cc,cm*0.75);
gl_FragColor=vec4(col,1.0);}
