/**
 * Quick test script to verify SS58 mapping
 * Run: node test-ss58.js <your-evm-address>
 */

import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import { u8aConcat, hexToU8a, u8aToHex } from '@polkadot/util';

const evmAddress = process.argv[2] || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

console.log('🔍 Testing SS58 Mapping for:', evmAddress);
console.log('');

// Method 1: CORRECT Portaldot mapping (EVM first, then 0xEE suffix)
function method1_PortaldotCorrect(evmAddr) {
  const clean = evmAddr.toLowerCase().replace('0x', '');
  const evmBytes = hexToU8a('0x' + clean);
  const paddingBytes = new Uint8Array(12).fill(0xEE);
  const pubKey = u8aConcat(evmBytes, paddingBytes);  // EVM first, padding last
  return {
    hex: u8aToHex(pubKey),
    ss58_prefix42: encodeAddress(pubKey, 42),
    ss58_prefix0: encodeAddress(pubKey, 0)
  };
}

// Method 2: Zero padding (alternative used by some chains)
function method2_ZeroPadding(evmAddr) {
  const clean = evmAddr.toLowerCase().replace('0x', '');
  const paddingBytes = new Uint8Array(12).fill(0x00);
  const evmBytes = hexToU8a('0x' + clean);
  const pubKey = u8aConcat(paddingBytes, evmBytes);
  return {
    hex: u8aToHex(pubKey),
    ss58_prefix42: encodeAddress(pubKey, 42),
    ss58_prefix0: encodeAddress(pubKey, 0)
  };
}

// Method 3: Suffix padding (EVM address at start)
function method3_SuffixPadding(evmAddr) {
  const clean = evmAddr.toLowerCase().replace('0x', '');
  const evmBytes = hexToU8a('0x' + clean);
  const paddingBytes = new Uint8Array(12).fill(0x00);
  const pubKey = u8aConcat(evmBytes, paddingBytes);
  return {
    hex: u8aToHex(pubKey),
    ss58_prefix42: encodeAddress(pubKey, 42),
    ss58_prefix0: encodeAddress(pubKey, 0)
  };
}

console.log('Method 1: ✅ CORRECT Portaldot mapping (EVM first + 0xEE suffix)');
const m1 = method1_PortaldotCorrect(evmAddress);
console.log('  32-byte hex:', m1.hex);
console.log('  SS58 (prefix 42):', m1.ss58_prefix42);
console.log('  SS58 (prefix 0):', m1.ss58_prefix0);
console.log('');

console.log('Method 2: 0x00 prefix padding (12 bytes)');
const m2 = method2_ZeroPadding(evmAddress);
console.log('  32-byte hex:', m2.hex);
console.log('  SS58 (prefix 42):', m2.ss58_prefix42);
console.log('  SS58 (prefix 0):', m2.ss58_prefix0);
console.log('');

console.log('Method 3: 0x00 suffix padding (12 bytes)');
const m3 = method3_SuffixPadding(evmAddress);
console.log('  32-byte hex:', m3.hex);
console.log('  SS58 (prefix 42):', m3.ss58_prefix42);
console.log('  SS58 (prefix 0):', m3.ss58_prefix0);
console.log('');

console.log('📋 Which SS58 address did you send 50 tPOT to?');
console.log('Compare it with the outputs above to find the correct mapping.');
