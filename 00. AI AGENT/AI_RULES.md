# Aturan Operasional AI Agent (AI Agent Rules) — Stock Scanner Ecosystem

Dokumen ini berisi instruksi operasional wajib untuk AI Agent yang bekerja pada repositori ini serta panduan pembuatan *prompt* terstandar untuk kolaborasi antara manusia dan AI.

---

## 🤖 1. Aturan Tindakan AI Agent

### A. Sebelum Melakukan Perubahan
* **Analisis Ruang Lingkup Proyek**: 
  - Jika memodifikasi tampilan atau API web dashboard, pelajari direktori `saham-indonesia-bsjp-scanner-master/` serta baca berkas `MODULE_MAP.md` dan `ARCHITECTURE.md`.
  - Jika memodifikasi daemon background atau bot Telegram, pelajari direktori `ai-stock-scanner-master/src/`.
* **Verifikasi Data Pasar & Parameter Finansial**:
  - Sadari bahwa data Yahoo Finance dan TradingView memiliki batasan delay serta rate limit. Jangan berasumsi data realtime orderbook tersedia secara live.
  - Pahami rumus scoring (0–100) dan batasan risiko sebelum mengubah logika scanner di `modules/scoring.ts` atau `src/services/signalService.ts`.
* **Identifikasi Gejala Bug**:
  - Jika terjadi kendala pada Next.js atau kalkulasi PnL, reproduksi dan verifikasi sumber angka matematis sebelum memodifikasi kode.

### B. Selama Menulis Kode
* **Patuhi Panduan Desain & Antarmuka**:
  - **Wajib 100% mematuhi** standar visual pada **[UI_UX_DESIGN_RULES.md](file:///d:/00.%20Projek%20Aplikasi/scanner_saham/ai-stock-scanner-master/00.%20AI%20AGENT/UI_UX_DESIGN_RULES.md)** saat mendesain atau mengedit halaman website (Next.js 16, Tailwind CSS v4, `@tanstack/react-table`, dan canvas chart `lightweight-charts`).
  - Gunakan font monospace/tabular (`font-mono tabular-nums`) untuk semua nilai angka harga (Rp), persentase keuntungan (%), volume, lot, dan skor.
  - Terapkan dark mode premium dengan palet warna disiplin: Emerald (`text-emerald-400`) untuk bullish/profit, Rose (`text-rose-400`) untuk bearish/loss, Amber (`text-amber-400`) untuk peringatan spekulatif, dan Slate/Zinc untuk latar belakang netral.
* **Patuhi Standar Penulisan Kode**:
  - Ikuti prinsip Clean Code pada **[CODING_STYLE.md](file:///d:/00.%20Projek%20Aplikasi/scanner_saham/ai-stock-scanner-master/00.%20AI%20AGENT/CODING_STYLE.md)** (TypeScript ketat, no `any`, guard clauses, penanganan error async safe).
  - Untuk kalkulasi uang, fee, persentase return, dan slippage, gunakan pustaka `decimal.js` atau pembulatan presisi desimal untuk menghindari *floating point rounding errors* (`0.1 + 0.2 !== 0.3`).
* **Integritas Dependensi & Arsitektur**:
  - Jangan menginstal dependensi baru tanpa alasan yang sangat kuat dan selalu sesuaikan dengan `DEPENDENCIES.md`.
  - Pertahankan prinsip **Manual Trading Assistant**: Jangan pernah mencoba membuat modul otomatisasi order ke broker (*no auto-buy/sell execution*).

### C. Setelah Melakukan Perubahan
* **Uji Fungsional & Build**:
  - Untuk Website Next.js: Jalankan linting atau verifikasi halaman web berjalan tanpa error Turbopack (`npm run dev` di `http://localhost:3000`).
  - Untuk Daemon Telegram: Verifikasi TypeScript kompilasi sukses (`cmd /c "npm run build"`).
* **Verifikasi Kepatuhan UI**:
  - Gunakan Checklist Desain pada `UI_UX_DESIGN_RULES.md` (Perataan kanan numerik, hairline border, sticky header, hover actions, dan no zebra striping).
* **Catat Perubahan ke CHANGELOG**:
  - Setiap perubahan wajib dicatat ke dalam berkas **[CHANGELOG.md](file:///d:/00.%20Projek%20Aplikasi/scanner_saham/ai-stock-scanner-master/00.%20AI%20AGENT/CHANGELOG.md)**.
* **Laporkan ke Pengguna**:
  - Berikan ringkasan ringkas, jelas, dan sertakan tautan ke file yang dimodifikasi.

---

## ✍️ 2. Panduan Pembuatan Prompt (Prompt Engineering Guide)
*Diadaptasi untuk ekosistem Financial Technology, Data Analysis, & Modern Web Engineering.*

Gunakan struktur prompt terstandar saat meminta bantuan AI Agent:

### A. Struktur Prompt yang Baik (Structured Prompts)
1. **Role/Peran**: Definisikan keahlian AI (misal: *"Bertindaklah sebagai Senior Fullstack Financial Engineer berpengalaman dengan Next.js 16, Tailwind CSS v4, dan TanStack Table"*).
2. **Context/Konteks**: Jelaskan modul yang sedang dikerjakan (misal: *"Halaman kandidat BSJP di `/candidates` membutuhkan filter berdasarkan skor likuiditas"*).
3. **Task/Tugas**: Deskripsikan instruksi spesifik (misal: *"Tambahkan tab filter cepat: Semua, Skor > 80 (Strong), Watchlist (70-79), dan Spekulatif"*).
4. **Constraints/Batasan**: 
   - **⚠️ ATURAN EMAS**: Angka harga wajib berformat Rupiah dengan `font-mono tabular-nums text-right`.
   - **🚨 JANGAN LAKUKAN**: Dilarang menggunakan pola belang-belang (*zebra striping*); gunakan *1px hairline border*.
5. **Output Format**: Format kode yang diinginkan (komponen React 19 Client Component dengan TypeScript bersih).

### B. Teknik Pemecahan Alur Kerja (Task-Splitting)
Pecah fitur kompleks menjadi langkah bertahap:
1. *Fase 1*: Definisikan tipe data dan skema Zod di `lib/types.ts`.
2. *Fase 2*: Implementasikan pengolahan data atau perhitungan indikator di `modules/`.
3. *Fase 3*: Buat komponen UI tabel atau chart di `components/`.
4. *Fase 4*: Hubungkan ke route handler atau Next.js page di `app/`.

### C. Pembuatan Berkas Kemudi (Steering Files)
Gunakan berkas di dalam `00. AI AGENT/` sebagai panduan otomatis context window AI agar tidak perlu mengulang instruksi panjang di setiap percakapan.
