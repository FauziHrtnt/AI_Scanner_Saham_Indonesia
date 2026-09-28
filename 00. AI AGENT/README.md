# AI Stock Scanner & BSJP Dashboard Ecosystem

Pusat kendali pedoman arsitektur, standar rekayasa visual antarmuka (*UI/UX Linear-grade*), spesifikasi teknis, aturan basis data finansial, dan panduan kemudi agen AI (*AI Steering Files*) untuk ekosistem **AI Stock Scanner Indonesia (BEI/IDX)**.

Ekosistem ini terdiri dari dua subsistem utama yang saling terintegrasi:
1. **BSJP Stock Scanner Dashboard (Website)**: Web dashboard lokal berbasis **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + TanStack Table + TradingView Lightweight Charts**.
2. **AI Stock Scanner & Telegram Automation**: Layanan backend & daemon berbasis **Node.js + TypeScript + Telegram Bot API + Node-Cron + TradingView API + Yahoo Finance + Google Gemini AI**.

---

## 📌 Fitur Utama Sistem

### 1. Website Dashboard (`saham-indonesia-bsjp-scanner-master`)
* **Dashboard Analisis Pasar (`/dashboard`)**: Ringkasan performa IHSG (`^JKSE`), status scanner harian, statistik kandidat aktif, dan tombol picu *live scan*.
* **Tabel Kandidat BSJP Presisi (`/candidates`)**: Visualisasi kandidat Beli Sore Jual Pagi dengan perataan angka tabular monospaced, *hairline borders*, *sticky headers*, skor multi-faktor (0–100), estimasi *entry low/high*, Target Profit (+1.5%), Stop Loss (-1.5%), serta filter kategori (*Strong*, *Watchlist*, *Weak*, *Speculative*).
* **Terminal Chart Saham Interaktif (`/candidates/[ticker]`)**: Integrasi canvas chart TradingView (*Lightweight Charts*) dengan candlestick harian, moving average (MA20/MA50), ATR-14, histogram volume, dan rekam jejak scoring historis.
* **Buku Catatan Paper Trading (`/paper-trading`)**: Simulasi transaksi tanpa risiko uang riil, pencatatan otomatis posisi beli sore, kalkulasi simulasi jual pagi, pemotongan komisi/pajak (*fee* beli 0.15%, *fee* jual 0.25%), serta penghitungan *win rate* dan *net profit/loss*.
* **Mesin Pengujian Historis Backtest (`/backtest`)**: Pengujian strategi BSJP terhadap data historis dengan simulasi slippage, spread, dan drawdown.
* **Konfigurasi Fleksibel (`/settings`)**: Pemilihan semesta saham (*LQ45, IDX30, All IDX 750+ saham dari CSV lokal, Speculative*), ambang batas skor, dan parameter risiko.
* **REST API Scanner (`/api/scan`)**: Endpoint lokal penyedia data kandidat real-time yang dapat dikonsumsi oleh bot Telegram dan klien eksternal.

### 2. Telegram Bot & Scheduler Daemon (`ai-stock-scanner-master`)
* **Jadwal Otomatis Multi-Sesi (WIB)**:
  * `07:45`: Reset status harian dan sinkronisasi kuota sinyal.
  * `08:00`: Full morning scan saham IDX sebelum pembukaan sesi 1.
  * `12:05`: Midday check dan konfirmasi volume saat jeda istirahat bursa.
  * `15:40`: Pre-closing scan (BSJP) dan trailing stop / exit warning menjelang penutupan sesi 2.
* **Bot Interaktif Telegram (`node-telegram-bot-api`)**:
  * Perintah `/menu` & `/start` dengan antarmuka tombol interaktif (*inline keyboard*).
  * Perintah `/modal <nominal>` untuk personalisasi kalkulasi *position sizing* dan batas risiko per pengguna.
  * Portal berita ekonomi, sentimen IHSG, dan pengumuman emiten terintegrasi Yahoo Finance & Google Gemini AI.
  * Sinergi dua arah dengan Website via panggilan API ke `http://localhost:3000/api/scan`.

---

## 🛡️ Prinsip Keamanan & Filosofi Trading

1. **Manual Trading Assistant Only**:
   * Sistem ini **BUKAN bot auto-trading** dan **TIDAK memiliki akses ke broker API / eksekusi order riil**.
   * Seluruh keputusan beli dan jual berada 100% di tangan pengguna melalui aplikasi sekuritas resmi masing-masing.
2. **Disiplin Manajemen Risiko**:
   * Setiap sinyal menyertakan *position sizing* berbasis risiko modal (default 2% risk per trade).
   * Saham spekulatif (*high risk/gorengan*) wajib ditandai label peringatan risiko (*amber/red badge*) dan dilarang disajikan sebagai rekomendasi aman.
3. **Presisi Finansial Tanpa Kesalahan Pembulatan Biner**:
   * Perhitungan nilai transaksi, fee broker, PPN/PPh, slippage, dan persentase keuntungan wajib menggunakan presisi matematis desimal (`decimal.js` / presisi hingga 4 desimal).

---

## 📂 Struktur Direktori Proyek & Berkas Kemudi (Steering Files)

```text
scanner_saham/
├── 00. AI AGENT/                  # Berkas kemudi terpadu agen AI (Standar, aturan, arsitektur)
│   ├── README.md                  # Gambaran umum ekosistem & peta berkas kemudi
│   ├── AI_RULES.md                # Aturan operasional agen AI & standar prompt terstruktur
│   ├── PROJECT_RULES.md           # Konvensi ticker IDX (.JK), presisi finansial, & batasan sistem
│   ├── UI_UX_DESIGN_RULES.md      # Standar desain UI/UX: Terminal keuangan Linear-grade, tabel TanStack, chart
│   ├── CODING_STYLE.md            # Standar Clean Code TypeScript, Next.js 16 App Router, & React 19
│   ├── ARCHITECTURE.md            # Arsitektur sistem Website Next.js, API, dan Telegram Daemon
│   ├── MODULE_MAP.md              # Pemetaan modul, routes, komponen UI, dan service data
│   ├── CRUD_SPECIFICATION.md      # Spesifikasi kontrol entitas: Scan, Paper Trade, Backtest, Config
│   ├── DATABASE_SCHEMA.md         # Skema database PostgreSQL / Prisma / JSON persistence
│   ├── WORKFLOW_DFD.md            # Diagram alur kerja (DFD) scan sore, backtest, dan alert Telegram
│   ├── SECURITY.md                # Mitigasi rate limit Yahoo/TradingView, sanitasi ticker, & API keys
│   ├── ROADMAP.md                 # Rencana pengembangan sistem bertahap (MVP -> Advanced)
│   ├── TODO.md                    # Daftar prioritas pekerjaan aktif dan backlog
│   ├── KNOWN_ISSUES.md            # Daftar kendala teknis (rate limiting, delay market data) & solusinya
│   ├── DECISIONS.md               # Catatan keputusan arsitektur (ADR)
│   ├── DEPENDENCIES.md            # Katalog lengkap dependensi website dan background service
│   ├── CHANGELOG.md               # Buku rekam jejak modifikasi kode
│   ├── PARSER_TEMPLATE.md         # Template parser data pasar OHLCV & kalkulator indikator teknikal
│   └── prompts/                   # Template alur kerja mandiri (ui_component, bug_fix, review, dsb.)
│
├── saham-indonesia-bsjp-scanner-master/  # [SUBSISTEM 1] Web Dashboard (Next.js 16 + React 19)
│   ├── app/                              # Next.js App Router (dashboard, candidates, backtest, dsb.)
│   ├── components/                       # Komponen UI terminal keuangan (tables, charts, modals)
│   ├── modules/                          # Domain engine (scanner, scoring, indicators, universe)
│   ├── lib/                              # Utility data, storage, db, & env
│   └── data/universe/                    # Dataset ticker IDX (idx-tickers.csv)
│
└── ai-stock-scanner-master/              # [SUBSISTEM 2] Telegram Bot & Scheduler Daemon
    ├── src/                              # Source code TypeScript (index, scheduler, telegram, services)
    ├── package.json                      # Konfigurasi node daemon
    └── .env                              # Token Telegram, Gemini API Key, & parameter modal
```
