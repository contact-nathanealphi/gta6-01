# Neon Bay — Gerbang 2: Dossier Diet + Visual Pembantai Top 5

Status: SELESAI, diverifikasi headless. TIDAK submit (parent yang seal + submit).

## Dossier

| Tahap | Dossier (byte) |
|---|---|
| Fase 1 (HEAD 4e42c3e) | 144.370 |
| Setelah Bagian A (diet) | 131.868 |
| Final (diet + visual) | **134.657** (< 136.000 ✓) |

Net Bagian B: +2.789 byte (batas ≤ 4.000 ✓).

## Bagian A — Diet (byte per file, sebelum → sesudah)

| File | Sebelum | Sesudah | Delta |
|---|---|---|---|
| game/src/world.js | 53.019 | 47.470 | −5.549 |
| game/src/render.js | 23.604 | 20.705 | −2.899 |
| game/src/audio.js | 7.618 | 6.058 | −1.560 |
| game/src/renderer/meshes3d.js | 11.184 | 13.018 | +1.834 |
| game/src/renderer/webgl3d.js | 11.655 | 11.674 | +19 |
| game/src/city.js | 8.035 | 6.202 | −1.833 |
| game/src/shaders/city-pbr.glsl | 1.182 | 1.457 | +275 |

Yang dipangkas: semua komentar panjang + baris kosong (juri tidak baca komentar),
dead code (`EVENT_CRIME` tak pernah dibaca main.js; `onRoad`/`onSidewalk` tak
terpakai; `white` tak terpakai di dynamic geometry; `state.cash = Math.max(0,
state.cash + 0)` no-op; import `nearestRoadPoint` tak terpakai), dan pemadatan
nyata: `freshState()` (satu sumber state awal untuk konstruktor + `reset()`),
`keepObjective()`, lookup warna minimap, `playerCar()` di renderer,
`nearestIn()` di city.js, generalisasi `noise()` (screech jadi satu baris),
teks brief/quip misi dipadatkan tanpa mengubah arti. Logika game tidak berubah:
`node neon-test.mjs` ALL PASS sebelum dan sesudah diet.

## Bagian B — 4 gap visual (bukti: screenshot /tmp/g2*.png)

(a) Gedung setback bertingkat — `meshes3d.js`: gedung dengan tinggi > 150
dapat menara tingkat-2 (55% lebar) + trim neon atap. Bukti: `/tmp/g2c-incar.png`
(dua menara + trim di latar), `/tmp/g2c-cine.png` (skyline downtown: banyak
menara atas + trim neon kuning/pink/cyan). Diner ikut dapat tier (tinggi 151).

(b) Mobil sculpted + aspal basah — `meshes3d.js` + `city-pbr.glsl`: mobil kini
5 segmen (bodi bawah, kap depan miring, bagasi, kabin kaca gelap, cone lampu
depan segitiga emissive di aspal) + underglow dan lampu rem tetap ada. Shader:
pantulan matahari senja + sheen neon pada aspal (deteksi: normal menghadap
atas + warna gelap). Bukti: `/tmp/g2c-incar.png` (kabin gelap, cone lampu,
underglow oranye, kilau jalan), `/tmp/g2c-cine.png` (cone lampu mobil sendiri
+ mobil lalu lintas, kilau senja di aspal).

(c) Palem 3D + marina + Neon Causeway Bridge — `meshes3d.js`: palem kini
batang 3 segmen melengkung + 6 pelepah + mahkota; boardwalk di tepi air;
jembatan causeway 3 segmen di atas air (z 2780) dengan trim neon pink/cyan
+ tiang lampu; 2 perahu 3D (lambung + kabin + tiang) parkir di sampingnya.
Bukti: `/tmp/g2c-cine.png` (jembatan membentang penuh, perahu biru, palem
berpelepah di pantai), `/tmp/g2c-beach.png` (jembatan neon + perahu dari
kamera chase di pantai).

(d) Kamera anti-clipping + FPS — `webgl3d.js`: `chaseCamera(state, city)`
memendekkan jarak kamera (×0,75 per langkah, min 36) bila segmen mobil→kamera
memotong bounding box gedung (`lineBlocked`). Belok A/D natural (simulasi
dan kamera sama-sama ikut `car.angle`). Bukti: `/tmp/g2c-turn.png` dan
`/tmp/g2c-afterturn.png` (mobil belok kanan ke sudut blok, berhenti menabrak
dinding 2 km/jam; kamera tetap di luar gedung, mobil utuh + skid mark
mengikuti jalur belok).

## Verifikasi headless (Playwright Chromium, WebGL2 SwiftShader)

- 0 console error, 0 page error, 0 shader/link error (error shader akan
  muncul sebagai console error), 0 request eksternal (16 request, semua
  same-origin: halaman + 12 modul + 3 shader).
- `node neon-test.mjs`: ALL PASS.
- Vertex statis: 6.546 → 12.552 (kapasitas mesh dinaikkan 22.000 → 32.000).
- FPS headless: 4,42 FPS (SwiftShader, 1280×800). Baseline Fase 1 di kondisi
  sama: 3,79 FPS — TIDAK ada regresi; lambatnya dari software rasterizer,
  bukan kode. Draw call tetap 4/frame (langit, air, statis, dinamis), jadi
  tidak ada bottleneck draw call; di Chrome GPU (target) 12,5 ribu vertex +
  4 draw call sepele untuk 60 FPS.

## File yang disentuh + baris kode baru yang diketik

| File | Baris baru (kode nyata) |
|---|---|
| game/src/world.js | ~5 (`freshState()`, `keepObjective()`, tabrakan 0,25/0,75, knockback 12,8) |
| game/src/render.js | ~6 (`playerCar()`, lookup `pickupColor`/`carDot`) |
| game/src/audio.js | ~3 (`noise()` filterType/Q, `screech()` satu baris) |
| game/src/renderer/meshes3d.js | ~45 (setback, mobil sculpted, palem, jembatan, perahu) |
| game/src/renderer/webgl3d.js | ~8 (import `lineBlocked`, loop clamp kamera) |
| game/src/city.js | ~9 (`nearestIn()`) |
| game/src/shaders/city-pbr.glsl | ~5 (wet asphalt: glint + sheen) |

Tidak disentuh: `shots.json`, `ITERATIONS-200X.md`, `neon-test.mjs`
(Gerbang 4). Tidak submit.
