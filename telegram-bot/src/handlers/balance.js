/**
 * Balance Handler
 * Fetch and display user balances
 */

import { ethers } from 'ethers';
import { getWalletSession } from '../utils/wallet.js';
import { getProvider, getTokenContract, CONTRACTS, formatTokenAmount } from '../utils/contracts.js';
import { getBackButton } from '../keyboards/index.js';

export async function handleBalance(ctx) {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);

  if (!session) {
    return ctx.reply('⚠️ No wallet found. Please create or import a wallet first.', getBackButton());
  }

  try {
    await ctx.answerCbQuery();
    await ctx.reply('⏳ Fetching balances...');

    const provider = getProvider();
    const address = session.address;

    // Fetch native balance
    const nativeBalance = await provider.getBalance(address);
    const nativeFormatted = ethers.formatEther(nativeBalance);

    // Fetch token balances
    const tokens = [
      { name: 'pUSDT', address: CONTRACTS.TOKENS.pUSDT, decimals: 6 },
      { name: 'pDAI', address: CONTRACTS.TOKENS.pDAI, decimals: 18 },
      { name: 'pWBTC', address: CONTRACTS.TOKENS.pWBTC, decimals: 8 },
      { name: 'pLINK', address: CONTRACTS.TOKENS.pLINK, decimals: 18 }
    ];

    let balanceText = `💰 <b>Your Balances</b>\n\n`;
    balanceText += `<b>Native:</b>\n`;
    balanceText += `  tPOTv3: ${parseFloat(nativeFormatted).toFixed(6)}\n\n`;
    balanceText += `<b>Tokens:</b>\n`;

    for (const token of tokens) {
      try {
        const contract = getTokenContract(token.address, provider);
        const balance = await contract.balanceOf(address);
        const formatted = formatTokenAmount(balance, token.decimals);
        balanceText += `  ${token.name}: ${parseFloat(formatted).toFixed(6)}\n`;
      } catch (error) {
        balanceText += `  ${token.name}: Error fetching\n`;
      }
    }

    balanceText += `\n<code>${address}</code>`;

    await ctx.reply(balanceText, {
      parse_mode: 'HTML',
      ...getBackButton()
    });

  } catch (error) {
    console.error('Balance fetch error:', error);
    await ctx.reply('❌ Failed to fetch balances. Please try again.', getBackButton());
  }
}
