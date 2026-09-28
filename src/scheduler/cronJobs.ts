/**
 * Advanced Scheduler (Multi-User)
 *
 * Schedules 4 specific jobs with exact timezones:
 *   1️⃣ 08:00 WIB: Full Scan & Ranking (pagi sebelum market buka 09:00)
 *   2️⃣ 12:05 WIB: Midday Hold/Exit Check
 *   3️⃣ 15:40 WIB: Exit / Momentum Check
 *   4️⃣ 07:45 WIB: Reset Daily Counter & Watchlist
 */

import cron from "node-cron";
import config from "../config/index.js";
import { generateSignals, checkExitSignals } from "../services/signalService.js";
import { getFetchSummary } from "../services/dataService.js";
import { sendDailySummary, sendExitSignal, sendMessage } from "../telegram/telegramService.js";
import {
  getRegisteredUsers,
  getActivePositions,
  closePosition,
  resetDailyState,
  getTodayState,
} from "./dailyStateService.js";
import logger from "../utils/logger.js";

const MODULE = "Scheduler";
const TIMEZONE = "Asia/Jakarta";

let job0800: cron.ScheduledTask | null = null;
let job1205: cron.ScheduledTask | null = null;
let job1540: cron.ScheduledTask | null = null;
let job0745: cron.ScheduledTask | null = null;

// ==========================================
// 1️⃣ 08:00 WIB — FULL SCAN
// ==========================================
async function runMorningScan(): Promise<void> {
  const startedAt = Date.now();

  // Reset daily state for all registered users
  resetDailyState();

  logger.info(MODULE, "🚀 ============================================");
  logger.info(MODULE, "🚀  [08:00] Starting full scan (pre-market)...");
  logger.info(MODULE, "🚀 ============================================");

  try {
    await sendMessage(`⏳ *[08:00] Full Scan Dimulai*\n\n` + `Scanner mulai memproses ticker IDX via TradingView.\n` + `Proses berjalan pagi hari agar selesai sebelum market buka (09:00 WIB).`);

    const signals = await generateSignals();
    const durationMin = ((Date.now() - startedAt) / 60000).toFixed(1);

    logger.info(MODULE, `[08:00] Scan completed. Found ${signals.length} signal(s).`);

    // Notify about fetch failures
    const summary = getFetchSummary();
    if (summary.failed > 0) {
      const parts: string[] = [];
      if (summary.rateLimited.length > 0) parts.push(`⏳ *Rate limited (${summary.rateLimited.length}):* ${summary.rateLimited.map((t) => t.replace(".JK", "")).join(", ")}`);
      if (summary.notFound.length > 0)
        parts.push(
          `❓ *Tidak ditemukan (${summary.notFound.length}):* ${summary.notFound
             .slice(0, 20)
             .map((t) => t.replace(".JK", ""))
             .join(", ")}${summary.notFound.length > 20 ? "..." : ""}`,
        );
      await sendMessage(`⚠️ *Peringatan Data Fetch*\n\n` + `Berhasil: ${summary.success} ticker\nGagal: ${summary.failed} ticker\n\n` + parts.join("\n"));
    }

    const users = getRegisteredUsers();

    if (signals.length > 0) {
      for (const chatId of users) {
        await sendDailySummary(chatId, signals);
        await sendMessage(`✅ *Full Scan Selesai*\n\nDurasi: ${durationMin} menit\nSignal: ${signals.length}\n\n` + `_Dicek ulang pada 12:05 dan 15:40 WIB._`, chatId);
      }
    } else {
      const date = new Date().toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      for (const chatId of users) {
        await sendMessage(`🔍 *AI STOCK SIGNAL SCANNER*\n📅 ${date}\n\n` + `📊 *Full Scan Selesai* (${durationMin} menit)\n\n` + `❌ Tidak ada saham yang memenuhi kriteria BUY hari ini.\n\n` + `_Re-check pada 12:05 WIB._`, chatId);
      }
    }
  } catch (error: any) {
    logger.error(MODULE, `Morning scan failed: ${error.message}`);
    await sendMessage(`⚠️ *Full Scan Gagal*\n\nError: ${error.message}`);
  }
}

/** Simple rupiah formatter */
function formatRupiahSimple(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// ==========================================
// 2️⃣ 12:05 WIB — MIDDAY CHECK
// ==========================================
async function runMiddayCheck(): Promise<void> {
  logger.info(MODULE, "⏰ [12:05] Running midday hold/exit check for all users...");
  const users = getRegisteredUsers();

  for (const chatId of users) {
    const activePositions = getActivePositions(chatId);
    const state = getTodayState(chatId);

    if (activePositions.length === 0) {
      logger.info(MODULE, `[12:05] User ${chatId} tidak memiliki posisi aktif.`);
      continue;
    }

    try {
      const tickers = activePositions.map((p) => p.ticker);
      logger.info(MODULE, `[12:05] User ${chatId}: Checking ${tickers.length} active position(s)`);

      const exitSignals = await checkExitSignals(tickers);

      const holdList: string[] = [];
      const slHitList: { ticker: string; entry: number; sl: number; current: number }[] = [];
      const tpHitList: { ticker: string; entry: number; tp: number; current: number }[] = [];
      const technicalExitList: { ticker: string; reason: string; current: number }[] = [];

      for (const pos of activePositions) {
        const exitSig = exitSignals.find((e) => e.ticker === pos.ticker);
        const currentPrice = exitSig?.currentPrice ?? pos.entry;

        if (currentPrice <= pos.stopLoss) {
          slHitList.push({ ticker: pos.ticker, entry: pos.entry, sl: pos.stopLoss, current: currentPrice });
          closePosition(chatId, pos.ticker, "hit_sl");
          continue;
        }

        if (currentPrice >= pos.takeProfit) {
          tpHitList.push({ ticker: pos.ticker, entry: pos.entry, tp: pos.takeProfit, current: currentPrice });
          closePosition(chatId, pos.ticker, "hit_tp");
          continue;
        }

        if (exitSig && exitSig.sell.shouldSell) {
          technicalExitList.push({
            ticker: pos.ticker,
            reason: exitSig.sell.reason,
            current: exitSig.currentPrice,
          });
          closePosition(chatId, pos.ticker, "exited");
          continue;
        }

        const pnlPct = (((currentPrice - pos.entry) / pos.entry) * 100).toFixed(2);
        holdList.push(`${pos.ticker.replace(".JK", "")} (${Number(pnlPct) >= 0 ? "+" : ""}${pnlPct}%)`);
      }

      // Send notifications to this user
      for (const sl of slHitList) {
        const lossPct = (((sl.current - sl.entry) / sl.entry) * 100).toFixed(2);
        await sendMessage(`🛑 *STOP LOSS HIT*\n\n🏷 *Stock:* \`${sl.ticker.replace(".JK", "")}\`\n` + `💰 Entry: ${formatRupiahSimple(sl.entry)}\n🛑 SL: ${formatRupiahSimple(sl.sl)}\n` + `📉 Sekarang: ${formatRupiahSimple(sl.current)} (${lossPct}%)`, chatId);
        await new Promise((res) => setTimeout(res, 1000));
      }

      for (const tp of tpHitList) {
        const profitPct = (((tp.current - tp.entry) / tp.entry) * 100).toFixed(2);
        await sendMessage(
          `🎯 *TAKE PROFIT HIT*\n\n🏷 *Stock:* \`${tp.ticker.replace(".JK", "")}\`\n` +
            `💰 Entry: ${formatRupiahSimple(tp.entry)}\n🎯 TP: ${formatRupiahSimple(tp.tp)}\n` +
            `📈 Sekarang: ${formatRupiahSimple(tp.current)} (+${profitPct}%)\n\n🎉 _Target tercapai!_`,
          chatId
        );
        await new Promise((res) => setTimeout(res, 1000));
      }

      for (const ex of technicalExitList) {
        await sendExitSignal(chatId, ex.ticker, ex.reason, ex.current);
        await new Promise((res) => setTimeout(res, 1000));
      }

      const holdText = holdList.length > 0 ? holdList.map((t) => `✅ ${t}`).join("\n") : "_Tidak ada_";
      const warnText = technicalExitList.length > 0 ? technicalExitList.map((e) => `⚠️ ${e.ticker.replace(".JK", "")} — ${e.reason} (Rp ${e.current.toLocaleString("id-ID")})`).join("\n") : "_Tidak ada_";

      await sendMessage(`⏰ *[12:05] Midday Check*\n\n` + `💎 *HOLD:*\n${holdText}\n\n` + `⚠️ *PERHATIAN (EXITED):*\n${warnText}\n\n` + `📋 Sinyal hari ini: ${state.buySignalsSent}/${config.signal.maxPerDay}\n\n` + `_Exit check 15:40 WIB._`, chatId);

      logger.info(MODULE, `[12:05] Done for user ${chatId}. Hold: ${holdList.length}, SL: ${slHitList.length}, TP: ${tpHitList.length}, Warn: ${technicalExitList.length}`);
    } catch (error: any) {
      logger.error(MODULE, `Midday check failed for user ${chatId}: ${error.message}`);
      await sendMessage(`⚠️ *[12:05] Midday Check Gagal*\n\nError: ${error.message}`, chatId);
    }
  }
}

// ==========================================
// 3️⃣ 15:40 WIB — EXIT CHECK
// ==========================================
async function runExitCheck(): Promise<void> {
  logger.info(MODULE, "🛑 [15:40] Running end-of-day exit check for all users...");
  const users = getRegisteredUsers();

  for (const chatId of users) {
    const activePositions = getActivePositions(chatId);
    const state = getTodayState(chatId);

    if (activePositions.length === 0) {
      logger.info(MODULE, `[15:40] User ${chatId} tidak memiliki posisi aktif.`);
      await sendMessage(`🛑 *[15:40] Exit Check Selesai*\n\n📋 Tidak ada posisi aktif.\n` + `📊 Sinyal hari ini: ${state.buySignalsSent}/${config.signal.maxPerDay}\n\n_Sampai besok! 👋_`, chatId);
      continue;
    }

    try {
      const tickers = activePositions.map((p) => p.ticker);
      const exitSignals = await checkExitSignals(tickers);

      const holdList: string[] = [];
      const slHitList: { ticker: string; entry: number; sl: number; current: number }[] = [];
      const tpHitList: { ticker: string; entry: number; tp: number; current: number }[] = [];
      const exitList: { ticker: string; reason: string; current: number }[] = [];

      for (const pos of activePositions) {
        const exitSig = exitSignals.find((e) => e.ticker === pos.ticker);
        const currentPrice = exitSig?.currentPrice ?? pos.entry;

        if (currentPrice <= pos.stopLoss) {
          slHitList.push({ ticker: pos.ticker, entry: pos.entry, sl: pos.stopLoss, current: currentPrice });
          closePosition(chatId, pos.ticker, "hit_sl");
          continue;
        }

        if (currentPrice >= pos.takeProfit) {
          tpHitList.push({ ticker: pos.ticker, entry: pos.entry, tp: pos.takeProfit, current: currentPrice });
          closePosition(chatId, pos.ticker, "hit_tp");
          continue;
        }

        if (exitSig && exitSig.sell.shouldSell) {
          exitList.push({ ticker: pos.ticker, reason: exitSig.sell.reason, current: exitSig.currentPrice });
          closePosition(chatId, pos.ticker, "exited");
          continue;
        }

        const pnlPct = (((currentPrice - pos.entry) / pos.entry) * 100).toFixed(2);
        holdList.push(`${pos.ticker.replace(".JK", "")} (${Number(pnlPct) >= 0 ? "+" : ""}${pnlPct}%)`);
      }

      for (const sl of slHitList) {
        const lossPct = (((sl.current - sl.entry) / sl.entry) * 100).toFixed(2);
        await sendMessage(`🛑 *STOP LOSS HIT*\n\n🏷 \`${sl.ticker.replace(".JK", "")}\`\n` + `Entry: ${formatRupiahSimple(sl.entry)} | SL: ${formatRupiahSimple(sl.sl)}\n` + `📉 Sekarang: ${formatRupiahSimple(sl.current)} (${lossPct}%)`, chatId);
        await new Promise((res) => setTimeout(res, 1000));
      }

      for (const tp of tpHitList) {
        const profitPct = (((tp.current - tp.entry) / tp.entry) * 100).toFixed(2);
        await sendMessage(
          `🎯 *TAKE PROFIT HIT*\n\n🏷 \`${tp.ticker.replace(".JK", "")}\`\n` + `Entry: ${formatRupiahSimple(tp.entry)} | TP: ${formatRupiahSimple(tp.tp)}\n` + `📈 Sekarang: ${formatRupiahSimple(tp.current)} (+${profitPct}%)\n🎉 _Target tercapai!_`,
          chatId
        );
        await new Promise((res) => setTimeout(res, 1000));
      }

      for (const ex of exitList) {
        await sendExitSignal(chatId, ex.ticker, ex.reason, ex.current);
        await new Promise((res) => setTimeout(res, 1000));
      }

      const holdText = holdList.length > 0 ? holdList.map((t) => `✅ ${t}`).join("\n") : "_Semua ditutup_";

      await sendMessage(`📊 *[15:40] End of Day Summary*\n\n💎 *HOLD:*\n${holdText}\n\n` + `📋 Sinyal hari ini: ${state.buySignalsSent}/${config.signal.maxPerDay}\n\n_Good work! 👋_`, chatId);
    } catch (error: any) {
      logger.error(MODULE, `Exit check failed for user ${chatId}: ${error.message}`);
      await sendMessage(`⚠️ *[15:40] Exit Check Gagal*\n\nError: ${error.message}`, chatId);
    }
  }
}

// ==========================================
// 4️⃣ 07:45 WIB — DAILY RESET
// ==========================================
async function runDailyReset(): Promise<void> {
  logger.info(MODULE, "🔄 [07:45] Running daily state reset...");

  const users = getRegisteredUsers();
  
  // Track carried positions per user before reset
  const userCarriedMap: { [chatId: string]: any[] } = {};
  for (const chatId of users) {
    userCarriedMap[chatId] = getActivePositions(chatId);
  }

  resetDailyState();

  for (const chatId of users) {
    const carriedPositions = userCarriedMap[chatId] || [];
    if (carriedPositions.length > 0) {
      const lines = carriedPositions.map((p) => {
        const daysSince = p.daysSinceEntry ?? 0;
        return `📌 ${p.ticker.replace(".JK", "")} — Entry: ${formatRupiahSimple(p.entry)} | SL: ${formatRupiahSimple(p.stopLoss)} | TP: ${formatRupiahSimple(p.takeProfit)} (Hari ke-${daysSince + 1})`;
      });
      await sendMessage(`🔄 *[07:45] Daily Reset*\n\n📊 Counter direset.\n` + `📌 *${carriedPositions.length} posisi aktif Anda:*\n\n` + lines.join("\n") + `\n\n_Scan dimulai 08:00 WIB._`, chatId);
    } else {
      await sendMessage(`🔄 *[07:45] Daily Reset*\n\nCounter direset. Tidak ada posisi aktif.\n_Scan 08:00 WIB. 👋_`, chatId);
    }
  }
}

/**
 * Start all scheduled cron jobs.
 */
export function startScheduler(): void {
  logger.info(MODULE, `📅 Starting scheduler (${TIMEZONE})...`);

  job0800 = cron.schedule("0 8 * * 1-5", runMorningScan, { timezone: TIMEZONE });
  logger.info(MODULE, `   [08:00] Full Scan scheduled.`);

  job1205 = cron.schedule("5 12 * * 1-5", runMiddayCheck, { timezone: TIMEZONE });
  logger.info(MODULE, `   [12:05] Midday Check scheduled.`);

  job1540 = cron.schedule("40 15 * * 1-5", runExitCheck, { timezone: TIMEZONE });
  logger.info(MODULE, `   [15:40] Exit Check scheduled.`);

  job0745 = cron.schedule("45 7 * * 1-5", runDailyReset, { timezone: TIMEZONE });
  logger.info(MODULE, `   [07:45] Daily Reset scheduled.`);

  logger.info(MODULE, "✅ All cron jobs active.");
}

/**
 * Stop all cron jobs.
 */
export function stopScheduler(): void {
  job0800?.stop();
  job1205?.stop();
  job1540?.stop();
  job0745?.stop();
  logger.info(MODULE, "🛑 Scheduler stopped.");
}

/**
 * Manually trigger scanning (broadcasts to all users).
 */
export async function triggerManualScan(): Promise<void> {
  logger.info(MODULE, "🔧 Manual scan triggered globally...");
  await runMorningScan();
}

/**
 * Manually trigger scanning for a specific user.
 */
export async function triggerManualScanForUser(chatId: string): Promise<void> {
  logger.info(MODULE, `🔧 Manual scan triggered for user ${chatId}...`);
  try {
    await sendMessage(`⏳ *Manual Scan Dimulai*\n\nScanner mulai memproses ticker IDX via TradingView.`, chatId);
    const signals = await generateSignals(chatId);
    
    if (signals.length > 0) {
      await sendDailySummary(chatId, signals);
      await sendMessage(`✅ *Manual Scan Selesai*\n\nSignal: ${signals.length}\n\n_Dicek ulang otomatis pada 12:05 dan 15:40 WIB._`, chatId);
    } else {
      await sendMessage(`✅ *Manual Scan Selesai*\n\n❌ Tidak ada saham yang memenuhi kriteria BUY hari ini.`, chatId);
    }
  } catch (err: any) {
    logger.error(MODULE, `Manual scan failed for user ${chatId}: ${err.message}`);
    await sendMessage(`⚠️ *Manual Scan Gagal*\n\nError: ${err.message}`, chatId);
  }
}
