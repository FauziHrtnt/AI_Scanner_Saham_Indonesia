# Katalog Dependensi & Toolchain (Dependencies & Toolchain) — Stock Scanner Ecosystem

Dokumen ini mencatat seluruh pustaka perangkat lunak (*libraries*), kerangka kerja (*frameworks*), dan paket pendukung yang digunakan pada ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## 🌐 1. Dependensi Website Dashboard (`saham-indonesia-bsjp-scanner-master`)

### A. Inti Kerangka Kerja & Tampilan (Core & UI)
| Nama Paket | Versi | Peran & Alasan Penggunaan |
| :--- | :--- | :--- |
| `next` | `^16.2.6` | Framework React App Router modern untuk web dashboard & API route handlers. |
| `react` & `react-dom` | `^19.2.4` | Pustaka dasar antarmuka pengguna berbasis komponen. |
| `tailwindcss` | `^4.0.0` | Kerangka CSS utilitas modern untuk tata letak dark mode terminal finansial. |
| `@tailwindcss/postcss`| `^4.0.0` | Integrasi PostCSS untuk kompilasi stylesheet Tailwind v4 berkecepatan tinggi. |
| `lucide-react` | `^1.14.0` | Set ikon antarmuka bersih dan minimalis untuk indikator pasar dan tombol aksi. |
| `clsx` | `^2.1.1` | Utilitas penggabungan kelas CSS kondisional yang efisien. |

### B. Tabel Data & Visualisasi Grafik (Data Grid & Charts)
| Nama Paket | Versi | Peran & Alasan Penggunaan |
| :--- | :--- | :--- |
| `@tanstack/react-table` | `^8.21.3` | Pustaka tabel *headless* untuk grid kandidat saham dengan sorting, filtering, dan angka tabular. |
| `lightweight-charts` | `^5.2.0` | Pustaka grafik kanvas resmi TradingView untuk visualisasi candlestick dan indikator teknikal 60 FPS. |
| `recharts` | `^3.8.1` | Visualisasi grafik berbasis SVG untuk kurva ekuitas backtest (*Equity Curve*) dan metrik ringkasan. |

### C. Analitis Data Pasar & Validasi (Market Data & Math)
| Nama Paket | Versi | Peran & Alasan Penggunaan |
| :--- | :--- | :--- |
| `yahoo-finance2` | `^3.14.0` | Klien pengambil data pasar harian (OHLCV, quotes) saham Indonesia (.JK) tanpa API key. |
| `decimal.js` | `^10.6.0` | Perhitungan matematis presisi tinggi untuk uang, fee sekuritas, PnL bersih, dan persentase keuntungan. |
| `zod` | `^4.4.3` | Skema validasi data bertipe ketat saat menerima input API atau memproses konfigurasi. |
| `csv-parse` | `^6.2.1` | Parser berkas dataset CSV semesta saham IDX (`idx-tickers.csv`). |
| `date-fns` & `date-fns-tz` | `^4.1.0` / `^3.2.0` | Penanganan tanggal, waktu bursa, dan konversi zona waktu Asia/Jakarta (WIB). |

### D. Basis Data & Persistensi
| Nama Paket | Versi | Peran & Alasan Penggunaan |
| :--- | :--- | :--- |
| `@prisma/client` | `^7.8.0` | ORM untuk pemetaan skema database. |
| `pg` & `@types/pg` | `^8.16.3` | Driver PostgreSQL untuk koneksi basis data relasional. |

---

## 🤖 2. Dependensi Background Daemon (`ai-stock-scanner-master`)

| Nama Paket | Versi | Peran & Alasan Penggunaan |
| :--- | :--- | :--- |
| `node-telegram-bot-api` | `^0.66.0` | Klien bot Telegram untuk menerima interaksi pengguna (`/start`, `/menu`) dan mendistribusikan sinyal. |
| `node-cron` | `^3.0.3` | Penjadwal tugas background otomatis (07:45, 08:00, 12:05, 15:40 WIB). |
| `axios` | `^1.6.7` | Klien HTTP untuk memanggil API TradingView Scanner dan integrasi bridge ke `http://localhost:3000/api/scan`. |
| `dotenv` | `^16.4.1` | Pembaca variabel lingkungan rahasia dari berkas `.env`. |
| `ts-node` | `^10.9.2` | Eksekutor TypeScript runtime untuk mode pengembangan lokal. |
| `typescript` | `^5.3.3` | Kompilator bahasa TypeScript untuk pengetikan tipe data yang aman dan handal. |
| `rimraf` | `^5.0.5` | Utilitas pembersih direktori build `dist/`. |

---

## 🚫 3. Kebijakan Instalasi Paket Baru
* AI Agent **dilarang** menginstal paket eksternal baru tanpa konfirmasi eksplisit dari pengguna.
* Jika membutuhkan kalkulasi tambahan, prioritaskan penggunaan pustaka yang sudah tersedia (`decimal.js`, `date-fns`, `yahoo-finance2`).
