export class PoliceAirSupportSystem {
  constructor(state, fx) { this.s = state; this.fx = fx; }
  update(dt) {
    const s = this.s, p = s.player, air = s.air;
    if (!air.heli && s.wanted >= 3) {
      air.heliT += dt;
      if (air.heliT > 1.5) {
        air.heli = { x: p.x + 260, y: p.y - 260, z: 26, angle: 0, rotor: 0, fireT: 2, spotX: p.x, spotY: p.y, leaving: false };
        air.heliT = 0;
        this.fx.showBanner('NBPD AIR-1 overhead!', 3);
      }
    } else if (!air.heli) air.heliT = 0;
    const h = air.heli;
    if (h) {
      h.rotor += dt * 30;
      h.spotX = p.x; h.spotY = p.y;
      if (s.wanted === 0) h.leaving = true;
      else if (s.wanted >= 3) h.leaving = false;
      if (h.leaving) {
        h.z += dt * 9;
        h.x += (h.x - p.x) * dt * 0.4; h.y += (h.y - p.y) * dt * 0.4;
        if (h.z > 70) air.heli = null;
      } else {
        const tx = p.x - Math.cos(p.angle) * 130 - Math.sin(p.angle) * 90, ty = p.y - Math.sin(p.angle) * 130 + Math.cos(p.angle) * 90;
        h.x += (tx - h.x) * Math.min(1, dt * 1.4);
        h.y += (ty - h.y) * Math.min(1, dt * 1.4);
        h.z += ((26 + Math.sin(s.time * 1.3) * 2) - h.z) * Math.min(1, dt * 2);
        h.angle = Math.atan2(p.y - h.y, p.x - h.x);
        h.fireT -= dt;
        if (h.fireT <= 0 && s.wanted >= 3) {
          h.fireT = 2.4;
          for (let i = -1; i <= 1; i += 1) this.fx.fireBullet(h.x + i * 14, h.y, p.x + i * 26, p.y, 'heli', 4, 820);
          this.fx.burst(h.x, h.y, '#ffe9a3', 3, 120);
        }
      }
    }
    if (s.wanted >= 4 && !air.swat) {
      air.swat = true;
      this.fx.spawnPoliceCar('van');
      this.fx.showBanner('NBPD SWAT Van inbound!', 3);
    } else if (s.wanted < 4) air.swat = false;
    for (let i = s.wrecks.length - 1; i >= 0; i -= 1) {
      const w = s.wrecks[i];
      w.life -= dt; w.fireT -= dt;
      if (w.fireT <= 0) {
        w.fireT = 0.12;
        this.fx.burst(w.x, w.y, '#ff7a18', 3, 90);
        this.fx.burst(w.x, w.y, '#555555', 2, 40);
      }
      if (w.life <= 0) s.wrecks.splice(i, 1);
    }
  }
}

export function renderChopperSearchlight(ctx, state) {
  const h = state.air && state.air.heli;
  if (!h) return;
  const r = 95;
  ctx.fillStyle = 'rgba(255,240,180,0.10)';
  ctx.beginPath();
  ctx.moveTo(h.x, h.y);
  ctx.arc(h.spotX, h.spotY, r, 0, Math.PI * 2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,180,0.20)';
  ctx.beginPath(); ctx.arc(h.spotX, h.spotY, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.angle);
  ctx.fillStyle = '#1d4a8a'; ctx.fillRect(-26, -11, 52, 22);
  ctx.fillStyle = '#2f6fd0'; ctx.fillRect(6, -8, 16, 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.stroke();
  ctx.restore();
}

export function renderNbpdDispatchBoard(hud, state) {
  const T = hud.text, R = hud.rect;
  const p = state.player;
  const units = [];
  if (state.air && state.air.heli) units.push(['AIR-1', 'SPOTLIGHT', state.air.heli]);
  let n = 0;
  for (const c of state.cars) {
    if (c.driver !== 'police') continue;
    n += 1;
    units.push([c.kind === 'van' ? 'SWAT' : 'UNIT-' + n, c.kind === 'van' ? 'RAMMING' : 'CHASE', c]);
  }
  for (const c of state.cops) units.push(['FOOT-' + (units.length + 1), 'ON FOOT', c]);
  const w = 224, x = hud.w - w - 14, y = 300;
  R(x, y, w, 34 + units.length * 20, 'rgba(12,16,26,0.78)');
  R(x, y, w, 3, '#ff2e2e');
  T('NBPD DISPATCH — ' + units.length + ' UNITS', x + 10, y + 22, 14, '#ff5a5a', 'left', true);
  for (let i = 0; i < units.length; i += 1) {
    const u = units[i], d = Math.round(Math.hypot(u[2].x - p.x, u[2].y - p.y)), yy = y + 46 + i * 20;
    T(u[0], x + 10, yy, 13, '#f4f1e6', 'left', true);
    T(u[1], x + 96, yy, 13, '#f2c94c', 'left');
    T(d + 'm', x + w - 10, yy, 13, '#b9b3a4', 'right');
  }
}

export function spawnBurningWreck(state, x, y, angle) {
  if (!state.wrecks) state.wrecks = [];
  if (state.wrecks.length >= 6) state.wrecks.shift();
  state.wrecks.push({ x, y, angle: angle || 0, life: 22, fireT: 0 });
}
