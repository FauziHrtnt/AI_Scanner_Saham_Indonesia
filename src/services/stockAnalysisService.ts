/**
 * Stock Analysis Service (Single Ticker On-Demand Scanner)
 *
 * Provides on-demand technical analysis, BSJP scoring, news sentiment,
 * and position sizing for a single stock ticker requested by a user.
 */

import axios from "axios";
import { fetchTradingViewBatch, TradingViewIndicators } from "./dataService.js";
import { analyzeDaily, analyze4H } from "./indicatorService.js";
import { calculateScore } from "./scoringService.js";
import { calculatePositionSize } from "../utils/riskManagement.js";
import { getNewsSentiment } from "./newsService.js";
import { getUserConfig } from "../scheduler/dailyStateService.js";
import logger from "../utils/logger.js";

const MODULE = "StockAnalysisService";

export interface SingleStockAnalysisResult {
  code: string;
  ticker: string;
  price: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  volumeRatio: number;
  rsi: number;
  adx: number;
  macd: string;
  isBullish1D: boolean;
  tvRecommendation: string;
  tvRecValue: number;
  sma20: number;
  sma50: number;
  score: number;
  scoreLabel: string;
  targetPrice: number;
  stopLoss: number;
  positionSizing: {
    lotSize: number;
    shares: number;
    positionSize: number;
    riskAmount: number;
    capital: number;
    riskPct: number;
  };
  bsjpData?: {
    label: string;
    totalScore: number;
    reasons: string[];
    warnings: string[];
    riskLabels: string[];
  };
  newsSentiment?: {
    score: number;
    summary: string;
    newsCount: number;
  };
}

/**
 * Format a number as Indonesian Rupiah.
 */
function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(amount))}`;
}

/**
 * Analyze a single stock ticker on demand.
 *
 * @param inputTicker - e.g. "DEWA", "dewa", "DEWA.JK"
 * @param chatId - Telegram chat ID to fetch user-specific capital configuration
 */
export async function analyzeSingleStock(
  inputTicker: string,
  chatId: string
): Promise<SingleStockAnalysisResult> {
  const code = inputTicker.trim().replace(/\.JK$/i, "").toUpperCase();
  const ticker = `${code}.JK`;

  logger.info(MODULE, `Running on-demand scanner analysis for ${code}...`);

  // 1. Fetch multi-timeframe indicators from TradingView Scanner API
  const [dailyMap, fourHourMap] = await Promise.all([
    fetchTradingViewBatch([ticker], "1D"),
    fetchTradingViewBatch([ticker], "4H"),
  ]);

  const daily = dailyMap.get(ticker);
  const fourHour = fourHourMap.get(ticker);

  if (!daily) {
    throw new Error(
      `Ticker *${code}* tidak ditemukan di bursa IDX (BEI). Pastikan kode 4 huruf benar (contoh: DEWA, BBCA, BBRI, GOTO).`
    );
  }

  // 2. Perform technical analysis
  const dailyAnalysis = analyzeDaily(daily);
  const fourHourAnalysis = fourHour ? analyze4H(fourHour) : null;
  const isBullish1D = dailyAnalysis?.isBullish ?? false;

  // 3. News Sentiment (Yahoo Finance)
  let newsSentiment: any = undefined;
  try {
    newsSentiment = await getNewsSentiment(ticker);
  } catch (err: any) {
    logger.warn(MODULE, `Failed to load news for ${ticker}: ${err.message}`);
  }

  // 4. Volume ratio & daily change
  const avgVol = daily.avgVolume20 > 0 ? daily.avgVolume20 : daily.volume;
  const volumeRatio = avgVol > 0 ? daily.volume / avgVol : 1;
  const changePct =
    daily.open > 0 ? ((daily.close - daily.open) / daily.open) * 100 : 0;

  // 5. Calculate technical score
  let score = 50;
  if (dailyAnalysis && fourHourAnalysis) {
    const scoreResult = calculateScore(ticker, dailyAnalysis, fourHourAnalysis, newsSentiment);
    score = scoreResult.score;
  } else if (dailyAnalysis) {
    // Fallback daily calculation
    let s = 50;
    if (dailyAnalysis.isBullish) s += 20;
    if (dailyAnalysis.rsi >= 50 && dailyAnalysis.rsi <= 75) s += 15;
    if (volumeRatio >= 1.2) s += 15;
    score = Math.min(100, Math.max(0, s));
  }

  let scoreLabel = "skip";
  if (score >= 80) scoreLabel = "strong";
  else if (score >= 70) scoreLabel = "watchlist";
  else if (score >= 60) scoreLabel = "weak";

  // 6. MACD status
  let macdText = "Netral ⏸️";
  const macdHist = fourHour ? fourHour.macdHist : daily.macdHist;
  if (macdHist > 0) {
    macdText = "Bullish Crossover ✅";
  } else if (macdHist < 0) {
    macdText = "Bearish 🔻";
  }

  // 7. TradingView recommendation label
  const recVal = fourHour ? fourHour.recommendAll : daily.recommendAll;
  let tvRecText = "Neutral ⏸️";
  if (recVal >= 0.5) tvRecText = "Strong Buy 🚀";
  else if (recVal > 0.1) tvRecText = "Buy ✅";
  else if (recVal <= -0.5) tvRecText = "Strong Sell 🔻";
  else if (recVal < -0.1) tvRecText = "Sell 🔻";

  // 8. User-specific position sizing
  const userConfig = getUserConfig(chatId);
  const capital = userConfig.capital || 10_000_000;
  const riskPct = userConfig.riskPerTrade || 0.02;
  const stopLossPct = userConfig.stopLossPct || 0.03;
  const atr = fourHour?.atr || daily.atr || daily.close * 0.03;

  const position = calculatePositionSize(
    daily.close,
    capital,
    riskPct,
    stopLossPct,
    atr
  );

  // 9. Cross-reference with BSJP Candidate Cache from Next.js server if available
  let bsjpData: any = undefined;
  try {
    const scanResponse = await axios.get("http://localhost:3000/api/scan", {
      timeout: 3000,
    });
    const candidates = scanResponse.data?.allCandidates || [];
    const matched = candidates.find((c: any) => c.code === code);
    if (matched && matched.score) {
      bsjpData = {
        label: matched.score.label,
        totalScore: matched.score.totalScore,
        reasons: matched.score.reasons || [],
        warnings: matched.score.warnings || [],
        riskLabels: matched.score.riskLabels || [],
      };
    }
  } catch {
    // Non-critical if local Next.js server is not reachable
  }

  return {
    code,
    ticker,
    price: daily.close,
    changePct,
    open: daily.open,
    high: daily.high,
    low: daily.low,
    volume: daily.volume,
    volumeRatio,
    rsi: fourHour?.rsi ?? daily.rsi,
    adx: fourHour?.adx ?? daily.adx,
    macd: macdText,
    isBullish1D,
    tvRecommendation: tvRecText,
    tvRecValue: recVal,
    sma20: daily.sma20,
    sma50: daily.sma50,
    score,
    scoreLabel,
    targetPrice: position.takeProfit,
    stopLoss: position.stopLoss,
    positionSizing: {
      lotSize: position.lotSize,
      shares: position.shares,
      positionSize: position.positionSize,
      riskAmount: position.riskAmount,
      capital,
      riskPct: Math.round(riskPct * 100),
    },
    bsjpData,
    newsSentiment: newsSentiment
      ? {
          score: newsSentiment.score,
          summary: newsSentiment.summary,
          newsCount: newsSentiment.newsCount,
        }
      : undefined,
  };
}

/**
 * Format the single stock analysis result into an attractive Telegram Markdown message.
 */
export function formatSingleStockMessage(
  analysis: SingleStockAnalysisResult
): string {
  const changeSign = analysis.changePct >= 0 ? "+" : "";
  const changeIcon = analysis.changePct >= 0 ? "🟢" : "🔴";

  let msg = `🔍 *HASIL SCANNER EMITEN: ${analysis.code}*\n`;
  msg += `🏷️ *Ticker:* \`${analysis.code}\` (${analysis.ticker})\n`;
  msg += `💰 *Harga Terakhir:* ${formatRupiah(analysis.price)} (${changeIcon} ${changeSign}${analysis.changePct.toFixed(2)}%)\n`;
  msg += `📊 *Rentang Hari Ini:* Low ${formatRupiah(analysis.low)} — High ${formatRupiah(analysis.high)}\n`;
  msg += `${"─".repeat(28)}\n\n`;

  // Skor & Kesimpulan
  const scoreStars =
    analysis.score >= 80 ? "⭐⭐⭐⭐⭐" : analysis.score >= 70 ? "⭐⭐⭐⭐" : "⭐⭐⭐";
  msg += `⭐ *Skor Scanner:* *${analysis.score}/100* ${scoreStars}\n`;
  msg += `📋 *Status Sinyal:* *${analysis.scoreLabel.toUpperCase()}*\n`;
  msg += `📈 *Tren 1D (Harian):* ${analysis.isBullish1D ? "✅ Bullish Uptrend" : "🔻 Bearish / Konsolidasi"}\n`;
  msg += `📊 *Rekomendasi TV:* ${analysis.tvRecommendation} (${analysis.tvRecValue.toFixed(2)})\n\n`;

  // Indikator Teknikal
  msg += `🔬 *Indikator Teknikal (1D + 4H):*\n`;
  const rsiNote =
    analysis.rsi > 70
      ? "⚠️ Overbought"
      : analysis.rsi < 30
      ? "⚡ Oversold"
      : "✅ Zona Sehat";
  msg += `├ RSI (14): ${analysis.rsi.toFixed(1)} (${rsiNote})\n`;
  msg += `├ MACD: ${analysis.macd}\n`;
  msg += `├ ADX (Trend Strength): ${analysis.adx.toFixed(1)} ${analysis.adx >= 25 ? "🔥 Tren Kuat" : "Konsolidasi"}\n`;
  msg += `├ Volume Ratio: ${analysis.volumeRatio.toFixed(2)}x rata-rata 20 hari\n`;
  msg += `├ MA20: ${formatRupiah(analysis.sma20)} (${analysis.price >= analysis.sma20 ? "Di Atas ✅" : "Di Bawah 🔻"})\n`;
  msg += `└ MA50: ${formatRupiah(analysis.sma50)} (${analysis.price >= analysis.sma50 ? "Di Atas ✅" : "Di Bawah 🔻"})\n\n`;

  // Rekomendasi Setup
  msg += `🎯 *Rekomendasi Setup (Swing / BSJP):*\n`;
  const tpPct = (((analysis.targetPrice - analysis.price) / analysis.price) * 100).toFixed(1);
  const slPct = (((analysis.price - analysis.stopLoss) / analysis.price) * 100).toFixed(1);
  msg += `├ 🎯 Target Profit (TP): ${formatRupiah(analysis.targetPrice)} (+${tpPct}%)\n`;
  msg += `└ 🛑 Stop Loss (SL): ${formatRupiah(analysis.stopLoss)} (-${slPct}%)\n\n`;

  // Position Sizing
  const pos = analysis.positionSizing;
  msg += `📦 *Position Sizing (Modal Anda: ${formatRupiah(pos.capital)}):*\n`;
  msg += `├ Batas Risiko (${pos.riskPct}%): ${formatRupiah(pos.riskAmount)}\n`;
  msg += `├ Ukuran Disarankan: *${pos.lotSize} lot* (${pos.shares} lembar)\n`;
  msg += `└ Estimasi Nilai Posisi: ${formatRupiah(pos.positionSize)}\n\n`;

  // BSJP Data jika tersedia dari server lokal
  if (analysis.bsjpData) {
    msg += `🔎 *Konteks Scanner BSJP Sore:*\n`;
    msg += `├ Skor BSJP: *${analysis.bsjpData.totalScore}/100* (${analysis.bsjpData.label.toUpperCase()})\n`;
    if (analysis.bsjpData.reasons.length > 0) {
      analysis.bsjpData.reasons.slice(0, 3).forEach((r) => {
        msg += `├ ✅ ${r}\n`;
      });
    }
    if (analysis.bsjpData.warnings.length > 0) {
      analysis.bsjpData.warnings.slice(0, 2).forEach((w) => {
        msg += `├ ⚠️ ${w}\n`;
      });
    }
    msg += `\n`;
  }

  // Sentimen Berita
  if (analysis.newsSentiment && analysis.newsSentiment.newsCount > 0) {
    const sign = analysis.newsSentiment.score > 0 ? "+" : "";
    msg += `📰 *Sentimen Berita:* ${sign}${analysis.newsSentiment.score}/10 (${analysis.newsSentiment.newsCount} berita)\n`;
    msg += `└ _${analysis.newsSentiment.summary}_\n\n`;
  }

  msg += `⚠️ _Disclaimer: Hasil scanner ini dihasilkan oleh sistem kuantitatif. Selalu terapkan manajemen risiko disiplin._`;
  return msg;
}
