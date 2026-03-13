import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';

const CHAINS = {
  ETHEREUM: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_PROJECT_ID'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  ARBITRUM: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  SOLANA: {
    chainId: 'solana',
    chainName: 'Solana Mainnet',
    nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
    rpcUrls: [
      'https://api.mainnet-beta.solana.com',
      'https://rpc.ankr.com/solana',
      'https://solana.publicnode.com',
      'https://mainnet.solana.dappio.xyz'
    ],
    blockExplorerUrls: ['https://solscan.io']
  }
};

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const isWalletInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setSigner(null);
    setProvider(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletName');
  }, []);

  const connectWallet = useCallback(async (providerInstance = window.ethereum, walletName = 'Wallet') => {
    if (!providerInstance) {
      alert('No wallet provider found');
      return;
    }

    setIsConnecting(true);
    try {
      // Handle Backpack wallet
      if (walletName === 'Backpack' && providerInstance.solana) {
        try {
          const resp = await providerInstance.solana.connect();
          setAccount(resp.publicKey.toString());
          setChainId('solana');
          setProvider(providerInstance);
          setSigner(providerInstance.solana);
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('walletName', walletName);
          setIsConnecting(false);
          return;
        } catch (backpackError) {
          console.error('Wallet connection error: Backpack');
          setIsConnecting(false);
          throw backpackError;
        }
      }

      // Handle Phantom wallet
      if (walletName === 'Phantom' && providerInstance.solana) {
        try {
          const resp = await providerInstance.solana.connect();
          setAccount(resp.publicKey.toString());
          setChainId('solana');
          setProvider(providerInstance);
          setSigner(providerInstance.solana);
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('walletName', walletName);
          setIsConnecting(false);
          return;
        } catch (phantomError) {
          console.error('Wallet connection error: Phantom');
          setIsConnecting(false);
          throw phantomError;
        }
      }

      // Handle Ethereum-compatible wallets
      const ethProvider = providerInstance.ethereum || providerInstance;
      const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        setAccount(accounts[0]);

        try {
          const web3Provider = new ethers.BrowserProvider(providerInstance);
          setProvider(web3Provider);
          const web3Signer = await web3Provider.getSigner();
          setSigner(web3Signer);
          const network = await web3Provider.getNetwork();
          const hexChainId = '0x' + network.chainId.toString(16);
          setChainId(hexChainId);
        } catch (providerError) {
          return;
        }

        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletName', walletName);
      }
    } catch (error) {
      if (!error.message?.includes('chrome.runtime.sendMessage')) {
        console.error('Wallet connection failed');
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchChain = useCallback(async (targetChainId) => {
    if (!isWalletInstalled()) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        const chainConfig = Object.values(CHAINS).find(chain => chain.chainId === targetChainId);
        if (chainConfig) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig]
            });
          } catch (addError) {
            console.error('Chain switch failed');
          }
        }
      }
    }
  }, []);

  const getBalance = useCallback(async (address = account) => {
    if (!provider || !address) return '0';
    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      return '0';
    }
  }, [provider, account]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!isWalletInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        localStorage.removeItem('walletConnected');
        setAccount(null);
        setChainId(null);
        setSigner(null);
        setProvider(null);
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    try {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    } catch (error) {}

    return () => {
      try {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      } catch (error) {}
    };
  }, []);

  // Auto-connect
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      const walletName = localStorage.getItem('walletName');
      if (!wasConnected || !walletName) return;

      try {
        if (walletName === 'Backpack') {
          if (!window.backpack?.solana?.publicKey) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          if (window.backpack?.solana) {
            try {
              if (window.backpack.solana.publicKey && window.backpack.solana.isConnected) {
                setAccount(window.backpack.solana.publicKey.toString());
                setChainId('solana');
                setProvider({ solana: window.backpack.solana, ethereum: window.ethereum?.providers?.find(p => p.isBackpack) });
                setSigner(window.backpack.solana);
                return;
              }
              const resp = await window.backpack.solana.connect({ onlyIfTrusted: true });
              if (resp && resp.publicKey) {
                setAccount(resp.publicKey.toString());
                setChainId('solana');
                setProvider({ solana: window.backpack.solana, ethereum: window.ethereum?.providers?.find(p => p.isBackpack) });
                setSigner(window.backpack.solana);
                return;
              }
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('walletName');
            } catch (e) {
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('walletName');
            }
          } else {
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletName');
          }
          return;
        }

        if (walletName === 'Phantom') {
          if (!window.phantom?.solana?.publicKey) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          if (window.phantom?.solana) {
            try {
              if (window.phantom.solana.publicKey && window.phantom.solana.isConnected) {
                setAccount(window.phantom.solana.publicKey.toString());
                setChainId('solana');
                setProvider({ solana: window.phantom.solana, ethereum: window.ethereum?.providers?.find(p => p.isPhantom) });
                setSigner(window.phantom.solana);
                return;
              }
              const resp = await window.phantom.solana.connect({ onlyIfTrusted: true });
              if (resp && resp.publicKey) {
                setAccount(resp.publicKey.toString());
                setChainId('solana');
                setProvider({ solana: window.phantom.solana, ethereum: window.ethereum?.providers?.find(p => p.isPhantom) });
                setSigner(window.phantom.solana);
                return;
              }
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('walletName');
            } catch (e) {
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('walletName');
            }
          } else {
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletName');
          }
          return;
        }

        if (!isWalletInstalled()) return;
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {}
    };

    autoConnect();
  }, [connectWallet]);

  const value = useMemo(() => ({
    account, chainId, isConnecting, provider, signer,
    isConnected: !!account,
    isWalletInstalled: isWalletInstalled(),
    connectWallet, disconnectWallet, switchChain, getBalance, CHAINS
  }), [account, chainId, isConnecting, provider, signer, connectWallet, disconnectWallet, switchChain, getBalance]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
