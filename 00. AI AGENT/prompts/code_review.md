# Panduan Peninjauan Kode (Code Review Guidelines) — Stock Scanner Ecosystem

Gunakan daftar periksa (*checklist*) di bawah ini untuk meninjau setiap perubahan kode pada Website Dashboard (`saham-indonesia-bsjp-scanner-master`) maupun Daemon Notifikasi (`ai-stock-scanner-master`).

---

## 📋 Checklist Peninjauan (Review Checklist)

### 1. Kebenaran & Logika Finansial (Correctness & Financial Math)
* **Kesesuaian Spesifikasi**: Apakah kode melakukan kalkulasi teknikal atau pemindaian tepat sesuai algoritma BSJP (0–100 poin)?
* **Presisi Finansial**: Apakah seluruh perhitungan uang, komisi broker, PnL bersih, dan persentase menggunakan `decimal.js` atau pembulatan matematis terkontrol (bukan pembagian floating point biner biasa)?
* **Kasus Batas (Edge Cases)**: Apakah kasus data pasar hilang, volume 0, harga < Rp 50, atau saham delisted telah ditangani dengan aman tanpa menyebabkan crash?

### 2. Kepatuhan Standar Visual & UI (UI/UX Compliance)
* **Aturan Tabel Finansial**: Apakah tabel TanStack mematuhi **[UI_UX_DESIGN_RULES.md](file:///d:/00.%20Projek%20Aplikasi/scanner_saham/ai-stock-scanner-master/00.%20AI%20AGENT/UI_UX_DESIGN_RULES.md)** (perataan kanan numerik, font tabular monospaced `font-mono tabular-nums`, *zero zebra stripes*, dan *hairline border*)?
* **Disiplin Warna Finansial**: Apakah status bullish menggunakan Emerald, bearish menggunakan Rose, dan spekulatif menggunakan Amber?
* **Chart Canvas**: Apakah komponen TradingView Lightweight Charts terinisialisasi bersih dengan penanganan *auto-resize*?

### 3. Kepatuhan Gaya Kode (Style & Clean Code)
* **Konsistensi Penamaan**: Apakah kode mematuhi panduan pada **[CODING_STYLE.md](file:///d:/00.%20Projek%20Aplikasi/scanner_saham/ai-stock-scanner-master/00.%20AI%20AGENT/CODING_STYLE.md)**?
* **Guard Clauses**: Apakah percabangan rumit dibersihkan di awal fungsi dengan guard clauses?
* **Strict TypeScript**: Apakah tidak ada penggunaan `any` tanpa pembungkus alasan yang sah?

### 4. Performa & Batasan Provider (Performance & Rate Limiting)
* **Batching & Delays**: Apakah pemanggilan data ke Yahoo Finance atau TradingView telah diatur dengan *batching delay* agar tidak terkena HTTP 429?
* **Komponen Next.js 16**: Apakah Server Components dan Client Components (`'use client'`) dipisahkan secara optimal?

### 5. Keamanan (Security)
* **Kerahasiaan Kunci**: Apakah tidak ada API token Telegram atau Gemini API key yang tertulis mentah (*hardcoded*) di dalam kode?
* **Sanitasi Ticker**: Apakah input kode emiten telah divalidasi dengan regex `/^[A-Z]{4}(\.JK)?$/`?

---
*Gunakan daftar periksa di atas sebagai acuan penilaian kelayakan kode sebelum menyelesaikan tugas.*
