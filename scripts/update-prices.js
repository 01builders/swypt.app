const fs = require('fs');
const path = require('path');

const SYMBOL_TO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  LINK: 'chainlink',
  SUI: 'sui',
  AVAX: 'avalanche-2',
  TON: 'the-open-network',
  DOT: 'polkadot',
  TRX: 'tron',
  ARB: 'arbitrum',
  SHIB: 'shiba-inu',
  UNI: 'uniswap',
  NEAR: 'near',
  PEPE: 'pepe',
  ATOM: 'cosmos',
  XMR: 'monero',
  ZEC: 'zcash',
  JUP: 'jupiter-exchange-solana',
  PENGU: 'pudgy-penguins',
};

const ID_TO_SYMBOL = Object.fromEntries(
  Object.entries(SYMBOL_TO_ID).map(([sym, id]) => [id, sym])
);

function formatPrice(price) {
  if (price >= 1000) return '$' + Math.round(price).toLocaleString('en-US');
  if (price >= 1) return '$' + price.toFixed(2);
  if (price >= 0.01) {
    // 3-4 significant digits
    const s = price.toPrecision(3);
    return '$' + parseFloat(s).toString();
  }
  // < 0.01: 3 significant figures
  return '$' + parseFloat(price.toPrecision(3)).toFixed(
    Math.max(0, -Math.floor(Math.log10(price)) + 2)
  );
}

function formatChange(change) {
  const sign = change >= 0 ? '+' : '';
  return sign + change.toFixed(1) + '%';
}

async function main() {
  const ids = Object.values(SYMBOL_TO_ID).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`CoinGecko API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const data = await res.json();

  const scriptPath = path.join(__dirname, '..', 'script.js');
  let content = fs.readFileSync(scriptPath, 'utf8');
  let changed = false;

  for (const [coinId, values] of Object.entries(data)) {
    const symbol = ID_TO_SYMBOL[coinId];
    if (!symbol) continue;

    const price = values.usd;
    const change24h = values.usd_24h_change;
    if (price == null || change24h == null) continue;

    const formattedPrice = formatPrice(price);
    const formattedChange = formatChange(change24h);
    const up = change24h >= 0;

    // Match line with this symbol and replace price, change, up
    const re = new RegExp(
      `(\\{\\s*type:'price',\\s*symbol:'${symbol}',\\s*)price:'[^']*',\\s*change:'[^']*',\\s*up:\\w+(,)`
    );
    const newContent = content.replace(re, (_, before, after) =>
      `${before}price:'${formattedPrice}', change:'${formattedChange}', up:${up}${after}`
    );
    if (newContent !== content) {
      changed = true;
      content = newContent;
    }
  }

  if (!changed) {
    console.log('No price changes');
    process.exit(1);
  }

  fs.writeFileSync(scriptPath, content, 'utf8');
  console.log('Prices updated in script.js');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
