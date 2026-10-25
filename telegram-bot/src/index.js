/**
 * Main Bot Entry Point
 * PortalSwap Telegram Bot with SS58 Address Mapping
 */

import { Telegraf } from 'telegraf';
import 'dotenv/config';

// Utils
import { createWallet, importWallet, hasActiveSession, getWalletSession } from './utils/wallet.js';
import { getAddressInfo } from './utils/ss58.js';

// Keyboards
import { getInitialMenu, getMainMenu, getBackButton } from './keyboards/index.js';

// Handlers
import { handleBalance } from './handlers/balance.js';
import {
  handleSwapStart,
  handleTokenSelection,
  handleSwapAmountInput,
  handleSwapConfirm,
  isInSwapFlow
} from './handlers/swap.js';
import {
  handleStakeMenu,
  handleStakeInfo,
  handleStakeDeposit,
  handleStakeWithdraw,
  handleStakeAmountInput,
  handleStakeDepositConfirm,
  handleStakeWithdrawConfirm,
  handleStakeClaimRewards,
  isInStakingFlow
} from './handlers/staking.js';

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.', getBackButton()).catch(() => {});
});

/**
 * /start command - Entry point
 */
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const firstName = ctx.from.first_name || 'there';

  if (hasActiveSession(userId)) {
    // User already has wallet
    await ctx.reply(
      `👋 Welcome back, ${firstName}!\n\n` +
      `Your wallet is already loaded. What would you like to do?`,
      getMainMenu()
    );
  } else {
    // New user
    await ctx.reply(
      `👋 Welcome to <b>PortalSwap Bot</b>, ${firstName}!\n\n` +
      `🔷 Trade on Portaldot V3 Testnet directly from Telegram.\n\n` +
      `To get started, create a new wallet or import an existing one:`,
      {
        parse_mode: 'HTML',
        ...getInitialMenu()
      }
    );
  }
});

/**
 * Create Wallet
 */
bot.action('wallet_create', async (ctx) => {
  await ctx.answerCbQuery();

  const userId = ctx.from.id;
  const walletInfo = createWallet(userId);

  await ctx.editMessageText(
    `✅ <b>Wallet Created!</b>\n\n${walletInfo.displayText}`,
    { parse_mode: 'HTML' }
  );

  // Show main menu after a delay
  setTimeout(async () => {
    await ctx.reply(
      '🎉 Setup complete! Here\'s your main menu:',
      getMainMenu()
    );
  }, 1000);
});

/**
 * Import Wallet - Start flow
 */
bot.action('wallet_import', async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    '📥 <b>Import Wallet</b>\n\n' +
    'Please send your private key (with or without 0x prefix).\n\n' +
    '⚠️ Only send this in a private chat! Never share your private key publicly.',
    { parse_mode: 'HTML' }
  );
});

/**
 * Main Menu
 */
bot.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    '🏠 <b>Main Menu</b>\n\nSelect an action:',
    {
      parse_mode: 'HTML',
      ...getMainMenu()
    }
  );
});

/**
 * Balance Check
 */
bot.action('balance', handleBalance);

/**
 * Swap Flow
 */
bot.action('swap', handleSwapStart);
bot.action(/^token_(from|to)_/, handleTokenSelection);
bot.action('confirm_swap', handleSwapConfirm);

/**
 * Staking Flow
 */
bot.action('stake', handleStakeMenu);
bot.action('stake_info', handleStakeInfo);
bot.action('stake_deposit', handleStakeDeposit);
bot.action('stake_withdraw', handleStakeWithdraw);
bot.action('stake_claim', handleStakeClaimRewards);
bot.action('confirm_stake_deposit', handleStakeDepositConfirm);
bot.action('confirm_stake_withdraw', handleStakeWithdrawConfirm);

/**
 * Show Keys
 */
bot.action('show_keys', async (ctx) => {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);

  if (!session) {
    return ctx.reply('⚠️ No wallet found.', getBackButton());
  }

  await ctx.answerCbQuery();

  const addressInfo = getAddressInfo(session.address);

  await ctx.reply(
    addressInfo.displayText + `\n\n` +
    `🔐 Private Key:\n<code>${session.privateKey}</code>\n\n` +
    `⚠️ Keep this safe and never share it!`,
    {
      parse_mode: 'HTML',
      ...getBackButton()
    }
  );
});

/**
 * Help
 */
bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();

  const helpText =
    `ℹ️ <b>PortalSwap Bot Help</b>\n\n` +
    `<b>Features:</b>\n` +
    `• Swap tokens on Portaldot V3 testnet\n` +
    `• Stake tPOT for rewards\n` +
    `• Check balances and portfolio\n\n` +
    `<b>Addresses:</b>\n` +
    `• EVM (0x...): For contract interactions\n` +
    `• SS58 (5...): For receiving testnet gas\n\n` +
    `<b>Security:</b>\n` +
    `• Your keys are stored in-session only\n` +
    `• Always verify transaction details\n` +
    `• This is testnet — use test funds only\n\n` +
    `🌐 App: portalswap.live\n` +
    `📘 GitHub: github.com/Junedkhan121/PortalSwap`;

  await ctx.editMessageText(helpText, {
    parse_mode: 'HTML',
    ...getBackButton()
  });
});

/**
 * Text Message Handler
 * Handles private key import and amount inputs
 */
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  // Check if user is importing wallet (no active session + looks like private key)
  if (!hasActiveSession(userId) && (text.startsWith('0x') || text.length === 64 || text.length === 66)) {
    const result = importWallet(userId, text);

    if (result.success) {
      await ctx.reply(result.displayText, { parse_mode: 'HTML' });
      setTimeout(async () => {
        await ctx.reply('🎉 Setup complete! Here\'s your main menu:', getMainMenu());
      }, 1000);
    } else {
      await ctx.reply(`❌ ${result.error}\n\nPlease try again.`);
    }
    return;
  }

  // Check if user is in swap flow
  if (isInSwapFlow(userId)) {
    await handleSwapAmountInput(ctx);
    return;
  }

  // Check if user is in staking flow
  if (isInStakingFlow(userId)) {
    await handleStakeAmountInput(ctx);
    return;
  }

  // Default: show main menu or initial menu
  if (hasActiveSession(userId)) {
    await ctx.reply(
      'Please use the menu buttons to navigate.',
      getMainMenu()
    );
  } else {
    await ctx.reply(
      'Please create or import a wallet first.',
      getInitialMenu()
    );
  }
});

/**
 * Launch bot
 */
console.log('🤖 Starting PortalSwap Telegram Bot...');
console.log('📡 Network: Portaldot V3 Testnet');
console.log('⚡ Chain ID:', process.env.CHAIN_ID);
console.log('🔗 RPC:', process.env.RPC_URL);

bot.launch()
  .then(() => {
    console.log('✅ Bot is running!');
    console.log('💬 Send /start to begin');
  })
  .catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('\n🛑 SIGINT received, stopping bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, stopping bot...');
  bot.stop('SIGTERM');
});
