/**
 * Quick balance checker for any EVM address on Portaldot
 */

import { ethers } from 'ethers';

const RPC = 'https://test-evm-rpc-v3.portaldot.dev';
const address = process.argv[2] || '0xc16fc1c3d11e68292094eba9b4d308ce19d012d9';

console.log('🔍 Checking balance for:', address);
console.log('');

const provider = new ethers.JsonRpcProvider(RPC, {
  chainId: 420420777,
  name: 'Portaldot V3 Testnet'
});

provider.getBalance(address)
  .then(balance => {
    const formatted = ethers.formatEther(balance);
    console.log('✅ Balance:', formatted, 'tPOTv3');
    console.log('   Raw wei:', balance.toString());

    if (balance > 0) {
      console.log('');
      console.log('✅ Funds found! This address has tPOT.');
    } else {
      console.log('');
      console.log('⚠️ No funds on this address.');
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
