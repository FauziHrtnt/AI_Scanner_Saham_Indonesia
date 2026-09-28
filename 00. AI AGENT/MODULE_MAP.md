# Peta Modul & Rute Sistem (Module & Route Map) — Stock Scanner Ecosystem

Dokumen ini memetakan seluruh berkas kode, rute halaman Next.js, endpoint REST API, modul kalkulasi teknikal, dan layanan background pada ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## 🌐 1. Pemetaan Website Dashboard (`saham-indonesia-bsjp-scanner-master`)

### A. Halaman Next.js (App Router)
| Rute Halaman | Berkas Sumber | Fungsi & Konten Utama |
| :--- | :--- | :--- |
| `/` | `app/page.tsx` | Pengalihan otomatis (*redirect*) ke `/dashboard`. |
| `/dashboard` | `app/dashboard/page.tsx` | Ringkasan kondisi pasar (IHSG `^JKSE`), kartu statistik scan hari ini, tombol picu scan, dan tabel kandidat unggulan teratas. |
| `/candidates` | `app/candidates/page.tsx` | Tabel komprehensif seluruh saham hasil scan BSJP dengan filter tab (*All, Strong, Watchlist, Speculative*), pencarian ticker, dan rincian skor. |
| `/candidates/[ticker]` | `app/candidates/[ticker]/page.tsx` | Halaman detail saham individu dengan canvas grafik TradingView (*Lightweight Charts*), tabel riwayat OHLCV harian, dan ringkasan skor teknikal. |
| `/paper-trading` | `app/paper-trading/page.tsx` | Buku besar transaksi simulasi (*Paper Trading Ledger*), riwayat posisi aktif/selesai, statistik *win rate*, dan ringkasan laba/rugi bersih (*Net PnL*). |
| `/backtest` | `app/backtest/page.tsx` | Panel pengujian strategi historis BSJP: input tanggal uji, target keuntungan, stop loss, simulasi slippage, dan visualisasi *equity curve*. |
| `/settings` | `app/settings/page.tsx` | Pengaturan konfigurasi: mode semesta saham (*all_idx, lq45, idx30, custom*), persentase fee komisi broker, dan ambang batas skor. |

### B. Endpoint REST API (Server Route Handlers)
| Metode | Endpoint URL | Berkas Sumber | Deskripsi & Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/scan` | `app/api/scan/route.ts` | Mengambil data hasil pemindaian BSJP terakhir yang tersimpan di database lokal. |
| `POST` | `/api/scan` | `app/api/scan/route.ts` | Memicu eksekusi pemindaian live ke pasar saham IDX melalui Yahoo Finance, menyimpan hasil ke database, dan mengembalikan daftar kandidat terfilter. |
| `GET` | `/api/paper-trades` | `app/api/paper-trades/route.ts` | Mengambil seluruh riwayat posisi transaksi paper trading. |
| `POST` | `/api/paper-trades` | `app/api/paper-trades/route.ts` | Mencatat transaksi beli sore baru (Ticker, Entry Price, Lot, Target Price, Cut Loss, Catatan). |
| `PATCH` | `/api/paper-trades` | `app/api/paper-trades/route.ts` | Menutup posisi transaksi (Exit Price, Exit Time, Status TP/SL/Manual) dan menghitung laba bersih akhir. |
| `POST` | `/api/backtest` | `app/api/backtest/route.ts` | Menjalankan mesin simulasi backtest terhadap kumpulan data historis dan mengembalikan statistik performa. |

### C. Komponen Antarmuka Pengguna (`components/`)
* **`app-shell.tsx`**: Kerangka tata letak terminal finansial utama (bilah navigasi atas, status pasar, indikator waktu bursa, dan pembungkus layout responsif).
* **`candidate-table.tsx`**: Komponen tabel data performa tinggi berbasis `@tanstack/react-table` dengan angka tabular, pengurutan interaktif (*sorting*), sorotan baris kursor (*hover*), dan tombol aksi cepat.
* **`price-history-chart.tsx`**: Komponen grafik canvas interaktif berbasis *TradingView Lightweight Charts* yang mendukung candlestick, volume histogram, dan garis MA20/MA50.
* **`scan-controls.tsx`**: Tombol kontrol scan interaktif dengan status proses pemindaian live dan feedback pesan penyelesaian.
* **`paper-trade-form.tsx`**: Modal dialog pencatatan posisi baru dengan kalkulator estimasi modal, TP (+1.5%), SL (-1.5%), dan rincian komisi broker.
* **`close-trade-form.tsx`**: Modal penyelesaian posisi untuk mencatat realisasi harga jual dan menghitung persentase laba bersih setelah fee.
* **`backtest-controls.tsx`**: Form input parameter pengujian historis (rentang tanggal, take profit %, stop loss %, fee komisi).
* **`theme-context.tsx`**: Manajemen tema antarmuka terpadu (fokus utama *dark terminal mode*).

### D. Modul Domain & Logika Analitis (`modules/`)
* **`scanner.ts`**: Koordinator orkestrasi pemindaian saham secara bertahap (*batching & concurrency limiter*) untuk mencegah pemblokiran IP oleh penyedia data.
* **`scoring.ts`**: Algoritma multi-faktor pemberi skor BSJP (Likuiditas, Momentum, Volume, Tren, dan Penalti Risiko) dari rentang 0 hingga 100 poin.
* **`indicators.ts`**: Perhitungan matematis indikator teknikal: Moving Average (MA20, MA50), Average True Range (ATR-14), Volume Ratio, dan persentase perubahan harian.
* **`market-data.ts`**: Adaptor penghubung data pasar ke pustaka `yahoo-finance2` untuk mengambil candle OHLCV harian dan snapshot harga terkini.
* **`trading.ts`**: Perhitungan matematis biaya transaksi saham Indonesia (komisi beli 0.15%, komisi jual 0.25%, PPh final, dan net return).
* **`universe.ts`**: Pengelola semesta emiten saham IDX (pembaca file `data/universe/idx-tickers.csv`, filter LQ45, dan IDX30).

### E. Pustaka Pendukung (`lib/`)
* **`types.ts`**: Definisi antarmuka TypeScript untuk seluruh entitas (`CandleData`, `Candidate`, `BsjpScore`, `PaperTrade`, `ScanSummary`).
* **`db.ts`**: Abstraksi koneksi database PostgreSQL / Prisma dengan inisialisasi skema tabel otomatis.
* **`storage.ts`**: Fallback penyimpanan data lokal berbasis JSON saat mode PostgreSQL tidak aktif.
* **`format.ts`**: Utilitas pemformatan mata uang Rupiah (`formatRupiah`) dan format angka persentase.
* **`env.ts`**: Pembaca dan validator variabel lingkungan (`process.env`).

---

## 🤖 2. Pemetaan Daemon Notifikasi & Telegram (`ai-stock-scanner-master`)

| Berkas Sumber | Fungsi & Tanggung Jawab |
| :--- | :--- |
| `src/index.ts` | Titik masuk utama aplikasi daemon: inisialisasi bot, pendaftaran listener graceful shutdown, dan start cron scheduler. |
| `src/config/index.ts` | Konfigurasi terpusat (Token bot Telegram, Modal default, Parameter risiko, Batch delay, Universe mode). |
| `src/telegram/telegramService.ts` | Penanganan webhook/polling bot Telegram, menu tombol interaktif (`/start`, `/menu`), perintah `/modal`, serta integrasi HTTP ke API Next.js `/api/scan`. |
| `src/scheduler/cronJobs.ts` | Penjadwal otomatisasi cron harian (07:45, 08:00, 12:05, 15:40 WIB) dan pemicu pemindaian manual. |
| `src/scheduler/dailyStateService.ts` | Pelacakan status kuota sinyal per hari, konfigurasi modal tersimpan per user Telegram, dan histori sinyal aktif. |
| `src/services/signalService.ts` | Mesin pemindai teknikal swing trading multi-timeframe (1D + 4H) dengan sistem scoring 100 poin. |
| `src/services/dataService.ts` | Pengambil data teknikal TradingView Scanner API dan data Yahoo Finance dengan proteksi anti-rate-limit. |
| `src/services/newsService.ts` | Pengambil berita emiten terkini dari Yahoo Finance RSS/Search dan snapshot indeks IHSG. |
| `src/services/geminiService.ts` | Integrasi model AI Google Gemini untuk analisis sentimen berita saham dan rangkuman narasi fundamental. |
| `src/utils/riskManagement.ts` | Kalkulator ukuran posisi aman (*Position Sizing*) berbasis risiko modal 2% dan fraksi lot BEI. |
| `src/utils/logger.ts` | Logger sistem terformat dengan label modul dan stempel waktu WIB. |
