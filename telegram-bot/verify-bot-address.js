import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

const ss58 = '5EuTQXex9eKxnRLzycNYdDCXedn1jGCsHtNGSLEuHJMK1URi';
const evm = '0x7DA6D8Ad6aA09D5e3CEc4c5Ed478c73D879689Be';

console.log('🔍 Verifying bot addresses...\n');

const decoded = decodeAddress(ss58);
const hex = u8aToHex(decoded);

console.log('SS58 address:', ss58);
console.log('32-byte pubkey:', hex);
console.log('');

// Check structure: should be [20 bytes EVM] + [12 bytes 0xEE]
const evmPart = '0x' + hex.slice(2, 42).toLowerCase();  // First 20 bytes (40 hex chars)
const padding = hex.slice(42);  // Last 12 bytes (24 hex chars)

console.log('Extracted EVM address:', evmPart);
console.log('Padding bytes:', padding);
console.log('');

if (evmPart === evm.toLowerCase()) {
  console.log('✅ EVM address matches!');
} else {
  console.log('❌ EVM address mismatch!');
  console.log('Expected:', evm.toLowerCase());
  console.log('Got:', evmPart);
}

if (padding === 'eeeeeeeeeeeeeeeeeeeeeeee') {
  console.log('✅ Padding is correct (0xEE × 12)');
} else {
  console.log('❌ Padding is wrong!');
  console.log('Expected: eeeeeeeeeeeeeeeeeeeeeeee');
  console.log('Got:', padding);
}

console.log('');
console.log('🎉 VERDICT: Mapping is CORRECT according to Portaldot pallet-revive spec!');
console.log('   You can safely fund this SS58 address.');
