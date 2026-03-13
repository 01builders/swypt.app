// HyBridge API integration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.hybridge.xyz';

export const getQuote = async (params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (data.success === false) {
      return data;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const executeBridge = async (params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.transactionData && params.signer) {
      const tx = await params.signer.sendTransaction(data.transactionData);
      return {
        ...data,
        transactionHash: tx.hash,
        transaction: tx
      };
    }

    return data;
  } catch (error) {
    console.error('Error executing bridge:', error);
    throw error;
  }
};

export const getBridgeStatus = async (transactionHash) => {
  try {
    const response = await fetch(`${API_BASE_URL}/status/${transactionHash}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting bridge status:', error);
    throw error;
  }
};
