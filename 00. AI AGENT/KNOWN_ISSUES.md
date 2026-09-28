# Daftar Masalah Diketahui & Solusi (Known Issues & Workarounds) — Stock Scanner Ecosystem

Dokumen ini mencatat kendala teknis yang diketahui (*known issues*), keterbatasan penyedia data, serta solusi (*workarounds*) yang diterapkan pada ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## ⚠️ 1. Masalah Data Pasar & Provider

### A. Rate Limiting Yahoo Finance (HTTP 429 / Network Timeout)
* **Gejala**: Muncul pesan error `Too Many Requests` atau `ETIMEDOUT` saat melakukan pemindaian ratusan saham secara serentak.
* **Penyebab**: Yahoo Finance menerapkan pembatasan kuota dinamis pada alamat IP publik jika menerima lonjakan request dalam interval sangat singkat.
* **Solusi / Mitigasi**:
  1. Sistem telah mengaktifkan *Adaptive Batching* (ukuran batch 25–50 ticker).
  2. Diterapkan jeda acak 3–5 detik antar request individual dan 15–20 detik jeda antar batch.
  3. Mekanisme *retry* otomatis hingga 4 kali dengan jeda eksponensial (*exponential backoff*).

### B. Saham Delisted / Suspensi Muncul di CSV Universe
* **Gejala**: Muncul peringatan log seperti `WSKT gagal: No data found, symbol may be delisted`.
* **Penyebab**: File dataset `idx-tickers.csv` memuat seluruh kode emiten terdaftar, termasuk saham yang sedang disuspensi sementara oleh BEI atau dalam proses delisting.
* **Solusi**:
  1. Engine membungkus pengambilan data setiap emiten dalam blok `try-catch` terisolasi.
  2. Saham tanpa data otomatis dicatat ke dalam array `logs` dan diabaikan tanpa menghentikan pemindaian saham lainnya.

### C. Keterlambatan Data Pasar (Delayed Feed 10–15 Menit)
* **Gejala**: Harga penutupan sore hari baru tercermin lengkap di Yahoo Finance beberapa menit setelah pukul 16:00 WIB.
* **Penyebab**: Feed gratis Yahoo Finance memiliki latensi 10–15 menit dibanding data feed berbayar bursa.
* **Solusi**:
  1. Dashboard menampilkan stempel waktu pengambilan data (*Quote Time*) dan badge disclaimer transparan.
  2. Sinyal BSJP sore dievaluasi paling optimal pada rentang waktu **15:35 – 15:55 WIB**.

---

## 💻 2. Masalah Lingkungan Windows & PowerShell

### A. Kebijakan Eksekusi Skrip PowerShell Memblokir `npm`
* **Gejala**: Menjalankan perintah `npm` di terminal PowerShell memunculkan error: `File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system`.
* **Penyebab**: Windows PowerShell membatasi eksekusi skrip `.ps1` tanpa izin administratif.
* **Solusi**:
  1. Jalankan perintah npm melalui pembungkus CMD: `cmd.exe /c "npm run build"` atau `cmd.exe /c "npm start"`.
  2. Atau panggil file biner langsung: `npm.cmd run dev`.

---

## 🎨 3. Masalah Visual & Layout Antarmuka

### A. Tabel Horizontal Overflow pada Layar Kecil
* **Gejala**: Kolom tabel terpotong atau merusak tata letak layar pada resolusi laptop standar (1366x768).
* **Solusi**:
  1. Pembungkus tabel wajib menggunakan kelas `overflow-x-auto w-full`.
  2. Kolom Ticker pertama dikunci dengan posisi tetap (`sticky left-0 bg-zinc-950 z-10`).
  3. Nama emiten yang panjang dipotong rapi dengan batas maksimal lebar (`max-w-[160px] truncate`) dan dilengkapi tooltip.
