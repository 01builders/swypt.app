# Swypt

**The onchain Robinhood.** Trade crypto, bet on anything -- self-custodial, no seed phrases.

## What is Swypt?

Swypt is a mobile-first trading app that combines spot/leveraged crypto trading with prediction markets (via Hyperliquid, Polymarket, and Kalshi) in a single self-custodial interface.

## Website

This repo contains the [swypt.app](https://swypt.app) landing page. It's a static site deployed via GitHub Pages.

### Structure

```
index.html      -- Main landing page
style.css       -- Styles
script.js       -- Animations, ticker, falling icons
favicon.svg     -- Logo/favicon
assets/logos/   -- Crypto token and platform logos
```

### Run locally

Open `index.html` in a browser. No build step required.

### Deploy

Pushes to `main` auto-deploy via GitHub Actions to GitHub Pages. See `.github/workflows/deploy.yml`.

## Links

- **Website:** [swypt.app](https://swypt.app)
- **Twitter/X:** [@swyptapp](https://x.com/swyptapp)
