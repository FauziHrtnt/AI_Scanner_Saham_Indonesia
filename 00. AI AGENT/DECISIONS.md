# Catatan Keputusan Arsitektur (Architectural Decision Records / ADR) — Stock Scanner Ecosystem

Dokumen ini mencatat keputusan-keputusan arsitektur mendasar, pertimbangan teknis, dan alasan pemilihan teknologi pada ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## 🏛️ ADR 001: Pemilihan Next.js 16 (App Router) & React 19 untuk Web Dashboard
* **Status**: Diterima (Accepted)
* **Konteks**: Dibutuhkan platform dashboard web modern yang cepat, mendukung rendering komponen server (*Server Components*) untuk efisiensi beban browser, serta menyediakan route handler API lokal terpadu.
* **Keputusan**: Menggunakan Next.js 16 dengan kompilator Turbopack dan React 19.
* **Konsekuensi**: 
  - Kecepatan pemuatan halaman dan fast-refresh tinggi.
  - Pemisahan yang jelas antara Server Components (pengambilan data) dan Client Components (tabel TanStack dan canvas chart).

---

## 📊 ADR 002: Yahoo Finance sebagai Sumber Data Pasar Utama (MVP)
* **Status**: Diterima (Accepted)
* **Konteks**: Trader membutuhkan platform scanner tanpa kewajiban berlangganan API berbayar mahal (Bloomberg, Refinitiv) pada tahap riset dan validasi strategi awal.
* **Keputusan**: Mengadopsi paket Node.js `yahoo-finance2` sebagai penyedia data pasar bawaan.
* **Konsekuensi**:
  - Nol biaya lisensi data (*Zero-cost prototype*).
  - Mendukung format ticker bursa Indonesia dengan akhiran `.JK`.
  - Memerlukan mekanisme perlindungan *Adaptive Batching* dan *Exponential Backoff* untuk mencegah rate-limit.

---

## 📈 ADR 003: TradingView Lightweight Charts untuk Visualisasi Grafik
* **Status**: Diterima (Accepted)
* **Konteks**: Menampilkan grafik candlestick interaktif, moving average, dan volume dengan performa tinggi tanpa lag.
* **Keputusan**: Menggunakan pustaka resmi TradingView `lightweight-charts`.
* **Konsekuensi**:
  - Performa rendering 60 FPS berbasis HTML5 Canvas yang sangat ringan dibanding chart SVG berat.
  - Estetika terminal finansial profesional yang diakui secara global.

---

## 📋 ADR 004: TanStack Table (`@tanstack/react-table`) untuk Grid Data Finansial
* **Status**: Diterima (Accepted)
* **Konteks**: Tabel kandidat saham memerlukan kontrol penuh atas perataan angka tabular, sorting multi-kolom, filter status, dan styling presisi tanpa terikat batasan CSS pustaka UI opiniatif.
* **Keputusan**: Menggunakan pustaka *headless table* `@tanstack/react-table` (v8).
* **Konsekuensi**: Fleksibilitas styling tak terbatas dengan Tailwind CSS v4 serta performa tinggi saat memproses ratusan emiten.

---

## 🛡️ ADR 005: Prinsip Manual Trading Saja (Zero Automated Broker Execution)
* **Status**: Diterima (Accepted)
* **Konteks**: Banyak proyek bot trading mencoba menghubungkan API broker, yang berisiko tinggi terhadap kesalahan algoritma (*flash loss*) dan benturan regulasi sekuritas OJK.
* **Keputusan**: Sistem sengaja dibatasi hanya sebagai **Asisten Analisis dan Riset Manual**. Tidak ada modul submit order riil.
* **Konsekuensi**: Menjamin keamanan modal pengguna 100% dan melindungi pengguna dari risiko kegagalan teknis.

---

## 🤖 ADR 006: Daemon Node.js Mandiri untuk Bot Telegram & Scheduler
* **Status**: Diterima (Accepted)
* **Konteks**: Pengguna membutuhkan pengingat sinyal tepat waktu (08:00, 12:05, 15:40 WIB) langsung ke smartphone bahkan saat browser laptop ditutup.
* **Keputusan**: Mempertahankan `ai-stock-scanner-master` sebagai daemon background terpisah yang berkomunikasi secara terpadu dengan API Next.js `/api/scan`.
* **Konsekuensi**: Penjadwal cron berjalan andal di background dan tidak bergantung pada sesi tab browser aktif.
