/**
 * Keyboard Layouts for Bot Navigation
 */

import { Markup } from 'telegraf';

/**
 * Initial menu - wallet setup
 */
export const getInitialMenu = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🆕 Create New Wallet', 'wallet_create'),
      Markup.button.callback('📥 Import Wallet', 'wallet_import')
    ]
  ]);
};

/**
 * Main DEX menu - authenticated users
 */
export const getMainMenu = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('💰 Check Balance', 'balance'),
    ],
    [
      Markup.button.callback('🔄 Swap Tokens', 'swap'),
      Markup.button.callback('⚡ Stake tPOT', 'stake')
    ],
    [
      Markup.button.callback('📊 Portfolio', 'portfolio'),
      Markup.button.callback('🚰 Faucet', 'faucet')
    ],
    [
      Markup.button.callback('ℹ️ Help', 'help'),
      Markup.button.callback('🔑 Show Keys', 'show_keys')
    ]
  ]);
};

/**
 * Token selection keyboard for swap
 */
export const getTokenSelectionKeyboard = (context = 'from') => {
  const label = context === 'from' ? 'Swap FROM' : 'Swap TO';
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${label}: tPOTv3 (Native)`, `token_${context}_native`)],
    [Markup.button.callback(`${label}: pUSDT`, `token_${context}_pusdt`)],
    [Markup.button.callback(`${label}: pDAI`, `token_${context}_pdai`)],
    [Markup.button.callback(`${label}: pWBTC`, `token_${context}_pwbtc`)],
    [Markup.button.callback(`${label}: pLINK`, `token_${context}_plink`)],
    [Markup.button.callback('« Back', 'main_menu')]
  ]);
};

/**
 * Confirmation keyboard
 */
export const getConfirmationKeyboard = (action) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Confirm', `confirm_${action}`),
      Markup.button.callback('❌ Cancel', 'main_menu')
    ]
  ]);
};

/**
 * Back to main menu button
 */
export const getBackButton = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('« Back to Main Menu', 'main_menu')]
  ]);
};

/**
 * Staking action keyboard
 */
export const getStakingMenu = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Stake tPOT', 'stake_deposit'),
      Markup.button.callback('➖ Unstake', 'stake_withdraw')
    ],
    [
      Markup.button.callback('🎁 Claim Rewards', 'stake_claim'),
      Markup.button.callback('📊 My Stake', 'stake_info')
    ],
    [Markup.button.callback('« Back', 'main_menu')]
  ]);
};
