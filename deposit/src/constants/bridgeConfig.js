// Solana token mint addresses
export const SOLANA_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Fee estimation constants for different chains
export const FEE_ESTIMATES = {
  'SOLANA': 0.025,      // SOL - Conservative estimate for complex bridge transactions
  'ETHEREUM': 0.01,     // ETH - Conservative estimate for high gas periods
  'ARBITRUM': 0.002,    // ETH - Lower L2 fees
  'POLYGON': 0.02       // POL - Conservative estimate for Polygon fees
};

// All token options with their configurations
export const allTokenOptions = [
  {
    value: 'ETH',
    label: 'ETH',
    logo: '/icons/eth.png',
    fallback: '\u039E',
    chains: ['ETHEREUM']
  },
  {
    value: 'USDC',
    label: 'USDC',
    logo: '/icons/usdc.png',
    fallback: '$',
    chains: ['ETHEREUM', 'ARBITRUM', 'POLYGON', 'SOLANA']
  },
  {
    value: 'USDT',
    label: 'USDT',
    logo: '/icons/usdt.png',
    fallback: '$',
    chains: ['ETHEREUM']
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
    value: 'POLYGON',
    label: 'Polygon'
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
    'ARBITRUM': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'POLYGON': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
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

// deBridge DLN chain IDs
export const DEBRIDGE_CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  POLYGON: 137,
  SOLANA: 7565164,
};

export const DESTINATION_TARGETS = {
  hyperliquid: {
    value: 'hyperliquid',
    label: 'Hyperliquid',
    chain: 'ARBITRUM',
    chainId: 42161,
    token: 'USDC',
    tokenAddress: tokenContracts.USDC.ARBITRUM
  },
  polygon: {
    value: 'polygon',
    label: 'Polymarket',
    chain: 'POLYGON',
    chainId: 137,
    token: 'USDC.e',
    tokenAddress: tokenContracts.USDC.POLYGON
  }
};

export const getDestinationConfig = (target = 'hyperliquid') =>
  DESTINATION_TARGETS[target] || DESTINATION_TARGETS.hyperliquid;

// Token decimals for amount conversion to smallest unit
export const TOKEN_DECIMALS = {
  USDC: 6, USDT: 6, ETH: 18, SOL: 9,
};

// deBridge native token addresses
export const NATIVE_TOKEN_ADDRESS = {
  EVM: '0x0000000000000000000000000000000000000000',
  SOLANA: '11111111111111111111111111111111',
};

// Resolve token + chain to deBridge-compatible token address
export const getSourceTokenAddress = (token, chain) => {
  if (token === 'ETH') return NATIVE_TOKEN_ADDRESS.EVM;
  if (token === 'SOL') return NATIVE_TOKEN_ADDRESS.SOLANA;
  if (token === 'USDC' && chain === 'SOLANA') return SOLANA_USDC_MINT;
  return tokenContracts[token]?.[chain] || null;
};

// Check if a token is the native token for its chain
export const isNativeToken = (token, chain) =>
  (token === 'SOL' && chain === 'SOLANA') ||
  (token === 'ETH' && (chain === 'ETHEREUM' || chain === 'ARBITRUM'));
