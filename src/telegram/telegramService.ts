/**
 * Telegram Service (Multi-User)
 *
 * Handles formatting and sending trading signals and news to Telegram.
 * Feeds user-specific config and positions tracking to DailyStateService.
 */

import TelegramBot from "node-telegram-bot-api";
import config from "../config/index.js";
import { BuySignal } from "../services/signalService.js";
import {
  getTodayState,
  incrementBuyCounter,
  addWatchlistPosition,
  getActivePositions,
  getUserConfig,
  setUserConfig,
  registerUser,
  getRegisteredUsers,
} from "../scheduler/dailyStateService.js";
import { calculatePositionSize } from "../utils/riskManagement.js";
import { analyzeSingleStock, formatSingleStockMessage } from "../services/stockAnalysisService.js";
import logger from "../utils/logger.js";
import axios from "axios";

const MODULE = "TelegramService";

let bot: TelegramBot | null = null;

/**
 * Safely send a message via Telegram bot, falling back to plain text if Markdown parsing fails.
 */
async function safeSendMessage(chatId: number | string, text: string, options: any = {}) {
  if (!bot) return;
  const numChatId = typeof chatId === "string" ? parseInt(chatId, 10) : chatId;
  try {
    return await bot.sendMessage(numChatId, text, options);
  } catch (err: any) {
    logger.warn(MODULE, `SendMessage failed with parse_mode, falling back: ${err.message}`);
    const fallbackOpts = { ...options };
    delete fallbackOpts.parse_mode;
    const cleanText = text.replace(/[*_`\[\]]/g, "");
    return await bot.sendMessage(numChatId, cleanText, fallbackOpts).catch((e: any) => {
      logger.error(MODULE, `Failed fallback sendMessage: ${e.message}`);
    });
  }
}

const TICKER_PROMPT_MSG =
  "🔎 *Cek & Analisis Emiten Saham IDX*\n\n" +
  "Ketik 4 huruf kode emiten yang ingin Anda analisis.\n" +
  "Contoh: `DEWA`, `BBCA`, `GOTO`, atau `BBRI` (huruf besar/kecil bebas).\n\n" +
  "Atau ketik langsung perintah:\n" +
  "`/cek <kode_saham>`\n" +
  "Contoh: `/cek DEWA`";

// Map to track users waiting to input a ticker code: chatId -> timestamp
const waitingTickerInput = new Map<string, number>();

/**
 * Format BSJP scan data into a nice Telegram message.
 */
function formatBsjpMessage(scanData: any): string {
  const date = new Date(scanData.finishedAt).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  let msg = `🔍 *BSJP SCANNER REPORT*\n`;
  msg += `📅 Run: ${date} WIB\n`;
  msg += `📊 Universe: ${scanData.universeMode.replace(/_/g, " ").toUpperCase()}\n`;
  msg += `📈 Total Tickers: ${scanData.totalTickers}\n`;
  msg += `${"─".repeat(25)}\n\n`;

  const candidates = scanData.allCandidates || [];
  const visible = candidates.filter((c: any) => c.score.label !== "skip");
  const top = visible.slice(0, 5);

  if (top.length === 0) {
    msg += `❌ Tidak ada saham yang memenuhi kriteria BSJP sore ini.`;
    return msg;
  }

  top.forEach((c: any, index: number) => {
    const change = c.indicators.dailyChangePct;
    const vol = c.indicators.volumeRatio;
    msg += `${index + 1}. *${c.code}* (${c.score.totalScore}/100) - ${c.score.label.replace(/_/g, " ").toUpperCase()}\n`;
    msg += `   💰 Price: Rp ${new Intl.NumberFormat("id-ID").format(c.price)} (${change >= 0 ? "+" : ""}${change.toFixed(2)}%)\n`;
    msg += `   📊 Vol Ratio: ${vol.toFixed(2)}x\n`;
    msg += `   🎯 TP1: Rp ${new Intl.NumberFormat("id-ID").format(Math.round(c.price * 1.015))} (+1.5%)\n`;
    msg += `   🛑 SL: Rp ${new Intl.NumberFormat("id-ID").format(Math.round(c.price * 0.985))} (-1.5%)\n\n`;
  });

  msg += `⚠️ _Disiplin batasi risiko sebelum masuk._`;
  return msg;
}

/**
 * Send main control menu to a user.
 */
async function sendMainMenu(chatId: number): Promise<void> {
  if (!bot) return;
  
  // Register the user automatically when they request menu
  registerUser(String(chatId));

  await bot.sendMessage(chatId, "🤖 *AI Stock Signal Scanner Menu*\nSilakan pilih opsi berikut untuk mengontrol scanner:", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⚡ Scan Sekarang", callback_data: "action_scan" },
          { text: "🔎 Cek / Analisis Emiten", callback_data: "action_check_ticker" }
        ],
        [
          { text: "🔍 Scan BSJP Sore", callback_data: "action_scan_bsjp" },
          { text: "📈 Hasil BSJP Terakhir", callback_data: "action_latest_bsjp" }
        ],
        [
          { text: "📊 Status & Modal", callback_data: "action_status" },
          { text: "💰 Ubah Modal", callback_data: "action_set_capital" }
        ],
        [
          { text: "📰 Berita & Kebijakan", callback_data: "action_news_menu" }
        ]
      ]
    }
  });
}

/**
 * Send news portal menu.
 */
async function sendNewsMenu(chatId: number): Promise<void> {
  if (!bot) return;
  await bot.sendMessage(chatId, "📰 *Portal Berita & Kebijakan*\nPilih kategori informasi ekonomi/pasar yang ingin Anda lihat:", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📰 Berita Ekonomi Terbaru", callback_data: "action_news_latest" },
          { text: "📈 Indeks IHSG", callback_data: "action_news_ihsg" }
        ],
        [
          { text: "🏛️ Kebijakan Pemerintah RI", callback_data: "action_news_gov" },
          { text: "💰 Kebijakan Ekonomi", callback_data: "action_news_eco" }
        ],
        [
          { text: "📢 Pengumuman Resmi IDX", callback_data: "action_news_idx" }
        ],
        [
          { text: "🏠 Kembali ke Menu Utama", callback_data: "action_menu_home" }
        ]
      ]
    }
  });
}

/**
 * Fetch and format news for users with specific keyword filters.
 */
async function handleNewsQuery(
  chatId: number,
  query: string,
  title: string,
  includeKeywords?: string[],
  excludeKeywords?: string[]
): Promise<void> {
  if (!bot) return;
  try {
    const { fetchYahooNewsDetailed } = await import("../services/newsService.js");
    let newsItems = await fetchYahooNewsDetailed(query, 25);

    if (includeKeywords && includeKeywords.length > 0) {
      newsItems = newsItems.filter((item) => {
        const text = item.title.toLowerCase();
        return includeKeywords.some((kw) => text.includes(kw.toLowerCase()));
      });
    }

    if (excludeKeywords && excludeKeywords.length > 0) {
      newsItems = newsItems.filter((item) => {
        const text = item.title.toLowerCase();
        return !excludeKeywords.some((kw) => text.includes(kw.toLowerCase()));
      });
    }

    newsItems = newsItems.slice(0, 5);

    if (newsItems.length === 0) {
      await bot.sendMessage(chatId, `❌ Tidak ada berita terbaru yang relevan ditemukan untuk: *${title}*`, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⬅️ Menu Berita", callback_data: "action_news_menu" },
              { text: "🏠 Menu Utama", callback_data: "action_menu_home" }
            ]
          ]
        }
      });
      return;
    }

    let ihsgHeader = "";
    if (query.includes("^JKSE")) {
      try {
        const { getIHSGQuote } = await import("../services/newsService.js");
        const quote = await getIHSGQuote();
        if (quote) {
          const sign = quote.changePct >= 0 ? "+" : "";
          ihsgHeader = `📊 *IHSG (Jakarta Composite Index) Realtime*\n💰 Price: Rp ${quote.price.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n📈 Change: ${sign}${quote.changePct.toFixed(2)}%\n\n${"─".repeat(25)}\n\n`;
        }
      } catch (err: any) {
        logger.warn(MODULE, `Failed to load real-time IHSG quote: ${err.message}`);
      }
    }

    let msg = ihsgHeader + `📰 *${title.toUpperCase()}*\n\n`;
    newsItems.forEach((item, index) => {
      const date = item.pubTime ? new Date(item.pubTime * 1000).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }) : "";
      const timeStr = date ? ` _(${date} WIB)_` : "";
      msg += `${index + 1}. *[${item.publisher}]* [${item.title}](${item.link})${timeStr}\n\n`;
    });

    await bot.sendMessage(chatId, msg, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⬅️ Menu Berita", callback_data: "action_news_menu" },
            { text: "🏠 Menu Utama", callback_data: "action_menu_home" }
          ]
        ]
      }
    });
  } catch (err: any) {
    await bot.sendMessage(chatId, `❌ Gagal mengambil berita: ${err.message}`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⬅️ Menu Berita", callback_data: "action_news_menu" }
          ]
        ]
      }
    });
  }
}

/**
 * Initialize the Telegram bot instance and configure interactive listeners.
 */
export function initBot(): void {
  if (!config.telegram.botToken) {
    logger.warn(MODULE, "Telegram bot token not configured. Messages will be logged only.");
    return;
  }

  bot = new TelegramBot(config.telegram.botToken, { polling: true });
  logger.info(MODULE, "✅ Telegram bot initialized with polling enabled.");

  // Gracefully handle polling network hiccups without crashing
  bot.on("polling_error", (error: any) => {
    logger.debug(MODULE, `Telegram polling notice: ${error.message}`);
  });

  // Set bot commands
  bot.setMyCommands([
    { command: "menu", description: "Tampilkan menu utama kontrol scanner" },
    { command: "cek", description: "Analisis emiten saham IDX (misal: /cek DEWA)" },
    { command: "modal", description: "Atur modal kerja (misal: /modal 10000000)" },
    { command: "start", description: "Mulai bot dan tampilkan menu" }
  ]).then(() => {
    logger.info(MODULE, "✅ Bot commands registered successfully.");
  }).catch((err: any) => {
    logger.error(MODULE, `Failed to set bot commands: ${err.message}`);
  });

  // Listener for /start and /menu
  bot.onText(/\/start|\/menu/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    await sendMainMenu(chatId);
  });

  // Listener for inline buttons
  bot.on("callback_query", async (callbackQuery: TelegramBot.CallbackQuery) => {
    const message = callbackQuery.message;
    if (!message) return;
    const chatId = message.chat.id;
    const data = callbackQuery.data;

    await bot?.answerCallbackQuery(callbackQuery.id).catch(() => {});

    const chatIdStr = String(chatId);

    if (data === "action_check_ticker") {
      waitingTickerInput.set(chatIdStr, Date.now());
      await safeSendMessage(chatId, TICKER_PROMPT_MSG, {
        parse_mode: "Markdown",
        reply_markup: { force_reply: true, selective: true },
      });
    } else if (data?.startsWith("action_recheck_")) {
      const code = data.replace("action_recheck_", "");
      await handleTickerAnalysis(chatId, code);
    } else if (data === "action_scan") {
      await bot?.sendMessage(chatId, "⏳ Memulai manual scan saham IDX...");
      try {
        const { triggerManualScanForUser } = await import("../scheduler/cronJobs.js");
        triggerManualScanForUser(chatIdStr);
      } catch (err: any) {
        await bot?.sendMessage(chatId, `❌ Gagal memicu scan: ${err.message}`);
      }
    } else if (data === "action_scan_bsjp") {
      await bot?.sendMessage(chatId, "⏳ Memulai scanning BSJP Sore di Next.js Dashboard...");
      try {
        await axios.post("http://localhost:3000/api/scan", {});
        const response = await axios.get("http://localhost:3000/api/scan");
        const messageText = formatBsjpMessage(response.data);
        await bot?.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
      } catch (err: any) {
        await bot?.sendMessage(chatId, `❌ Gagal scan BSJP: ${err.message || err}`);
      }
    } else if (data === "action_latest_bsjp") {
      await bot?.sendMessage(chatId, "⏳ Mengambil hasil scan BSJP terakhir...");
      try {
        const response = await axios.get("http://localhost:3000/api/scan");
        const messageText = formatBsjpMessage(response.data);
        await bot?.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
      } catch (err: any) {
        await bot?.sendMessage(chatId, `❌ Gagal mengambil data BSJP: ${err.message || err}`);
      }
    } else if (data === "action_status") {
      try {
        const { getTickerList } = await import("../services/signalService.js");
        const userConfig = getUserConfig(chatIdStr);
        const tickers = getTickerList();
        const statusMsg = `📊 *Status Sistem Anda*\n\n` +
          `💰 *Modal kerja Anda:* ${formatRupiah(userConfig.capital)}\n` +
          `🛡️ *Risk Per Trade:* ${(userConfig.riskPerTrade * 100).toFixed(0)}%\n` +
          `🛑 *Batas Stop Loss:* ${(userConfig.stopLossPct * 100).toFixed(0)}%\n` +
          `📈 *Jumlah Ticker:* ${tickers.length} saham\n` +
          `📬 *Maks. Sinyal/Hari:* ${config.signal.maxPerDay}`;
        await bot?.sendMessage(chatId, statusMsg, { parse_mode: "Markdown" });
      } catch (err: any) {
        await bot?.sendMessage(chatId, `❌ Gagal mengambil status: ${err.message}`);
      }
    } else if (data === "action_set_capital") {
      await bot?.sendMessage(chatId, "💰 *Ubah Modal Kerja*\nUntuk memperbarui modal kerja Anda, silakan ketik perintah berikut:\n\n`/modal <angka_modal>`\n\nContoh: `/modal 10000000` (untuk Rp 10.000.000)", {
        parse_mode: "Markdown"
      });
    } else if (data === "action_news_menu") {
      await sendNewsMenu(chatId);
    } else if (data === "action_menu_home") {
      await sendMainMenu(chatId);
    } else if (data === "action_news_latest") {
      await bot?.sendMessage(chatId, "⏳ Mengambil berita ekonomi terbaru...");
      await handleNewsQuery(
        chatId, 
        '"indonesia economy" OR "ekonomi indonesia"', 
        "Berita Ekonomi Terbaru",
        ["ekonomi", "economy", "rupiah", "gdp", "inflasi", "inflation", "growth", "bps", "saham", "bisnis", "trade", "ekspor", "impor", "investasi", "investment"],
        ["ihsg", "composite index", "jkse"]
      );
    } else if (data === "action_news_ihsg") {
      await bot?.sendMessage(chatId, "⏳ Mengambil berita tentang IHSG...");
      await handleNewsQuery(
        chatId, 
        '^JKSE OR "IHSG"', 
        "Indeks IHSG & Saham",
        ["ihsg", "jkse", "composite", "idx", "saham", "stock", "bursa", "bei"]
      );
    } else if (data === "action_news_gov") {
      await bot?.sendMessage(chatId, "⏳ Mengambil berita kebijakan pemerintah RI...");
      await handleNewsQuery(
        chatId, 
        '"regulasi" OR "kebijakan" OR "pemerintah" indonesia', 
        "Kebijakan Pemerintah RI",
        ["pemerintah", "kebijakan", "regulasi", "regulation", "policy", "uu", "aturan", "presiden", "jokowi", "prabowo", "menteri", "dpr"],
        ["ihsg", "saham", "stock", "idx", "bursa"]
      );
    } else if (data === "action_news_eco") {
      await bot?.sendMessage(chatId, "⏳ Mengambil berita kebijakan ekonomi...");
      await handleNewsQuery(
        chatId, 
        '"economic policy" OR "kebijakan ekonomi" OR "fiskal" OR "moneter" indonesia', 
        "Kebijakan Ekonomi",
        ["kebijakan", "policy", "fiskal", "moneter", "bunga", "rate", "bi", "bank indonesia", "sri mulyani", "kemenkeu", "pajak", "tax", "subsidi", "ekonomi"],
        ["saham", "stock", "ihsg"]
      );
    } else if (data === "action_news_idx") {
      await bot?.sendMessage(chatId, "⏳ Mengambil pengumuman resmi IDX...");
      await handleNewsQuery(
        chatId, 
        '"bursa efek indonesia" OR "pengumuman idx" OR "idx announcement"', 
        "Pengumuman Resmi IDX",
        ["idx", "bursa", "pengumuman", "announcement", "bei", "saham", "efek", "suspend", "delisting", "listing"],
        []
      );
    }
  });

  // Listener for changing capital: /modal <amount>
  bot.onText(/\/modal\s+(.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const chatIdStr = String(chatId);
    const valStr = match?.[1];
    if (!valStr) return;

    const newAmount = parseFloat(valStr.replace(/[^0-9.-]+/g, ""));
    if (isNaN(newAmount) || newAmount <= 0) {
      await bot?.sendMessage(chatId, "❌ Nominal modal tidak valid. Gunakan angka saja.");
      return;
    }

    // Save to userConfigs.json
    setUserConfig(chatIdStr, { capital: newAmount });
    await bot?.sendMessage(chatId, `✅ *Modal berhasil diperbarui!*\n💰 Modal baru Anda: ${formatRupiah(newAmount)} (Tersimpan ke profil Anda)`);
  });

  // Listener for /cek <ticker>
  bot.onText(/\/cek(?:\s+(.+))?/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const chatIdStr = String(chatId);
    const tickerInput = match?.[1]?.trim();

    if (!tickerInput) {
      waitingTickerInput.set(chatIdStr, Date.now());
      await safeSendMessage(chatId, TICKER_PROMPT_MSG, {
        parse_mode: "Markdown",
        reply_markup: { force_reply: true, selective: true },
      });
      return;
    }

    waitingTickerInput.delete(chatIdStr);
    await handleTickerAnalysis(chatId, tickerInput);
  });

  // Listener for general messages (text ticker input)
  bot.on("message", async (msg: TelegramBot.Message) => {
    if (!msg.text) return;
    if (msg.text.startsWith("/")) return; // Ignore commands handled by onText

    const chatId = msg.chat.id;
    const chatIdStr = String(chatId);
    const text = msg.text.trim();

    const isWaiting = waitingTickerInput.has(chatIdStr);
    const cleanLetters = text.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const isExact4Letters = cleanLetters.length === 4;

    // Trigger analysis if user was waiting or typed a standalone 4-letter stock code
    if (isWaiting || isExact4Letters) {
      waitingTickerInput.delete(chatIdStr);
      await handleTickerAnalysis(chatId, cleanLetters);
    }
  });
}

/**
 * Handle on-demand analysis for a single stock ticker.
 */
async function handleTickerAnalysis(chatId: number, rawInput: string): Promise<void> {
  const code = rawInput.trim().replace(/\.JK$/i, "").replace(/[^a-zA-Z]/g, "").toUpperCase();

  if (code.length !== 4) {
    await safeSendMessage(
      chatId,
      `❌ Format kode emiten *${rawInput}* tidak valid.\nKode saham IDX harus terdiri dari 4 huruf (contoh: \`DEWA\`, \`BBCA\`, \`GOTO\`, \`BBRI\`).`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔎 Coba Masukkan Lagi", callback_data: "action_check_ticker" }],
            [{ text: "🏠 Menu Utama", callback_data: "action_menu_home" }]
          ]
        }
      }
    );
    return;
  }

  await safeSendMessage(chatId, `⏳ Menganalisis emiten *${code}* (TradingView 1D+4H, BSJP & Berita)...`, {
    parse_mode: "Markdown"
  });

  try {
    const analysis = await analyzeSingleStock(code, String(chatId));
    const messageText = formatSingleStockMessage(analysis);

    await safeSendMessage(chatId, messageText, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: `🔄 Analisis Ulang ${code}`, callback_data: `action_recheck_${code}` },
            { text: "🔎 Cek Emiten Lain", callback_data: "action_check_ticker" }
          ],
          [
            { text: "🔍 Scan BSJP Sore", callback_data: "action_scan_bsjp" },
            { text: "🏠 Menu Utama", callback_data: "action_menu_home" }
          ]
        ]
      }
    });
  } catch (err: any) {
    logger.error(MODULE, `Failed to analyze ticker ${code}: ${err.message}`);
    await safeSendMessage(
      chatId,
      `❌ Gagal menganalisis emiten *${code}*:\n${err.message || "Data pasar tidak dapat diakses."}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔎 Coba Emiten Lain", callback_data: "action_check_ticker" }],
            [{ text: "🏠 Menu Utama", callback_data: "action_menu_home" }]
          ]
        }
      }
    );
  }
}

/**
 * Get remaining signals for a user today.
 */
export function getRemainingSignals(chatId: string): number {
  const state = getTodayState(chatId);
  return Math.max(0, config.signal.maxPerDay - state.buySignalsSent);
}

/**
 * Format a number as Indonesian Rupiah.
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a buy signal into a Telegram message personalized for a specific user config.
 */
export function formatBuyMessage(signal: BuySignal, userConfig: any): string {
  const timestamp = signal.timestamp.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const position = calculatePositionSize(
    signal.entry,
    userConfig.capital,
    userConfig.riskPerTrade,
    userConfig.stopLossPct,
    signal.fourHourAnalysis.atr
  );

  const rsiVal = signal.fourHourAnalysis.rsi.toFixed(1);
  const adxVal = signal.fourHourAnalysis.adx.toFixed(1);
  const tvRec = signal.fourHourAnalysis.recommendAll.toFixed(2);
  const slPct = (((signal.entry - position.stopLoss) / signal.entry) * 100).toFixed(2);
  const tpPct = (((position.takeProfit - signal.entry) / signal.entry) * 100).toFixed(2);

  let sentimentText = "";
  if (signal.newsSentiment && signal.newsSentiment.newsCount > 0) {
    sentimentText = `\n\n📰 *Sentimen Berita:* ${signal.newsSentiment.score > 0 ? "+" : ""}${signal.newsSentiment.score}/10\n└ ${signal.newsSentiment.summary}`;
  }

  return `📈 *SWING BUY SIGNAL*
 
🏷 *Stock:* \`${signal.ticker.replace(".JK", "")}\` (${signal.ticker})
⭐ *Score:* ${signal.score}/100
💰 *Entry:* ${formatRupiah(signal.entry)}
🕒 *Waktu Entry:* Pembukaan market terdekat (Sesi 1: 09:00 WIB / Sesi 2: 13:30 WIB)
🛑 *Stop Loss:* ${formatRupiah(position.stopLoss)} (-${slPct}%)
🎯 *Take Profit:* ${formatRupiah(position.takeProfit)} (+${tpPct}%)
📊 *Timeframe:* 4H + 1D
📈 *Trend 1D:* ✅ Bullish

🔬 *Konfirmasi Teknikal:*
├ TV Recommendation: ${tvRec}
├ RSI 4H: ${rsiVal} ✅
├ MACD: Bullish ✅
└ ADX: ${adxVal} (Trend Strength) ✅

📦 *Position Sizing:*
├ Modal: ${formatRupiah(userConfig.capital)}
├ Risk: ${formatRupiah(position.riskAmount)} (${(userConfig.riskPerTrade * 100).toFixed(0)}%)
├ Lot Size: ${position.lotSize} lot (${position.shares} lembar)
└ Position: ${formatRupiah(position.positionSize)}

📋 *Score Breakdown:*
├ TV Recommend: ${signal.breakdown.recommendScore}/100 (35%)
├ Trend: ${signal.breakdown.trendScore}/100 (20%)
├ Volume: ${signal.breakdown.volumeScore}/100 (15%)
├ ADX: ${signal.breakdown.adxScore}/100 (15%)
├ RSI: ${signal.breakdown.rsiScore}/100 (10%)
└ Sentiment: ${signal.breakdown.sentimentScore}/100 (5%)${sentimentText}

⏰ *Time:* ${timestamp} WIB

⚠️ _Disclaimer: Sinyal ini bukan saran investasi. Lakukan riset sendiri sebelum mengambil keputusan._`;
}

/**
 * Format an exit (sell) signal message.
 */
export function formatExitMessage(ticker: string, reason: string, currentPrice: number): string {
  const timestamp = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });

  return `🔴 *EXIT WARNING*

🏷 *Stock:* \`${ticker.replace(".JK", "")}\` (${ticker})
💰 *Current Price:* ${formatRupiah(currentPrice)}
⚠️ *Reason:* ${reason}

Disarankan untuk melepas posisi atau memindahkan Stop Loss (Trailing Stop) untuk melindungi modal.

⏰ *Time:* ${timestamp} WIB`;
}

/**
 * Format a daily summary header message.
 */
export function formatSummaryHeader(signalCount: number): string {
  const date = new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `🔔 *AI STOCK SIGNAL SCANNER*
📅 ${date}
📊 Total sinyal baru: ${signalCount}

${"─".repeat(30)}`;
}

/**
 * Send a single buy signal to a specific user and track it in their positions.
 */
export async function sendSignal(chatId: string, signal: BuySignal): Promise<boolean> {
  const userConfig = getUserConfig(chatId);
  const remaining = getRemainingSignals(chatId);
  if (remaining <= 0) {
    logger.warn(MODULE, `Daily signal limit reached for user ${chatId} (${config.signal.maxPerDay}). Skipping ${signal.ticker}.`);
    return false;
  }

  const message = formatBuyMessage(signal, userConfig);

  if (!bot) {
    logger.info(MODULE, `📩 [DRY RUN] Would send signal to user ${chatId}:`);
    console.log(message);
    incrementBuyCounter(chatId);
    return true;
  }

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
    incrementBuyCounter(chatId);
    const state = getTodayState(chatId);
    
    // Add position tracking specifically for this user
    const position = calculatePositionSize(
      signal.entry,
      userConfig.capital,
      userConfig.riskPerTrade,
      userConfig.stopLossPct,
      signal.fourHourAnalysis.atr
    );
    addWatchlistPosition(chatId, signal.ticker, signal.entry, position.stopLoss, position.takeProfit, signal.score);

    logger.info(MODULE, `📩 Signal sent to user ${chatId} for ${signal.ticker} (${state.buySignalsSent}/${config.signal.maxPerDay} today)`);
    return true;
  } catch (error: any) {
    logger.error(MODULE, `Failed to send signal to user ${chatId} for ${signal.ticker}: ${error.message}`);
    return false;
  }
}

/**
 * Send an exit signal to a specific user.
 */
export async function sendExitSignal(chatId: string, ticker: string, reason: string, currentPrice: number): Promise<boolean> {
  const message = formatExitMessage(ticker, reason, currentPrice);

  if (!bot) {
    logger.info(MODULE, `📩 [DRY RUN] Would send EXIT signal to user ${chatId}:`);
    console.log(message);
    return true;
  }

  try {
    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    logger.info(MODULE, `📩 EXIT Signal sent to user ${chatId} for ${ticker}`);
    return true;
  } catch (error: any) {
    logger.error(MODULE, `Failed to send EXIT signal to user ${chatId} for ${ticker}: ${error.message}`);
    return false;
  }
}

/**
 * Send a batch of new buy signals to a specific user.
 */
export async function sendDailySummary(chatId: string, signals: BuySignal[]): Promise<void> {
  if (signals.length === 0) {
    logger.info(MODULE, `No new signals to send to user ${chatId}.`);
    return;
  }

  const remaining = getRemainingSignals(chatId);
  const sendableSignals = signals.slice(0, remaining);

  if (sendableSignals.length === 0) {
    logger.warn(MODULE, `Daily limit already hit for user ${chatId}. Ignoring batch.`);
    return;
  }

  // Send header
  const header = formatSummaryHeader(sendableSignals.length);
  if (bot) {
    try {
      await bot.sendMessage(chatId, header, { parse_mode: "Markdown" });
    } catch (error: any) {
      logger.error(MODULE, `Failed to send header to user ${chatId}: ${error.message}`);
    }
  } else {
    console.log(header);
  }

  // Send each signal with a small delay
  for (const signal of sendableSignals) {
    await sendSignal(chatId, signal);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  logger.info(MODULE, `✅ Batch sending complete for user ${chatId}. Sent ${sendableSignals.length} signal(s).`);
}

/**
 * Send a custom text message to a specific user or broadcast to all registered users.
 */
export async function sendMessage(text: string, chatId?: string): Promise<void> {
  if (!bot) {
    logger.info(MODULE, `📩 [DRY RUN] ${text}`);
    return;
  }

  if (chatId) {
    try {
      await bot.sendMessage(chatId, text, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    } catch (error: any) {
      logger.error(MODULE, `Failed to send message to user ${chatId}: ${error.message}`);
    }
  } else {
    const users = getRegisteredUsers();
    for (const userId of users) {
      try {
        await bot.sendMessage(userId, text, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        });
      } catch (error: any) {
        logger.error(MODULE, `Failed to broadcast message to user ${userId}: ${error.message}`);
      }
    }
  }
}

export default {
  initBot,
  getRemainingSignals,
  formatBuyMessage,
  formatExitMessage,
  sendSignal,
  sendExitSignal,
  sendDailySummary,
  sendMessage,
};
