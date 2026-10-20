import { useMemo } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, RPC_URL } from '../utils/addresses';
import { FACTORY_ABI, ROUTER_ABI, PAIR_ABI, ERC20_ABI, WPOT_ABI } from '../utils/abis';

// Read-only provider for when wallet is not connected
const readProvider = new ethers.JsonRpcProvider(RPC_URL);

export function useContract(address, abi, signerOrProvider) {
  return useMemo(() => {
    if (!address || address === ethers.ZeroAddress) return null;
    const provider = signerOrProvider || readProvider;
    return new ethers.Contract(address, abi, provider);
  }, [address, abi, signerOrProvider]);
}

export function useFactory(signerOrProvider) {
  return useContract(ADDRESSES.Factory, FACTORY_ABI, signerOrProvider);
}

export function useRouter(signerOrProvider) {
  return useContract(ADDRESSES.Router, ROUTER_ABI, signerOrProvider);
}

export function useERC20(tokenAddress, signerOrProvider) {
  return useContract(tokenAddress, ERC20_ABI, signerOrProvider);
}

export function usePair(pairAddress, signerOrProvider) {
  return useContract(pairAddress, PAIR_ABI, signerOrProvider);
}

export function useWPOT(signerOrProvider) {
  return useContract(ADDRESSES.WPOT, WPOT_ABI, signerOrProvider);
}

export { readProvider };
