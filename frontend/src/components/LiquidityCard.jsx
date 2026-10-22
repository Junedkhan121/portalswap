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
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>Liquidity</h2>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-menu-item)', borderRadius: 12, padding: 4 }}>
          <button
            onClick={() => setMode('add')}
            style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-primary)', transition: 'all 0.15s', border: 'none', cursor: 'pointer',
              background: mode === 'add' ? 'var(--accent-blue)' : 'transparent',
              color: mode === 'add' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Add
          </button>
          <button
            onClick={() => setMode('remove')}
            style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-primary)', transition: 'all 0.15s', border: 'none', cursor: 'pointer',
              background: mode === 'remove' ? 'var(--accent-red)' : 'transparent',
              color: mode === 'remove' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Remove
          </button>
        </div>
      </div>

      {mode === 'add' ? (
        <>
          <div style={{ background: 'var(--bg-menu-item)', borderRadius: 20, padding: 16, marginBottom: 12, border: '1px solid var(--border-secondary)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Token A</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-primary)',
                  width: '100%',
                }}
              />
              <TokenSelect selectedToken={tokenA} onSelect={setTokenA} otherToken={tokenB} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: 12, background: 'var(--bg-menu-item)', border: '1px solid var(--border-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>+</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-menu-item)', borderRadius: 20, padding: 16, border: '1px solid var(--border-secondary)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Token B</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-primary)',
                  width: '100%',
                }}
              />
              <TokenSelect selectedToken={tokenB} onSelect={setTokenB} otherToken={tokenA} />
            </div>
          </div>

          {pairAddress && pairAddress !== ethers.ZeroAddress && (
            <div style={{ marginTop: 16, padding: 12, background: 'rgba(61,126,255,0.05)', borderRadius: 16, border: '1px solid rgba(61,126,255,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Pool</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)', fontWeight: 500 }}>
                  {tokenA.symbol} / {tokenB.symbol}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Your LP Tokens</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)', fontWeight: 500 }}>
                  {parseFloat(lpBalance).toFixed(6)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={account ? handleAddLiquidity : connect}
            disabled={isLoading || (account && (!amountA || !amountB))}
            style={{
              width: '100%', marginTop: 16, padding: '16px 0', borderRadius: 20,
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-primary)',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              color: '#fff', border: 'none', cursor: account && !isLoading && amountA && amountB ? 'pointer' : 'not-allowed',
              opacity: isLoading || (account && (!amountA || !amountB)) ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {!account ? 'Connect Wallet' : isLoading ? 'Adding...' : 'Add Liquidity'}
          </button>
        </>
      ) : (
        <>
          <div style={{ background: 'var(--bg-menu-item)', borderRadius: 20, padding: 16, marginBottom: 16, border: '1px solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LP Tokens to Remove</p>
              <button
                onClick={() => setRemoveAmount(lpBalance)}
                style={{ fontSize: 11, color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600 }}
              >
                Max: {parseFloat(lpBalance).toFixed(6)}
              </button>
            </div>
            <input
              type="number"
              value={removeAmount}
              onChange={(e) => setRemoveAmount(e.target.value)}
              placeholder="0.0"
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['25', '50', '75', '100'].map((pct) => (
              <button
                key={pct}
                onClick={() =>
                  setRemoveAmount(((parseFloat(lpBalance) * parseInt(pct)) / 100).toString())
                }
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 16, fontSize: 11, fontWeight: 600,
                  fontFamily: 'var(--font-primary)', background: 'var(--bg-menu-item)',
                  color: 'var(--text-muted)', border: '1px solid var(--border-secondary)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.background='var(--bg-menu-item-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='var(--bg-menu-item)'; }}
              >
                {pct}%
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <TokenSelect selectedToken={tokenA} onSelect={setTokenA} otherToken={tokenB} />
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>/</span>
            <TokenSelect selectedToken={tokenB} onSelect={setTokenB} otherToken={tokenA} />
          </div>

          <button
            onClick={account ? handleRemoveLiquidity : connect}
            disabled={isLoading || (account && (!removeAmount || parseFloat(removeAmount) === 0))}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 20,
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-primary)',
              background: 'linear-gradient(135deg, var(--accent-red), #c92a2a)',
              color: '#fff', border: 'none', cursor: account && !isLoading && removeAmount && parseFloat(removeAmount) > 0 ? 'pointer' : 'not-allowed',
              opacity: isLoading || (account && (!removeAmount || parseFloat(removeAmount) === 0)) ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {!account ? 'Connect Wallet' : isLoading ? 'Removing...' : 'Remove Liquidity'}
          </button>
        </>
      )}
    </div>
  );
}