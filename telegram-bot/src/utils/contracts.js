/**
 * Blockchain Provider and Contract Utilities
 */

import { ethers } from 'ethers';
import 'dotenv/config';

// Provider instance
let provider;

/**
 * Initialize provider
 */
export function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://test-evm-rpc-v3.portaldot.dev',
      {
        chainId: parseInt(process.env.CHAIN_ID) || 420420777,
        name: 'Portaldot V3 Testnet'
      }
    );
  }
  return provider;
}

/**
 * Contract ABIs (minimal interfaces for bot operations)
 */

// ERC20 interface
export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// Router interface (based on PortalSwapRouter)
export const ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)'
];

// Staking interface (based on PortalSwapStaking)
export const STAKING_ABI = [
  'function stake(uint256 amount) returns (bool)',
  'function unstake(uint256 amount) returns (bool)',
  'function getStake(address user) view returns (uint256)',
  'function pendingRewards(address user) view returns (uint256)',
  'function claimRewards() returns (bool)'
];

// WPOT interface
export const WPOT_ABI = [
  'function deposit() payable',
  'function withdraw(uint256) returns (bool)',
  ...ERC20_ABI
];

/**
 * Contract addresses from environment
 */
export const CONTRACTS = {
  ROUTER: process.env.ROUTER_ADDRESS,
  FACTORY: process.env.FACTORY_ADDRESS,
  WPOT: process.env.WPOT_ADDRESS,
  STAKING: process.env.STAKING_ADDRESS,
  FAUCET: process.env.FAUCET_ADDRESS,
  TOKENS: {
    pUSDT: process.env.PUSDT_ADDRESS,
    pDAI: process.env.PDAI_ADDRESS,
    pWBTC: process.env.PWBTC_ADDRESS,
    pLINK: process.env.PLINK_ADDRESS
  }
};

/**
 * Get token contract instance
 */
export function getTokenContract(tokenAddress, signerOrProvider) {
  return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
}

/**
 * Get router contract instance
 */
export function getRouterContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signerOrProvider);
}

/**
 * Get staking contract instance
 */
export function getStakingContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signerOrProvider);
}

/**
 * Get WPOT contract instance
 */
export function getWPOTContract(signerOrProvider) {
  return new ethers.Contract(CONTRACTS.WPOT, WPOT_ABI, signerOrProvider);
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount, decimals) {
  return ethers.formatUnits(amount, decimals);
}

/**
 * Parse token amount from user input
 */
export function parseTokenAmount(amount, decimals) {
  return ethers.parseUnits(amount.toString(), decimals);
}
