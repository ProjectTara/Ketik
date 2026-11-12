# ketik.

Latihan mengetik cepat dan tepat, dalam bahasa Indonesia dan bahasa Inggris.

## Fitur

- Pilihan durasi: 15, 30, 60, atau 120 detik. Waktu mulai berjalan saat huruf pertama diketik.
- Bahasa Indonesia dan bahasa Inggris, untuk antarmuka dan daftar kata.
- Typo ditandai merah secara langsung.
- Skor akhir: kecepatan bersih (kata/menit) × akurasi (%).
- Akurasi menghitung setiap salah tekan, termasuk yang sudah dihapus.
- Rekor tersimpan di browser (localStorage), terpisah per bahasa dan durasi.
- Mode terang dan gelap mengikuti pengaturan perangkat. Bisa dipakai di HP.
- Tekan `Esc` untuk mengulang.

## Cara hitung

- 1 kata = 5 huruf (standar WPM).
- Kecepatan bersih = (huruf benar ÷ 5) ÷ menit.
- Kecepatan kotor = (semua huruf yang diketik ÷ 5) ÷ menit.
- Akurasi = (tekanan benar ÷ total tekanan) × 100.
- Skor = kecepatan bersih × akurasi.

## Struktur

```
index.html   halaman utama
style.css    tampilan
script.js    logika mengetik, timer, skor
words.js     daftar kata (ubah atau tambah kata di sini)
```

Tidak perlu build step. Cukup buka `index.html` di browser.

## Deploy ke Vercel

1. Buat repo baru di GitHub, lalu upload semua file ini ke repo tersebut.
2. Buka https://vercel.com dan login dengan akun GitHub.
3. Klik **Add New → Project**, lalu pilih repo ini.
4. Framework Preset: **Other**. Build command dan output directory dibiarkan kosong.
5. Klik **Deploy**. Link `nama-proyek.vercel.app` akan muncul setelah selesai.

Setiap `git push` ke branch `main` akan otomatis memperbarui situs.
