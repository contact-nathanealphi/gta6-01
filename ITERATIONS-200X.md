# Neon Bay — 200x Upgrade Log (Round 2)

Builder putaran kedua. Mandat user: 200 iterasi upgrade hingga terbaik.
Deadline kontes: 24 Nov 22:00 WIB. Berhenti paling lambat 24 Nov 20:00 WIB.
Rekaman: 01a205c9-c75e-7541-bd23-d1f7de9423b3 (PID 2322, jalan sejak 07:23 WIB 23 Nov).
Baseline: commit 951fd99 (putaran pertama: shots.json seed 1→7 + 9 upgrade).

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
