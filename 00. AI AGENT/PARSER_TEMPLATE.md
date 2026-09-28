# Template Parser Data Pasar & Indikator Teknikal (Parser Template) — Stock Scanner Ecosystem

Dokumen ini menyediakan pola acuan kode (*template*) untuk memproses deret waktu data pasar (*OHLCV*), menghitung indikator teknikal murni, serta mengkalkulasi skor algoritma BSJP secara independen dan *type-safe*.

---

## 📈 1. Template Normalisasi Data Lilin (OHLCV Normalizer)

Digunakan untuk membersihkan data mentah dari penyedia pasar (Yahoo Finance atau TradingView) menjadi bentuk terstandarisasi:

```typescript
export interface RawMarketCandle {
  date: Date | string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CleanCandle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  range: number;
  isBullish: boolean;
}

export function normalizeCandles(rawCandles: RawMarketCandle[]): CleanCandle[] {
  return rawCandles
    .filter((c) => c && c.close > 0 && c.volume >= 0 && c.high >= c.low)
    .map((c) => {
      const d = c.date instanceof Date ? c.date : new Date(c.date);
      const range = c.high - c.low;
      return {
        date: d,
        open: Math.round(c.open),
        high: Math.round(c.high),
        low: Math.round(c.low),
        close: Math.round(c.close),
        volume: c.volume,
        range,
        isBullish: c.close >= c.open,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
```

---

## 🔬 2. Template Kalkulasi Indikator Teknikal (Moving Average & ATR)

```typescript
/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Average True Range (ATR 14)
 */
export function calculateATR(candles: CleanCandle[], period = 14): number | null {
  if (candles.length < period + 1) return null;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }

  return calculateSMA(trueRanges, period);
}
```

---

## 🎯 3. Template Kalkulator Skor Multi-Faktor BSJP

```typescript
export interface BsjpScoreBreakdown {
  liquidityScore: number;   // Max 25
  momentumScore: number;    // Max 30
  volumeScore: number;      // Max 20
  trendScore: number;       // Max 15
  riskPenalty: number;      // 0 to -30
  totalScore: number;       // 0 - 100
  label: "strong" | "watchlist" | "weak" | "skip";
}

export function computeBsjpScore(params: {
  candles: CleanCandle[];
  avgValue20D: number;
  volumeRatio: number;
  dailyChangePct: number;
}): BsjpScoreBreakdown {
  const { candles, avgValue20D, volumeRatio, dailyChangePct } = params;
  const latest = candles[candles.length - 1];

  // 1. Likuiditas (Max 25 pt)
  let liquidityScore = 0;
  if (avgValue20D >= 50_000_000_000) liquidityScore = 25;
  else if (avgValue20D >= 20_000_000_000) liquidityScore = 20;
  else if (avgValue20D >= 10_000_000_000) liquidityScore = 15;
  else if (avgValue20D >= 5_000_000_000) liquidityScore = 10;
  else liquidityScore = 3;

  // 2. Momentum Sore (Max 30 pt)
  let momentumScore = 0;
  const range = latest.high - latest.low;
  const closePosition = range > 0 ? (latest.close - latest.low) / range : 0.5;
  
  if (closePosition >= 0.85) momentumScore += 20;
  else if (closePosition >= 0.70) momentumScore += 14;
  else if (closePosition >= 0.50) momentumScore += 8;

  if (dailyChangePct >= 1.5 && dailyChangePct <= 6.0) momentumScore += 10; // Sweet spot
  else if (dailyChangePct > 6.0 && dailyChangePct <= 12.0) momentumScore += 5;

  // 3. Volume Breakout (Max 20 pt)
  let volumeScore = 0;
  if (volumeRatio >= 2.0) volumeScore = 20;
  else if (volumeRatio >= 1.5) volumeScore = 15;
  else if (volumeRatio >= 1.2) volumeScore = 10;

  // 4. Tren (Max 15 pt)
  const closes = candles.map((c) => c.close);
  const ma20 = calculateSMA(closes, 20) ?? latest.close;
  const ma50 = calculateSMA(closes, 50) ?? latest.close;
  let trendScore = 0;
  if (latest.close > ma20) trendScore += 8;
  if (latest.close > ma50) trendScore += 7;

  // 5. Penalti Risiko (0 s/d -30 pt)
  let riskPenalty = 0;
  const upperShadow = latest.high - Math.max(latest.open, latest.close);
  if (range > 0 && upperShadow / range > 0.35) riskPenalty -= 15; // Ekor atas panjang
  if (avgValue20D < 3_000_000_000) riskPenalty -= 15; // Risiko likuiditas tipis

  const rawTotal = liquidityScore + momentumScore + volumeScore + trendScore + riskPenalty;
  const totalScore = Math.max(0, Math.min(100, rawTotal));

  let label: BsjpScoreBreakdown["label"] = "skip";
  if (totalScore >= 80) label = "strong";
  else if (totalScore >= 70) label = "watchlist";
  else if (totalScore >= 60) label = "weak";

  return {
    liquidityScore,
    momentumScore,
    volumeScore,
    trendScore,
    riskPenalty,
    totalScore,
    label,
  };
}
```
