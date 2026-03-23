import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getQuote, createTransaction } from '../api/bridgeAPI';
import WalletSelector from './WalletSelector';
import { allTokenOptions, chainOptions, isNativeToken } from '../constants/bridgeConfig';
import { getTokenBalance, validateFees, calculateMaxBridgeAmount } from '../utils/tokenUtils';
import { handleSolanaTransaction } from '../utils/solanaTransactionHandler';
import { handleEvmTransaction } from '../utils/evmTransactionHandler';

const BridgeInterface = () => {
  const {
    account, chainId, isConnected, switchChain, CHAINS, signer, provider, connectWallet
  } = useWallet();

  const [amount, setAmount] = useState('');
  const [fromChain, setFromChain] = useState(() => localStorage.getItem('selectedChain') || 'ETHEREUM');
  const [fromToken, setFromToken] = useState(() => localStorage.getItem('selectedToken') || 'ETH');
  const [hasSetDefaultChain, setHasSetDefaultChain] = useState(false);

  useEffect(() => { localStorage.setItem('selectedChain', fromChain); }, [fromChain]);
  useEffect(() => { localStorage.setItem('selectedToken', fromToken); }, [fromToken]);

  // Set default chain based on wallet type
  useEffect(() => {
    if (isConnected && provider && chainId && !hasSetDefaultChain) {
      if (chainId === 'solana') {
        setFromChain('SOLANA');
        setFromToken('SOL');
        setHasSetDefaultChain(true);
      } else if (chainId !== 'solana') {
        if (fromChain === 'SOLANA') {
          setFromChain('ETHEREUM');
          setFromToken('ETH');
        }
        setHasSetDefaultChain(true);
      }
    }
  }, [account, isConnected, provider, signer, chainId, hasSetDefaultChain, fromChain]);

  useEffect(() => { if (!isConnected) setHasSetDefaultChain(false); }, [isConnected]);

  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [nativeBalance, setNativeBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [feeValidation, setFeeValidation] = useState({
    hasEnoughForFees: true, maxBridgeable: null, feeEstimate: 0, feeValidationError: null
  });
  const [quote, setQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [notification, setNotification] = useState(null);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const tokenOptions = useMemo(() => allTokenOptions.filter(token => token.chains.includes(fromChain)), [fromChain]);
  const getTokenOption = (value) => allTokenOptions.find(option => option.value === value);
  const getChainOption = (value) => chainOptions.find(option => option.value === value);

  // Fee validation
  const updateFeeValidation = useCallback(async () => {
    if (!isConnected || !balance || !fromChain || !fromToken) {
      setFeeValidation({ hasEnoughForFees: true, maxBridgeable: null, feeEstimate: 0, feeValidationError: null });
      return;
    }
    try {
      const result = await validateFees({ isConnected, balance, fromChain, fromToken, provider, account, nativeBalance });
      const native = isNativeToken(fromToken, fromChain);
      let maxBridgeable = null;
      let errorMessage = null;

      if (native) {
        maxBridgeable = parseFloat(calculateMaxBridgeAmount(balance, fromToken, fromChain)) || 0;
        if (!result.isValid) {
          errorMessage = `Insufficient ${fromToken} for transaction fees.`;
        }
      } else if (!result.isValid) {
        const nativeToken = fromChain === 'SOLANA' ? 'SOL' : 'ETH';
        errorMessage = `Insufficient ${nativeToken} for fees. Need ~${result.feeAmount} ${nativeToken}.`;
      }

      setFeeValidation({
        hasEnoughForFees: result.isValid, maxBridgeable, feeEstimate: result.feeAmount, feeValidationError: errorMessage
      });
    } catch (error) {
      setFeeValidation({ hasEnoughForFees: true, maxBridgeable: null, feeEstimate: 0, feeValidationError: null });
    }
  }, [isConnected, balance, fromChain, fromToken, nativeBalance, provider, account]);

  // Fetch native balance
  useEffect(() => {
    const fetchNativeBalance = async () => {
      if (!isConnected || !account || !provider) { setNativeBalance('0'); return; }
      try {
        if (isNativeToken(fromToken, fromChain)) {
          setNativeBalance(balance);
        } else {
          const nativeTokenType = fromChain === 'SOLANA' ? 'SOL' : 'ETH';
          const nb = await getTokenBalance(nativeTokenType, provider, account);
          setNativeBalance(nb);
        }
      } catch (error) { setNativeBalance('0'); }
    };
    fetchNativeBalance();
  }, [isConnected, account, provider, fromChain, fromToken, balance]);

  useEffect(() => { updateFeeValidation(); }, [updateFeeValidation]);

  // Reset token on chain change
  useEffect(() => {
    const currentTokenAvailable = tokenOptions.find(token => token.value === fromToken);
    if (!currentTokenAvailable && tokenOptions.length > 0) {
      if (fromChain === 'SOLANA') {
        const wasUsingUSDC = fromToken === 'USDC';
        const usdcAvailable = tokenOptions.find(token => token.value === 'USDC');
        const solAvailable = tokenOptions.find(token => token.value === 'SOL');
        if (wasUsingUSDC && usdcAvailable) setFromToken('USDC');
        else if (solAvailable) setFromToken('SOL');
        else setFromToken(tokenOptions[0].value);
      } else {
        setFromToken(tokenOptions[0].value);
      }
    }
  }, [fromChain, fromToken, tokenOptions]);

  const isCorrectChain = chainId === CHAINS[fromChain].chainId;

  const notificationTimeoutRef = useRef(null);
  const showNotification = (message, type = 'error') => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ message, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    return () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTokenDropdown && !event.target.closest('.token-dropdown')) setShowTokenDropdown(false);
      if (showChainDropdown && !event.target.closest('.chain-dropdown')) setShowChainDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTokenDropdown, showChainDropdown]);

  const providerRef = useRef(provider);
  const accountRef = useRef(account);
  useEffect(() => { providerRef.current = provider; accountRef.current = account; }, [provider, account]);

  const balanceFetchInProgress = useRef(false);
  const balanceFetchTimeout = useRef(null);

  const refreshBalance = useCallback(async () => {
    if (!providerRef.current || !accountRef.current) return;
    if (balanceFetchTimeout.current) clearTimeout(balanceFetchTimeout.current);
    if (balanceFetchInProgress.current) return;
    balanceFetchInProgress.current = true;
    try {
      const tokenBalance = await getTokenBalance(fromToken, providerRef.current, accountRef.current);
      setBalance(tokenBalance);
    } catch (error) { setBalance('0'); }
    finally { balanceFetchInProgress.current = false; }
  }, [fromToken]);

  useEffect(() => {
    if (!isConnected) { setQuote(null); setQuoteError(null); setTxHash(''); }
  }, [isConnected]);

  // Extract address from URL
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const pathAddress = path.split('/').find(segment => segment.startsWith('0x') && segment.length === 42);
    const queryAddress = searchParams.get('user');
    const addressFromURL = pathAddress || queryAddress;
    if (addressFromURL && addressFromURL.match(/^0x[a-fA-F0-9]{40}$/)) {
      setUserAddress(addressFromURL);
    }
  }, []);

  // Balance fetching with debounce
  useEffect(() => {
    if (balanceFetchTimeout.current) clearTimeout(balanceFetchTimeout.current);
    if (!isConnected || !account || !provider) { setBalance('0'); return; }
    const needsWalletSwitch = (fromChain === 'SOLANA' && chainId !== 'solana') || (fromChain !== 'SOLANA' && chainId === 'solana');
    if (needsWalletSwitch) { setBalance('0'); return; }
    if (!isCorrectChain) { setBalance('0'); return; }

    balanceFetchTimeout.current = setTimeout(async () => {
      if (balanceFetchInProgress.current) return;
      balanceFetchInProgress.current = true;
      try {
        const tokenBalance = await getTokenBalance(fromToken, provider, account);
        setBalance(tokenBalance);
      } catch (error) { setBalance('0'); }
      finally { balanceFetchInProgress.current = false; }
    }, 150);

    return () => { if (balanceFetchTimeout.current) { clearTimeout(balanceFetchTimeout.current); balanceFetchTimeout.current = null; } };
  }, [isConnected, account, chainId, provider, fromToken, fromChain, isCorrectChain]);

  // Quote fetching
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0 || !userAddress) { setQuote(null); return; }
      setIsLoadingQuote(true);
      setQuoteError(null);
      const fromAddress = account || userAddress;
      const quoteParams = {
        fromAddress, toAddress: userAddress,
        fromChain, toChain: 'HyperCore', fromToken, toToken: 'USDC', amount
      };
      try {
        const quoteData = await getQuote(quoteParams);
        if (quoteData.success === false) {
          if (quoteData.message?.includes('Invalid EVM destination address format')) setQuoteError('address');
          else setQuoteError('general');
          setQuote(null);
        } else {
          setQuote(quoteData);
          setQuoteError(null);
        }
      } catch (error) {
        setQuote(null);
        setQuoteError('general');
      } finally { setIsLoadingQuote(false); }
    };
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [amount, fromChain, fromToken, account, userAddress]);

  const isCorrectWalletType = (fromChain === 'SOLANA') === (chainId === 'solana');

  const handleSwitchChain = async () => {
    await switchChain(CHAINS[fromChain].chainId);
  };

  const handleBridge = async () => {
    if (!isConnected) { setShowWalletSelector(true); return; }
    if (!amount || !isCorrectChain || !userAddress) return;

    setIsLoading(true);
    setTxHash('');
    let transactionSucceeded = false;

    try {
      const quoteParams = {
        fromAddress: account, toAddress: userAddress,
        fromChain, toChain: 'HyperCore', fromToken, toToken: 'USDC', amount
      };
      const freshQuote = await createTransaction(quoteParams);
      if (!freshQuote.success || !freshQuote.data?.tx) throw new Error('Failed to get valid quote');

      const transactionData = freshQuote.data.tx;

      if (chainId === 'solana') {
        setIsConfirming(true);
        const result = await handleSolanaTransaction({
          provider, transactionData,
          onProgress: (progress) => { if (progress.txHash) setTxHash(progress.txHash); }
        });
        if (!result.success) throw new Error(result.error);
        if (result.showWarningNotification) {
          showNotification(result.warning, 'warning');
        } else {
          transactionSucceeded = true;
        }
      } else {
        const result = await handleEvmTransaction({
          signer, provider, transactionData, fromToken, amount,
          onProgress: (progress) => {
            if (progress.txHash) setTxHash(progress.txHash);
            if (progress.status === 'confirming') setIsConfirming(true);
            else if (progress.status === 'confirmed') setIsConfirming(false);
          }
        });
        if (!result.success) throw new Error(result.error);
        if (result.approvalOnly) {
          showNotification(result.message || 'Token approval successful. Please click deposit again.', 'success');
          return;
        }
        transactionSucceeded = true;
      }

      if (transactionSucceeded) {
        showNotification('Successfully deposited', 'success');
        setDepositSuccess(true);
        setAmount('');
        setQuote(null);
        setTimeout(() => refreshBalance(), 1000);
      }
    } catch (error) {
      console.error('Bridge transaction failed');
      setTxHash('');
      setIsConfirming(false);
      let errorMessage = 'Depositing failed. Please try again.';
      if (error.code === 4001) errorMessage = 'Transaction was rejected by user.';
      else if (error.message?.includes('insufficient funds')) errorMessage = 'Insufficient funds for transaction.';
      else if (error.message?.includes('Transaction failed')) errorMessage = error.message;
      else if (chainId === 'solana') {
        if (error.message?.includes('Blockhash not found')) errorMessage = 'Transaction expired. Please try again.';
        else if (error.message?.includes('User rejected')) errorMessage = 'Transaction was rejected by user.';
        else errorMessage = 'Solana transaction failed. Please try again.';
      }
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
    }
  };

  const canBridge = () => {
    if (!isConnected) return true;
    const hasQuoteData = quote && quote.data && typeof quote.data.toTokenEstimatedUsdcValue === 'number';
    const estimatedValue = hasQuoteData ? parseFloat(quote.data.toTokenEstimatedUsdcValue) : 0;
    const passesBasicChecks = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(balance)
      && userAddress && isCorrectWalletType && isCorrectChain && estimatedValue >= 15;

    if (isNativeToken(fromToken, fromChain) && feeValidation.maxBridgeable !== null) {
      return passesBasicChecks && parseFloat(amount || '0') <= feeValidation.maxBridgeable && feeValidation.hasEnoughForFees;
    }
    return passesBasicChecks && feeValidation.hasEnoughForFees;
  };

  // Success page
  if (depositSuccess) {
    return (
      <div className="success-card">
        <div className="success-icon">
          <svg width="32" height="32" fill="none" stroke="#4ADE80" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2>Deposit Successful</h2>
        <p>Funds will show up in your App in a few minutes.</p>
        {txHash && (
          <div className="success-tx">
            <div className="success-tx-label">Transaction Hash:</div>
            <div className="success-tx-hash">{txHash}</div>
          </div>
        )}
        <button className="bridge-btn" onClick={() => { setDepositSuccess(false); setTxHash(''); refreshBalance(); }}>
          Make Another Deposit
        </button>
      </div>
    );
  }

  // No address page
  if (!userAddress) {
    return (
      <div className="no-address-card">
        <div className="no-address-icon">
          <img src="/favicon.svg" alt="Swypt" style={{ width: 32, height: 32 }} />
        </div>
        <h2>Swypt Deposit</h2>
        <p>To deposit into Swypt, follow the link in your Swypt app.</p>
      </div>
    );
  }

  const native = isNativeToken(fromToken, fromChain);
  const needsWalletSwitch = (fromChain === 'SOLANA' && chainId !== 'solana') || (fromChain !== 'SOLANA' && chainId === 'solana');

  const displayBalance = native && feeValidation.maxBridgeable !== null
    ? parseFloat(feeValidation.maxBridgeable) || 0
    : parseFloat(balance) || 0;

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="notification">
          <div className={`notification-inner ${notification.type}`}>
            <div className={`notification-dot ${notification.type}`}></div>
            <p className={`notification-msg ${notification.type}`}>{notification.message}</p>
            <button className="notification-close" onClick={() => setNotification(null)} style={{ color: notification.type === 'success' ? 'var(--green)' : notification.type === 'warning' ? '#FFC107' : 'var(--red)' }}>&times;</button>
          </div>
        </div>
      )}

      <div className="bridge-card">
        <div className="bridge-header">
          <img src="/favicon.svg" alt="Swypt" />
          <span>Deposit</span>
        </div>

        {txHash && (
          <div className={`tx-status ${isConfirming ? 'confirming' : 'confirmed'}`}>
            <div className={`tx-status-dot ${isConfirming ? 'confirming' : 'confirmed'}`}>
              {isConfirming && <div className="spinner" style={{ width: 8, height: 8, borderWidth: 1 }}></div>}
            </div>
            <div>
              <div className="tx-status-label">{isConfirming ? 'Confirming transaction...' : 'Bridge transaction submitted!'}</div>
              <div className="tx-status-hash">Transaction: {txHash}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* From Section */}
          <div>
            <label className="form-label">From</label>
            <div className="form-section">
              <div className="form-row">
                {/* Chain Dropdown */}
                <div className="chain-dropdown" style={{ position: 'relative' }}>
                  <button className="dropdown-btn" onClick={() => setShowChainDropdown(!showChainDropdown)}>
                    <span>{getChainOption(fromChain)?.label}</span>
                    <svg className={`dropdown-chevron ${showChainDropdown ? 'open' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showChainDropdown && (
                    <div className="dropdown-menu">
                      {chainOptions.map(option => (
                        <button key={option.value} className={`dropdown-option ${fromChain === option.value ? 'selected' : ''}`}
                          onClick={() => { setFromChain(option.value); setShowChainDropdown(false); }}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Balance */}
                <div className="balance-row">
                  <div className="balance-label">
                    <span>Max</span>
                    <div className="tooltip-wrap">
                      <img src="/icons/info-icon.png" alt="info" className="info-icon" />
                      <div className={`tooltip ${native ? 'wide' : ''}`}>
                        {native ? `Max amount leaving enough ${fromToken} for gas.` : `Your current ${fromToken} balance.`}
                      </div>
                    </div>
                  </div>
                  {!isConnected || needsWalletSwitch ? (
                    <span className="balance-value">...</span>
                  ) : (
                    <button className="balance-value" onClick={() => {
                      if (native && feeValidation.maxBridgeable !== null) setAmount(feeValidation.maxBridgeable.toString());
                      else setAmount(balance);
                    }}>
                      {(fromToken === 'USDC' || fromToken === 'USDT') ? displayBalance.toFixed(2) : displayBalance.toFixed(4)} {fromToken}
                    </button>
                  )}
                </div>
              </div>

              <div className="input-row">
                <input type="number" className="amount-input" value={amount}
                  onChange={(e) => setAmount(e.target.value)} placeholder="0.0" step="0.001" min="0"
                  max={native && feeValidation.maxBridgeable !== null ? feeValidation.maxBridgeable : undefined} />

                {/* Token Dropdown */}
                <div className="token-dropdown" style={{ position: 'relative' }}>
                  <button className="dropdown-btn"
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}>
                    <img src={getTokenOption(fromToken)?.logo} alt={fromToken} className="token-icon"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                    <span>{fromToken}</span>
                    <svg className={`dropdown-chevron ${showTokenDropdown ? 'open' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showTokenDropdown && (
                    <div className="dropdown-menu">
                      {tokenOptions.map(option => (
                        <button key={option.value} className={`dropdown-option ${fromToken === option.value ? 'selected' : ''}`}
                          onClick={() => { setFromToken(option.value); setShowTokenDropdown(false); }}>
                          <img src={option.logo} alt={option.label} className="token-icon"
                            onError={(e) => { e.target.style.display = 'none'; }} />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="validation-row">
                {isConnected && amount && parseFloat(amount) > parseFloat(balance) ? (
                  <span className="validation-msg">Insufficient balance</span>
                ) : isConnected && amount && quote?.data && typeof quote.data.toTokenEstimatedUsdcValue === 'number' && parseFloat(quote.data.toTokenEstimatedUsdcValue) < 15 ? (
                  <span className="validation-msg">Minimum deposit amount $15</span>
                ) : !native && !feeValidation.hasEnoughForFees && feeValidation.feeValidationError ? (
                  <span className="validation-msg">
                    Need {feeValidation.feeEstimate.toFixed(4)} {fromChain === 'SOLANA' ? 'SOL' : 'ETH'} for fees
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="arrow-divider">
            <div className="arrow-circle">
              <svg width="24" height="24" fill="none" stroke="var(--text-secondary)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* Receive Section */}
          <div className="receive-section">
            <p className="receive-label">You will receive</p>
            <p className="receive-value">
              {isLoadingQuote ? (
                <span style={{ opacity: 0.5 }}>Loading...</span>
              ) : quoteError === 'address' ? (
                <span style={{ color: 'var(--red)', fontSize: '0.75rem' }}>
                  The Swypt address is wrong.<br />Please retry by clicking the link in your app.
                </span>
              ) : quote ? (
                `~ ${parseFloat(quote.data?.toTokenEstimatedUsdcValue || '0').toFixed(2)} USDC`
              ) : quoteError ? (
                <span style={{ color: 'var(--red)' }}>Can't fetch quote</span>
              ) : amount && parseFloat(amount) > 0 ? (
                <span style={{ color: 'var(--text-secondary)' }}>Getting quote...</span>
              ) : (
                '~ 0.00 USDC'
              )}
            </p>
          </div>

          {/* Swypt Account */}
          <div className="account-section">
            <div className="account-label">
              <label className="form-label" style={{ marginBottom: 0 }}>Swypt Account</label>
              <div className="tooltip-wrap">
                <img src="/icons/info-icon.png" alt="info" className="info-icon" />
                <div className="tooltip">Your Swypt account from signup.</div>
              </div>
            </div>
            <div className="account-value">
              {userAddress || '0x... (Hyperliquid address)'}
            </div>
          </div>

          {/* Bridge Button */}
          {!isConnected ? (
            <button className="bridge-btn" onClick={handleBridge}>Connect Wallet to Deposit</button>
          ) : !isCorrectWalletType ? (
            <button className="bridge-btn" onClick={() => setShowWalletSelector(true)}>
              Connect {fromChain === 'SOLANA' ? 'Solana' : fromChain === 'ARBITRUM' ? 'Arbitrum' : 'Ethereum'} Wallet
            </button>
          ) : !isCorrectChain ? (
            <button className="bridge-btn" onClick={handleSwitchChain}>
              Switch to {CHAINS[fromChain].chainName}
            </button>
          ) : (
            <button className="bridge-btn" onClick={handleBridge} disabled={!canBridge() || isLoading || isConfirming}>
              {isLoading ? (
                <span className="bridge-btn-loading"><span className="spinner"></span>Signing Transaction</span>
              ) : isConfirming ? (
                <span className="bridge-btn-loading"><span className="spinner"></span>Confirming on Network</span>
              ) : 'Deposit'}
            </button>
          )}
        </div>

        <WalletSelector isOpen={showWalletSelector} onClose={() => setShowWalletSelector(false)} onConnect={connectWallet} />
      </div>
    </>
  );
};

export default BridgeInterface;
