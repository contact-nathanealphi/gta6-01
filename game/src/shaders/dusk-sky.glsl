// @vertex
precision highp float;
attribute vec3 aPos;uniform mat4 uVP;uniform vec3 uCam;varying vec3 vDir;
void main(){vDir=aPos;vec4 p=uVP*vec4(aPos+uCam,1.);gl_Position=vec4(p.xy,p.w*.9999,p.w);}
// @fragment
precision highp float;
varying vec3 vDir;uniform vec3 uSD;uniform float uTime;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return vn(p)*.7+vn(p*2.3)*.3;}
void main(){
vec3 d=normalize(vDir);float h=d.y;vec3 sd=normalize(uSD);float s=dot(d,sd);
vec3 col=mix(vec3(.98,.42,.06),vec3(.85,.25,.12),smoothstep(0.,.16,h));
col=mix(col,vec3(.16,.07,.26),smoothstep(.18,.7,h));
col=mix(vec3(.12,.06,.2),col,smoothstep(-.12,.02,h));
float disc=smoothstep(.9965,.998,s);
col+=vec3(1.,.5,.3)*pow(max(s,0.),6.)*smoothstep(.55,0.,abs(h-.06))*.08;
col+=vec3(1.,.45,.18)*pow(max(s,0.),24.)*.06;
col=mix(col,vec3(1.3,.5,.1),disc*.95);
vec2 cuv=d.xz/(abs(h)+.18)*1.4+vec2(uTime*.004,0.);
float cm=smoothstep(.6,.8,fbm(cuv))*smoothstep(.02,.25,h)*smoothstep(.85,.45,h);
vec3 cc=mix(vec3(.45,.2,.18),vec3(1.,.6,.3),pow(max(s,0.),2.));
cc=mix(cc,vec3(1.,.55,.25),smoothstep(.5,.8,fbm(cuv*2.7+vec2(0.,uTime*.002)))*.6);
col=mix(col,cc,cm*.55);
gl_FragColor=vec4(col,1.);}