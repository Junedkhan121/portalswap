/**
 * Wallet Management Module
 * Handles wallet creation, import, and session storage
 */

import { ethers } from 'ethers';
import { getAddressInfo } from './ss58.js';

// In-memory session storage (replace with Redis/database in production)
const userSessions = new Map();

/**
 * Create a new EVM wallet
 *
 * @param {number} userId - Telegram user ID
 * @returns {object} Wallet details with EVM and SS58 addresses
 */
export function createWallet(userId) {
  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();

  // Store in session
  userSessions.set(userId, {
    privateKey: wallet.privateKey,
    address: wallet.address,
    createdAt: Date.now()
  });

  const addressInfo = getAddressInfo(wallet.address);

  return {
    privateKey: wallet.privateKey,
    evmAddress: wallet.address,
    ss58Address: addressInfo.ss58,
    mnemonic: wallet.mnemonic?.phrase || null,
    displayText: addressInfo.displayText + `\n\n` +
      `🔐 Private Key:\n<code>${wallet.privateKey}</code>\n\n` +
      `⚠️ SAVE THIS PRIVATE KEY SECURELY!\n` +
      `Never share it with anyone. This bot does not store it permanently.`
  };
}

/**
 * Import existing wallet from private key
 *
 * @param {number} userId - Telegram user ID
 * @param {string} privateKey - Private key (with or without 0x prefix)
 * @returns {object} Wallet details or error
 */
export function importWallet(userId, privateKey) {
  try {
    // Normalize private key
    const cleanKey = privateKey.trim().startsWith('0x')
      ? privateKey.trim()
      : '0x' + privateKey.trim();

    // Validate and create wallet
    const wallet = new ethers.Wallet(cleanKey);

    // Store in session
    userSessions.set(userId, {
      privateKey: wallet.privateKey,
      address: wallet.address,
      importedAt: Date.now()
    });

    const addressInfo = getAddressInfo(wallet.address);

    return {
      success: true,
      evmAddress: wallet.address,
      ss58Address: addressInfo.ss58,
      displayText: `✅ Wallet imported successfully!\n\n` + addressInfo.displayText
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid private key. Please check and try again.'
    };
  }
}

/**
 * Get wallet from session
 *
 * @param {number} userId - Telegram user ID
 * @returns {object|null} Wallet session or null
 */
export function getWalletSession(userId) {
  return userSessions.get(userId) || null;
}

/**
 * Check if user has active session
 *
 * @param {number} userId - Telegram user ID
 * @returns {boolean}
 */
export function hasActiveSession(userId) {
  return userSessions.has(userId);
}

/**
 * Clear user session (logout)
 *
 * @param {number} userId - Telegram user ID
 */
export function clearSession(userId) {
  userSessions.delete(userId);
}

/**
 * Get wallet instance for signing transactions
 *
 * @param {number} userId - Telegram user ID
 * @param {ethers.Provider} provider - Ethers provider
 * @returns {ethers.Wallet|null}
 */
export function getWalletSigner(userId, provider) {
  const session = getWalletSession(userId);
  if (!session) return null;

  return new ethers.Wallet(session.privateKey, provider);
}
