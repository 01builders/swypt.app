import { ethers } from 'ethers';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { SOLANA_USDC_MINT, FEE_ESTIMATES, alternativeRpcs, tokenContracts, isNativeToken } from '../constants/bridgeConfig';

export const getTokenBalance = async (tokenType, walletProvider, walletAccount) => {
  if (!walletProvider || !walletAccount) return '0';

  try {
    if (tokenType === 'ETH') {
      const balance = await walletProvider.getBalance(walletAccount);
      return ethers.formatEther(balance);
    } else if (tokenType === 'SOL') {
      try {
        const solanaProvider = walletProvider?.solana;
        if (solanaProvider && solanaProvider.publicKey) {
          try {
            const connection = new Connection('https://rpc.ankr.com/solana');
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout')), 8000);
            });
            const balancePromise = connection.getBalance(solanaProvider.publicKey);
            const balance = await Promise.race([balancePromise, timeoutPromise]);
            return (balance / LAMPORTS_PER_SOL).toString();
          } catch (primaryError) {
            try {
              const connection = new Connection('https://solana.publicnode.com');
              const balance = await connection.getBalance(solanaProvider.publicKey);
              return (balance / LAMPORTS_PER_SOL).toString();
            } catch (fallbackError) {
              return '0';
            }
          }
        } else {
          return '0';
        }
      } catch (error) {
        return '1.5';
      }
    } else if (tokenType === 'USDC' && walletProvider?.solana) {
      try {
        const publicKey = walletProvider.solana.publicKey;
        if (!publicKey) return '0';

        for (const rpc of alternativeRpcs) {
          try {
            const connection = new Connection(rpc);
            try {
              const ataAddress = await getAssociatedTokenAddress(
                new PublicKey(SOLANA_USDC_MINT),
                publicKey
              );
              const ataInfo = await connection.getTokenAccountBalance(ataAddress);
              if (ataInfo?.value?.uiAmount !== null) {
                const rounded = Math.floor(ataInfo.value.uiAmount * 100) / 100;
                return rounded.toFixed(2);
              }
            } catch (ataError) {}

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
              publicKey,
              { mint: new PublicKey(SOLANA_USDC_MINT) }
            );
            if (tokenAccounts.value.length === 0) return '0';
            const firstAccount = tokenAccounts.value[0];
            const balance = firstAccount.account.data.parsed.info.tokenAmount.uiAmount;
            const rounded = Math.floor((balance || 0) * 100) / 100;
            return rounded.toFixed(2);
          } catch (rpcError) {
            continue;
          }
        }
        return '0';
      } catch (error) {
        return '0';
      }
    } else {
      return await getERC20Balance(tokenType, walletProvider, walletAccount);
    }
  } catch (error) {
    console.error('Balance fetch error');
    return '0';
  }
};

const getERC20Balance = async (tokenType, provider, account) => {
  try {
    const network = await provider.getNetwork();
    const chainIdNum = Number(network.chainId);

    let contractAddress;
    if (chainIdNum === 1) {
      contractAddress = tokenContracts[tokenType]?.ETHEREUM;
    } else if (chainIdNum === 42161) {
      contractAddress = tokenContracts[tokenType]?.ARBITRUM;
    }

    if (!contractAddress) return '0';

    const erc20ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];

    const contract = new ethers.Contract(contractAddress, erc20ABI, provider);
    const [balance, decimals] = await Promise.all([contract.balanceOf(account), contract.decimals()]);
    const formattedBalance = ethers.formatUnits(balance, decimals);

    if (tokenType === 'USDC' || tokenType === 'USDT') {
      const rounded = Math.floor(parseFloat(formattedBalance) * 100) / 100;
      return rounded.toFixed(2);
    }

    return formattedBalance;
  } catch (error) {
    return '0';
  }
};

export const validateFees = async ({
  isConnected, balance, fromChain, fromToken, provider, account, nativeBalance
}) => {
  if (!isConnected || !balance || !fromChain || !fromToken) {
    return { isValid: true, hasNativeFee: false, message: '', feeAmount: 0 };
  }

  try {
    const estimatedFee = FEE_ESTIMATES[fromChain];
    if (!estimatedFee) {
      return { isValid: true, hasNativeFee: false, message: '', feeAmount: 0 };
    }

    if (isNativeToken(fromToken, fromChain)) {
      return { isValid: true, hasNativeFee: false, message: '', feeAmount: estimatedFee };
    }

    if ((fromChain === 'ETHEREUM' || fromChain === 'ARBITRUM') && provider && account) {
      const ethBalance = await provider.getBalance(account);
      const ethBalanceFormatted = parseFloat(ethers.formatEther(ethBalance));
      if (ethBalanceFormatted < estimatedFee) {
        return {
          isValid: false, hasNativeFee: true,
          message: `Need at least ${estimatedFee} ETH for gas fees`,
          feeAmount: estimatedFee
        };
      }
    } else if (fromChain === 'SOLANA' && fromToken !== 'SOL') {
      const solBalance = parseFloat(nativeBalance || '0');
      if (solBalance < estimatedFee) {
        return {
          isValid: false, hasNativeFee: true,
          message: `Need at least ${estimatedFee} SOL for transaction fees`,
          feeAmount: estimatedFee
        };
      }
    }

    return { isValid: true, hasNativeFee: true, message: '', feeAmount: estimatedFee };
  } catch (error) {
    return { isValid: true, hasNativeFee: false, message: '', feeAmount: 0 };
  }
};

export const calculateMaxBridgeAmount = (balance, fromToken, fromChain) => {
  if (!balance || isNaN(parseFloat(balance))) return '0';

  const balanceNum = parseFloat(balance);
  const estimatedFee = FEE_ESTIMATES[fromChain] || 0;

  if (isNativeToken(fromToken, fromChain)) {
    return Math.max(0, balanceNum - estimatedFee).toString();
  }

  return balance;
};
