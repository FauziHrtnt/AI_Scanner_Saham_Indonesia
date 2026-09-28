# Panduan Rekayasa Desain UI/UX (UI/UX Engineering & Review Workflow) — Stock Scanner Website

Gunakan alur kerja terstruktur ini saat merancang, membangun, atau meninjau antarmuka pengguna (UI) pada sistem **BSJP Stock Scanner Website (`saham-indonesia-bsjp-scanner-master`)**. Seluruh implementasi wajib berpedoman pada dokumen kemudi **[UI_UX_DESIGN_RULES.md](file:///d:/00.%20Projek%20Aplikasi/scanner_saham/ai-stock-scanner-master/00.%20AI%20AGENT/UI_UX_DESIGN_RULES.md)**.

---

## 🧭 Alur Kerja Perancangan UI (Step-by-Step UI Workflow)

### 1. Penentuan Konteks & Kepadatan (Context & Density)
* **Jenis Antarmuka**: Apakah komponen ini berupa Tabel Data Kandidat Pasar, Kartu Ringkasan Statistik Pasar, Terminal Grafik TradingView, Modal Formulir Paper Trade, atau Form Parameter Backtest?
* **Pilihan Kepadatan (Row Density)**:
  - Gunakan *Compact* (36px–40px) untuk tabel pemindaian pasar `/candidates` dan `/dashboard` agar trader dapat memantau puluhan saham sekaligus.
  - Gunakan *Default* (48px) untuk buku besar transaksi `/paper-trading`.

### 2. Standar Tabel Finansial TanStack (Data Grid Verification)
* [ ] **Perataan Kolom Numerik**: Harga (Rp), perubahan harian (%), volume ratio, target price, stop loss, dan skor wajib rata kanan (`text-right`).
* [ ] **Font Tabular Monospace**: Wajib menggunakan kelas `font-mono tabular-nums` untuk seluruh angka agar seluruh digit sejajar vertikal lurus.
* [ ] **Garis vs Zebra**: Wajib menggunakan garis tipis presisi 1px (`border-b border-zinc-800/60`). **DILARANG KERAS** menggunakan motif belang-belang (*zebra stripes*).
* [ ] **Penyematan Konteks**: Pastikan header tabel terkunci di atas (`sticky top-0 bg-zinc-950/90 backdrop-blur`) dan kolom Ticker terkunci di kiri saat scrolling horizontal.
* [ ] **Sel Kosong & Teks Panjang**: Tampilkan tanda hubung redup `—` untuk data kosong/pasar tutup, dan batasi teks panjang dengan `truncate` dan tooltip.
* [ ] **Tombol Aksi**: Tombol aksi (*+ Paper Trade*, *Chart*) disembunyikan dan hanya muncul saat baris disorot kursor (*reveal on hover*).

### 3. Nuansa Terminal Finansial (Linear-Grade Visual Polish)
* [ ] **Estetika Dark Mode Konsisten**: Latar belakang `#09090b` (zinc-950), kartu panel `#121215` (zinc-900/80), batas tipis `border-zinc-800/70`.
* [ ] **Disiplin Warna Finansial**:
  - Hijau Emerald (`#10b981` / `text-emerald-400`) untuk bullish, kenaikan harga, dan status *Strong*.
  - Merah Rose (`#f43f5e` / `text-rose-400`) untuk bearish, penurunan harga, dan batas *Stop Loss*.
  - Kuning/Oranye Amber (`#f59e0b` / `text-amber-400`) khusus untuk peringatan risiko saham spekulatif/gorengan.
  - Cyan/Biru (`#06b6d4` / `text-cyan-400`) untuk status *Watchlist*.
* [ ] **Chart Canvas**: Canvas TradingView `lightweight-charts` responsif dengan *ResizeObserver*, candlestick terkalibrasi, dan histogram volume proporsional.
* [ ] **Aksesibilitas Papan Ketik**: Sertakan pintasan keyboard yang terlihat jelas (`/` untuk cari ticker, `R` untuk re-scan, `Esc` untuk menutup dialog).

---

## 📋 Checklist Verifikasi Akhir
Setelah kode UI selesai ditulis, jalankan verifikasi terhadap **Checklist Verifikasi Desain UI** pada `00. AI AGENT/UI_UX_DESIGN_RULES.md` sebelum menyelesaikan tugas.
