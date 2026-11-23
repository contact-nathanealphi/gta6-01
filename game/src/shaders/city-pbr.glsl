// @vertex
precision highp float;
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec3 aCol;
attribute vec2 aUv;
attribute float aEmi;
uniform mat4 uVP;
uniform vec3 uCam;
varying vec3 vNor;
varying vec3 vCol;
varying vec2 vUv;
varying float vEmi;
varying vec3 vWp;
varying float vDist;
void main(){
  vWp=aPos;
  vNor=aNor;
  vCol=aCol;
  vUv=aUv;
  vEmi=aEmi;
  vDist=length(uCam-aPos);
  gl_Position=uVP*vec4(aPos,1.0);
}
// @fragment
precision highp float;
varying vec3 vNor;
varying vec3 vCol;
varying vec2 vUv;
varying float vEmi;
varying vec3 vWp;
varying float vDist;
uniform sampler2D uTex;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uAmb;
uniform vec3 uFogCol;
uniform float uFogDen;
uniform float uSoft;
uniform vec3 uCam;
void main(){
  vec3 base=texture2D(uTex,vUv).rgb*vCol;
  vec3 n=normalize(vNor);
  vec3 sd=normalize(uSunDir);
  float dif=max(dot(n,sd),0.0);
  vec3 sh=mix(vec3(.3,.22,.4),uSunCol*1.4,dif);
  vec3 col=base*(uAmb*0.55+sh);
  vec3 v=normalize(uCam-vWp);
  vec3 h=normalize(sd+v);
  float sp=pow(max(dot(n,h),0.0),28.0);
  col+=uSunCol*sp*0.45;
  col+=vec3(1.0,0.55,0.2)*pow(max(dot(n,normalize(vec3(-0.6,0.25,0.6))),0.0),3.0)*0.28;
  vec3 r=reflect(-v,n);
  float wet=step(0.9,n.y)*(1.0-step(0.3,vCol.r))*(1.0-step(0.3,vCol.g));
  float glint=pow(max(dot(r,sd),0.0),24.0);
  float roadWet=step(0.9,n.y)*step(abs(vCol.r-0.20),0.06)*step(abs(vCol.g-0.22),0.06);
  float streak=pow(max(dot(r,normalize(vec3(0.9,0.25,0.3))),0.0),30.0);
  col+=uSunCol*glint*wet*0.35;
  col+=vec3(1.0,0.62,0.25)*streak*roadWet*0.7+vec3(0.35,0.55,1.0)*pow(max(dot(r,normalize(vec3(-0.4,0.35,0.8))),0.0),10.0)*roadWet*0.5;
  float f=1.0-exp(-uFogDen*uFogDen*vDist*vDist);
  col=mix(col,uFogCol,clamp(f,0.0,1.0));
  col=mix(col,base*1.7,vEmi);
  vec2 q=(vUv-vec2(.25,.6875))/.0625;
  float rad=pow(clamp(1.-length(q-.5)*2.,0.,1.),2.2);
  float fa=uSoft<.5?1.:rad;
  gl_FragColor=vec4(col,vEmi*fa);
}
