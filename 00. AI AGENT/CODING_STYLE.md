# Panduan Gaya Penulisan Kode (Coding Style Guide) — Stock Scanner Ecosystem

Panduan ini mendefinisikan standar penulisan kode bersih (*Clean Code*), efisien, dan berkinerja tinggi yang wajib dipatuhi oleh seluruh developer dan AI Agent untuk menjamin keterbacaan, keandalan analitis, dan kemudahan pemeliharaan (*maintainability*) sistem.

---

## 🚀 5 Prinsip Utama Clean Code Finansial

### 1. Hindari "Deep Nesting" dengan Guard Clauses
Kondisi pasar dan validasi indikator sering kali memiliki banyak pengecekan (*illiquid*, harga < Rp 50, candle tidak lengkap). Jangan menumpuk blok `if-else` bersarang; bersihkan kondisi gagal di awal fungsi (*Guard Clauses*).

* ❌ **Gaya Buruk (Deep Nesting / Arrow Code):**
  ```typescript
  function calculateBsjpScore(candle: CandleData) {
    if (candle) {
      if (candle.volume > 0) {
        if (candle.close >= 50) {
          if (candle.high !== candle.low) {
            // Logika perhitungan skor di sini
            return score;
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  ```

*  **Gaya Bersih (Guard Clauses):**
  ```typescript
  function calculateBsjpScore(candle: CandleData | null): BsjpScore | null {
    if (!candle) return null;
    if (candle.volume <= 0) return null;
    if (candle.close < 50) return null; // Filter saham tidur / di bawah batas bursa
    if (candle.high === candle.low) return null; // Tidak ada pergerakan rentang

    // Logika perhitungan utama berada di indentasi terluar yang bersih
    const range = candle.high - candle.low;
    const closePosition = (candle.close - candle.low) / range;
    return computeMetrics(candle, closePosition);
  }
  ```

---

### 2. Hindari "Magic Numbers" dengan Konstanta Deskriptif
Dalam trading kuantitatif, rumus sering melibatkan angka ambang batas (*threshold*). Jangan tuliskan angka mentah di tengah algoritma tanpa penjelasan.

* ❌ **Gaya Buruk (Magic Numbers):**
  ```typescript
  if (valueTraded >= 20000000000 && ratio >= 1.5 && (close - low) / (high - low) > 0.75) {
    status = "strong";
  }
  ```

*  **Gaya Bersih (Descriptive Constants):**
  ```typescript
  const MIN_LIQUIDITY_TIER1_IDR = 20_000_000_000; // Rp 20 Miliar
  const MIN_VOLUME_SPIKE_RATIO = 1.5;
  const MIN_CLOSE_RANGE_PERCENTILE = 0.75; // 75% teratas dari rentang harian

  const isHighlyLiquid = valueTraded >= MIN_LIQUIDITY_TIER1_IDR;
  const hasVolumeBreakout = ratio >= MIN_VOLUME_SPIKE_RATIO;
  const isClosingNearHigh = closePosition >= MIN_CLOSE_RANGE_PERCENTILE;

  if (isHighlyLiquid && hasVolumeBreakout && isClosingNearHigh) {
    return SignalLabel.STRONG_CANDIDATE;
  }
  ```

---

### 3. Presisi Finansial: Larangan Floating-Point Arithmetic untuk Uang
Jangan mengandalkan operator `+`, `-`, `*`, `/` standar pada JavaScript untuk uang, fee, dan net return karena sifat representasi biner IEEE 754.

* ❌ **Gaya Buruk (Floating Point Bug):**
  ```typescript
  const entryPrice = 1200;
  const sellPrice = 1220;
  const grossProfit = (sellPrice - entryPrice) / entryPrice; // 0.016666666666666666
  const netReturn = grossProfit - (0.0015 + 0.0025); // Resiko floating error!
  ```

*  **Gaya Bersih (Pustaka Decimal.js atau Math Rounding Terkalibrasi):**
  ```typescript
  import { Decimal } from "decimal.js";

  const BUY_FEE_PCT = new Decimal("0.0015");
  const SELL_FEE_PCT = new Decimal("0.0025");

  function calculateNetProfit(entry: number, exit: number, shares: number): {
    grossProfitIdr: number;
    feeTotalIdr: number;
    netProfitIdr: number;
    netReturnPct: number;
  } {
    const buyVal = new Decimal(entry).times(shares);
    const sellVal = new Decimal(exit).times(shares);
    const buyFee = buyVal.times(BUY_FEE_PCT);
    const sellFee = sellVal.times(SELL_FEE_PCT);
    const totalFee = buyFee.plus(sellFee);
    const netProfit = sellVal.minus(buyVal).minus(totalFee);
    const netReturn = netProfit.dividedBy(buyVal).times(100);

    return {
      grossProfitIdr: sellVal.minus(buyVal).round().toNumber(),
      feeTotalIdr: totalFee.round().toNumber(),
      netProfitIdr: netProfit.round().toNumber(),
      netReturnPct: netReturn.toDecimalPlaces(2).toNumber(),
    };
  }
  ```

---

### 4. Pemisahan Komponen Server vs Client pada Next.js 16
Arsitektur App Router mengoptimalkan performa halaman melalui Server Components dan Client Components:
* **Server Components (Default)**:
  - Gunakan untuk pembacaan data awal (membaca CSV ticker, memanggil query PostgreSQL/storage lokal).
  - Mengurangi beban bundle JavaScript yang dikirim ke browser pengguna.
* **Client Components (`'use client'`)**:
  - Gunakan secara terlokalisir khusus pada komponen interaktif:
    - Input filter pencarian realtime
    - Canvas grafik `lightweight-charts` (membutuhkan API DOM window & canvas)
    - Modal popup paper trading
    - Tombol picu scan dengan animasi loading

---

### 5. Gunakan Objek untuk Parameter Fungsi yang Kompleks
Indikator trading dan fungsi order biasanya menerima banyak parameter. Selalu gunakan *Object Destructuring* dengan pengetikan TypeScript yang ketat.

* ❌ **Gaya Buruk (Positional Parameters membingungkan):**
  ```typescript
  function calculatePosition(entry, capital, riskPct, stopLossPct, atr, feePct) {
    // Sulit mengingat urutan parameter saat pemanggilan
  }
  ```

*  **Gaya Bersih (Object Destructuring):**
  ```typescript
  interface PositionSizingParams {
    entryPrice: number;
    totalCapital: number;
    riskPerTradePct?: number; // Default 0.02 (2%)
    stopLossPct?: number;     // Default 0.03 (3%)
    atr14?: number;
  }

  function calculatePositionSize({
    entryPrice,
    totalCapital,
    riskPerTradePct = 0.02,
    stopLossPct = 0.03,
    atr14,
  }: PositionSizingParams): PositionSizeResult {
    // Sangat jelas dan fleksibel dengan default parameter
  }
  ```

---

## 🎨 Standar Formatting & TypeScript

1. **TypeScript Strictness**:
   - `noImplicitAny: true` wajib aktif. Dilarang menggunakan tipe `any` tanpa pembungkus komentar alasan yang valid. Buat antarmuka tipe data yang jelas di `lib/types.ts`.
2. **Naming Conventions**:
   - Variabel & Fungsi: `camelCase` (e.g. `calculateBsjpScore`, `formatRupiah`, `volumeRatio`).
   - Tipe & Antarmuka: `PascalCase` (e.g. `CandleData`, `CandidateResult`, `PaperTradeEntry`).
   - Konstanta: `UPPER_SNAKE_CASE` (e.g. `DEFAULT_BUY_FEE`, `MAX_TICKERS_PER_BATCH`).
3. **Penanganan Error Asynchronous (Safe Fetching)**:
   - Setiap panggilan ke data provider (Yahoo Finance / TradingView) wajib dibungkus dalam blok `try-catch` dengan fallback yang aman agar satu ticker gagal tidak menghentikan keseluruhan scan.
