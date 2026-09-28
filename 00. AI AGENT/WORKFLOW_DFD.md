# Diagram Alur Data Sistem (Data Flow Diagrams / DFD) — Stock Scanner Ecosystem

Dokumen ini memodelkan aliran data (*Data Flow Diagrams*) dan alur kerja analitis dari ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## 🌊 1. Diagram Konteks (DFD Level 0)

Diagram konteks memperlihatkan interaksi antara entitas eksternal dengan sistem terpadu:

```mermaid
graph TD
    TraderWeb["Trader (Web Browser)"]
    TraderTelegram["Trader (Telegram App)"]
    YF["Yahoo Finance & TradingView API"]
    Broker["Aplikasi Sekuritas Resmi"]

    System(["Sistem Terpadu AI Stock Scanner & BSJP Dashboard"])

    YF -->|Data Pasar OHLCV, Quotes, Indikator| System
    TraderWeb -->|Picu Scan, Catat Paper Trade, Konfigurasi| System
    TraderTelegram -->|Perintah Bot /start, /modal, Scan BSJP| System
    
    System -->|Tabel Kandidat BSJP, Chart Interaktif, Laporan PnL| TraderWeb
    System -->|Sinyal Beli Sore, Peringatan Stop Loss, Ringkasan| TraderTelegram
    
    TraderWeb -.->|Eksekusi Transaksi Manual Mandiri| Broker
    TraderTelegram -.->|Eksekusi Transaksi Manual Mandiri| Broker
```

---

## ⚙️ 2. DFD Level 1: Proses Pemindaian & Penilaian Saham (BSJP Engine)

Menjelaskan transformasi data dari daftar mentah ticker menjadi kandidat berskor tinggi:

```mermaid
graph TD
    D1[("File Ticker: data/universe/idx-tickers.csv")]
    D2[("Cache Data Pasar: Yahoo Finance API")]
    D3[("Tabel: scan_results")]
    
    P1["1.0 Filter Semesta Saham (Universe Filter)"]
    P2["2.0 Pengambilan Data Pasar Bertahap (Batch Fetcher)"]
    P3["3.0 Kalkulasi Indikator Teknikal (Indicators Engine)"]
    P4["4.0 Penilaian Skor Multi-Faktor (BSJP Scoring)"]
    P5["5.0 Filter & Klasifikasi Sinyal (Ranking & Tagging)"]
    P6["6.0 Distribusi Output (Web Table & Telegram Alert)"]

    D1 -->|Daftar 750+ Saham IDX| P1
    P1 -->|Ticker Terpilih (LQ45 / All IDX)| P2
    P2 <-->|Request/Response Candle OHLCV| D2
    P2 -->|Deret Candle Harian & Volume| P3
    P3 -->|MA20, MA50, ATR-14, Volume Ratio, Close Position| P4
    P4 -->|Skor Mentah & Penalti Risiko| P5
    P5 -->|Kandidat Terurut (Strong, Watchlist, Speculative)| D3
    D3 --> P6
    P6 -->|JSON Payload| WebTable["Tabel /candidates"]
    P6 -->|Pesan Markdown| BotAlert["Notifikasi Telegram"]
```

---

## 🕒 3. Diagram Siklus Hidup Transaksi BSJP (Sore ke Pagi)

Menggambarkan alur eksekusi strategi dari sore hari menjelang penutupan hingga pagi hari pembukaan bursa:

```mermaid
sequenceDiagram
    autonumber
    actor Trader
    participant Web as Web Dashboard (/candidates)
    participant Engine as Scanner Engine (/api/scan)
    participant Paper as Paper Trading Ledger
    participant Telegram as Bot Telegram

    Note over Trader,Telegram: FASE SORE (15:30 - 15:49 WIB) - Jendela Beli Sore
    Trader->>Web: Buka dashboard atau picu live scan
    Web->>Engine: POST /api/scan
    Engine-->>Web: Tampilkan daftar kandidat berskor >= 80 (Strong)
    Engine-->>Telegram: Broadcast ringkasan Top 5 BSJP Sore
    Trader->>Web: Klik "+ Paper Trade" pada emiten terpilih (misal: BBRI)
    Web->>Paper: Catat posisi OPEN (Harga Beli, Lot, TP +1.5%, SL -1.5%)
    Trader->>Trader: (Opsional) Beli manual di aplikasi sekuritas resmi

    Note over Trader,Telegram: FASE MALAM - Evaluasi & Istirahat Bursa
    Paper->>Paper: Simpan posisi dalam status HOLD

    Note over Trader,Telegram: FASE PAGI (09:00 - 09:30 WIB) - Jendela Jual Pagi
    Telegram->>Trader: Kirim pengingat cek posisi pagi
    Trader->>Web: Buka /paper-trading
    Trader->>Paper: Masukkan harga realisasi jual (Exit Price)
    Paper->>Paper: Hitung otomatis Komisi Beli (0.15%), Komisi Jual (0.25%), & Net Profit
    Paper-->>Trader: Tampilkan realisasi laba bersih & update statistik Win Rate
```

---

## 📊 4. DFD Level 2: Mesin Pengujian Historis (Backtest Engine)

Alur kerja evaluasi strategi terhadap rentang tanggal masa lalu:

```mermaid
graph TD
    UserInput["Input Parameter: Rentang Tanggal, TP%, SL%, Universe"] --> Engine["Backtest Engine (/api/backtest)"]
    D_Historical[("Historical Data Cache")] --> Engine
    
    subgraph Simulasi_Trade["Simulasi Trade Hari demi Hari"]
        Engine --> CheckScan["1. Jalankan Aturan Scoring pada Tanggal T"]
        CheckScan --> FilterBuy["2. Jika Skor >= Ambang Batas: Masuk Simulasi Beli Sore"]
        FilterBuy --> CheckNextDay["3. Ambil Harga Open/High Tanggal T+1"]
        CheckNextDay --> CalcExit["4. Evaluasi Apakah Kena TP, SL, atau Exit di Open"]
        CalcExit --> DeductFees["5. Potong Fee Komisi & Slippage (0.4% - 0.7%)"]
    end
    
    DeductFees --> Aggregate["Agregasi Statistik (Win Rate, Total Trade, Max Drawdown, Equity Curve)"]
    Aggregate --> D_Result[("Tabel: backtest_runs")]
    D_Result --> ViewBacktest["Visualisasi Grafik Performa (/backtest)"]
```
