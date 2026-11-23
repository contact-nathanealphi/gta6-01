# Neon Bay — 200x Upgrade Log (Round 2)

Builder putaran kedua. Mandat user: 200 iterasi upgrade hingga terbaik.
Deadline kontes: 24 Nov 22:00 WIB. Berhenti paling lambat 24 Nov 20:00 WIB.
Rekaman: 01a205c9-c75e-7541-bd23-d1f7de9423b3 (PID 2322, jalan sejak 07:23 WIB 23 Nov).
Baseline: commit 951fd99 (putaran pertama: shots.json seed 1→7 + 9 upgrade).

**ATURAN TERKETAT (user, 23 Nov 07:45 WIB): upgrade 200x yang BENERAN — bukan
beberapa kali lalu merasa percaya diri. Target #1 leaderboard. Lawan = AI dari
seluruh dunia. Bahkan jika 200 iterasi belum bisa mengejar leaderboard, HAJAR
TERUS hingga tercapai. Setiap iterasi = perubahan nyata + uji.**

## Baseline test (sebelum iterasi)
- Headless test `/tmp/neon-test.mjs`: 3 gagal awal.
- Total reward misi ternyata $4.400 (bukan $4.650 seperti klaim lama) — lihat iterasi 2.
- **BUG KRITIS ditemukan saat baseline: `nextCarId` tidak pernah bertambah — SEMUA mobil id=1.**
  Akibat: `playerCar()` selalu mengembalikan mobil PERTAMA di array, bukan mobil yang
  dimasuki pemain. Misi 3 (antar Golden Comet) TIDAK BISA selesai karena
  `playerCar().kind` selalu sedan pertama. Mencuri mobil selain yang pertama
  juga rusak (yang bergerak mobil pertama). Ini iterasi 1.

## Iterasi

| # | Perubahan | Uji | Hasil |
|---|---|---|---|
| 1 | BUGFIX: `nextCarId += 1` di `newCar()` — tiap mobil dapat id unik | headless test (misi 3 selesai, ID unik) | KEEP |
| 2 | Misi 5 reward 500→750 — total misi $4.400→$4.650 (sesuai klaim), kurva reward lebih mulus | headless test (total 4650) | KEEP |
| 3 | Wanted coolDelay 18→15, coolRate 0.4→0.5 — heat reda lebih cepat, kurang menunggu | headless test | KEEP |
| 4 | Foot cop arrest time 1.6→1.9 dtk — sedikit lebih pemaaf saat ditangkap | headless test | KEEP |
| 5 | Player walk 235→245, run 355→365 — gerak kaki lebih responsif | headless test | KEEP |
| 6 | Pistol mag 12→14 — lebih sedikit reload | headless test | KEEP |
| 7 | Rival shootEvery 0.9→1.1, damage 7→6 — baku tembak lebih adil | headless test | KEEP |
| 8 | Near-miss bonus $5→$10 — lebih menghargai nyetir stylish | headless test | KEEP |
| 9 | Cash pickup 25–80→30–90 | headless test | KEEP |
| 10 | Health pickup 30→40 | headless test | KEEP |
| 11 | Denda busted 20%→15% — kurang menghukum | headless test | KEEP |
| 12 | Kehilangan wasted 10%→8% | headless test | KEEP |
| 13 | Banner health dinamis (`Health +${amount}`) bukan hardcode +30 | headless test | KEEP |
| 14 | Cash pickup respawn 25–80→30–90 (konsisten dengan #9) | headless test | KEEP |
| 15 | Traffic targetSpeed 150–230→160–250 — lalu lintas lebih hidup | headless test | KEEP |
| 16 | Patrol carChaseSpeed 540→550 — kejar-kejaran sedikit lebih ketat | headless test | KEEP |
| 17 | Punch damage 12→15 — tinju lebih layak dipakai | headless test | KEEP |
| 18 | Pistol damage 25→28 — 2 tembakan tetap bunuh rival, lebih terasa | headless test | KEEP |
| 19 | Punch cooldown 0.4→0.35 dtk | headless test | KEEP |
| 20 | Shoot cooldown 0.22→0.20 dtk | headless test | KEEP |
| 21 | Reload 1.1→0.9 dtk | headless test | KEEP |
| 22 | Invuln setelah kena tembak 0.3→0.4 dtk — sedikit lebih pemaaf | headless test | KEEP |
| 23 | Mobil baru: Bay Muscle (topSpeed 500) + Neon Limo (58 panjang) | headless test | KEEP |
| 24 | Traffic pool tambah muscle + limo | headless test | KEEP |
| 25 | Landmark baru: Neon Casino (4,0) + Neon Stadium (4,2) | headless test | KEEP |
| 26 | Warna baju pejalan kaki 5→10 variasi | headless test | KEEP |
| 27 | Jogger: 15% pejalan kaki jalan 2x lebih cepat (130–170) | headless test | KEEP |
| 28 | Muscle parkir di kasino, limo di mall — mobil baru bisa ditemukan | headless test | KEEP |
| 29 | Misi ke-7 "The Getaway" — epilog: survive 20 dtk (4 bintang) lalu ke pantai selatan, reward $1.000; total $5.650 | headless test (7 misi selesai) | KEEP |
| 30 | HUD "Mission X of 6" → dinamis `of ${MISSIONS.length}` (render.js import MISSIONS) | headless test | KEEP |
| 31 | README: six→seven jobs, mobil + landmark baru didokumentasikan | — | KEEP |
| 32 | Muzzle flash (burst kuning di ujung pistol) saat menembak | headless test | KEEP |
| 33 | Ledakan saat mobil hancur (asap + percikan + guncangan) | headless test | KEEP |
| 34 | Asap knalpot saat akselerasi keras | headless test | KEEP |
| 35 | Minimap tampilkan pickup (hijau health, hijau cash, emas ammo, coklat crate) | headless test | KEEP |
| 36 | Lampu rem merah saat mobil mundur | headless test | KEEP |
| 37 | Jendela gedung menyala (pola tetap per gedung, tidak berkedip) | headless test + screenshot | KEEP |
| 38 | Title screen "Six jobs" → "Seven jobs" (konsisten dengan misi ke-7) | screenshot 1-start | KEEP |
| 39 | shots.js mag hardcode 12 → PLAYER.magSize (14) | headless test + screenshot | KEEP |
| 40 | Klakson: input PRESS_HORN (tombol H) | headless test | KEEP |
| 41 | Suara klakson dua nada (audio.horn) | headless test | KEEP |
| 42 | Suara cha-ching untuk uang (audio.cash) | headless test | KEEP |
| 43 | Flag cashSound — uang mainkan cha-ching, bukan pickup biasa | headless test | KEEP |
| 44 | Musik latar: bassline synthwave A minor (8 not, 112 BPM) via setInterval | headless test | KEEP |
| 45 | Musik mulai saat audio context dibuat; music(on) diekspos; mute menghentikan musik | headless test | KEEP |
| 46 | Hint kontrol + title screen sebutkan H (klakson) | headless test | KEEP |
| 47 | Courier: state field (courier, courierCd) untuk aktivitas free roam | headless test | KEEP |
| 48 | Courier: pickup paket mulai pengiriman 40 dtk ke tujuan acak ($120–200) | headless test | KEEP |
| 49 | updateCourier: spawn berkala, timer, bayar saat sampai, gagal saat habis waktu | headless test (courier test) | KEEP |
| 50 | Courier: render amplop + dot putih di minimap | headless test | KEEP |
| 51 | Speed lines di tepi layar saat mobil >420 | headless test | KEEP |
| 52 | Pause screen tampilkan progres misi + cash + wanted | headless test | KEEP |
| 53 | Bintang wanted berkedip merah saat naik level | headless test | KEEP |
| 54 | Hurt flash merah saat pemain kena tembak | headless test | KEEP |
| 55 | Hurt flash juga saat mobil ditabrak patroli | headless test | KEEP |
| 56 | Perf: ground statis di-pre-render ke offscreen canvas 3600×2700, di-blit per frame | headless test | KEEP |
| 57 | Robustness: cap partikel 500 di burst() | headless test | KEEP |
| 58 | Robustness: cap peluru 60 di fireBullet() | headless test | KEEP |
| 59 | Courier dibersihkan saat busted/wasted (objective ikut reset bila free roam) | headless test | KEEP |
| 60 | Shotgun: field p.shotgun (jumlah shell) | headless test | KEEP |
| 61 | Shotgun pickup spawn di dermaga + markas polisi (6 shell) | headless test | KEEP |
| 62 | Shotgun: tembak 5 pelet menyebar, cooldown 0.7 dtk, damage 12/pelet | headless test (shotgun test) | KEEP |
| 63 | Shotgun: pickup memberi shell + banner | headless test | KEEP |
| 64 | Shotgun: render pickup + di tangan + HUD "Shotgun X shells" + dot oranye minimap | headless test | KEEP |
| 65 | Shotgun disimpan di save/load | headless test | KEEP |
| 66 | Armor: field p.armor (detik tersisa) | headless test | KEEP |
| 67 | Armor pickup spawn di rumah sakit + garasi (20 dtk) | headless test | KEEP |
| 68 | Armor: pickup memberi 20 dtk + banner | headless test | KEEP |
| 69 | Armor: decay per detik; damage peluru + tabrakan jadi setengah | headless test (armor test) | KEEP |
| 70 | Armor: render perisai + cincin biru berdenyut + HUD "Armor Xs" + panel HUD lebih tinggi | headless test | KEEP |
| 71 | Siklus siang/malam: overlay berubah selama 4 menit (siang→senja→malam→fajar) | headless test + screenshot | KEEP |
| 72 | Jam in-game di HUD (ikon ☀/☾ + HH:MM) | screenshot | KEEP |
| 73 | Perbaiki fase siklus: mulai 08:00 pagi (bukan tengah malam yang gelap) + jam cocok | screenshot 2-drive | KEEP |
| 74 | Taxi: state field (fare, fareCd) | headless test | KEEP |
| 75 | Taxi: pejalan kaki hailing saat pemain mengemudi taksi | headless test (taxi test) | KEEP |
| 76 | Taxi: jemput penumpang → pengiriman 45 dtk ($80–150) | headless test | KEEP |
| 77 | Taxi: bayar saat sampai, gagal saat habis waktu, batal saat keluar taksi | headless test | KEEP |
| 78 | Taxi: tanda TAXI kuning di atas penumpang yang hailing | headless test | KEEP |
| 79 | updateFare dipanggil dari step() | headless test | KEEP |
| 80 | Taxi: test headless lengkap (hail→pickup→deliver→bayar) | headless test | KEEP |
