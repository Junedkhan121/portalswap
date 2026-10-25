import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

const ss58Address = '5HTzEPr3W2R93FhiZ4A59FN7whDpRF7MxxL6r9U65N7HkfPR';

console.log('Decoding SS58 address:', ss58Address);

const decoded = decodeAddress(ss58Address);
const hex = u8aToHex(decoded);

console.log('32-byte public key:', hex);
console.log('');

// Check if it's EE-padded
if (hex.startsWith('0xeeeeeeeeeeeeeeeeeeeeeeee')) {
  const evmPart = '0x' + hex.slice(26); // Remove 0xEE padding (12 bytes = 24 chars)
  console.log('✅ This IS EE-padded!');
  console.log('Extracted EVM address:', evmPart);
} else if (hex.startsWith('0x000000000000000000000000')) {
  const evmPart = '0x' + hex.slice(26);
  console.log('✅ This IS zero-padded!');
  console.log('Extracted EVM address:', evmPart);
} else {
  console.log('⚠️ Unknown padding pattern');
  console.log('First 12 bytes:', hex.slice(0, 26));
}
