// deBridge DLN API integration
import {
  DEBRIDGE_CHAIN_IDS, TOKEN_DECIMALS, getDestinationConfig,
  getSourceTokenAddress, tokenContracts,
} from '../constants/bridgeConfig';

const DLN_API = 'https://api.dln.trade/v1.0';

// Convert human-readable amount to smallest unit string
const toSmallestUnit = (amount, token) => {
  const decimals = TOKEN_DECIMALS[token];
  return BigInt(Math.round(parseFloat(amount) * 10 ** decimals)).toString();
};

// Build deBridge query params from app params
const buildDlnParams = ({ fromAddress, toAddress, fromChain, fromToken, amount, target }) => {
  const destination = getDestinationConfig(target);
  const srcChainId = DEBRIDGE_CHAIN_IDS[fromChain];
  const srcChainTokenIn = getSourceTokenAddress(fromToken, fromChain);
  if (!srcChainId || !srcChainTokenIn) {
    throw new Error(`Unsupported chain/token: ${fromChain}/${fromToken}`);
  }
  return new URLSearchParams({
    srcChainId: srcChainId.toString(),
    srcChainTokenIn,
    srcChainTokenInAmount: toSmallestUnit(amount, fromToken),
    dstChainId: destination.chainId.toString(),
    dstChainTokenOut: destination.tokenAddress,
    dstChainTokenOutAmount: 'auto',
    dstChainTokenOutRecipient: toAddress,
    prependOperatingExpenses: 'true',
  });
};

const getDirectTransferConfig = ({ fromChain, fromToken, target }) => {
  const destination = getDestinationConfig(target);
  if (fromToken !== 'USDC') return null;
  if (fromChain !== destination.chain) return null;
  return {
    destination,
    tokenAddress: tokenContracts.USDC[fromChain]
  };
};

// Get bridge quote for preview
export const getQuote = async (params) => {
  const directTransfer = getDirectTransferConfig(params);
  if (directTransfer) {
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
  const directTransfer = getDirectTransferConfig(params);
  if (directTransfer) {
    const amount = parseFloat(params.amount);
    const amountSmallest = toSmallestUnit(params.amount, 'USDC');
    const paddedTo = params.toAddress.slice(2).toLowerCase().padStart(64, '0');
    const paddedAmount = BigInt(amountSmallest).toString(16).padStart(64, '0');
    const data = '0xa9059cbb' + paddedTo + paddedAmount;
    return {
      success: true,
      data: {
        tx: { to: directTransfer.tokenAddress, data, value: '0' },
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
