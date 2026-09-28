# Spesifikasi Entitas & Kontrol Data (Entity & Control Specification) — Stock Scanner Ecosystem

Dokumen ini mendefinisikan spesifikasi kontrol formulir, validasi input data, tipe data, serta aturan bisnis untuk seluruh entitas yang dikelola pada **BSJP Stock Scanner Website** dan **Telegram Daemon**.

---

## 📋 1. Entitas Transaksi Paper Trading (`PaperTrade`)

Digunakan pada halaman `/paper-trading` untuk mencatat simulasi transaksi tanpa risiko uang nyata:

### A. Form Buka Posisi Baru (*Open Position / Beli Sore*)
| Nama Atribut | Label UI | Tipe Kontrol UI | Validasi & Aturan | Deskripsi & Nilai Default |
| :--- | :--- | :--- | :--- | :--- |
| `ticker` | Kode Saham | Search Select / Text | `required|string|regex:/^[A-Z]{4}$/` | Kode emiten 4 huruf kapital (misal: `BBCA`, `BRIS`). |
| `entryPrice` | Harga Masuk (Rp) | NumberInput (Tabular) | `required|integer|min:50` | Harga beli per lembar. Default terisi dari harga terakhir bursa saat scan. |
| `lot` | Jumlah Lot | NumberInput (Tabular) | `required|integer|min:1` | Jumlah lot yang dibeli (1 lot = 100 lembar). |
| `targetPrice` | Target Profit (TP) | NumberInput (Tabular) | `required|integer|gt:entryPrice` | Target harga jual pagi. Default dihitung otomatis `entryPrice * 1.015` (+1.5%). |
| `cutLossPrice` | Cut Loss (SL) | NumberInput (Tabular) | `required|integer|lt:entryPrice` | Batas proteksi kerugian. Default dihitung otomatis `entryPrice * 0.985` (-1.5%). |
| `notes` | Alasan Masuk | Textarea | `optional|string|max:500` | Catatan analisis (misal: *"Volume spike 2.5x, penutupan di pucuk candle"*). |

### B. Form Tutup Posisi (*Close Position / Jual Pagi*)
| Nama Atribut | Label UI | Tipe Kontrol UI | Validasi & Aturan | Deskripsi & Nilai Default |
| :--- | :--- | :--- | :--- | :--- |
| `exitPrice` | Harga Keluar (Rp) | NumberInput (Tabular) | `required|integer|min:50` | Realisasi harga penjualan di sesi pagi. |
| `exitReason` | Alasan Keluar | Select Dropdown | `required|in:TP_HIT,SL_HIT,TIME_EXIT,MANUAL` | Pilihan: Target Tercapai (+1.5%), Kena Stop Loss, Batas Waktu Habis, atau Tutup Manual. |
| `exitNotes` | Catatan Evaluasi | Textarea | `optional|string|max:500` | Evaluasi perdagangan pasca-market pagi. |

### C. Kolom Hasil Perhitungan Otomatis (*Computed Attributes*)
* `totalCapital`: `entryPrice * lot * 100` (Total uang yang dialokasikan).
* `buyFeeIdr`: `totalCapital * 0.0015` (Komisi beli broker 0.15%).
* `sellFeeIdr`: `(exitPrice * lot * 100) * 0.0025` (Komisi jual broker 0.25% + PPh final).
* `netProfitIdr`: `(exitPrice - entryPrice) * lot * 100 - (buyFeeIdr + sellFeeIdr)`.
* `netReturnPct`: `(netProfitIdr / totalCapital) * 100` (Persentase hasil bersih setelah seluruh potongan).

---

## 🔍 2. Entitas Hasil Pemindaian Saham (`Candidate`)

Dihasilkan oleh route handler `/api/scan` dan ditampilkan pada tabel `/candidates`:

| Atribut Data | Tipe Data | Representasi UI | Keterangan Aturan |
| :--- | :--- | :--- | :--- |
| `code` | `VARCHAR(10)` | Teks Tebal Monospace | Kode saham 4 huruf (contoh: `BBRI`). |
| `price` | `INTEGER` | Format Rupiah Rata Kanan | Harga penutupan terakhir (contoh: `Rp 4.850`). |
| `dailyChangePct` | `DECIMAL(5,2)` | Persentase Berwarna Rata Kanan | Hijau jika positif (`+2.45%`), merah jika negatif. |
| `volumeRatio` | `DECIMAL(4,2)` | Angka Desimal x | Rasio volume hari ini dibanding MA20V (contoh: `1.85x`). |
| `totalScore` | `INTEGER` | Nilai 0–100 + Bar Visual | Skor total hasil penjumlahan 5 komponen algoritma BSJP. |
| `label` | `ENUM` | Badge Berwarna | `strong` (Hijau), `watchlist` (Biru), `weak` (Kuning), `skip` (Abu-abu). |
| `suggestedEntryLow` | `INTEGER` | Format Rupiah | Batas bawah zona beli yang disarankan. |
| `suggestedEntryHigh` | `INTEGER` | Format Rupiah | Batas atas zona beli yang disarankan. |
| `targetPrice` | `INTEGER` | Format Rupiah (+1.5%) | Target jual terdekat pada pembukaan sesi berikutnya. |
| `cutLossPrice` | `INTEGER` | Format Rupiah (-1.5%) | Batas stop loss disiplin. |
| `tags` | `JSON Array` | Tag Pill | Penanda karakteristik (misal: `["liquid", "breakout"]` atau `["speculative", "high_risk"]`). |

---

## ⚙️ 3. Entitas Konfigurasi Scanner (`ScannerSettings`)

Dikelola melalui halaman `/settings` untuk menyesuaikan preferensi scanner:

| Nama Pengaturan | Tipe Input | Nilai Bawaan (Default) | Batasan & Opsi |
| :--- | :--- | :--- | :--- |
| `universeMode` | Radio / Pill Select | `"all_idx"` | Pilihan: `lq45` (Aman), `idx30` (Sangat Likuid), `all_idx` (Seluruh BEI), `custom` (Watchlist Pribadi). |
| `includeSpeculative` | Toggle Switch | `true` | Jika aktif, saham berisiko tinggi / berkapitalisasi kecil tetap muncul dengan label peringatan Amber. |
| `minLiquidityIdr` | NumberInput | `5000000000` (Rp 5 Miliar) | Batas minimal rata-rata nilai transaksi harian agar saham tidak diabaikan (*skip*). |
| `buyFeePct` | NumberInput (%) | `0.15` | Persentase komisi beli sekuritas pengguna. |
| `sellFeePct` | NumberInput (%) | `0.25` | Persentase komisi jual sekuritas pengguna. |
| `targetProfitPct` | NumberInput (%) | `1.50` | Persentase target kenaikan standar strategi BSJP. |
| `stopLossPct` | NumberInput (%) | `1.50` | Persentase batas kerugian standar strategi BSJP. |

---

## 🤖 4. Entitas Konfigurasi Pengguna Telegram (`UserConfig`)

Disimpan pada `userConfigs.json` di direktori daemon untuk setiap trader yang berinteraksi via bot:

| Field | Tipe | Nilai Default | Keterangan |
| :--- | :--- | :--- | :--- |
| `chatId` | `VARCHAR(30)` | Wajib (ID Chat Telegram) | Kunci unik pengenal pengguna Telegram. |
| `capital` | `DECIMAL(16,2)` | `Rp 200.000` | Modal trading yang dialokasikan pengguna untuk kalkulasi *lot sizing*. Diperbarui melalui `/modal <angka>`. |
| `riskPerTrade` | `DECIMAL(4,2)` | `0.02` (2%) | Batas maksimal risiko kerugian modal per satu transaksi. |
| `stopLossPct` | `DECIMAL(4,2)` | `0.03` (3%) | Batas stop loss default yang diantisipasi pengguna. |
| `registeredAt` | `DATETIME` | Waktu registrasi awal | Waktu pengguna pertama kali menekan `/start` atau `/menu`. |
