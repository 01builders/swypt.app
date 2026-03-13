import { ethers } from 'ethers';
import { tokenContracts } from '../constants/bridgeConfig';

export const handleEvmTransaction = async ({
  signer, transactionData, fromToken, amount, onProgress = () => {}, provider
}) => {
  if (!signer) throw new Error('EVM signer not available');

  try {
    // For ERC20 tokens, check and handle approval first
    if (fromToken === 'USDC' || fromToken === 'USDT') {
      const network = await provider.getNetwork();
      const chainIdNum = Number(network.chainId);
      const chainName = chainIdNum === 1 ? 'ETHEREUM' : chainIdNum === 42161 ? 'ARBITRUM' : null;
      const tokenAddress = tokenContracts[fromToken]?.[chainName];

      if (!tokenAddress) throw new Error(`No token address found for ${fromToken} on ${chainName}`);

      const erc20ABI = [
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)'
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      const userAddress = await signer.getAddress();
      const spenderAddress = transactionData.to;
      const currentAllowance = await tokenContract.allowance(userAddress, spenderAddress);

      if (currentAllowance < amountInWei) {
        onProgress?.({ status: 'approving' });
        const approveTx = await tokenContract.approve(spenderAddress, amountInWei);
        await approveTx.wait();
        onProgress?.({ status: 'approved' });

        return {
          success: true,
          approvalOnly: true,
          txHash: approveTx.hash,
          message: 'USDC approval successful. Please click deposit again to complete the bridge.'
        };
      }
    }

    // Estimate gas
    const transactionForEstimation = {
      to: transactionData.to,
      value: transactionData.value,
      data: transactionData.data,
    };

    let gasLimit, gasPrice;
    try {
      gasLimit = await signer.estimateGas(transactionForEstimation);
      const isApprovalTx = transactionData.data && !transactionData.value;
      const minGasLimit = isApprovalTx ? 100000n : 300000n;
      if (gasLimit < minGasLimit) gasLimit = minGasLimit;

      try {
        if (provider && typeof provider.getFeeData === 'function') {
          const feeData = await provider.getFeeData();
          gasPrice = feeData.gasPrice;
        } else {
          gasPrice = await provider.getGasPrice();
        }
      } catch (feeError) {
        gasPrice = await provider.getGasPrice();
      }
      const estimatedFee = gasLimit * gasPrice;

      if (gasPrice && gasLimit) {
        if (fromToken === 'ETH') {
          const ethBalance = await provider.getBalance(await signer.getAddress());
          const totalNeeded = ethers.parseEther(amount) + estimatedFee;
          if (ethBalance < totalNeeded) {
            const shortfall = ethers.formatEther(totalNeeded - ethBalance);
            throw new Error(`Insufficient ETH. You need ${shortfall} more ETH for this transaction (including gas fees).`);
          }
        } else {
          const ethBalance = await provider.getBalance(await signer.getAddress());
          if (ethBalance < estimatedFee) {
            const needed = ethers.formatEther(estimatedFee);
            const current = ethers.formatEther(ethBalance);
            throw new Error(`Insufficient ETH for gas fees. Need ${needed} ETH, have ${current} ETH.`);
          }
        }
      }
    } catch (gasError) {
      if (gasError.message?.includes('eth_maxPriorityFeePerGas') || gasError.message?.includes('gas')) {
        if (!gasPrice) {
          try {
            gasLimit = 500000n;
            gasPrice = await provider.getGasPrice();
          } catch (fallbackError) {
            throw new Error('Unable to estimate gas. Please try again.');
          }
        } else {
          gasLimit = 500000n;
        }
      } else {
        throw gasError;
      }
    }

    const transaction = {
      to: transactionData.to,
      value: transactionData.value,
      data: transactionData.data,
      gasLimit: gasLimit,
      gasPrice: gasPrice
    };

    onProgress?.({ status: 'signing' });
    const txResponse = await signer.sendTransaction(transaction);
    onProgress?.({ status: 'confirming', txHash: txResponse.hash });
    const receipt = await txResponse.wait();
    onProgress?.({ status: 'confirmed' });

    return { success: true, txHash: txResponse.hash, receipt: receipt };

  } catch (error) {
    let errorMessage = 'Transaction failed';
    if (error.code === 4001) {
      errorMessage = 'Transaction was rejected by user.';
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for transaction and gas fees.';
    } else if (error.message?.includes('Unable to estimate gas')) {
      errorMessage = error.message;
    } else if (error.message?.includes('nonce')) {
      errorMessage = 'Transaction failed due to nonce error. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
};
