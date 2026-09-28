# Catatan Perubahan Proyek (Project Changelog) — Stock Scanner Ecosystem

Dokumen ini digunakan untuk mencatat setiap perubahan kode, fitur, penyempurnaan UI/UX, atau pembaruan konfigurasi pada ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## 🛠️ Format Riwayat Perubahan (Changelog Template)

```markdown
### [YYYY-MM-DD] - [Judul Singkat Perubahan / Fitur]
* **Penulis (Author)**: [Developer / AI Agent]
* **Tipe Perubahan**: `[Added / Changed / Fixed / Security / Removed]`
* **Rincian Perubahan**:
  - `path/to/file1.ext`: Penjelasan apa yang diubah.
  - `path/to/file2.ext`: Penjelasan apa yang diubah.
* **Catatan Tambahan**: (Instruksi khusus, migrasi database, atau konfigurasi .env).
```

---

## 📜 Riwayat Perubahan Proyek

### 2026-09-28 - Konfigurasi & Penyelarasan Berkas Kemudi AI Agent untuk Ekosistem Stock Scanner
* **Penulis (Author)**: AI Agent Antigravity
* **Tipe Perubahan**: `Changed` & `Added`
* **Rincian Perubahan**:
  - `00. AI AGENT/README.md`: Penyelarasan gambaran umum ekosistem terpadu (Next.js Dashboard + Telegram Daemon).
  - `00. AI AGENT/AI_RULES.md`: Penetapan aturan operasional AI untuk rekayasa visual finansial dan penanganan data pasar.
  - `00. AI AGENT/PROJECT_RULES.md`: Konvensi ticker IDX (.JK), jam bursa resmi (WIB), fraksi lot, dan presisi `decimal.js`.
  - `00. AI AGENT/UI_UX_DESIGN_RULES.md`: Standar visual terminal keuangan Linear-grade, tabel TanStack (perataan kanan tabular, zero zebra stripes, hairline borders), dan canvas TradingView Lightweight Charts.
  - `00. AI AGENT/CODING_STYLE.md`: 5 Prinsip Clean Code finansial, larangan floating point bug, dan pemisahan Server/Client Components.
  - `00. AI AGENT/ARCHITECTURE.md`: Diagram arsitektur Mermaid terpadu antara Web Next.js, API `/api/scan`, dan Telegram Daemon.
  - `00. AI AGENT/MODULE_MAP.md`: Pemetaan lengkap rute halaman Next.js, komponen UI, modul analitis, dan layanan bot.
  - `00. AI AGENT/CRUD_SPECIFICATION.md`: Spesifikasi entitas Paper Trading, Candidate, Scanner Settings, dan User Config.
  - `00. AI AGENT/DATABASE_SCHEMA.md`: Skema tabel PostgreSQL/Prisma (`scan_results`, `paper_trades`, `backtest_runs`) dan JSON storage.
  - `00. AI AGENT/WORKFLOW_DFD.md`: Diagram aliran data (DFD Level 0, 1, 2) untuk siklus BSJP Beli Sore Jual Pagi dan Paper Trading.
  - `00. AI AGENT/SECURITY.md`: Protokol mitigasi rate-limit Yahoo Finance, isolasi API keys, dan batasan Zero-Execution.
  - `00. AI AGENT/ROADMAP.md`: Rencana pengembangan sistem dari MVP hingga integrasi mobile Flutter.
  - `00. AI AGENT/TODO.md`: Daftar prioritas tugas aktif UI/UX dan kalkulasi komisi broker.
  - `00. AI AGENT/KNOWN_ISSUES.md`: Dokumentasi kendala rate limiting, saham delisted, dan bypass PowerShell execution policy.
  - `00. AI AGENT/DECISIONS.md`: 6 Catatan Keputusan Arsitektur (ADR) Next.js 16, Lightweight Charts, TanStack Table, dan Manual Trading.
  - `00. AI AGENT/DEPENDENCIES.md`: Katalog lengkap dependensi website dan daemon background.
  - `00. AI AGENT/PARSER_TEMPLATE.md`: Template parser OHLCV dan kalkulator indikator teknikal.
  - `00. AI AGENT/prompts/*`: Pembaruan seluruh template prompt kemudi AI untuk konteks Stock Scanner.

### 2026-09-27 - Integrasi Sinergi Bot Telegram dengan API Scanner Next.js
* **Penulis (Author)**: Developer & AI Agent
* **Tipe Perubahan**: `Added`
* **Rincian Perubahan**:
  - `src/telegram/telegramService.ts`: Penambahan tombol inline `action_scan_bsjp` dan `action_latest_bsjp` yang memicu pemanggilan HTTP ke `http://localhost:3000/api/scan`.
  - `src/telegram/telegramService.ts`: Penambahan formatter pesan khusus `formatBsjpMessage()` untuk laporan Telegram berformat rapi.
  - `start-scanner.bat`: Skrip otomatisasi Windows untuk menjalankan Next.js dev server dan membuka browser lokal ke [http://localhost:3000](http://localhost:3000).

### 2026-09-20 - Inisialisasi Sistem Inti BSJP Scanner & Telegram Daemon
* **Penulis (Author)**: Developer
* **Tipe Perubahan**: `Added`
* **Rincian Perubahan**:
  - `saham-indonesia-bsjp-scanner-master/`: Pembuatan dashboard Next.js 16 App Router dengan modul scanner Yahoo Finance.
  - `ai-stock-scanner-master/`: Pembuatan background daemon Node.js dengan penjadwal cron waktu Jakarta dan bot Telegram interaktif.
