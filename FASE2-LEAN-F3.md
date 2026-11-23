# Neon Bay — Gerbang 3: Fase 2 Lean & Deadly

Kontes make.fun "Make GTA 6" (gta6-01, $1.666, tutup 24 Nov 2026 22:00 WIB).
Repo: contact-nathanealphi/gta6-01. HEAD sebelumnya: 3cfc2dc (Gerbang 2).

## 4 modul baru (game/src/)

| Modul | Byte | Isi |
|---|---|---|
| police-air-support.js | 4.084 | `PoliceAirSupportSystem`, `renderChopperSearchlight`, `renderNbpdDispatchBoard`, `spawnBurningWreck`. NBPD AIR-1 (Y 24–28) saat wanted ≥3: rotor, strobo merah-biru, searchlight cone mengejar pemain, tracer; SWAT Van ★4–5; Dispatch Board HUD kanan (unit + status + jarak meter live); burning wrecks (api + kolom asap). |
| weapon-wheel.js | 3.456 | `WEAPON_SLOTS_6`, `WeaponWheelSystem`, `renderRadialWeaponWheel`, `detonateHydraRpg`. 6 slot: 1 Neon Katana, 2 Vice 9mm, 3 Micro-SMG (drive-by), 4 Combat Shotgun, 5 Tactical Carbine, 6 Hydra RPG (roket 3D + fireball + shockwave). Tahan Tab/Q → slow-mo 0.2x + radial wheel. |
| district-fixer.js | 2.145 | `CITY_DISTRICTS_6`, `RESPECT_RANKS`, `DistrictStandingSystem`, `renderFixerDialogueBox`. 6 distrik berwarna di minimap + rep 0–100% + 6 Respect Ranks (Street Runner → Vice Kingpin). Fixer Elena "Viper" Cruz, Syndicate Fixer — potret vektor + kotak dialog bawah-tengah saat misi aktif. |
| crew-garage-race.js | 8.979 | `CrewAbilitySystem`, `NeonCustomsGarage`, `StreetRaceCircuit`, `ProceduralFmRadio`. 3 crew ability ([1] Signal Jammer −2 Wanted, [2] Crew Hit Squad, [3] Nitrous Overdrive) + ikon cooldown HUD bawah; Neon Customs (2 titik, showroom orbit, upgrade Engine/Armor/Nitrous/Underglow di localStorage); 2 sirkuit street race (gerbang holografik 3D + 3 rival AI + HUD posisi/lap); 3 stasiun FM WebAudio ([R] ganti: VICE FM 104.5, SUNSET 91.7, NEON PULSE 98.2) + equalizer toast. |

## 10 misi cerita (total hadiah $15.000)

M1 First Delivery $150 · M2 A Quiet Word $250 · M3 The Golden Comet $400 ·
M4 Dockside Trouble $600 · M5 Shake the Heat $750 · M6 (dst, total lama $5.650) ·
M8 Viper's Cut $1.850 · M9 The Neon Limo $2.500 · M10 The Grand Casino Heist $5.000.
Viewport-Aware Dense Spawner: 12–16 kendaraan + 16–22 pejalan kaki 3D selalu aktif
di sekitar kamera (terukur: 20 mobil / 16 pejalan kaki dalam radius 1000).

## Pemetaan tombol (koreksi spek)

[1][2][3] = crew ability (Jammer / Hit Squad / Nitrous). [4] = start Neon Loop race,
[5] = start Bayfront Sprint. [R] = ganti stasiun radio (saat menyetir; saat jalan kaki
R = reload). Tab/Q = weapon wheel. [V] = ganti mode kamera. G = buka Neon Customs
(dekat garasi, saat menyetir).

## Dossier (via main.ts)

- **Text: 163.195 byte — TIDAK terpotong (truncate), headroom ke cap 163.840 = 645 byte.**
- **OVER BUDGET vs target 154.000: +9.195 byte.** Anggaran ≤16 KB / <154.000
  tidak muat untuk spek lengkap pada densitas yang masih terbaca juri (tambahan
  bersih vs Gerbang 2 ≈ 28,5 KB). Tidak di-minify (juri baca kualitas kode) dan
  tidak dipindah ke `game/vendor/` (mengakali cap). Fitur tidak dipotong.
- Gerbang 4 harap jaga delta shots.json ≤ ~645 byte atau diet di tempat lain.

## Verifikasi

- **Browser headless Playwright Chromium (WebGL2 SwiftShader), 960×600:**
  10/10 misi selesai + storyDone, 0 console error, 0 page error, 0 shader error,
  0 external request (20 request, semua same-origin). Radio 3 stasiun, heli spawn,
  jammer, weapon wheel — semua PASS.
- **FPS headless: 3,10 (1280×800, SwiftShader, menyetir).** Lambat karena
  SwiftShader, bukan bottleneck draw call baru.
- **Node smoke (smoke-f3.mjs):** heli, jammer, hit squad, RPG, race, radio, garage,
  distrik, dense spawner, misi 8–10 + storyDone — semua PASS.
- **neon-test.mjs: 5 FAIL — semuanya ekspektasi tes yang kedaluwarsa** (Gerbang 4
  yang update): 7→10 misi, total 5650→15000, M9 decoy limo (tes cari by kind,
  game pakai targetCarId — game benar), shotgun (tes tidak pilih slot 4; default
  senjata kini 2 pistol). Sisanya PASS.
- **Bug audio diperbaiki:** bass radio 4-nota diindeks `% 8` → `undefined` →
  1.705 pageerror di run pertama; kini 0 error (guard `Number.isFinite` +
  `% line.length`).

## Bukti screenshot (~/workspace/makefun-trial/)

- f3-heli.png — searchlight cone + banner "NBPD AIR-1 overhead!" + Dispatch Board
  (AIR-1 SPOTLIGHT 139m, unit FOOT + jarak live). Badan heli di tepi atas frame
  (chase cam) — kerucut searchlight yang terlihat jelas.
- f3-wheel.png — radial wheel 6 slot, judul "WEAPON WHEEL — SLOW-MO 0.2x" sudah
  tidak tertutup slot atas (fix Gerbang 3 akhir), center "Vice 9mm".
- f3-garage.png — showroom "NEON CUSTOMS — Rico's Garage", 4 baris upgrade + harga.
- f3-fixer.png — kotak dialog Elena "Viper" Cruz + potret, banner "Viper's Cut",
  Mission 8 of 10.

## File yang disentuh

Baru: game/src/police-air-support.js, game/src/weapon-wheel.js,
game/src/district-fixer.js, game/src/crew-garage-race.js.
Diubah: game/src/world.js, game/src/main.js, game/src/render.js,
game/src/renderer/meshes3d.js, game/src/audio.js, game/src/input.js,
game/src/tune.js, game/src/shots.js (hanya diet komentar + inline wrapper).
TIDAK disentuh: shots.json, ITERATIONS-200X.md, neon-test.mjs.

## Catatan untuk Gerbang 4

1. Update neon-test.mjs: 7→10 misi; total 5650→15000; steal-stage cari by
   `targetCarId` (bukan kind — limo decoy di (1450,1250)); tes shotgun set
   `player.weapon = 4` dulu.
2. Jaga delta shots.json ≤ ~645 byte (headroom dossier).
3. TIDAK submit — parent yang seal + submit setelah ACC user.
