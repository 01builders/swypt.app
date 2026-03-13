// Solana token mint addresses
export const SOLANA_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Fee estimation constants for different chains
export const FEE_ESTIMATES = {
  'SOLANA': 0.025,      // SOL - Conservative estimate for complex bridge transactions
  'ETHEREUM': 0.01,     // ETH - Conservative estimate for high gas periods
  'ARBITRUM': 0.002     // ETH - Lower L2 fees
};

// All token options with their configurations
export const allTokenOptions = [
  {
    value: 'ETH',
    label: 'ETH',
    logo: '/icons/eth.png',
    fallback: '\u039E',
    chains: ['ETHEREUM', 'ARBITRUM']
  },
  {
    value: 'USDC',
    label: 'USDC',
    logo: '/icons/usdc.png',
    fallback: '$',
    chains: ['ETHEREUM', 'SOLANA']
  },
  {
    value: 'USDT',
    label: 'USDT',
    logo: '/icons/usdt.png',
    fallback: '$',
    chains: ['ETHEREUM', 'ARBITRUM']
  },
  {
    value: 'SOL',
    label: 'SOL',
    logo: '/icons/sol.png',
    fallback: '\u25CE',
    chains: ['SOLANA']
  }
];

// Chain options
export const chainOptions = [
  {
    value: 'ETHEREUM',
    label: 'Ethereum'
  },
  {
    value: 'ARBITRUM',
    label: 'Arbitrum'
  },
  {
    value: 'SOLANA',
    label: 'Solana'
  }
];

// Token contract addresses for ERC20 tokens
export const tokenContracts = {
  'USDC': {
    'ETHEREUM': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'ARBITRUM': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  },
  'USDT': {
    'ETHEREUM': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'ARBITRUM': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
  }
};

// Alternative Solana RPC endpoints for redundancy
export const alternativeRpcs = [
  'https://rpc.ankr.com/solana',
  'https://solana.publicnode.com',
  'https://mainnet.solana.dappio.xyz'
];
