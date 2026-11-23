// @vertex
precision highp float;
attribute vec2 aPos;varying vec2 vUv;
void main(){vUv=aPos*0.5+0.5;gl_Position=vec4(aPos,0.0,1.0);}
// @fragment
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;uniform sampler2D uBloom;uniform float uMode;uniform vec2 uTexel;
void main(){
if(uMode>0.5){
vec2 d=(uMode>1.5)?vec2(0.0,uTexel.y):vec2(uTexel.x,0.0);
vec3 c=texture2D(uScene,vUv-2.0*d).rgb*0.06136+texture2D(uScene,vUv-d).rgb*0.24477+texture2D(uScene,vUv).rgb*0.38774+texture2D(uScene,vUv+d).rgb*0.24477+texture2D(uScene,vUv+2.0*d).rgb*0.06136;
if(uMode<1.5){float l=dot(c,vec3(0.2126,0.7152,0.0722));c*=smoothstep(0.72,1.1,l);}
gl_FragColor=vec4(c,1.0);return;}
vec3 c=texture2D(uScene,vUv).rgb+texture2D(uBloom,vUv).rgb*0.6;
c=max(c,vec3(0.0));
c=(c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14);
c*=vec3(1.04,0.99,0.96);
vec2 q=vUv-0.5;
c*=1.0-dot(q,q)*0.55;
c=pow(c,vec3(1.0/2.2));
gl_FragColor=vec4(c,1.0);}
