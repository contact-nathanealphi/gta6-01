// Procedural Vice-Dusk texture atlas (1024x1024, offscreen Canvas2D, no files).

export const VICE_FACADE_UV = [
  [0.0, 0.75, 0.25, 1.0],
  [0.25, 0.75, 0.5, 1.0],
  [0.5, 0.75, 0.75, 1.0],
  [0.75, 0.75, 1.0, 1.0],
];
export const VICE_ROOF_UV = [0.0, 0.5, 0.25, 0.75];
export const VICE_WHITE_UV = [0.25, 0.6875, 0.3125, 0.75];
export const VICE_CASINO_UV = [0.5, 0.5, 0.75, 0.75];

export function createViceDuskTextureAtlas(gl) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d');
  const F = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const glass = ['#1a2436', '#232c40', '#141c2c', '#2a2438'];
  const neon = ['#ff2d78', '#00e5ff', '#ffd23d', '#ff7a2d'];
  for (let t = 0; t < 4; t += 1) {
    const x0 = t * 256;
    F(glass[t], x0, 0, 256, 256);
    for (let r = 0; r < 8; r += 1) {
      for (let col = 0; col < 6; col += 1) {
        const lit = ((t * 7 + r * 3 + col * 5) % 4) < 2;
        F(lit ? ((r + col) % 3 === 0 ? '#7fe3ff' : '#ffd27a') : 'rgba(0,0,0,0.35)', x0 + 14 + col * 40, 12 + r * 30, 26, 18);
      }
    }
    F(neon[t], x0, 200, 256, 6);
    F('rgba(255,255,255,0.25)', x0, 210, 256, 2);
  }
  F('#14101f', 512, 256, 256, 256);
  for (let r = 0; r < 6; r += 1) for (let col = 0; col < 6; col += 1) F(((r + col) % 3 === 0) ? '#7fe3ff' : 'rgba(0,0,0,0.4)', 526 + col * 40, 440 + r * 12, 26, 8);
  g.textAlign = 'center';
  g.font = 'bold 58px sans-serif';
  g.shadowBlur = 20;
  g.save();
  g.translate(1280, 0);
  g.scale(-1, 1);
  g.shadowColor = '#00e5ff'; g.fillStyle = '#00e5ff';
  g.fillText('NEON', 640, 330);
  g.shadowColor = '#ff9d00'; g.fillStyle = '#ffd23d';
  g.fillText('CASINO', 640, 396);
  g.restore();
  g.shadowBlur = 0;
  F('#ff2d78', 540, 410, 200, 6);
  F('#00e5ff', 540, 420, 200, 3);
  F('#3a3f4a', 0, 256, 256, 256);
  g.strokeStyle = '#f2c94c';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(128, 384, 70, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = '#f2c94c';
  g.font = 'bold 60px sans-serif';
  g.textAlign = 'center';
  g.fillText('H', 128, 404);
  F('#ffffff', 256, 256, 64, 64);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}
