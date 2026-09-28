# Peta Jalan Pengembangan Sistem (System Roadmap) — Stock Scanner Ecosystem

Dokumen ini mendefinisikan tahapan evolusi dan prioritas pengembangan ekosistem **AI Stock Scanner & BSJP Dashboard** dari fase MVP lokal hingga platform analisis kuantitatif tingkat lanjut.

---

## 🗺️ Gambaran Tahapan Pengembangan

```text
Fase 1: MVP Core & Automation  ───►  Fase 2: Visual Terminal & Paper Ledger (Sekarang)
                                                        │
Fase 4: Multi-Provider & Realtime ◄─── Fase 3: Backtest Engine & Risk Analytics
          │
          ▼
Fase 5: Ekosistem Mobile (Flutter App)
```

---

## 🚀 Rincian Fase Pengembangan

### ✅ Fase 1: MVP Core Scanner & Telegram Automation (Selesai)
* [x] Integrasi pembaca data pasar harian menggunakan pustaka `yahoo-finance2`.
* [x] Dukungan semesta saham Indonesia lengkap (750+ ticker IDX dari file `idx-tickers.csv`).
* [x] Implementasi algoritma scoring multi-faktor BSJP (0–100 poin) meliputi Likuiditas, Momentum Sore, Volume, Tren, dan Penalti Risiko.
* [x] Layanan background daemon otomatisasi dengan penjadwal cron waktu Jakarta (07:45, 08:00, 12:05, 15:40 WIB).
* [x] Bot interaktif Telegram (`@ai_stock_bot`) dengan tombol `/menu`, pengaturan `/modal`, dan notifikasi alert beli sore & peringatan exit.
* [x] Integrasi jembatan dua arah (*bidirectional bridge*) antara bot Telegram dan route handler Next.js `/api/scan`.

---

### 🔨 Fase 2: Terminal Visual Finansial & Buku Paper Trading (Fase Aktif)
* [x] Arsitektur antarmuka modern berbasis **Next.js 16 (App Router)** dan **React 19**.
* [x] Standar visual *Linear-grade financial terminal* (Dark mode konsisten, palet warna disiplin Emerald/Rose/Amber).
* [x] Desain tabel data presisi tinggi berbasis `@tanstack/react-table` (Perataan kanan numerik, font tabular monospaced, *hairline borders*, *zero zebra stripes*, dan *sticky headers*).
* [x] Integrasi grafik canvas interaktif resmi *TradingView Lightweight Charts* pada halaman detail saham (`/candidates/[ticker]`).
* [x] Modul Buku Besar Paper Trading (`/paper-trading`) untuk simulasi transaksi beli sore dan jual pagi tanpa risiko uang nyata.
* [x] Perhitungan presisi biaya transaksi saham bursa Indonesia (komisi beli 0.15%, komisi jual 0.25%, PPh final, dan net return).

---

### ⏳ Fase 3: Mesin Pengujian Historis (Backtest Engine) & Analisis Risiko
* [ ] Penyempurnaan mesin backtest multi-tahun terhadap seluruh saham IDX.
* [ ] Visualisasi kurva ekuitas (*Equity Curve*) dan *Drawdown Chart* berbasis Recharts.
* [ ] Kalkulasi metrik kuantitatif lanjutan: *Profit Factor*, *Sharpe Ratio*, *Expectancy per Trade*, dan *Maximum Adverse Excursion (MAE)*.
* [ ] Ekspor laporan hasil backtest ke format CSV dan PDF untuk dokumentasi riset trader.

---

### 🔮 Fase 4: Abstraksi Multi-Provider & Akselerasi Data Realtime
* [ ] Arsitektur provider plug-and-play: Fallback otomatis dari Yahoo Finance ke TradingView Scanner API, Google Finance, atau provider berbayar jika terjadi rate limit.
* [ ] Mode *Turbo Pre-Closing (15:30 – 15:49 WIB)*: Pemindaian cepat interval 2 menit pada 50 saham paling aktif menjelang bel penutupan bursa.
* [ ] Integrasi webhook sentimen berita realtime terfilter menggunakan Google Gemini AI API.

---

### 📱 Fase 5: Aplikasi Mobile Pendamping (Flutter App)
* [ ] Menghubungkan aplikasi mobile Flutter (`frontend/`) ke REST API scanner untuk pemantauan portofolio dan penerimaan *push notification* darurat saat jam bursa berjalan.
* [ ] Sinkronisasi posisi paper trading antara Web Dashboard dan smartphone.
