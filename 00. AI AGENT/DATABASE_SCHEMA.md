# Skema Basis Data & Model Penyimpanan (Database Schema) — Stock Scanner Ecosystem

Dokumen ini mendefinisikan skema tabel basis data relasional (**PostgreSQL / Prisma**) untuk Website Dashboard (`saham-indonesia-bsjp-scanner-master`) serta skema penyimpanan persisten terstruktur (**JSON Storage**) untuk Daemon Telegram (`ai-stock-scanner-master`).

---

## 🏛️ 1. Skema Basis Data Relasional Website (PostgreSQL / Prisma)

Basis data ini diinisialisasi secara otomatis oleh aplikasi Next.js (`lib/db.ts`) saat pertama kali terhubung ke PostgreSQL:

```text
┌─────────────────────────┐          ┌─────────────────────────┐
│      scan_results       │          │      paper_trades       │
├─────────────────────────┤          ├─────────────────────────┤
│ id (PK, UUID/SERIAL)    │          │ id (PK, UUID/SERIAL)    │
│ created_at (TIMESTAMP)  │          │ created_at (TIMESTAMP)  │
│ universe_mode (VARCHAR) │          │ ticker (VARCHAR)        │
│ total_tickers (INT)     │          │ status (VARCHAR)        │
│ candidates_json (JSONB) │          │ entry_price (INT)       │
│ logs_json (JSONB)       │          │ entry_lot (INT)         │
│ metadata_json (JSONB)   │          │ target_price (INT)      │
└─────────────────────────┘          │ cut_loss_price (INT)    │
                                     │ exit_price (INT, NULL)  │
┌─────────────────────────┐          │ exit_at (TIMESTAMP)     │
│      backtest_runs      │          │ exit_reason (VARCHAR)   │
├─────────────────────────┤          │ net_profit_idr (DECIMAL)│
│ id (PK, UUID/SERIAL)    │          │ net_return_pct (DECIMAL)│
│ created_at (TIMESTAMP)  │          │ notes (TEXT)            │
│ universe_mode (VARCHAR) │          └─────────────────────────┘
│ start_date (DATE)       │
│ end_date (DATE)         │          ┌─────────────────────────┐
│ win_rate (DECIMAL)      │          │     system_settings     │
│ total_trades (INT)      │          ├─────────────────────────┤
│ net_profit_pct (DECIMAL)│          │ id (PK, INT)            │
│ max_drawdown (DECIMAL)  │          │ config_key (VARCHAR, UQ)│
│ details_json (JSONB)    │          │ config_value (JSONB)    │
│                         │          │ updated_at (TIMESTAMP)  │
└─────────────────────────┘          └─────────────────────────┘
```

### A. Tabel `scan_results` (Histori Pemindaian Pasar Harian)
Menyimpan snapshot lengkap hasil pemindaian pasar sore:
```sql
CREATE TABLE IF NOT EXISTS scan_results (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    universe_mode VARCHAR(30) NOT NULL DEFAULT 'all_idx',
    total_tickers INTEGER NOT NULL,
    candidates_json JSONB NOT NULL,
    logs_json JSONB,
    metadata_json JSONB
);

CREATE INDEX IF NOT EXISTS idx_scan_results_created_at ON scan_results(created_at DESC);
```

### B. Tabel `paper_trades` (Buku Besar Simulasi Transaksi)
Mencatat seluruh siklus hidup transaksi virtual beli sore dan jual pagi:
```sql
CREATE TABLE IF NOT EXISTS paper_trades (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ticker VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED_TP', 'CLOSED_SL', 'CLOSED_MANUAL'
    entry_price INTEGER NOT NULL,
    entry_lot INTEGER NOT NULL,
    target_price INTEGER NOT NULL,
    cut_loss_price INTEGER NOT NULL,
    exit_price INTEGER,
    exit_at TIMESTAMP WITH TIME ZONE,
    exit_reason VARCHAR(30),
    net_profit_idr DECIMAL(16, 2) DEFAULT 0,
    net_return_pct DECIMAL(6, 2) DEFAULT 0,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_paper_trades_status ON paper_trades(status);
CREATE INDEX IF NOT EXISTS idx_paper_trades_ticker ON paper_trades(ticker);
```

### C. Tabel `backtest_runs` (Riwayat Pengujian Algoritma Historis)
Menyimpan metrik kuantitatif evaluasi strategi:
```sql
CREATE TABLE IF NOT EXISTS backtest_runs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    universe_mode VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    win_rate DECIMAL(5, 2) NOT NULL,
    total_trades INTEGER NOT NULL,
    net_profit_pct DECIMAL(8, 2) NOT NULL,
    max_drawdown_pct DECIMAL(5, 2) NOT NULL,
    details_json JSONB
);
```

### D. Tabel `system_settings` (Konfigurasi Global Website)
```sql
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📁 2. Skema Penyimpanan Persistensi Lokal JSON (Daemon Telegram)

Pada `ai-stock-scanner-master`, status disimpan dalam file JSON lokal yang ringan, instan, dan tanpa overhead jaringan:

### A. `userConfigs.json` (Profil Parameter & Modal Pengguna)
```json
{
  "7924447603": {
    "capital": 10000000,
    "riskPerTrade": 0.02,
    "stopLossPct": 0.03,
    "registeredAt": "2026-09-28T01:46:31.000Z"
  }
}
```

### B. `positions.json` (Portofolio Sinyal Aktif Per Pengguna)
```json
{
  "7924447603": [
    {
      "ticker": "BBRI.JK",
      "entryPrice": 4850,
      "stopLoss": 4700,
      "takeProfit": 4930,
      "score": 85,
      "entryDate": "2026-09-28T01:46:31.000Z",
      "status": "HOLD"
    }
  ]
}
```

### C. `dailyState.json` (Status & Kuota Sinyal Harian)
```json
{
  "date": "2026-09-28",
  "buySignalsSent": 1,
  "middayChecked": false,
  "exitChecked": false,
  "lastResetAt": "2026-09-28T00:45:00.000Z"
}
```

### D. `userRegistry.json` (Daftar ID Pengguna Terdaftar)
```json
[
  "7924447603"
]
```
