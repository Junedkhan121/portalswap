/**
 * Swap Handler
 * Multi-step conversational swap flow
 */

import { ethers } from 'ethers';
import { getWalletSession, getWalletSigner } from '../utils/wallet.js';
import {
  getProvider,
  getRouterContract,
  getTokenContract,
  CONTRACTS,
  parseTokenAmount,
  formatTokenAmount
} from '../utils/contracts.js';
import { getTokenSelectionKeyboard, getConfirmationKeyboard, getBackButton } from '../keyboards/index.js';

// Swap session storage (in production: use database)
const swapSessions = new Map();

/**
 * Initialize swap flow
 */
export async function handleSwapStart(ctx) {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);

  if (!session) {
    return ctx.reply('⚠️ No wallet found. Please create or import a wallet first.', getBackButton());
  }

  await ctx.answerCbQuery();

  // Initialize swap session
  swapSessions.set(userId, {
    step: 'select_from',
    fromToken: null,
    toToken: null,
    amount: null
  });

  await ctx.reply(
    '🔄 <b>Token Swap</b>\n\nStep 1/3: Select the token you want to swap FROM:',
    {
      parse_mode: 'HTML',
      ...getTokenSelectionKeyboard('from')
    }
  );
}

/**
 * Handle token selection
 */
export async function handleTokenSelection(ctx) {
  const userId = ctx.from.id;
  const swapSession = swapSessions.get(userId);

  if (!swapSession) {
    return ctx.reply('⚠️ Swap session expired. Please start again.', getBackButton());
  }

  await ctx.answerCbQuery();

  const callbackData = ctx.callbackQuery.data;
  const [, context, token] = callbackData.split('_'); // token_from_pusdt => ["token", "from", "pusdt"]

  // Map token identifiers
  const tokenMap = {
    native: { symbol: 'tPOTv3', address: 'native', decimals: 18 },
    pusdt: { symbol: 'pUSDT', address: CONTRACTS.TOKENS.pUSDT, decimals: 6 },
    pdai: { symbol: 'pDAI', address: CONTRACTS.TOKENS.pDAI, decimals: 18 },
    pwbtc: { symbol: 'pWBTC', address: CONTRACTS.TOKENS.pWBTC, decimals: 8 },
    plink: { symbol: 'pLINK', address: CONTRACTS.TOKENS.pLINK, decimals: 18 }
  };

  if (context === 'from') {
    swapSession.fromToken = tokenMap[token];
    swapSession.step = 'select_to';

    await ctx.editMessageText(
      `🔄 <b>Token Swap</b>\n\n` +
      `FROM: ${swapSession.fromToken.symbol}\n\n` +
      `Step 2/3: Select the token you want to swap TO:`,
      {
        parse_mode: 'HTML',
        ...getTokenSelectionKeyboard('to')
      }
    );
  } else if (context === 'to') {
    const selectedToken = tokenMap[token];

    // Prevent same token swap
    if (selectedToken.address === swapSession.fromToken.address) {
      return ctx.answerCbQuery('⚠️ Cannot swap the same token', { show_alert: true });
    }

    swapSession.toToken = selectedToken;
    swapSession.step = 'enter_amount';
    swapSessions.set(userId, swapSession);

    await ctx.editMessageText(
      `🔄 <b>Token Swap</b>\n\n` +
      `FROM: ${swapSession.fromToken.symbol}\n` +
      `TO: ${swapSession.toToken.symbol}\n\n` +
      `Step 3/3: Enter the amount of ${swapSession.fromToken.symbol} you want to swap:`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );
  }
}

/**
 * Handle amount input (text message)
 */
export async function handleSwapAmountInput(ctx) {
  const userId = ctx.from.id;
  const swapSession = swapSessions.get(userId);

  if (!swapSession || swapSession.step !== 'enter_amount') {
    return; // Not in swap flow
  }

  const amountText = ctx.message.text.trim();
  const amount = parseFloat(amountText);

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('⚠️ Invalid amount. Please enter a valid number greater than 0.');
  }

  try {
    await ctx.reply('⏳ Calculating swap preview...');

    const provider = getProvider();
    const router = getRouterContract(provider);

    // Build path
    const path = [];
    if (swapSession.fromToken.address === 'native') {
      path.push(CONTRACTS.WPOT);
    } else {
      path.push(swapSession.fromToken.address);
    }

    if (swapSession.toToken.address === 'native') {
      path.push(CONTRACTS.WPOT);
    } else {
      path.push(swapSession.toToken.address);
    }

    // Get amounts out
    const amountIn = parseTokenAmount(amount, swapSession.fromToken.decimals);
    const amountsOut = await router.getAmountsOut(amountIn, path);
    const amountOut = amountsOut[amountsOut.length - 1];
    const formattedOut = formatTokenAmount(amountOut, swapSession.toToken.decimals);

    // Calculate price impact (simplified)
    const priceImpact = 0.3; // 0.3% fee

    swapSession.amount = amount;
    swapSession.amountOut = formattedOut;
    swapSession.path = path;
    swapSession.step = 'confirm';
    swapSessions.set(userId, swapSession);

    const confirmText =
      `🔄 <b>Confirm Swap</b>\n\n` +
      `You pay: ${amount} ${swapSession.fromToken.symbol}\n` +
      `You receive (est.): ${parseFloat(formattedOut).toFixed(6)} ${swapSession.toToken.symbol}\n\n` +
      `Fee: 0.3%\n` +
      `Price Impact: ~${priceImpact}%\n\n` +
      `⚠️ This will execute on Portaldot V3 Testnet.`;

    await ctx.reply(confirmText, {
      parse_mode: 'HTML',
      ...getConfirmationKeyboard('swap')
    });

  } catch (error) {
    console.error('Swap preview error:', error);
    await ctx.reply('❌ Failed to calculate swap. Insufficient liquidity or invalid pair.', getBackButton());
    swapSessions.delete(userId);
  }
}

/**
 * Execute swap
 */
export async function handleSwapConfirm(ctx) {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);
  const swapSession = swapSessions.get(userId);

  if (!swapSession || swapSession.step !== 'confirm') {
    return ctx.answerCbQuery('⚠️ Swap session expired');
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText('⏳ <b>Executing swap...</b>\n\nPlease wait, this may take a moment.', {
    parse_mode: 'HTML'
  });

  try {
    const provider = getProvider();
    const signer = getWalletSigner(userId, provider);
    const router = getRouterContract(signer);

    const amountIn = parseTokenAmount(swapSession.amount, swapSession.fromToken.decimals);
    const amountOutMin = parseTokenAmount(
      parseFloat(swapSession.amountOut) * 0.98, // 2% slippage
      swapSession.toToken.decimals
    );
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    let tx;

    if (swapSession.fromToken.address === 'native') {
      // Swap native tPOT for tokens
      tx = await router.swapExactETHForTokens(
        amountOutMin,
        swapSession.path,
        session.address,
        deadline,
        { value: amountIn }
      );
    } else if (swapSession.toToken.address === 'native') {
      // Approve tokens first
      const tokenContract = getTokenContract(swapSession.fromToken.address, signer);
      const approveTx = await tokenContract.approve(CONTRACTS.ROUTER, amountIn);
      await approveTx.wait();

      // Swap tokens for native
      tx = await router.swapExactTokensForETH(
        amountIn,
        amountOutMin,
        swapSession.path,
        session.address,
        deadline
      );
    } else {
      // Approve tokens first
      const tokenContract = getTokenContract(swapSession.fromToken.address, signer);
      const approveTx = await tokenContract.approve(CONTRACTS.ROUTER, amountIn);
      await approveTx.wait();

      // Swap tokens for tokens
      tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        swapSession.path,
        session.address,
        deadline
      );
    }

    const receipt = await tx.wait();

    await ctx.editMessageText(
      `✅ <b>Swap Successful!</b>\n\n` +
      `Swapped: ${swapSession.amount} ${swapSession.fromToken.symbol}\n` +
      `Received: ~${parseFloat(swapSession.amountOut).toFixed(6)} ${swapSession.toToken.symbol}\n\n` +
      `Tx: <code>${receipt.hash}</code>`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );

    swapSessions.delete(userId);

  } catch (error) {
    console.error('Swap execution error:', error);
    await ctx.editMessageText(
      `❌ <b>Swap Failed</b>\n\n` +
      `Error: ${error.message || 'Unknown error'}\n\n` +
      `Please check your balance and try again.`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );
    swapSessions.delete(userId);
  }
}

// Export for text message handler
export function isInSwapFlow(userId) {
  const session = swapSessions.get(userId);
  return session && session.step === 'enter_amount';
}
