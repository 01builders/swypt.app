// deBridge DLN API integration
import {
  DEBRIDGE_CHAIN_IDS, DST_CHAIN_ID, DST_USDC,
  TOKEN_DECIMALS, getSourceTokenAddress, tokenContracts,
} from '../constants/bridgeConfig';

const DLN_API = 'https://api.dln.trade/v1.0';

// Convert human-readable amount to smallest unit string
const toSmallestUnit = (amount, token) => {
  const decimals = TOKEN_DECIMALS[token];
  return BigInt(Math.round(parseFloat(amount) * 10 ** decimals)).toString();
};

// Build deBridge query params from app params
const buildDlnParams = ({ fromAddress, toAddress, fromChain, fromToken, amount }) => {
  const srcChainId = DEBRIDGE_CHAIN_IDS[fromChain];
  const srcChainTokenIn = getSourceTokenAddress(fromToken, fromChain);
  if (!srcChainId || !srcChainTokenIn) {
    throw new Error(`Unsupported chain/token: ${fromChain}/${fromToken}`);
  }
  return new URLSearchParams({
    srcChainId: srcChainId.toString(),
    srcChainTokenIn,
    srcChainTokenInAmount: toSmallestUnit(amount, fromToken),
    dstChainId: DST_CHAIN_ID.toString(),
    dstChainTokenOut: DST_USDC,
    dstChainTokenOutAmount: 'auto',
    dstChainTokenOutRecipient: toAddress,
    prependOperatingExpenses: 'true',
  });
};

// Check if this is a same-chain Arbitrum USDC transfer (no bridge needed)
const isArbitrumDirectTransfer = (fromChain, fromToken) =>
  fromChain === 'ARBITRUM' && fromToken === 'USDC';

// Get bridge quote for preview
export const getQuote = async (params) => {
  // Arbitrum USDC → Arbitrum: no bridge, return amount directly
  if (isArbitrumDirectTransfer(params.fromChain, params.fromToken)) {
    const amount = parseFloat(params.amount);
    return { success: true, data: { toTokenEstimatedUsdcValue: amount } };
  }

  const dlnParams = buildDlnParams(params);
  const response = await fetch(`${DLN_API}/dln/order/quote?${dlnParams}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { success: false, message: error.errorMessage || `Quote failed (${response.status})` };
  }

  const data = await response.json();
  return {
    success: true,
    data: {
      toTokenEstimatedUsdcValue: data.estimation.dstChainTokenOut.recommendedApproximateUsdValue,
    },
  };
};

// Create executable transaction for deposit
export const createTransaction = async (params) => {
  // Arbitrum USDC → Arbitrum: construct ERC20 transfer directly
  if (isArbitrumDirectTransfer(params.fromChain, params.fromToken)) {
    const amount = parseFloat(params.amount);
    const amountSmallest = toSmallestUnit(params.amount, 'USDC');
    // Encode USDC.transfer(toAddress, amount)
    // transfer(address,uint256) selector = 0xa9059cbb
    const paddedTo = params.toAddress.slice(2).toLowerCase().padStart(64, '0');
    const paddedAmount = BigInt(amountSmallest).toString(16).padStart(64, '0');
    const data = '0xa9059cbb' + paddedTo + paddedAmount;
    return {
      success: true,
      data: {
        tx: { to: tokenContracts.USDC.ARBITRUM, data, value: '0' },
        toTokenEstimatedUsdcValue: amount,
      },
    };
  }

  const dlnParams = buildDlnParams(params);
  dlnParams.set('srcChainOrderAuthorityAddress', params.fromAddress);
  dlnParams.set('dstChainOrderAuthorityAddress', params.toAddress);

  const response = await fetch(`${DLN_API}/dln/order/create-tx?${dlnParams}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { success: false, message: error.errorMessage || `Transaction creation failed (${response.status})` };
  }

  const data = await response.json();
  return {
    success: true,
    data: {
      tx: data.tx,
      toTokenEstimatedUsdcValue: data.estimation.dstChainTokenOut.recommendedApproximateUsdValue,
      orderId: data.orderId,
    },
  };
};

// Poll deBridge order status (for post-bridge tracking)
export const getOrderStatus = async (txHash) => {
  const orderIdsRes = await fetch(
    `https://stats-api.dln.trade/api/Transaction/${txHash}/orderIds`
  );
  if (!orderIdsRes.ok) return { status: 'pending', orderId: null };

  const { orderIds } = await orderIdsRes.json();
  if (!orderIds?.length) return { status: 'pending', orderId: null };

  const orderId = orderIds[0];
  const orderRes = await fetch(`https://stats-api.dln.trade/api/Orders/${orderId}`);
  if (!orderRes.ok) return { status: 'pending', orderId };

  const orderData = await orderRes.json();
  return { status: orderData.state, orderId };
};
