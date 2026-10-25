/**
 * SS58 Address Utilities for Portaldot
 * Maps EVM addresses (0x...) to SS58 substrate addresses (5...)
 */

import { encodeAddress } from '@polkadot/util-crypto';
import { u8aConcat, hexToU8a } from '@polkadot/util';

/**
 * Convert EVM address to Portaldot SS58 address using 0xEE padding rule
 *
 * Portaldot uses a specific mapping: EVM addresses are padded with 0xEE prefix
 * to create a 32-byte public key, then encoded as SS58 with prefix 42 (generic substrate)
 *
 * @param {string} evmAddress - 0x-prefixed EVM address
 * @returns {string} SS58-encoded address starting with '5'
 */
export function evmToSS58(evmAddress) {
  // Remove 0x prefix if present
  const cleanAddress = evmAddress.toLowerCase().replace('0x', '');

  // EVM addresses are 20 bytes, we need 32 bytes for substrate
  // Portaldot pallet-revive mapping rule (from 04_address_map.js):
  //   AccountId32 = <20 bytes of H160> ++ [0xEE; 12]
  // Put EVM address FIRST, then pad with 0xEE at the END
  const evmBytes = hexToU8a('0x' + cleanAddress);
  const paddingBytes = new Uint8Array(12).fill(0xEE);

  // Concatenate: [20-byte EVM address] + [0xEE * 12] = 32 bytes
  const substratePublicKey = u8aConcat(evmBytes, paddingBytes);

  // Encode as SS58 with prefix 42 (generic substrate format)
  // This produces addresses starting with '5'
  const ss58Address = encodeAddress(substratePublicKey, 42);

  return ss58Address;
}

/**
 * Display both addresses for user reference
 *
 * @param {string} evmAddress - 0x-prefixed address
 * @returns {object} Both address formats
 */
export function getAddressInfo(evmAddress) {
  return {
    evm: evmAddress,
    ss58: evmToSS58(evmAddress),
    displayText: `🔑 Your Addresses:\n\n` +
      `EVM Address (for contracts):\n<code>${evmAddress}</code>\n\n` +
      `SS58 Address (for gas transfers):\n<code>${evmToSS58(evmAddress)}</code>\n\n` +
      `⚠️ To receive testnet gas (tPOTv3), share your SS58 address (5...).`
  };
}
