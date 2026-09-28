# Standar Desain UI/UX & Rekayasa Visual Terminal Keuangan — BSJP Stock Scanner Website

Dokumen ini mendefinisikan standar antarmuka pengguna (UI) dan pengalaman pengguna (UX) untuk seluruh pengembangan tampilan pada sistem **BSJP Stock Scanner Website (`saham-indonesia-bsjp-scanner-master`)**. 

Standar ini mengadopsi prinsip desain terminal finansial modern (*Linear-grade visual engineering*, TradingView canvas aesthetics, efisiensi data table TanStack, dan eliminasi tampilan klise generik AI) untuk menghadirkan platform riset saham yang berkecepatan tinggi, berpresisi mutlak, dan bernuansa premium bagi *swing trader* dan *scalper*.

Setiap pengembang maupun AI Agent **wajib patuh 100%** pada standar ini saat membangun komponen React 19, Next.js 16 App Router, Tailwind CSS v4, `@tanstack/react-table`, maupun canvas grafik `lightweight-charts`.

---

## 📊 1. Desain Tabel Data Finansial (TanStack Table & Presisi Angka)

Tabel pada platform saham bukan sekadar tabel HTML biasa, melainkan instrumen analitis pengambilan keputusan cepat di mana setiap milidetik dan setiap desimal sangat berarti.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Sticky Header - z-20 backdrop-blur-md bg-zinc-950/90]                                                │
│ Ticker ↕   Nama Emiten         Harga ↕      Perub ↕   Vol Ratio ↕   Skor BSJP ↕    Sinyal     Aksi ⚡  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Pinned]   [Left Truncated]    [Right Mono] [Right]   [Right Mono]  [Right + Bar]  [Badge]    [Hover]  │
│ BBCA       Bank Central Asia   Rp 9.250     +2.21%    1.84x         88/100 ▰▰▰▰▰▱  STRONG     [Trade]  │ <-- 1px Hairline
│ BMRI       Bank Mandiri        Rp 6.800     +1.49%    1.42x         81/100 ▰▰▰▰▰▱  STRONG     [Trade]  │ <-- Hover Row
│ BRIS       Bank Syariah Ind    Rp 2.940     +4.62%    2.65x         78/100 ▰▰▰▰▱▱  WATCHLIST  [Trade]  │ <-- Actions reveal
│ RAJA       Rukun Raharja       Rp 1.480     +7.25%    3.10x         68/100 ▰▰▰▱▱▱  SPEKULATIF [Trade]  │ <-- Amber warning
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### A. Perataan Teks dan Angka (Alignment & Tabular Numbers)
* **Angka Harga, Persentase, Volume, dan Skor Wajib Rata Kanan (`text-right`)**:
  - Kolom harga (Rp), perubahan harian (%), rasio volume (x), nilai transaksi (Rp M), lot, target profit (TP), dan cut loss (SL) **wajib selalu rata kanan**.
  - **Wajib menggunakan angka tabular / monospaced** (`font-mono tabular-nums`). Hal ini menjamin seluruh digit dan tanda koma sejajar tegak lurus ke bawah, sehingga memudahkan mata trader membandingkan nilai antar saham dalam hitungan detik.
* **Kode Ticker, Nama Emiten, dan Keterangan Wajib Rata Kiri (`text-left`)**:
  - Kode saham (`BBCA`) dan nama perusahaan diratakan ke kiri sesuai ritme pembacaan alami.
* **Kolom Status, Badge Sinyal, dan Aksi Cepat**:
  - Badge kategori (*Strong, Watchlist, Speculative*) diratakan ke tengah (`text-center`) atau kiri dengan padding proporsional.

### B. Garis Pembatas (Hairline Borders) vs. Larangan Keras Zebra Stripes
* **🚨 DILARANG KERAS menggunakan latar belakang belang-belang (*zebra stripes*)**:
  - Baris selang-seling abu-hitam menciptakan polusi visual dan mengaburkan pemindaian visual pada puluhan baris data pasar.
* **Gunakan Garis Tipis Presisi (*1px Hairline Border*)**:
  - Gunakan pemisah baris horizontal ultra tipis (`border-b border-zinc-800/60 dark:border-zinc-800/80`).
* **Sorotan Baris Kursor (*Row Hover State*)**:
  - Berikan feedback visual instan saat kursor melintas di atas baris saham (`hover:bg-zinc-900/60 transition-colors duration-75`).

### C. Tingkat Kepadatan Baris (*Row Density Modes*)
Tinggi baris disesuaikan dengan kebutuhan trader melalui opsi kontrol kepadatan:
* **Compact (36px – 40px)**:
  - Mode default untuk tabel pemindaian cepat (`/candidates` dan `/dashboard`). Memungkinkan pemantauan 15–20 saham sekaligus dalam satu layar tanpa banyak scrolling.
* **Default (48px)**:
  - Digunakan untuk tabel ledger paper trading (`/paper-trading`) yang memerlukan informasi tambahan seperti status open/close, target price, dan timestamp transaksi.
* **Comfortable (56px – 64px)**:
  - Digunakan saat tabel memuat indikator multi-baris (misal: skor rincian momentum + volume + likuiditas).

### D. Mempertahankan Konteks Layar (*Sticky Header & Pinned Columns*)
* **Sticky Table Header**:
  - Baris judul kolom wajib terkunci di bagian atas tabel saat scrolling vertikal (`sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800`).
* **Pinned Ticker Column**:
  - Kolom kode saham pertama (`Ticker`) harus terkunci di posisi kiri (`sticky left-0 z-10 bg-zinc-950`) pada tabel dengan banyak indikator teknikal agar trader tidak kehilangan konteks saat menggeser horizontal (*horizontal scroll*).

### E. Penanganan Nilai Kosong, Truncate, & Tombol Aksi Melayang
* **Sel Tanpa Data / N/A**:
  - Jangan biarkan sel kosong. Tampilkan tanda hubung redup `—` dengan warna netral (`text-zinc-600 font-mono`) untuk menegaskan bahwa indikator memang belum terhitung atau pasar sedang tutup.
* **Pemotongan Nama Emiten Panjang**:
  - Batasi lebar kolom nama perusahaan (`max-w-[180px] truncate`) dan sediakan *hover tooltip* untuk menampilkan nama lengkap resmi emiten.
* **Reveal Actions on Hover**:
  - Tombol aksi seperti *+ Paper Trade*, *Buka Chart*, atau *Salin Ticker* disembunyikan atau dibuat transparan (`opacity-0 group-hover:opacity-100 transition-opacity`) agar tidak mengotori tabel.

---

## 🎨 2. Palet Warna Finansial & Estetika Dark Mode

Platform ini menggunakan estetika **Financial Terminal Premium** (perpaduan gaya Linear.app, Bloomberg Terminal, dan TradingView):

```text
Surface Levels (Dark Theme):
├─ Level 0 (Latar Layar Utama)    : #09090b (zinc-950)
├─ Level 1 (Kartu & Panel)        : #121215 (zinc-900/80 dengan border-zinc-800/70)
├─ Level 2 (Input & Tabel Header) : #18181b (zinc-900)
└─ Level 3 (Modal Dialog & Popup) : #27272a (zinc-800)

Semantic Color Rules:
├─ 🟢 Bullish / Profit / Strong   : Emerald-400 (#34d399) / Emerald-500 (#10b981)
├─ 🔴 Bearish / Loss / Stop Loss  : Rose-400 (#fb7185) / Rose-500 (#f43f5e)
├─ 🟡 Caution / Warning / Spek    : Amber-400 (#fbbf24) / Amber-500 (#f59e0b)
├─ 🔵 Watchlist / Info / IHSG     : Cyan-400 (#22d3ee) / Blue-500 (#3b82f6)
└─ ⚪ Neutral Text                : Zinc-100 (Primary), Zinc-400 (Secondary), Zinc-600 (Muted)
```

### Aturan Disiplin Warna Finansial:
1. **Dilarang Menggunakan Warna Hijau & Merah Saturasi Mentah**:
   - Jangan gunakan `#00FF00` atau `#FF0000`. Gunakan warna HSL/Tailwind yang terkalibrasi (`emerald-400/emerald-500` dan `rose-400/rose-500`) yang ramah mata saat ditatap berjam-jam.
2. **Konteks Warna Harga**:
   - Nilai positif selalu disertai tanda plus `+` dan warna hijau (`+2.45%`).
   - Nilai negatif selalu disertai tanda minus `-` dan warna merah (`-1.20%`).
   - Nilai netral / tidak berubah menggunakan warna abu-abu netral (`text-zinc-400`).
3. **Pembedaan Saham Spekulatif**:
   - Saham dengan tag `SPECULATIVE` wajib menggunakan penanda Amber/Oranye cerah untuk membedakannya secara visual dari saham liquid LQ45/IDX30.

---

## 📈 3. Desain Terminal Grafik (TradingView Lightweight Charts)

Halaman visualisasi saham (`/candidates/[ticker]`) mengintegrasikan kanvas resmi TradingView:

### Standar Rekayasa Grafik:
1. **Latar Kanvas & Grid**:
   - Background kanvas: `#09090b` (zinc-950 transparan).
   - Garis grid vertikal & horizontal: Sangat halus (`rgba(255, 255, 255, 0.04)`).
2. **Candlestick Colors**:
   - Up Candle (Bullish): Body `#10b981`, Border `#10b981`, Wick `#10b981`.
   - Down Candle (Bearish): Body `#f43f5e`, Border `#f43f5e`, Wick `#f43f5e`.
3. **Panel Volume Terpadu**:
   - Histogram volume diletakkan di panel bawah dengan tinggi maksimal 20% dari total canvas area.
   - Warna batang volume diselaraskan dengan warna candle hari tersebut dengan transparansi 50% (`rgba(16, 185, 129, 0.5)` untuk up-day).
4. **Indikator Overlay Garis Rata-Rata (MA)**:
   - MA20 (Garis Kuning/Emas tipis 1.5px): Menunjukkan momentum jangka pendek.
   - MA50 (Garis Biru Cerah 1.5px): Menunjukkan tren penopang utama.
5. **Crosshair & Tooltip Responsif**:
   - Tooltip harga wajib menampilkan ringkasan dinamis: `O (Open)`, `H (High)`, `L (Low)`, `C (Close)`, `V (Volume)`, serta perubahan dalam Rupiah dan persentase.

---

## ⚡ 4. Komponen Interaktif & Feedback Aksi

### A. Tombol Scanner Cepat (Trigger Live Scan)
* **Status Idle**: Tombol dengan aksen primer (`bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-all`).
* **Status Scanning**: Tombol otomatis dinonaktifkan (`disabled:opacity-50`), teks berganti *"Sedang Memindai Pasar IDX..."*, disertai indikator spinner atau progress bar mikro beranimasi halus.

### B. Modal Dialog Paper Trading
* Saat trader menekan tombol *+ Paper Trade* pada suatu saham:
  * Modal terbuka secara instan (transisi < 100ms tanpa bouncing).
  * Harga beli (*Entry Price*) otomatis terisi dengan harga terakhir (*last close/bid*).
  * Target Profit (+1.5%) dan Stop Loss (-1.5%) otomatis dihitung beserta estimasi nominal laba bersih setelah dipotong komisi broker.
  * Input jumlah lot otomatis menghitung total modal yang dibutuhkan dalam Rupiah secara *real-time*.

### C. Pintasan Papan Ketik (Keyboard Shortcuts)
Untuk efisiensi trader aktif:
* `/`: Langsung memfokuskan kursor ke kotak pencarian ticker saham.
* `R`: Memicu refresh data / re-scan cepat.
* `Esc`: Menutup modal dialog atau panel detail yang sedang aktif.
* `1`, `2`, `3`: Beralih cepat antar tab navigasi (`/dashboard`, `/candidates`, `/paper-trading`).

---

## ✅ 5. Checklist Verifikasi UI Sebelum Rilis

Sebelum mempublikasikan perubahan kode tampilan pada website, pastikan:
- [ ] Seluruh angka nominal uang menggunakan format `Rp` dengan pemisah ribuan titik (`Rp 9.250`).
- [ ] Seluruh nilai numerik (harga, persentase, volume, score) rata kanan dengan kelas `font-mono tabular-nums text-right`.
- [ ] Header tabel terkunci (`sticky top-0`) dan kolom pertama terkunci jika ada horizontal scroll.
- [ ] Tidak ada baris bermotif belang-belang (*zero zebra stripes*); batas baris menggunakan *1px hairline border*.
- [ ] Tombol aksi baris tidak mengotori tabel dan muncul dengan anggun saat kursor melintas (*reveal on hover*).
- [ ] Nilai kosong menampilkan simbol tanda hubung redup `—`.
- [ ] Palet warna konsisten: Emerald untuk profit/bullish, Rose untuk loss/bearish, Amber untuk risiko spekulatif.
- [ ] Grafik Lightweight Charts responsif saat ukuran jendela browser diubah (*auto-resize handler*).
