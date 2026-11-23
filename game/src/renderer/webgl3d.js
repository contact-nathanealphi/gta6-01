// True 3D Vice-Dusk WebGL2 renderer (pure WebGL2, no libraries, no network):
// reads the same 2D simulation state in real time and paints it as a third-
// person 3D city at golden hour. Falls back to the Canvas 2D renderer when
// WebGL2 is unavailable. Camera: chase (V cycles chase / cinematic / top-down).

import { WORLD } from '../tune.js';
import { createViceDuskTextureAtlas } from './textures3d.js';
import { VICE_VERT_STRIDE, buildViceCityStaticGeometry, buildViceDynamicGeometry, viceCreateMesh } from './meshes3d.js';

async function viceLoadShaderText(url) {
  const res = await fetch(url);
  const src = await res.text();
  const parts = src.split('// @fragment');
  return { vsrc: parts[0].replace('// @vertex', '').trim(), fsrc: parts[1].trim() };
}

function viceCompileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('ViceDusk shader error:', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

function viceCreateProgram(gl, vsrc, fsrc) {
  const vs = viceCompileShader(gl, gl.VERTEX_SHADER, vsrc);
  const fs = viceCompileShader(gl, gl.FRAGMENT_SHADER, fsrc);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('ViceDusk link error:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

function vicePerspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}

function viceLookAt(eye, target, up) {
  let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
  let l = Math.hypot(zx, zy, zz);
  zx /= l; zy /= l; zz /= l;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz);
  xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1];
}

function viceMul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function viceDuskSun(hour) {
  const t = ((hour - 6) / 12) * Math.PI;
  const el = Math.max(0.08, Math.sin(t));
  const dir = [-Math.cos(t), el, 0.3];
  const l = Math.hypot(dir[0], dir[1], dir[2]);
  dir[0] /= l; dir[1] /= l; dir[2] /= l;
  const warm = 1 - Math.min(1, el * 2.5);
  const col = [1, 1 - 0.45 * warm, 1 - 0.75 * warm];
  return { dir, col, amb: [0.38, 0.26, 0.46], fog: [0.45, 0.2, 0.4] };
}

function viceSkyCube() {
  const s = 4000;
  const v = [[-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s], [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]];
  const f = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];
  const out = new Float32Array(36 * 3);
  let n = 0;
  for (const [a, b, c, d] of f) {
    for (const [i, j, k] of [[a, b, c], [a, c, d]]) {
      for (const idx of [i, j, k]) { out[n] = v[idx][0]; out[n + 1] = v[idx][1]; out[n + 2] = v[idx][2]; n += 3; }
    }
  }
  return out;
}

function viceWaterGrid() {
  const cols = 32, rows = 10;
  const x0 = -200, x1 = 3800, z0 = 2630, z1 = 3050;
  const verts = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const ax = x0 + (x1 - x0) * (c / cols), az = z0 + (z1 - z0) * (r / rows);
      const bx = x0 + (x1 - x0) * ((c + 1) / cols), bz = z0 + (z1 - z0) * ((r + 1) / rows);
      verts.push(ax, 0, az, bx, 0, az, bx, 0, bz, ax, 0, az, bx, 0, bz, ax, 0, bz);
    }
  }
  return new Float32Array(verts);
}

export async function createWebGL3DViceDuskRenderer(canvas2d) {
  const glCanvas = document.createElement('canvas');
  glCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
  canvas2d.parentNode.insertBefore(glCanvas, canvas2d);
  const gl = glCanvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) { glCanvas.remove(); return null; }
  const base = new URL('../shaders/', import.meta.url);
  let sky, city, water;
  try {
    sky = await viceLoadShaderText(new URL('dusk-sky.glsl', base));
    city = await viceLoadShaderText(new URL('city-pbr.glsl', base));
    water = await viceLoadShaderText(new URL('ocean-water.glsl', base));
  } catch {
    glCanvas.remove();
    return null;
  }
  const skyProg = viceCreateProgram(gl, sky.vsrc, sky.fsrc);
  const cityProg = viceCreateProgram(gl, city.vsrc, city.fsrc);
  const waterProg = viceCreateProgram(gl, water.vsrc, water.fsrc);
  if (!skyProg || !cityProg || !waterProg) { glCanvas.remove(); return null; }
  const atlas = createViceDuskTextureAtlas(gl);
  const dynMesh = viceCreateMesh(16000);
  let staticBuf = null, staticCount = 0;
  let skyBuf = null, waterBuf = null, dynBuf = null;
  let viewW = 0, viewH = 0, dpr = 1;
  let mode = 0;
  let visible = true;
  const smoothEye = [0, 0, 0];
  let eyeInit = false;

  function bindAttribs(prog, buf, stride, defs) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    for (const [name, size, off] of defs) {
      const loc = gl.getAttribLocation(prog, name);
      if (loc < 0) continue;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, off * 4);
    }
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    glCanvas.width = Math.round(viewW * dpr);
    glCanvas.height = Math.round(viewH * dpr);
  }

  function initBuffers(cityData) {
    const stat = buildViceCityStaticGeometry(cityData);
    staticCount = stat.length / VICE_VERT_STRIDE;
    staticBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.bufferData(gl.ARRAY_BUFFER, stat, gl.STATIC_DRAW);
    const skyData = viceSkyCube();
    skyBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
    gl.bufferData(gl.ARRAY_BUFFER, skyData, gl.STATIC_DRAW);
    const waterData = viceWaterGrid();
    waterBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, waterBuf);
    gl.bufferData(gl.ARRAY_BUFFER, waterData, gl.STATIC_DRAW);
    dynBuf = gl.createBuffer();
  }

  function chaseCamera(state) {
    const p = state.player;
    const car = state.cars.find((c) => c.driver === 'player');
    let px, pz, fx, fz, speed;
    if (car && !p.onFoot) {
      px = car.x; pz = car.y; fx = Math.cos(car.angle); fz = Math.sin(car.angle); speed = Math.abs(car.speed);
    } else {
      px = p.x; pz = p.y; fx = Math.cos(p.angle); fz = Math.sin(p.angle); speed = 0;
    }
    const onFoot = p.onFoot;
    const dist = onFoot ? 58 : 115;
    const height = onFoot ? 28 : 55;
    const ahead = onFoot ? 45 : 85;
    const ex = px - fx * dist, ey = height, ez = pz - fz * dist;
    const tx = px + fx * ahead, ty = onFoot ? 4 : 6, tz = pz + fz * ahead;
    const fov = (62 + Math.min(10, speed * 0.012)) * Math.PI / 180;
    return { eye: [ex, ey, ez], target: [tx, ty, tz], fov };
  }

  function cinematicCamera(state) {
    const p = state.player;
    const t = state.time * 0.08;
    const R = 280, H = 130;
    return {
      eye: [p.x + Math.cos(t) * R, H, p.y + Math.sin(t) * R],
      target: [p.x, 12, p.y],
      fov: 58 * Math.PI / 180,
    };
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyV' && !e.repeat) mode = (mode + 1) % 3;
  });
  window.addEventListener('resize', resize);
  resize();

  return {
    get mode() { return mode; },
    get canvas() { return glCanvas; },
    setVisible(v) {
      if (v === visible) return;
      visible = v;
      glCanvas.style.display = v ? 'block' : 'none';
    },
    init(cityData) { initBuffers(cityData); },
    draw(state, city, screen) {
      if (mode === 2 || !visible) return;
      if (!staticBuf) initBuffers(city);
      if (glCanvas.width !== Math.round(viewW * dpr)) resize();
      const hour = (8 + state.time / 10) % 24;
      const sun = viceDuskSun(hour);
      const cam = (screen === 'title' || mode === 1) ? cinematicCamera(state) : chaseCamera(state);
      if (!eyeInit) {
        smoothEye[0] = cam.eye[0]; smoothEye[1] = cam.eye[1]; smoothEye[2] = cam.eye[2];
        eyeInit = true;
      } else {
        const dx = cam.eye[0] - smoothEye[0], dy = cam.eye[1] - smoothEye[1], dz = cam.eye[2] - smoothEye[2];
        const d = Math.hypot(dx, dy, dz);
        if (d > 200) {
          smoothEye[0] = cam.eye[0]; smoothEye[1] = cam.eye[1]; smoothEye[2] = cam.eye[2];
        } else {
          smoothEye[0] += dx * 0.5; smoothEye[1] += dy * 0.5; smoothEye[2] += dz * 0.5;
        }
      }
      const proj = vicePerspective(cam.fov, viewW / viewH, 1, 9000);
      const view = viceLookAt(smoothEye, cam.target, [0, 1, 0]);
      const vp = viceMul(proj, view);
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      gl.clearColor(0.12, 0.07, 0.2, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.useProgram(skyProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(skyProg, 'uVP'), false, vp);
      gl.uniform3fv(gl.getUniformLocation(skyProg, 'uSunDir'), sun.dir);
      gl.uniform1f(gl.getUniformLocation(skyProg, 'uTime'), state.time);
      gl.uniform3fv(gl.getUniformLocation(skyProg, 'uCam'), smoothEye);
      bindAttribs(skyProg, skyBuf, 3, [['aPos', 3, 0]]);
      gl.drawArrays(gl.TRIANGLES, 0, 36);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.useProgram(waterProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(waterProg, 'uVP'), false, vp);
      gl.uniform1f(gl.getUniformLocation(waterProg, 'uTime'), state.time);
      gl.uniform3fv(gl.getUniformLocation(waterProg, 'uSunDir'), sun.dir);
      gl.uniform3fv(gl.getUniformLocation(waterProg, 'uCam'), smoothEye);
      bindAttribs(waterProg, waterBuf, 3, [['aPos', 3, 0]]);
      gl.drawArrays(gl.TRIANGLES, 0, 32 * 10 * 6);
      gl.useProgram(cityProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(cityProg, 'uVP'), false, vp);
      gl.uniform3fv(gl.getUniformLocation(cityProg, 'uCam'), smoothEye);
      gl.uniform3fv(gl.getUniformLocation(cityProg, 'uSunDir'), sun.dir);
      gl.uniform3fv(gl.getUniformLocation(cityProg, 'uSunCol'), sun.col);
      gl.uniform3fv(gl.getUniformLocation(cityProg, 'uAmb'), sun.amb);
      gl.uniform3fv(gl.getUniformLocation(cityProg, 'uFogCol'), sun.fog);
      gl.uniform1f(gl.getUniformLocation(cityProg, 'uFogDen'), 0.00022);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(gl.getUniformLocation(cityProg, 'uTex'), 0);
      const defs = [['aPos', 3, 0], ['aNor', 3, 3], ['aCol', 3, 6], ['aUv', 2, 9], ['aEmi', 1, 11]];
      bindAttribs(cityProg, staticBuf, VICE_VERT_STRIDE, defs);
      gl.drawArrays(gl.TRIANGLES, 0, staticCount);
      const dyn = buildViceDynamicGeometry(state, dynMesh);
      gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
      gl.bufferData(gl.ARRAY_BUFFER, dyn, gl.DYNAMIC_DRAW);
      bindAttribs(cityProg, dynBuf, VICE_VERT_STRIDE, defs);
      gl.drawArrays(gl.TRIANGLES, 0, dyn.length / VICE_VERT_STRIDE);
    },
  };
}
