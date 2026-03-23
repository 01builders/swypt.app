# Swypt

**The onchain Robinhood.** Trade crypto, bet on anything -- self-custodial, no seed phrases.

## What is Swypt?

Swypt is a mobile-first trading app that combines spot/leveraged crypto trading with prediction markets (via Hyperliquid, Polymarket, and Kalshi) in a single self-custodial interface.

## This Repo

Marketing website at [swypt.app](https://swypt.app) and deposit app at [deposit.swypt.app](https://deposit.swypt.app). Both deployed as Cloudflare Workers.

### Structure

```
src/worker.js              -- Landing page CF Worker
script.js                  -- Animations, ticker, falling icons
style.css                  -- Landing page styles
deposit/                   -- Deposit app (Vite + React)
  src/api/bridgeAPI.js     -- deBridge DLN API integration
  src/components/           -- BridgeInterface, WalletSelector
  src/utils/               -- Solana & EVM transaction handlers
  src/constants/           -- Token addresses, chain config
  wrangler.toml            -- Deposit CF Worker config
scripts/update-prices.js   -- Hourly ticker price updater
.github/workflows/
  deploy.yml               -- Auto-deploy both workers on push to main
  update-prices.yml        -- Hourly price update via CoinGecko
```

### Deposit Flow

```
User wallet (Ethereum/Solana/Arbitrum)
  → deBridge DLN (cross-chain bridge, no API key needed)
    → Arbitrum USDC at user's Privy wallet address
      → Swypt app auto-bridges to HyperCore on launch
```

Supported paths: Ethereum (ETH, USDC, USDT), Solana (USDC, SOL), Arbitrum (USDC direct transfer).

### Wallets Supported

MetaMask, Rainbow, Rabby, Coinbase Wallet, Phantom, Backpack, Solflare.

### Run Locally

```bash
# Landing page -- open index.html in browser

# Deposit app
cd deposit
npm install
npm run dev    # http://localhost:5173/?user=0xYOUR_ADDRESS
```

### Deploy

Pushes to `main` auto-deploy both workers via GitHub Actions. See `.github/workflows/deploy.yml`.

## Links

- **Website:** [swypt.app](https://swypt.app)
- **App Store:** [Swypt on iOS](https://apps.apple.com/us/app/swypt-app/id6746246646)
- **Twitter/X:** [@swyptapp](https://x.com/swyptapp)
