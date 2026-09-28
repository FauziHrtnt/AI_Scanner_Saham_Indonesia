# AI Stock Signal Scanner Indonesia 🇮🇩

Sistem pemindai saham otomatis terintegrasi yang menganalisis seluruh saham yang terdaftar di Bursa Efek Indonesia (BEI/IDX) menggunakan analisis teknikal multi-timeframe (1D & 4H), deteksi momentum breakout & volume spike, sentimen berita AI (Google Gemini), integrasi scanner BSJP, serta bot Telegram interaktif untuk riset saham mandiri dan notifikasi trading harian.

---

## ✨ Fitur Utama

- 📊 **Multi-Timeframe Technical Scanner**: Filter tren jangka menengah (Daily 1D: SMA20, SMA50, RSI, MACD, ADX) dipadukan dengan pemicu masuk jangka pendek (4H Entry Trigger).
- 🔎 **On-Demand Stock Analysis (Cek Emiten Mandiri)**: Analisis kode saham apapun (misal: `DEWA`, `BBCA`, `GOTO`) langsung dari Telegram melalui menu interaktif atau perintah `/cek <KODE>`.
- 🏆 **Algoritma Scoring AI (0–100)**: Penilaian komprehensif berdasarkan 5 pilar teknikal & tren fundamental.
- ⚡ **Deteksi Breakout & Volume Spike**: Pemindaian lonjakan volume signifikan di atas rata-rata 20 hari dan penembusan level resisten.
- 📰 **AI Sentiment Analysis (Google Gemini)**: Penilaian sentimen berita pasar, emiten, dan kebijakan makroekonomi secara otomatis.
- 💰 **Kalkulasi Money & Risk Management Otomatis**: Menghitung alokasi lot, estimasi modal beli, serta target profit (TP1, TP2) dan batas risiko Stop Loss (SL) sesuai modal masing-masing pengguna.
- 📲 **Interactive Telegram Bot (Multi-User)**: Mendukung pengaturan modal per-pengguna (`/modal`), pemantauan portofolio simulasi (*paper trade*), serta notifikasi terpusat.
- ⏰ **Automated Crons & Resilient Execution**: Penjadwalan scan otomatis pada jam bursa (08:45 WIB, 12:05 WIB, dan 15:40 WIB) dengan penanganan jitter & rate-limiting aman.

---

## 🔒 Keamanan & Data Pribadi (Privasi Terjamin)

> [!IMPORTANT]
> **Data Kredensial dan Konfigurasi Pengguna Wajib Diisi Secara Manual.**
> Repository publik ini **TIDAK MENYIMPAN** token bot, kunci API, chat ID, maupun data transaksi/konfigurasi modal pengguna.

Semua data pribadi telah dikecualikan melalui `.gitignore`:
* **`.env`** — Berisi kredensial bot Telegram, Google Gemini API Key, dan konfigurasi rahasia lainnya.
* **`userConfigs.json`** — Menyimpan profil modal dan persentase risiko unik tiap pengguna Telegram.
* **`userRegistry.json`** — Daftar ID Telegram pengguna yang terdaftar.
* **`dailyState.json`** & **`positions.json`** — Status harian dan riwayat simulasi posisi portofolio.

*(File-file di atas akan dibuat secara otomatis oleh sistem saat aplikasi berjalan pertama kali).*

---

## 🚀 Panduan Instalasi & Pengisian Kredensial Manual

### 1. Kloning Repository & Pasang Dependensi

```bash
git clone https://github.com/FauziHrtnt/AI_Scanner_Saham_Indonesia.git
cd AI_Scanner_Saham_Indonesia
npm install
```

### 2. Konfigurasi File Lingkungan (`.env`)

Salin template konfigurasi `.env.example` menjadi `.env`:

```bash
# Windows Command Prompt:
copy .env.example .env

# Atau PowerShell / Linux / macOS:
cp .env.example .env
```

Buka file `.env` yang baru dibuat dengan teks editor Anda, lalu lakukan pengisian kredensial secara manual:

#### A. Bot Telegram (`TELEGRAM_BOT_TOKEN`)
1. Buka aplikasi Telegram, cari akun resmi **[@BotFather](https://t.me/BotFather)**.
2. Kirim perintah `/newbot`, lalu ikuti instruksi pembuatan nama bot.
3. BotFather akan memberikan token API HTTP (contoh: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
4. Tempelkan token tersebut pada baris `TELEGRAM_BOT_TOKEN=...`.

#### B. Chat ID Telegram (`TELEGRAM_CHAT_ID`)
1. Kirim pesan `/start` ke bot yang baru Anda buat.
2. Cari bot **[@userinfobot](https://t.me/userinfobot)** di Telegram untuk melihat Chat ID Anda secara instan, atau buka URL berikut di peramban web:
   ```
   https://api.telegram.org/bot<TOKEN_BOT_ANDA>/getUpdates
   ```
3. Salin angka `id` (contoh: `7924447603`) dan masukkan ke `TELEGRAM_CHAT_ID=...`.

#### C. Google Gemini API Key (`GEMINI_API_KEY` - Opsional)
1. Kunjungi [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Buat API Key baru secara gratis.
3. Tempelkan API Key ke `GEMINI_API_KEY=...` untuk mengaktifkan analisis sentimen berita.

#### D. Pengaturan Modal Default & Risiko
Sesuaikan nilai default sesuai preferensi Anda:
```env
CAPITAL_AMOUNT=3000000   # Modal default Rp 3.000.000 (bisa diubah per user di bot via /modal)
RISK_PER_TRADE=0.02      # Toleransi risiko 2% per transaksi
STOP_LOSS_PCT=0.03       # Batas cut loss 3%
MAX_SIGNALS_PER_DAY=5    # Maksimal rekomendasi saham harian
SCAN_UNIVERSE=idx        # Memindai seluruh saham BEI
```

---

## 🛠️ Menjalankan Sistem

### Kompilasi & Jalankan Scanner

```bash
# Kompilasi TypeScript ke JavaScript (dist/)
npm run build

# Menjalankan daemon scanner & bot Telegram
npm start

# Atau jalankan mode pengujian/development
npm run dev

# Jalankan manual scan sekali jalan (CLI)
npm start -- --scan
```

---

## 📱 Panduan Perintah Bot Telegram

Setelah bot aktif, pengguna dapat mengontrol bot melalui Telegram:

| Perintah | Keterangan |
|---|---|
| `/menu` atau `/start` | Membuka Dashboard Kontrol Utama dengan tombol interaktif |
| `🔎 Cek / Analisis Emiten` | Tombol interaktif untuk memasukkan kode emiten saham (misal: `DEWA`) |
| `/cek <KODE>` | Menganalisis emiten tertentu secara langsung (contoh: `/cek BBCA` atau `/cek dewa`) |
| `/modal <JUMLAH>` | Mengatur modal kerja pribadi secara mandiri (contoh: `/modal 10000000`) |
| `📰 Berita Pasar` | Menu membaca berita IHSG, kebijakan ekonomi, dan pengumuman BEI |
| `📊 Portofolio Simulasi` | Menampilkan posisi aktif dan riwayat evaluasi TP/SL |

---

## ⏰ Jadwal Pemindaian Otomatis (WIB)

| Waktu (WIB) | Modul | Deskripsi |
|---|---|---|
| **08:45** | **Morning Full Scan** | Memindai universe saham IDX untuk filter tren 1D & trigger 4H sebelum sesi perdagangan. Top kandidat dikirimkan ke Telegram. |
| **12:05** | **Midday Re-Check** | Evaluasi ulang candle 4H saat jeda sesi 1 bursa untuk memantau peluang baru. |
| **15:40** | **Closing Exit Check** | Memeriksa seluruh posisi saham aktif terhadap batas Stop Loss / penembusan support. |
| **07:45** | **Daily Reset** | Mereset kuota sinyal harian untuk hari perdagangan baru. |

---

## 📂 Struktur Direktori Proyek

```
ai-stock-scanner/
├── .env.example             # Template konfigurasi environment (panduan manual)
├── .gitignore               # Proteksi ketat data pribadi & kredensial
├── package.json
├── tsconfig.json
├── 00. AI AGENT/            # Dokumentasi arsitektur, panduan keamanan & UI rules
├── src/
│   ├── config/
│   │   ├── index.ts         # Parser konfigurasi lingkungan (.env)
│   │   ├── tickers.json     # Daftar ticker saham utama
│   │   └── tickers_full.json# Daftar seluruh emiten IDX
│   ├── services/
│   │   ├── dataService.ts          # Integrasi TradingView & Yahoo Finance
│   │   ├── indicatorService.ts     # Kalkulasi teknikal (RSI, SMA, ADX, MACD)
│   │   ├── signalService.ts        # Pipeline pemrosesan sinyal beli
│   │   ├── scoringService.ts       # Sistem pembobotan skor saham
│   │   ├── stockAnalysisService.ts # On-demand scanner per emiten (/cek)
│   │   └── newsService.ts          # Integrasi berita & Google Gemini AI
│   ├── scheduler/
│   │   ├── cronJobs.ts             # Manajemen jadwal otomatis cron
│   │   └── dailyStateService.ts    # Penyimpanan profil user & posisi simulasi
│   ├── telegram/
│   │   └── telegramService.ts      # Logika interaktif bot Telegram & inline buttons
│   ├── utils/
│   │   ├── logger.ts               # Pencatatan log aktivitas sistem
│   │   └── riskManagement.ts       # Kalkulasi ukuran lot & manajemen risiko
│   └── index.ts                    # Titik masuk utama aplikasi (daemon)
```

---

## ⚖️ Lisensi & Disclaimer

Proyek ini dirilis di bawah lisensi [MIT](LICENSE).

**Disclaimer Finansial:**
Sistem ini dibuat untuk tujuan edukasi dan riset teknikal mandiri (*Decision Support System*). Sistem ini **TIDAK** melakukan eksekusi order otomatis ke bursa sekuritas dan bukan merupakan ajakan finansial mutlak. Segala keputusan investasi dan risiko transaksi saham sepenuhnya berada pada tanggung jawab masing-masing individu (*Do Your Own Research*).
