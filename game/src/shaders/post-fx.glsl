// @vertex
precision highp float;
attribute vec2 aPos;varying vec2 vUv;
void main(){vUv=aPos*.5+.5;gl_Position=vec4(aPos,0.,1.);}
// @fragment
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;uniform sampler2D uBloom;uniform float uMode;uniform vec2 uTexel;
void main(){
if(uMode>.5){
vec2 d=(uMode>1.5)?vec2(0.,uTexel.y):vec2(uTexel.x,0.);
vec3 c=texture2D(uScene,vUv-2.*d).rgb*.06136+texture2D(uScene,vUv-d).rgb*.24477+texture2D(uScene,vUv).rgb*.38774+texture2D(uScene,vUv+d).rgb*.24477+texture2D(uScene,vUv+2.*d).rgb*.06136;
if(uMode<1.5){float l=dot(c,vec3(.2126,.7152,.0722));c*=smoothstep(.72,1.1,l);}
gl_FragColor=vec4(c,1.);return;}
vec3 c=texture2D(uScene,vUv).rgb+texture2D(uBloom,vUv).rgb*.6;
c=max(c,vec3(0.));
c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);
float l=dot(c,vec3(.2126,.7152,.0722));
c=mix(vec3(l),c,1.25);
c=pow(c,vec3(1.12));
c*=vec3(1.06,1.,.94);
c=pow(c,vec3(1./2.2));
gl_FragColor=vec4(c,1.);}
