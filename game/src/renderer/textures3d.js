export const VICE_FACADE_UV = [
  [0.0, 0.75, 0.25, 1.0],
  [0.25, 0.75, 0.5, 1.0],
  [0.5, 0.75, 0.75, 1.0],
  [0.75, 0.75, 1.0, 1.0],
];
export const VICE_ROOF_UV = [0.0, 0.5, 0.25, 0.75];
export const VICE_WHITE_UV = [0.25, 0.6875, 0.3125, 0.75];
export const VICE_CASINO_UV = [0.5, 0.625, 0.9375, 0.75];

export function createViceDuskTextureAtlas(gl) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d');
  const F = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const walls = ['#d8b89a', '#d98a7c', '#cfa27e', '#354866'];
  const trims = ['#ff2d78', '#00e5ff', '#ffd23d', '#ff7a2d'];
  for (let t = 0; t < 4; t += 1) {
    const x0 = t * 256;
    F(walls[t], x0, 0, 256, 256);
    F('rgba(0,0,0,0.20)', x0, 0, 256, 10);
    F(trims[t], x0, 10, 256, 4);
    for (let r = 0; r < 9; r += 1) {
      for (let col = 0; col < 10; col += 1) {
        const k = (t * 7 + r * 3 + col * 5) % 5;
        F(k === 0 ? '#ffd27a' : k === 1 ? '#7fe3ff' : k === 2 ? '#ffe9b0' : 'rgba(24,18,36,0.55)', x0 + 10 + col * 24, 22 + r * 21, 13, 10);
      }
    }
    F('#241a2e', x0, 222, 256, 34);
    F('#3a2f4a', x0 + 104, 228, 48, 28);
  }
  F('#160b26', 512, 256, 448, 128);
  g.strokeStyle = '#f2c94c'; g.lineWidth = 5; g.strokeRect(518, 262, 436, 116);
  g.fillStyle = '#f2c94c';
  for (let i = 0; i < 20; i += 1) { const bx = 536 + i * 22; g.beginPath(); g.arc(bx, 272, 3, 0, 7); g.fill(); g.beginPath(); g.arc(bx, 374, 3, 0, 7); g.fill(); }
  g.textAlign = 'center';
  g.font = 'bold 56px sans-serif';
  g.shadowBlur = 22;
  g.save();
  g.translate(1280, 0);
  g.scale(-1, 1);
  g.shadowColor = '#00e5ff'; g.fillStyle = '#8ef4ff';
  g.fillText('NEON', 430, 338);
  g.shadowColor = '#ff9d00'; g.fillStyle = '#ffd23d';
  g.fillText('CASINO', 660, 338);
  g.restore();
  g.shadowBlur = 0;
  F('#3a3f4a', 0, 256, 256, 256);
  g.strokeStyle = '#f2c94c';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(128, 384, 70, 0, 7);
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
