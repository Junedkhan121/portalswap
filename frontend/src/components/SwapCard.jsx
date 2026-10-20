import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import TokenSelect from './TokenSelect';
import { ADDRESSES, TOKENS } from '../utils/addresses';
import { ROUTER_ABI, ERC20_ABI, FACTORY_ABI, PAIR_ABI } from '../utils/abis';

export default function SwapCard({ wallet }) {
  const { account, signer, isCorrectChain, connect } = wallet;

  const [tokenIn, setTokenIn] = useState(TOKENS[0]); // tPOTv3
  const [tokenOut, setTokenOut] = useState(TOKENS[2]); // pUSDT
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isLoading, setIsLoading] = useState(false);
  const [priceImpact, setPriceImpact] = useState(null);
  const [balanceIn, setBalanceIn] = useState('0');
  const [balanceOut, setBalanceOut] = useState('0');
  const [showSettings, setShowSettings] = useState(false);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!account || !signer) return;
    try {
      const provider = signer.provider;
      if (tokenIn?.isNative) {
        const bal = await provider.getBalance(account);
        setBalanceIn(ethers.formatEther(bal));
      } else if (tokenIn?.address && tokenIn.address !== ethers.ZeroAddress) {
        const contract = new ethers.Contract(tokenIn.address, ERC20_ABI, provider);
        const bal = await contract.balanceOf(account);
        setBalanceIn(ethers.formatUnits(bal, tokenIn.decimals));
      }
      if (tokenOut?.isNative) {
        const bal = await provider.getBalance(account);
        setBalanceOut(ethers.formatEther(bal));
      } else if (tokenOut?.address && tokenOut.address !== ethers.ZeroAddress) {
        const contract = new ethers.Contract(tokenOut.address, ERC20_ABI, provider);
        const bal = await contract.balanceOf(account);
        setBalanceOut(ethers.formatUnits(bal, tokenOut.decimals));
      }
    } catch (e) {
      console.error('Balance fetch error:', e);
    }
  }, [account, signer, tokenIn, tokenOut]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Get quote
  const getQuote = useCallback(async (inputAmount) => {
    if (!inputAmount || parseFloat(inputAmount) === 0 || !tokenIn || !tokenOut) {
      setAmountOut('');
      setPriceImpact(null);
      return;
    }
    if (ADDRESSES.Router === ethers.ZeroAddress) {
      setAmountOut('');
      return;
    }
    try {
      const provider = signer?.provider || new ethers.JsonRpcProvider('https://test-evm-rpc-v3.portaldot.dev');
      const router = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, provider);
      const inAddress = tokenIn.isNative ? ADDRESSES.WPOT : tokenIn.address;
      const outAddress = tokenOut.isNative ? ADDRESSES.WPOT : tokenOut.address;
      const amountInWei = ethers.parseUnits(inputAmount, tokenIn.decimals);
      const amounts = await router.getAmountsOut(amountInWei, [inAddress, outAddress]);
      const outputAmount = ethers.formatUnits(amounts[1], tokenOut.decimals);
      setAmountOut(outputAmount);

      // Price impact = how far execution price is from the pool's spot price
      try {
        const factory = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
        const pairAddr = await factory.getPair(inAddress, outAddress);
        if (pairAddr && pairAddr !== ethers.ZeroAddress) {
          const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
          const [token0, reserves] = await Promise.all([pair.token0(), pair.getReserves()]);
          const inIsToken0 = inAddress.toLowerCase() === token0.toLowerCase();
          const reserveIn = parseFloat(
            ethers.formatUnits(inIsToken0 ? reserves[0] : reserves[1], tokenIn.decimals)
          );
          const reserveOut = parseFloat(
            ethers.formatUnits(inIsToken0 ? reserves[1] : reserves[0], tokenOut.decimals)
          );
          if (reserveIn > 0) {
            const spotPrice = reserveOut / reserveIn;
            const execPrice = parseFloat(outputAmount) / parseFloat(inputAmount);
            const impact = (1 - execPrice / spotPrice) * 100;
            if (isFinite(impact) && impact >= 0) {
              setPriceImpact(impact < 0.01 ? '<0.01' : impact.toFixed(2));
            }
          }
        }
      } catch (impactErr) {
        // Non-fatal — impact is cosmetic
        console.debug('Price impact unavailable:', impactErr.message);
      }
    } catch (err) {
      console.error('Quote error:', err);
      setAmountOut('');
      setPriceImpact(null);
    }
  }, [tokenIn, tokenOut, signer]);

  useEffect(() => {
    const timer = setTimeout(() => getQuote(amountIn), 300);
    return () => clearTimeout(timer);
  }, [amountIn, getQuote]);

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const handleSwap = async () => {
    if (!signer || !account) return;
    setIsLoading(true);
    const toastId = toast.loading('Preparing swap...');

    try {
      const router = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 min

      // Guard against empty/invalid custom slippage input
      const slippageNum = parseFloat(slippage);
      const effectiveSlippage = isFinite(slippageNum) && slippageNum >= 0 && slippageNum <= 50
        ? slippageNum
        : 0.5;
      const slippageBps = Math.floor(effectiveSlippage * 100);

      const inAddress = tokenIn.isNative ? ADDRESSES.WPOT : tokenIn.address;
      const outAddress = tokenOut.isNative ? ADDRESSES.WPOT : tokenOut.address;
      const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);

      // Re-quote against current reserves instead of trusting the debounced display value,
      // which can be stale if the user typed and clicked immediately.
      const readProvider = signer.provider;
      const readRouter = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, readProvider);
      const freshAmounts = await readRouter.getAmountsOut(amountInWei, [inAddress, outAddress]);
      const freshOut = freshAmounts[freshAmounts.length - 1];
      if (freshOut === 0n) throw new Error('No route found for this amount');

      const minAmountOut = (freshOut * BigInt(10000 - slippageBps)) / BigInt(10000);

      let tx;

      if (tokenIn.isNative) {
        // Swap native POT for token
        toast.loading('Swapping tPOTv3...', { id: toastId });
        tx = await router.swapExactPOTForTokens(
          minAmountOut,
          [inAddress, outAddress],
          account,
          deadline,
          { value: amountInWei }
        );
      } else if (tokenOut.isNative) {
        // Approve first
        toast.loading('Approving token...', { id: toastId });
        const tokenContract = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account, ADDRESSES.Router);
        if (allowance < amountInWei) {
          const approveTx = await tokenContract.approve(ADDRESSES.Router, ethers.MaxUint256);
          await approveTx.wait();
        }
        toast.loading('Swapping...', { id: toastId });
        tx = await router.swapExactTokensForPOT(
          amountInWei,
          minAmountOut,
          [inAddress, outAddress],
          account,
          deadline
        );
      } else {
        // Token to token
        toast.loading('Approving token...', { id: toastId });
        const tokenContract = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account, ADDRESSES.Router);
        if (allowance < amountInWei) {
          const approveTx = await tokenContract.approve(ADDRESSES.Router, ethers.MaxUint256);
          await approveTx.wait();
        }
        toast.loading('Swapping...', { id: toastId });
        tx = await router.swapExactTokensForTokens(
          amountInWei,
          minAmountOut,
          [inAddress, outAddress],
          account,
          deadline
        );
      }

      toast.loading('Waiting for confirmation...', { id: toastId });
      await tx.wait();
      toast.success('Swap successful!', { id: toastId });
      setAmountIn('');
      setAmountOut('');
      fetchBalances();
    } catch (err) {
      console.error('Swap error:', err);
      toast.error(err.reason || err.message || 'Swap failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (!account) return 'Connect Wallet';
    if (!isCorrectChain) return 'Switch to Portaldot V3';
    if (!tokenIn || !tokenOut) return 'Select tokens';
    if (!amountIn || parseFloat(amountIn) === 0) return 'Enter amount';
    if (parseFloat(amountIn) > parseFloat(balanceIn)) return 'Insufficient balance';
    if (!amountOut) return 'No route found';
    return 'Swap';
  };

  const isButtonDisabled = () => {
    if (!account) return false;
    if (!isCorrectChain) return false;
    if (!tokenIn || !tokenOut) return true;
    if (!amountIn || parseFloat(amountIn) === 0) return true;
    if (parseFloat(amountIn) > parseFloat(balanceIn)) return true;
    if (!amountOut) return true;
    if (isLoading) return true;
    return false;
  };

  return (
    <div className="bg-portal-card border border-portal-border rounded-3xl p-5 glow-box">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Swap</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-xl hover:bg-portal-surface transition text-portal-muted hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Slippage Settings */}
      {showSettings && (
        <div className="mb-4 p-3 bg-portal-surface rounded-2xl">
          <p className="text-xs text-portal-muted mb-2">Slippage Tolerance</p>
          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map((val) => (
              <button
                key={val}
                onClick={() => setSlippage(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  slippage === val
                    ? 'bg-portal-primary text-white'
                    : 'bg-portal-card text-portal-muted hover:text-white'
                }`}
              >
                {val}%
              </button>
            ))}
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              className="w-16 px-2 py-1.5 bg-portal-card rounded-lg text-xs text-white text-center token-input border border-portal-border"
              placeholder="Custom"
            />
          </div>
        </div>
      )}

      {/* Token In */}
      <div className="bg-portal-surface rounded-2xl p-4 mb-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-portal-muted">You pay</p>
          {account && (
            <button
              onClick={() => setAmountIn(balanceIn)}
              className="text-xs text-portal-primary hover:text-portal-accent transition"
            >
              Balance: {parseFloat(balanceIn).toFixed(4)}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder-portal-muted/50 token-input"
          />
          <TokenSelect
            selectedToken={tokenIn}
            onSelect={setTokenIn}
            otherToken={tokenOut}
            label="From"
          />
        </div>
      </div>

      {/* Switch Button */}
      <div className="flex justify-center -my-3 relative z-10">
        <button
          onClick={switchTokens}
          className="w-10 h-10 bg-portal-card border-4 border-portal-dark rounded-xl flex items-center justify-center hover:bg-portal-surface transition group"
        >
          <svg className="w-4 h-4 text-portal-muted group-hover:text-portal-primary transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Token Out */}
      <div className="bg-portal-surface rounded-2xl p-4 mt-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-portal-muted">You receive</p>
          {account && (
            <p className="text-xs text-portal-muted">
              Balance: {parseFloat(balanceOut).toFixed(4)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amountOut}
            readOnly
            placeholder="0.0"
            className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder-portal-muted/50"
          />
          <TokenSelect
            selectedToken={tokenOut}
            onSelect={setTokenOut}
            otherToken={tokenIn}
            label="To"
          />
        </div>
      </div>

      {/* Price Info */}
      {amountIn && amountOut && parseFloat(amountOut) > 0 && (
        <div className="mt-3 p-3 bg-portal-surface/50 rounded-xl space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-portal-muted">Rate</span>
            <span className="text-portal-text">
              1 {tokenIn?.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut?.symbol}
            </span>
          </div>
          {priceImpact && (
            <div className="flex justify-between text-xs">
              <span className="text-portal-muted">Price Impact</span>
              <span className={`${parseFloat(priceImpact) > 5 ? 'text-red-400' : 'text-green-400'}`}>
                {priceImpact}%
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-portal-muted">Slippage Tolerance</span>
            <span className="text-portal-text">{slippage}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-portal-muted">Fee</span>
            <span className="text-portal-text">0.3%</span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={account ? (isCorrectChain ? handleSwap : wallet.switchNetwork) : connect}
        disabled={isButtonDisabled()}
        className="w-full mt-4 py-4 rounded-2xl text-base font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-portal-primary to-portal-secondary text-white hover:shadow-lg hover:shadow-portal-primary/25"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Swapping...
          </span>
        ) : (
          getButtonText()
        )}
      </button>
    </div>
  );
}
