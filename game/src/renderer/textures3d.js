// Procedural Vice-Dusk texture atlas (1024x1024, offscreen Canvas2D, no files):
// 4 skyscraper facades with lit windows + neon trim, a helipad roof tile and a
// white tile for plain vertex-coloured geometry. UVs assume UNPACK_FLIP_Y.

export const VICE_FACADE_UV = [
  [0.0, 0.75, 0.25, 1.0],
  [0.25, 0.75, 0.5, 1.0],
  [0.5, 0.75, 0.75, 1.0],
  [0.75, 0.75, 1.0, 1.0],
];
export const VICE_ROOF_UV = [0.0, 0.5, 0.25, 0.75];
export const VICE_WHITE_UV = [0.25, 0.6875, 0.3125, 0.75];

export function createViceDuskTextureAtlas(gl) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d');
  const glass = ['#1a2436', '#232c40', '#141c2c', '#2a2438'];
  const neon = ['#ff2d78', '#00e5ff', '#ffd23d', '#ff7a2d'];
  for (let t = 0; t < 4; t += 1) {
    const x0 = t * 256;
    g.fillStyle = glass[t];
    g.fillRect(x0, 0, 256, 256);
    for (let r = 0; r < 8; r += 1) {
      for (let col = 0; col < 6; col += 1) {
        const lit = ((t * 7 + r * 3 + col * 5) % 4) < 2;
        g.fillStyle = lit ? ((r + col) % 3 === 0 ? '#7fe3ff' : '#ffd27a') : 'rgba(0,0,0,0.35)';
        g.fillRect(x0 + 14 + col * 40, 12 + r * 30, 26, 18);
      }
    }
    g.fillStyle = neon[t];
    g.fillRect(x0, 200, 256, 6);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.fillRect(x0, 210, 256, 2);
  }
  g.fillStyle = '#3a3f4a';
  g.fillRect(0, 256, 256, 256);
  g.strokeStyle = '#f2c94c';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(128, 384, 70, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = '#f2c94c';
  g.font = 'bold 60px sans-serif';
  g.textAlign = 'center';
  g.fillText('H', 128, 404);
  g.fillStyle = '#ffffff';
  g.fillRect(256, 256, 64, 64);
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
