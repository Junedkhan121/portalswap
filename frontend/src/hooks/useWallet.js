import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID, NETWORK_CONFIG } from '../utils/addresses';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectChain = chainId === CHAIN_ID;

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError) {
      // Chain not added — add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
        } catch (addError) {
          setError('Failed to add Portaldot V3 network');
        }
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or OKX Wallet');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      const newSigner = await browserProvider.getSigner();
      const bal = await browserProvider.getBalance(accounts[0]);

      setAccount(accounts[0]);
      setProvider(browserProvider);
      setSigner(newSigner);
      setChainId(Number(network.chainId));
      setBalance(ethers.formatEther(bal));

      if (Number(network.chainId) !== CHAIN_ID) {
        await switchNetwork();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [switchNetwork]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance('0');
  }, []);

  const refreshBalance = useCallback(async () => {
    if (provider && account) {
      const bal = await provider.getBalance(account);
      setBalance(ethers.formatEther(bal));
    }
  }, [provider, account]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        refreshBalance();
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(Number(newChainId));
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect, refreshBalance]);

  // Auto-connect if already authorized
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        if (accounts.length > 0) connect();
      });
    }
  }, [connect]);

  return {
    account,
    provider,
    signer,
    chainId,
    balance,
    isConnecting,
    isCorrectChain,
    error,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
  };
}
