import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import TokenSelect from './TokenSelect';
import { ADDRESSES, TOKENS } from '../utils/addresses';
import { ROUTER_ABI, ERC20_ABI, FACTORY_ABI, PAIR_ABI } from '../utils/abis';

export default function LiquidityCard({ wallet }) {
  const { account, signer, connect } = wallet;
  const [mode, setMode] = useState('add');
  const [tokenA, setTokenA] = useState(TOKENS[0]);
  const [tokenB, setTokenB] = useState(TOKENS[2]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [lpBalance, setLpBalance] = useState('0');
  const [removeAmount, setRemoveAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pairAddress, setPairAddress] = useState(null);
  const [reserves, setReserves] = useState({ r0: '0', r1: '0' });

  const fetchPairInfo = useCallback(async () => {
    if (!signer || ADDRESSES.Factory === ethers.ZeroAddress) return;
    try {
      const provider = signer.provider;
      const factory = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
      const addrA = tokenA.isNative ? ADDRESSES.WPOT : tokenA.address;
      const addrB = tokenB.isNative ? ADDRESSES.WPOT : tokenB.address;
      if (addrA === ethers.ZeroAddress || addrB === ethers.ZeroAddress) return;
      if (addrA.toLowerCase() === addrB.toLowerCase()) {
        setPairAddress(null);
        return;
      }
      const pair = await factory.getPair(addrA, addrB);
      setPairAddress(pair);
      if (pair !== ethers.ZeroAddress) {
        const pairContract = new ethers.Contract(pair, PAIR_ABI, provider);
        const res = await pairContract.getReserves();
        setReserves({ r0: res[0].toString(), r1: res[1].toString() });
        if (account) {
          const lpBal = await pairContract.balanceOf(account);
          setLpBalance(ethers.formatEther(lpBal));
        }
      } else {
        setReserves({ r0: '0', r1: '0' });
        setLpBalance('0');
      }
    } catch (e) {
      console.error('Pair info error:', e);
    }
  }, [signer, account, tokenA, tokenB]);

  useEffect(() => {
    fetchPairInfo();
  }, [fetchPairInfo]);

  useEffect(() => {
    if (mode !== 'add' || !amountA || parseFloat(amountA) === 0) {
      setAmountB('');
      return;
    }
    if (pairAddress && pairAddress !== ethers.ZeroAddress && reserves.r0 !== '0' && reserves.r1 !== '0') {
      // Reserves are ordered by token0/token1 (sorted addresses), so map decimals correctly
      const addrA = tokenA.isNative ? ADDRESSES.WPOT : tokenA.address;
      const addrB = tokenB.isNative ? ADDRESSES.WPOT : tokenB.address;
      const aIsToken0 = addrA.toLowerCase() < addrB.toLowerCase();
      const decimals0 = aIsToken0 ? tokenA.decimals : tokenB.decimals;
      const decimals1 = aIsToken0 ? tokenB.decimals : tokenA.decimals;
      const raw0 = parseFloat(ethers.formatUnits(reserves.r0, decimals0));
      const raw1 = parseFloat(ethers.formatUnits(reserves.r1, decimals1));
      const reserveA = aIsToken0 ? raw0 : raw1;
      const reserveB = aIsToken0 ? raw1 : raw0;
      if (reserveA > 0) {
        setAmountB(((parseFloat(amountA) * reserveB) / reserveA).toFixed(6));
      }
    }
  }, [amountA, reserves, mode, tokenA, tokenB, pairAddress]);

  const approveIfNeeded = async (tokenAddr, amount, spender) => {
    const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
    const allowance = await tokenContract.allowance(account, spender);
    if (allowance < amount) {
      const tx = await tokenContract.approve(spender, ethers.MaxUint256);
      await tx.wait();
    }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !account) return;
    setIsLoading(true);
    const toastId = toast.loading('Adding liquidity...');
    try {
      const router = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const addrA = tokenA.isNative ? ADDRESSES.WPOT : tokenA.address;
      const addrB = tokenB.isNative ? ADDRESSES.WPOT : tokenB.address;
      const amtA = ethers.parseUnits(amountA, tokenA.decimals);
      const amtB = ethers.parseUnits(amountB, tokenB.decimals);
      // 0.5% tolerance — the auto-filled B amount is ratio-based and the pool can
      // drift between the quote and the signature. 5% was needlessly strict and
      // caused swaps-just-happened reverts.
      const minA = amtA * 995n / 1000n;
      const minB = amtB * 995n / 1000n;

      let tx;
      if (tokenA.isNative || tokenB.isNative) {
        const tokenAddr = tokenA.isNative ? addrB : addrA;
        const tokenAmt = tokenA.isNative ? amtB : amtA;
        const tokenMin = tokenA.isNative ? minB : minA;
        const potAmt = tokenA.isNative ? amtA : amtB;
        const potMin = tokenA.isNative ? minA : minB;
        toast.loading('Approving token...', { id: toastId });
        await approveIfNeeded(tokenAddr, tokenAmt, ADDRESSES.Router);
        toast.loading('Adding liquidity...', { id: toastId });
        tx = await router.addLiquidityPOT(tokenAddr, tokenAmt, tokenMin, potMin, account, deadline, {
          value: potAmt,
        });
      } else {
        toast.loading('Approving tokens...', { id: toastId });
        await approveIfNeeded(addrA, amtA, ADDRESSES.Router);
        await approveIfNeeded(addrB, amtB, ADDRESSES.Router);
        toast.loading('Adding liquidity...', { id: toastId });
        tx = await router.addLiquidity(addrA, addrB, amtA, amtB, minA, minB, account, deadline);
      }
      await tx.wait();

      toast.success('Liquidity added!', { id: toastId });
      setAmountA('');
      setAmountB('');
      fetchPairInfo();
    } catch (err) {
      console.error(err);
      toast.error(err.reason || 'Failed to add liquidity', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!signer || !account || !pairAddress) return;
    if (pairAddress === ethers.ZeroAddress) {
      toast.error('No pool exists for this pair yet');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Removing liquidity...');
    try {
      const router = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, signer);
      const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const lpAmount = ethers.parseEther(removeAmount);
      const addrA = tokenA.isNative ? ADDRESSES.WPOT : tokenA.address;
      const addrB = tokenB.isNative ? ADDRESSES.WPOT : tokenB.address;

      toast.loading('Approving LP tokens...', { id: toastId });
      const allowance = await pairContract.allowance(account, ADDRESSES.Router);
      if (allowance < lpAmount) {
        const approveTx = await pairContract.approve(ADDRESSES.Router, ethers.MaxUint256);
        await approveTx.wait();
      }

      toast.loading('Removing liquidity...', { id: toastId });
      let tx;
      if (tokenA.isNative || tokenB.isNative) {
        const token = tokenA.isNative ? addrB : addrA;
        tx = await router.removeLiquidityPOT(token, lpAmount, 0, 0, account, deadline);
      } else {
        tx = await router.removeLiquidity(addrA, addrB, lpAmount, 0, 0, account, deadline);
      }
      await tx.wait();

      toast.success('Liquidity removed!', { id: toastId });
      setRemoveAmount('');
      fetchPairInfo();
    } catch (err) {
      console.error(err);
      toast.error(err.reason || 'Failed to remove liquidity', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-portal-card border border-portal-border rounded-3xl p-5 glow-box">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Liquidity</h2>
        <div className="flex gap-1 bg-portal-surface rounded-xl p-0.5">
          <button
            onClick={() => setMode('add')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === 'add' ? 'bg-portal-primary text-white' : 'text-portal-muted hover:text-white'
            }`}
          >
            Add
          </button>
          <button
            onClick={() => setMode('remove')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === 'remove' ? 'bg-portal-primary text-white' : 'text-portal-muted hover:text-white'
            }`}
          >
            Remove
          </button>
        </div>
      </div>

      {mode === 'add' ? (
        <>
          <div className="bg-portal-surface rounded-2xl p-4 mb-2">
            <p className="text-xs text-portal-muted mb-2">Token A</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-xl font-semibold text-white placeholder-portal-muted/50 token-input"
              />
              <TokenSelect selectedToken={tokenA} onSelect={setTokenA} otherToken={tokenB} />
            </div>
          </div>

          <div className="flex justify-center my-1">
            <div className="w-8 h-8 rounded-lg bg-portal-surface flex items-center justify-center">
              <span className="text-portal-muted text-lg">+</span>
            </div>
          </div>

          <div className="bg-portal-surface rounded-2xl p-4">
            <p className="text-xs text-portal-muted mb-2">Token B</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-xl font-semibold text-white placeholder-portal-muted/50 token-input"
              />
              <TokenSelect selectedToken={tokenB} onSelect={setTokenB} otherToken={tokenA} />
            </div>
          </div>

          {pairAddress && pairAddress !== ethers.ZeroAddress && (
            <div className="mt-3 p-3 bg-portal-surface/50 rounded-xl space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-portal-muted">Pool</span>
                <span className="text-portal-text">
                  {tokenA.symbol} / {tokenB.symbol}
                </span>
              </div>              <div className="flex justify-between text-xs">
                <span className="text-portal-muted">Your LP Tokens</span>
                <span className="text-portal-text">{parseFloat(lpBalance).toFixed(6)}</span>
              </div>
            </div>
          )}

          <button
            onClick={account ? handleAddLiquidity : connect}
            disabled={isLoading || (account && (!amountA || !amountB))}
            className="w-full mt-4 py-4 rounded-2xl text-base font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-portal-primary to-portal-secondary text-white hover:shadow-lg hover:shadow-portal-primary/25"
          >
            {!account ? 'Connect Wallet' : isLoading ? 'Adding...' : 'Add Liquidity'}
          </button>
        </>
      ) : (
        <>
          <div className="bg-portal-surface rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-portal-muted">LP Tokens to Remove</p>
              <button
                onClick={() => setRemoveAmount(lpBalance)}
                className="text-xs text-portal-primary hover:text-portal-accent"
              >
                Max: {parseFloat(lpBalance).toFixed(6)}
              </button>
            </div>
            <input
              type="number"
              value={removeAmount}
              onChange={(e) => setRemoveAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-xl font-semibold text-white placeholder-portal-muted/50 token-input"
            />
          </div>

          <div className="flex gap-2 mb-3">
            {['25', '50', '75', '100'].map((pct) => (
              <button
                key={pct}
                onClick={() =>
                  setRemoveAmount(((parseFloat(lpBalance) * parseInt(pct)) / 100).toString())
                }
                className="flex-1 py-2 rounded-xl text-xs font-medium bg-portal-surface text-portal-muted hover:text-white hover:bg-portal-border transition"
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="flex gap-3 mb-3">
            <TokenSelect selectedToken={tokenA} onSelect={setTokenA} otherToken={tokenB} />
            <span className="text-portal-muted self-center">/</span>
            <TokenSelect selectedToken={tokenB} onSelect={setTokenB} otherToken={tokenA} />
          </div>

          <button
            onClick={account ? handleRemoveLiquidity : connect}
            disabled={isLoading || (account && (!removeAmount || parseFloat(removeAmount) === 0))}
            className="w-full mt-2 py-4 rounded-2xl text-base font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25"
          >
            {!account ? 'Connect Wallet' : isLoading ? 'Removing...' : 'Remove Liquidity'}
          </button>
        </>
      )}
    </div>
  );
}
