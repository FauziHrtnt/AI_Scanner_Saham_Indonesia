# Aturan Khusus Proyek (Project Rules & Financial Standards) — Stock Scanner Ecosystem

Dokumen ini mendefinisikan batasan teknis, konvensi pasar modal Indonesia (BEI/IDX), standar presisi matematis finansial, dan regulasi arsitektur untuk ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## 🏛️ 1. Standar Konvensi Pasar Modal Indonesia (BEI / IDX)

Seluruh komponen, database, tampilan website, dan pesan notifikasi wajib patuh pada standar bursa berikut:

### A. Format Ticker Saham & Indeks
* **Saham Reguler**: Menggunakan 4 huruf kapital dengan akhiran `.JK` pada layer data (misal: `BBCA.JK`, `BBRI.JK`, `ASII.JK`, `TLKM.JK`).
* **Format Tampilan UI**: Tampilkan kode 4 huruf kapital sebagai judul utama (`BBCA`) dan kode Yahoo Finance lengkap (`BBCA.JK`) sebagai sub-teks sekunder yang redup (`text-xs text-slate-400 font-mono`).
* **Indeks Acuan IHSG**: Menggunakan simbol `^JKSE` untuk indeks gabungan bursa Indonesia.
* **Saham Khusus & Akselerasi**: Saham dengan kode khusus (waran `-W`, obligasi) tidak disertakan dalam default scanner BSJP saham umum.

### B. Satuan Transaksi & Fraksi Harga Saham BEI
* **Satuan Transaksi (Lot)**: 
  - 1 Lot = **100 lembar saham**.
  - Kalkulasi *position sizing* wajib menghasilkan angka bulat lot (`Math.floor(shares / 100)`). **Dilarang keras** menyarankan pembelian lot pecahan (*fractional shares*).
* **Fraksi Harga (Tick Size BEI)**:
  - Harga < Rp 200: Fraksi Rp 1
  - Rp 200 – Rp 500: Fraksi Rp 2
  - Rp 500 – Rp 2.000: Fraksi Rp 5
  - Rp 2.000 – Rp 5.000: Fraksi Rp 10
  - Harga > Rp 5.000: Fraksi Rp 25
  - Target Price (TP) dan Stop Loss (SL) yang dihasilkan scanner harus disesuaikan ke fraksi terdekat yang valid di bursa.

### C. Zona Waktu & Jam Perdagangan Resmi (WIB = UTC+7)
* Seluruh penanggalan, log scanner, jadwal cron, dan grafik wajib menggunakan zona waktu **Asia/Jakarta (WIB)**.
* **Sesi 1**: 09:00 – 12:00 WIB (Khusus Jumat: 09:00 – 11:30 WIB).
* **Sesi 2**: 13:30 – 15:49 WIB.
* **Pra-Penutupan (Pre-closing)**: 15:50 – 16:00 WIB.
* **Jendela Emas BSJP (Beli Sore)**: Direkomendasikan scan dan eksekusi pada rentang **15:30 – 15:49 WIB** ketika arah candle harian dan akumulasi volume telah terkonfirmasi.
* **Jendela Jual Pagi**: 09:00 – 09:30 WIB pada hari bursa aktif berikutnya.

---

## 💰 2. Standar Presisi Finansial & Fee Simulation

### A. Larangan Floating-Point Arithmetic untuk Transaksi Uang
Operasi matematika biner standar di JavaScript dapat menyebabkan galat presisi (*e.g.* `0.1 + 0.2 === 0.30000000000000004`).
* **Wajib Gunakan Pustaka Presisi Tinggi (`decimal.js`)**:
  - Untuk kalkulasi nilai transaksi, fee sekuritas, PPh/PPN, slippage, net return, dan akumulasi PnL di modul paper trading dan backtest.
* **Parameter Biaya Transaksi Standar (Indonesian Broker Fee Structure)**:
  - **Fee Beli (Default)**: `0.15%` (0.0015) termasuk komisi broker, levy BEI, KPEI, KSEI, dan PPN.
  - **Fee Jual (Default)**: `0.25%` (0.0025) termasuk komisi broker, levy, PPN, dan PPh final transaksi penjualan saham (0.1%).
  - **Slippage Beli/Jual (Simulasi)**: Default `0.2%` – `0.5%` pada mode backtest untuk mencerminkan eksekusi riil pada market bertransaksi cepat.

---

## 📊 3. Model & Klasifikasi Skor BSJP (0 – 100 Poin)

Scoring bersifat multi-faktor matematis objektif untuk mengeliminasi bias emosional:

| Komponen | Bobot Maksimal | Tolok Ukur / Aturan |
| :--- | :--- | :--- |
| **1. Likuiditas (Liquidity)** | **25 Poin** | Rata-rata transaksi 20 hari (`avgValue20D`): <br>• `>= Rp 50M` (+25 pt)<br>• `>= Rp 20M` (+20 pt)<br>• `>= Rp 10M` (+15 pt)<br>• `>= Rp 5M` (+10 pt)<br>• `< Rp 5M` (0-5 pt / diskualifikasi jika illiquid). |
| **2. Momentum Sore** | **30 Poin** | Posisi harga terhadap rentang harian (`closePosition = (close - low) / (high - low)`): <br>• Close di area 75%-100% dari rentang harian (+20 pt)<br>• Kenaikan harian ideal (+1.5% s/d +6%) (+10 pt). |
| **3. Konfirmasi Volume** | **20 Poin** | Lonjakan volume terhadap rata-rata 20 hari (`volumeRatio`): <br>• Vol Ratio >= 2.0x (+20 pt)<br>• Vol Ratio >= 1.5x (+15 pt)<br>• Vol Ratio >= 1.2x (+10 pt). |
| **4. Konteks Tren (1D & 4H)** | **15 Poin** | Posisi di atas MA20 dan MA50 (+10 pt), slope MA20 positif (+5 pt). |
| **5. Penalti Risiko (Risk Penalty)** | **0 s/d -30 Poin** | Pengurangan skor jika: Jarum atas panjang (*upper shadow wick* > 30%), dekat resisten kuat, spread harga renggang, atau saham masuk kriteria gorengan. |

### Klasifikasi Label Skor:
1. `score >= 80` ➔ **STRONG CANDIDATE** (`text-emerald-400 bg-emerald-500/10 border-emerald-500/30`)
2. `score 70 - 79` ➔ **WATCHLIST** (`text-cyan-400 bg-cyan-500/10 border-cyan-500/30`)
3. `score 60 - 69` ➔ **WEAK / MONITOR ONLY** (`text-amber-400 bg-amber-500/10 border-amber-500/30`)
4. `score < 60` ➔ **SKIP** (`text-slate-400 bg-slate-800/40 border-slate-700`)
5. **High Risk / Speculative**: Saham dengan kapitalisasi kecil, volume anomali sesaat, atau papan pemantauan khusus wajib mendapatkan tanda **SPECULATIVE** dengan rekomendasi ukuran posisi setengah (*half sizing*).

---

## 🔒 4. Batasan Arsitektur & Keamanan Ekosistem

1. **Jalur Data Publik Bersifat Read-Only**:
   - Integrasi Yahoo Finance (`yahoo-finance2`) dan TradingView bersifat pembacaan data pasar publik (*read-only*).
2. **Tidak Ada Modul Eksekusi Order Riil**:
   - Sistem tidak menyimpan kredensial akun sekuritas, PIN trading, ataupun API key broker untuk menjamin keamanan total dana pengguna.
3. **Penyimpanan Status Bersifat Terisolasi**:
   - Hasil scan, histori sinyal, dan paper trading disimpan lokal pada database PostgreSQL / JSON storage tanpa mentransmisikan data privasi ke server eksternal.
