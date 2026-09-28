/**
 * Daily State Service (Multi-User)
 *
 * Manages user configurations, registries, and trading states
 * (buy signal counters, watchlists, active positions) keyed by Telegram chatId.
 */

import fs from "fs";
import path from "path";
import config from "../config/index.js";
import logger from "../utils/logger.js";

const MODULE = "DailyStateService";
const REGISTRY_FILE_PATH = path.resolve(process.cwd(), "userRegistry.json");
const CONFIGS_FILE_PATH = path.resolve(process.cwd(), "userConfigs.json");
const STATE_FILE_PATH = path.resolve(process.cwd(), "dailyState.json");
const POSITIONS_FILE_PATH = path.resolve(process.cwd(), "positions.json");

export interface WatchlistPosition {
  ticker: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  score: number;
  addedAt: string; // ISO timestamp
  status: "active" | "hit_sl" | "hit_tp" | "exited";
  closedAt?: string; // ISO timestamp when closed
  closeReason?: string;
  daysSinceEntry?: number; // auto-calculated
}

export interface UserDailyState {
  buySignalsSent: number;
  watchlist: string[];
  closedPositions: WatchlistPosition[];
}

export interface GlobalDailyState {
  date: string; // Format: YYYY-MM-DD
  users: {
    [chatId: string]: UserDailyState;
  };
}

export interface UserPositions {
  activePositions: WatchlistPosition[];
  closedHistory: WatchlistPosition[];
}

export interface GlobalPositions {
  users: {
    [chatId: string]: UserPositions;
  };
}

export interface UserConfig {
  capital: number;
  riskPerTrade: number;
  stopLossPct: number;
}

// ─── HELPER TIMEZONE FUNCTIONS ──────────────────────────────────────────────

function getTodayDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

// ─── USER REGISTRY ──────────────────────────────────────────────────────────

export function getRegisteredUsers(): string[] {
  try {
    if (fs.existsSync(REGISTRY_FILE_PATH)) {
      const raw = fs.readFileSync(REGISTRY_FILE_PATH, "utf-8");
      return JSON.parse(raw) as string[];
    }
  } catch (error: any) {
    logger.error(MODULE, `Failed to load user registry: ${error.message}`);
  }
  return [];
}

export function registerUser(chatId: string): void {
  const users = getRegisteredUsers();
  if (!users.includes(chatId)) {
    users.push(chatId);
    try {
      fs.writeFileSync(REGISTRY_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
      logger.info(MODULE, `Registered new user: ${chatId}`);
    } catch (error: any) {
      logger.error(MODULE, `Failed to save user registry: ${error.message}`);
    }
  }
}

// ─── USER CONFIGS ───────────────────────────────────────────────────────────

export function getUserConfig(chatId: string): UserConfig {
  try {
    if (fs.existsSync(CONFIGS_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIGS_FILE_PATH, "utf-8");
      const allConfigs = JSON.parse(raw);
      if (allConfigs[chatId]) {
        return {
          capital: allConfigs[chatId].capital ?? config.capital.amount,
          riskPerTrade: allConfigs[chatId].riskPerTrade ?? config.capital.riskPerTrade,
          stopLossPct: allConfigs[chatId].stopLossPct ?? config.capital.stopLossPct,
        };
      }
    }
  } catch (error: any) {
    logger.error(MODULE, `Failed to load user configs: ${error.message}`);
  }
  // Return global config default if not found
  return {
    capital: config.capital.amount,
    riskPerTrade: config.capital.riskPerTrade,
    stopLossPct: config.capital.stopLossPct,
  };
}

export function setUserConfig(chatId: string, updates: Partial<UserConfig>): void {
  try {
    let allConfigs: { [chatId: string]: UserConfig } = {};
    if (fs.existsSync(CONFIGS_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIGS_FILE_PATH, "utf-8");
      allConfigs = JSON.parse(raw);
    }
    const current = allConfigs[chatId] || getUserConfig(chatId);
    allConfigs[chatId] = {
      capital: updates.capital ?? current.capital,
      riskPerTrade: updates.riskPerTrade ?? current.riskPerTrade,
      stopLossPct: updates.stopLossPct ?? current.stopLossPct,
    };
    fs.writeFileSync(CONFIGS_FILE_PATH, JSON.stringify(allConfigs, null, 2), "utf-8");
    logger.info(MODULE, `Updated config for user ${chatId}`);
  } catch (error: any) {
    logger.error(MODULE, `Failed to save user config: ${error.message}`);
  }
}

// ─── STATE MANAGEMENT ───────────────────────────────────────────────────────

function loadGlobalState(): GlobalDailyState {
  const today = getTodayDateString();
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      const state = JSON.parse(raw) as GlobalDailyState;
      if (state.date === today) {
        if (!state.users) state.users = {};
        return state;
      }
    }
  } catch (error: any) {
    logger.error(MODULE, `Error reading daily state: ${error.message}`);
  }
  
  // Date changed or file doesn't exist, create clean state
  const newState: GlobalDailyState = {
    date: today,
    users: {},
  };
  saveGlobalState(newState);
  return newState;
}

function saveGlobalState(state: GlobalDailyState): void {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error: any) {
    logger.error(MODULE, `Failed to save daily state: ${error.message}`);
  }
}

export function getTodayState(chatId: string): UserDailyState {
  const globalState = loadGlobalState();
  if (!globalState.users[chatId]) {
    // Populate with default empty state for this user
    // Carry over active positions from positions.json
    const userPos = loadUserPositions(chatId);
    globalState.users[chatId] = {
      buySignalsSent: 0,
      watchlist: userPos.activePositions.map((p) => p.ticker),
      closedPositions: [],
    };
    saveGlobalState(globalState);
  }
  return globalState.users[chatId];
}

export function incrementBuyCounter(chatId: string): void {
  const globalState = loadGlobalState();
  if (!globalState.users[chatId]) {
    getTodayState(chatId); // initialize
    return incrementBuyCounter(chatId);
  }
  globalState.users[chatId].buySignalsSent += 1;
  saveGlobalState(globalState);
  logger.debug(MODULE, `Buy counter incremented for user ${chatId} to: ${globalState.users[chatId].buySignalsSent}`);
}

export function addWatchlistStock(chatId: string, ticker: string): void {
  const globalState = loadGlobalState();
  if (!globalState.users[chatId]) {
    getTodayState(chatId);
    return addWatchlistStock(chatId, ticker);
  }
  if (!globalState.users[chatId].watchlist.includes(ticker)) {
    globalState.users[chatId].watchlist.push(ticker);
    saveGlobalState(globalState);
    logger.debug(MODULE, `Added ${ticker} to watchlist of user ${chatId}.`);
  }
}

export function removeWatchlistStock(chatId: string, ticker: string): void {
  const globalState = loadGlobalState();
  if (globalState.users[chatId]) {
    globalState.users[chatId].watchlist = globalState.users[chatId].watchlist.filter((t) => t !== ticker);
    saveGlobalState(globalState);
    logger.debug(MODULE, `Removed ${ticker} from watchlist of user ${chatId}.`);
  }
}

// ─── POSITIONS MANAGEMENT ───────────────────────────────────────────────────

function loadGlobalPositions(): GlobalPositions {
  try {
    if (fs.existsSync(POSITIONS_FILE_PATH)) {
      const raw = fs.readFileSync(POSITIONS_FILE_PATH, "utf-8");
      const data = JSON.parse(raw) as GlobalPositions;
      if (!data.users) data.users = {};
      return data;
    }
  } catch (error: any) {
    logger.error(MODULE, `Error reading global positions: ${error.message}`);
  }
  return { users: {} };
}

function saveGlobalPositions(data: GlobalPositions): void {
  try {
    fs.writeFileSync(POSITIONS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error: any) {
    logger.error(MODULE, `Failed to save global positions: ${error.message}`);
  }
}

export function loadUserPositions(chatId: string): UserPositions {
  const globalPos = loadGlobalPositions();
  if (!globalPos.users[chatId]) {
    globalPos.users[chatId] = { activePositions: [], closedHistory: [] };
    saveGlobalPositions(globalPos);
  }
  
  const userPos = globalPos.users[chatId];
  const now = new Date();
  for (const pos of userPos.activePositions) {
    const addedDate = new Date(pos.addedAt);
    pos.daysSinceEntry = Math.floor((now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return userPos;
}

export function getActivePositions(chatId: string): WatchlistPosition[] {
  const userPos = loadUserPositions(chatId);
  return userPos.activePositions.filter((p) => p.status === "active");
}

export function addWatchlistPosition(
  chatId: string,
  ticker: string,
  entry: number,
  stopLoss: number,
  takeProfit: number,
  score: number
): void {
  const globalPos = loadGlobalPositions();
  if (!globalPos.users[chatId]) {
    globalPos.users[chatId] = { activePositions: [], closedHistory: [] };
  }
  const userPos = globalPos.users[chatId];
  
  // Don't add if already closed today
  const today = getTodayDateString();
  if (userPos.closedHistory.some((p) => p.ticker === ticker && p.closedAt?.startsWith(today))) {
    logger.debug(MODULE, `${ticker} already closed recently for user ${chatId}. Not re-adding.`);
    return;
  }
  
  // Don't add if already active
  if (userPos.activePositions.some((p) => p.ticker === ticker)) {
    logger.debug(MODULE, `${ticker} already in active positions for user ${chatId}.`);
    return;
  }

  const position: WatchlistPosition = {
    ticker,
    entry,
    stopLoss,
    takeProfit,
    score,
    addedAt: new Date().toISOString(),
    status: "active",
    daysSinceEntry: 0,
  };
  
  userPos.activePositions.push(position);
  saveGlobalPositions(globalPos);

  // Sync daily state watchlist
  addWatchlistStock(chatId, ticker);
  logger.info(MODULE, `[User ${chatId}] Added position: ${ticker} (Entry: ${entry}, SL: ${stopLoss}, TP: ${takeProfit})`);
}

export function closePosition(chatId: string, ticker: string, reason: "hit_sl" | "hit_tp" | "exited"): void {
  const globalPos = loadGlobalPositions();
  const userPos = globalPos.users[chatId];
  if (!userPos) return;

  const posIndex = userPos.activePositions.findIndex((p) => p.ticker === ticker && p.status === "active");
  if (posIndex >= 0) {
    const pos = userPos.activePositions[posIndex];
    pos.status = reason;
    pos.closedAt = new Date().toISOString();
    pos.closeReason = reason;
    userPos.closedHistory.push(pos);
    userPos.activePositions.splice(posIndex, 1);
    
    saveGlobalPositions(globalPos);

    // Sync daily state closed list and remove from watchlist
    removeWatchlistStock(chatId, ticker);
    const globalState = loadGlobalState();
    if (globalState.users[chatId]) {
      if (!globalState.users[chatId].closedPositions.some((p) => p.ticker === ticker)) {
        globalState.users[chatId].closedPositions.push(pos);
        saveGlobalState(globalState);
      }
    }
    logger.info(MODULE, `[User ${chatId}] Closed position: ${ticker} (Reason: ${reason})`);
  }
}

export function isPositionClosed(chatId: string, ticker: string): boolean {
  const userPos = loadUserPositions(chatId);
  return userPos.closedHistory.some((p) => p.ticker === ticker);
}

export function getWatchlist(chatId: string): string[] {
  return getTodayState(chatId).watchlist;
}

// ─── DAILY RESET ────────────────────────────────────────────────────────────

export function resetDailyState(): void {
  const globalState = loadGlobalState();
  const today = getTodayDateString();
  
  // Re-initialize daily state
  globalState.date = today;
  
  // Reset daily counters but preserve watchlists from active positions
  const users = getRegisteredUsers();
  for (const chatId of users) {
    const userPos = loadUserPositions(chatId);
    const activeTickerList = userPos.activePositions.filter((p) => p.status === "active").map((p) => p.ticker);
    globalState.users[chatId] = {
      buySignalsSent: 0,
      watchlist: activeTickerList,
      closedPositions: [],
    };
  }
  
  saveGlobalState(globalState);
  logger.info(MODULE, `[${today}] Daily reset completed for all registered users.`);
}

export default {
  getRegisteredUsers,
  registerUser,
  getUserConfig,
  setUserConfig,
  getTodayState,
  incrementBuyCounter,
  addWatchlistStock,
  addWatchlistPosition,
  getActivePositions,
  closePosition,
  isPositionClosed,
  getWatchlist,
  removeWatchlistStock,
  resetDailyState,
};
