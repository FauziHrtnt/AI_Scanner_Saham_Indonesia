# Daftar Tugas & Prioritas Kerja (Backlog & TODO) — Stock Scanner Ecosystem

Dokumen ini mencatat daftar tugas aktif, prioritas perbaikan, dan backlog fitur untuk ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## 🔥 1. Prioritas Utama / Tugas Aktif (Immediate Sprint)

### A. Penyempurnaan UI/UX Website Dashboard (`saham-indonesia-bsjp-scanner-master`)
- [ ] **Kepatuhan Angka Tabular**: Pastikan seluruh sel harga (Rp), persentase pergerakan (%), volume ratio, target price, dan skor pada tabel `/candidates` dan `/dashboard` menggunakan kelas `font-mono tabular-nums text-right`.
- [ ] **Sticky Headers & Pinned Ticker**: Verifikasi header tabel terkunci saat scroll vertikal dan kolom Ticker terkunci saat horizontal scroll pada layar sedang/kecil.
- [ ] **Eliminasi Zebra Stripes**: Pastikan tabel sepenuhnya bersih dari baris belang-belang abu-putih dan hanya menggunakan *1px hairline border* (`border-b border-zinc-800/60`).
- [ ] **Penyempurnaan Chart Canvas**: Pastikan kanvas *TradingView Lightweight Charts* pada `/candidates/[ticker]` menangani event resize jendela dengan mulus (*ResizeObserver*) dan memiliki crosshair dinamis yang nyaman.
- [ ] **Pintasan Keyboard**: Tambahkan listener papan ketik global (`/` untuk fokus ke pencarian ticker, `R` untuk refresh scan, `Esc` untuk menutup modal paper trade).

### B. Simulasi Paper Trading & Fee Calculation
- [ ] **Modal Buka Posisi**: Verifikasi modal form "+ Paper Trade" secara otomatis mengusulkan Target Price (+1.5%) dan Stop Loss (-1.5%) berdasarkan harga penutupan terakhir.
- [ ] **Kalkulasi Komisi Broker**: Pastikan pemotongan biaya transaksi (beli 0.15% dan jual 0.25%) menggunakan pustaka `decimal.js` sehingga angka PnL bersih akurat hingga satuan Rupiah.
- [ ] **Ringkasan Win Rate**: Buat kartu metrik ringkasan di bagian atas `/paper-trading` yang menampilkan Total Trades, Win Rate %, Total Net Profit (Rp), dan Average Gain/Loss.

---

## 📋 2. Backlog Fitur Menengah (Medium-Term Tasks)

### A. Mesin Backtesting Historis (`/backtest`)
- [ ] Hubungkan form parameter backtest dengan engine `/api/backtest`.
- [ ] Tampilkan grafik kurva ekuitas (*Equity Curve Chart*) menggunakan Recharts untuk memvisualisasikan pertumbuhan modal hipotetis dari waktu ke waktu.
- [ ] Tambahkan simulasi slippage dinamis (0.2% untuk saham liquid, 0.5% untuk saham spekulatif).

### B. Otomatisasi & Bot Telegram (`ai-stock-scanner-master`)
- [ ] Tambahkan opsi filter universe langsung dari bot Telegram (misal: tombol *"Hanya LQ45"* vs *"Semua Saham IDX"*).
- [ ] Sinkronkan posisi transaksi yang dicatat via bot ke dalam basis data paper trading website.
- [ ] Perkaya pesan alert pagi (09:00 WIB) dengan evaluasi otomatis gap opening harga saham yang dibeli sore hari sebelumnya.

---

## 💡 3. Ide & Eksperimen Masa Depan (Future Experiments)

- [ ] Eksperimen deteksi akumulasi bandarmologi sederhana (*Foreign Flow Net Buy / Top Broker Concentration*) jika penyedia data pihak ketiga terjangkau telah tersedia.
- [ ] Implementasi audio chime halus saat live scan selesai menemukan saham dengan skor >= 85 (Strong).
- [ ] Ekspor catatan jurnal trading harian ke format CSV dan PDF siap cetak.
