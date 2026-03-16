import React, { useState } from 'react';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import BridgeInterface from './components/BridgeInterface';
import WalletSelector from './components/WalletSelector';
import './styles/theme.css';

function WalletStatus() {
  const { account, isConnected, disconnectWallet, connectWallet } = useWallet();
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  if (!isConnected) return (
    <>
      <button className="connect-wallet-btn" onClick={() => setShowWalletSelector(true)}>
        Connect Wallet
      </button>
      <WalletSelector isOpen={showWalletSelector} onClose={() => setShowWalletSelector(false)} onConnect={connectWallet} />
    </>
  );

  const short = account.slice(0, 6) + '...' + account.slice(-4);
  return (
    <div className="wallet-connected">
      <span className="wallet-address">{short}</span>
      <button className="disconnect-btn" onClick={disconnectWallet}>Disconnect</button>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Nav */}
        <nav className="deposit-nav">
          <div className="deposit-nav-inner">
            <a href="https://swypt.app" className="deposit-logo">
              <img src="/favicon.svg" alt="Swypt logo" />
              swypt
            </a>
            <WalletStatus />
          </div>
        </nav>

        {/* Main */}
        <main className="deposit-main">
          <BridgeInterface />
        </main>

        {/* Footer */}
        <footer className="deposit-footer">
          <div className="deposit-footer-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <a href="https://swypt.app" className="deposit-logo" style={{ fontSize: '1.2rem' }}>
                <img src="/favicon.svg" alt="Swypt logo" style={{ width: 24, height: 22 }} />
                swypt
              </a>
              <span className="deposit-footer-copy">&copy; 2026 Swypt. All rights reserved.</span>
            </div>
            <ul className="deposit-footer-links">
              <li><a href="https://swypt.app/privacy.html">Privacy</a></li>
              <li><a href="https://swypt.app/terms.html">Terms</a></li>
              <li><a href="https://swypt.app/support.html">Support</a></li>
              <li><a href="https://x.com/swyptapp" target="_blank" rel="noopener noreferrer">X</a></li>
            </ul>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}

export default App;
