import React, { useState, useEffect } from 'react';

const WalletSelector = ({ isOpen, onClose, onConnect }) => {
  const [availableWallets, setAvailableWallets] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const walletProviders = [
      {
        name: 'MetaMask', id: 'metamask', icon: '\uD83E\uDD8A',
        checkProvider: () => {
          if (window.ethereum?.providers) {
            if (window.ethereum.providers.some(p => p.isMetaMask && !p.isRainbow && !p.isRabby && !p.isCoinbaseWallet && !p.isPhantom && !p.isBackpack)) return true;
          }
          if (window.ethereum?.isMetaMask && !window.ethereum?.isRainbow && !window.ethereum?.isRabby && !window.ethereum?.isCoinbaseWallet && !window.ethereum?.isPhantom && !window.ethereum?.isBackpack && !window.phantom?.solana) return true;
          return false;
        },
        getProvider: () => {
          if (window.ethereum?.providers) {
            const p = window.ethereum.providers.find(p => p.isMetaMask && !p.isRainbow && !p.isRabby && !p.isCoinbaseWallet && !p.isPhantom && !p.isBackpack);
            if (p) return p;
            const any = window.ethereum.providers.find(p => p.isMetaMask);
            if (any) return any;
          }
          if (window.ethereum?.isMetaMask) return window.ethereum;
          return null;
        }
      },
      {
        name: 'Rainbow', id: 'rainbow', icon: '\uD83C\uDF08',
        checkProvider: () => {
          if (window.rainbow) return true;
          if (window.ethereum?.isRainbow) return true;
          if (window.ethereum?.providers?.some(p => p.isRainbow)) return true;
          return false;
        },
        getProvider: () => {
          if (window.rainbow?.ethereum) return window.rainbow.ethereum;
          if (window.ethereum?.providers) {
            const p = window.ethereum.providers.find(p => p.isRainbow);
            if (p) return p;
          }
          if (window.ethereum?.isRainbow) return window.ethereum;
          return null;
        }
      },
      {
        name: 'Rabby', id: 'rabby', icon: '\uD83D\uDC30',
        checkProvider: () => {
          if (window.ethereum?.providers?.some(p => p.isRabby)) return true;
          if (window.ethereum?.isRabby) return true;
          return false;
        },
        getProvider: () => {
          if (window.ethereum?.providers) {
            const p = window.ethereum.providers.find(p => p.isRabby);
            if (p) return p;
          }
          if (window.ethereum?.isRabby) return window.ethereum;
          return null;
        }
      },
      {
        name: 'Coinbase Wallet', id: 'coinbase', icon: '\uD83D\uDD35',
        checkProvider: () => {
          if (window.ethereum?.providers?.some(p => p.isCoinbaseWallet)) return true;
          if (window.ethereum?.isCoinbaseWallet) return true;
          return false;
        },
        getProvider: () => {
          if (window.ethereum?.providers) return window.ethereum.providers.find(p => p.isCoinbaseWallet);
          return window.ethereum?.isCoinbaseWallet ? window.ethereum : null;
        }
      },
      {
        name: 'Backpack', id: 'backpack', icon: '\uD83C\uDF92',
        checkProvider: () => {
          if (window.backpack?.solana) return true;
          if (window.ethereum?.providers?.some(p => p.isBackpack)) return true;
          if (window.ethereum?.isBackpack) return true;
          return false;
        },
        getProvider: () => {
          if (window.backpack?.solana) {
            return {
              solana: window.backpack.solana,
              ethereum: window.ethereum?.providers?.find(p => p.isBackpack) || (window.ethereum?.isBackpack ? window.ethereum : null)
            };
          }
          if (window.ethereum?.providers) return window.ethereum.providers.find(p => p.isBackpack);
          return window.ethereum?.isBackpack ? window.ethereum : null;
        }
      },
      {
        name: 'Phantom', id: 'phantom', icon: '\uD83D\uDC7B',
        checkProvider: () => {
          if (window.phantom?.solana) return true;
          if (window.ethereum?.providers?.some(p => p.isPhantom)) return true;
          if (window.ethereum?.isPhantom) return true;
          return false;
        },
        getProvider: () => {
          if (window.phantom?.solana) {
            return {
              solana: window.phantom.solana,
              ethereum: window.ethereum?.providers?.find(p => p.isPhantom) || (window.ethereum?.isPhantom ? window.ethereum : null)
            };
          }
          if (window.ethereum?.providers) return window.ethereum.providers.find(p => p.isPhantom);
          return window.ethereum?.isPhantom ? window.ethereum : null;
        }
      }
    ];

    const detected = [];
    walletProviders.forEach(wallet => {
      try {
        if (wallet.checkProvider()) detected.push(wallet);
      } catch (error) {}
    });
    setAvailableWallets(detected);
  }, [isOpen]);

  const handleWalletSelect = async (wallet) => {
    try {
      const provider = wallet.getProvider();
      if (!provider) {
        alert(`Could not connect to ${wallet.name}. Please make sure it's properly installed.`);
        return;
      }
      await onConnect(provider, wallet.name);
      onClose();
    } catch (error) {
      if (!error.message?.includes('chrome.runtime.sendMessage')) {
        alert(`Failed to connect to ${wallet.name}. Please try again.`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connect Wallet</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="mobile-banner">
          <div className="mobile-banner-inner">
            <div className="mobile-banner-dot"></div>
            <p>For full functionality, please visit this page on Desktop</p>
          </div>
        </div>

        {availableWallets.length > 0 ? (
          <div className="wallet-list">
            {availableWallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet)}
                className="wallet-btn"
              >
                <span className="wallet-icon">{wallet.icon}</span>
                <span>{wallet.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="no-wallets">
            <p>No compatible wallets detected.</p>
            <p>Please install MetaMask, Rainbow, Rabby, Coinbase Wallet, Backpack, or Phantom.</p>
          </div>
        )}

        <div className="modal-footer">
          By connecting a wallet, you agree to our Terms of Service.
        </div>
      </div>
    </div>
  );
};

export default WalletSelector;
