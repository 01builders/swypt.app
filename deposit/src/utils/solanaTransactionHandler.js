import { Connection, Transaction, VersionedTransaction, MessageV0 } from '@solana/web3.js';
import { alternativeRpcs } from '../constants/bridgeConfig';

const hexToBytes = (hex) => {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return bytes;
};

export const handleSolanaTransaction = async ({
  provider, transactionData, onProgress = () => {}
}) => {
  const solanaProvider = provider?.solana;
  if (!solanaProvider) throw new Error('Solana provider not available');

  try {
    let transaction;

    const rawHex = transactionData.data || (typeof transactionData === 'string' ? transactionData : null);
    if (rawHex) {
      const bytes = hexToBytes(rawHex);
      try {
        transaction = VersionedTransaction.deserialize(bytes);
      } catch (versionedError) {
        try {
          transaction = Transaction.from(bytes);
        } catch (legacyError) {
          throw new Error('Transaction deserialization failed');
        }
      }
    } else if (typeof transactionData !== 'string') {
      transaction = transactionData;
    }

    // Refresh blockhash
    try {
      let freshBlockhash = null;
      for (const rpc of alternativeRpcs) {
        try {
          const connection = new Connection(rpc);
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          freshBlockhash = blockhash;
          break;
        } catch (rpcError) {
          continue;
        }
      }

      if (freshBlockhash) {
        if (transaction instanceof Transaction) {
          transaction.recentBlockhash = freshBlockhash;
        } else if (transaction instanceof VersionedTransaction) {
          try {
            const originalMessage = transaction.message;
            const newMessage = new MessageV0({
              header: originalMessage.header,
              staticAccountKeys: originalMessage.staticAccountKeys,
              recentBlockhash: freshBlockhash,
              compiledInstructions: originalMessage.compiledInstructions,
              addressTableLookups: originalMessage.addressTableLookups || []
            });
            transaction = new VersionedTransaction(newMessage);
          } catch (updateError) {}
        }
      }
    } catch (blockhashError) {}

    // Send with retry logic
    let solanaResponse;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const isPhantom = !!window.solana?.isPhantom;

        let sendOptions;
        if (attempts === 1) {
          sendOptions = isPhantom
            ? { skipPreflight: true, preflightCommitment: 'confirmed', maxRetries: 3 }
            : { skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 };
        } else if (attempts === 2) {
          sendOptions = { skipPreflight: true, preflightCommitment: 'confirmed', maxRetries: 3 };
        } else {
          sendOptions = { skipPreflight: true, preflightCommitment: 'processed', maxRetries: 0 };
        }

        const timeoutDuration = attempts === 1 ? 15000 : 10000;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Transaction timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration);
        });

        const transactionPromise = solanaProvider.signAndSendTransaction(transaction, sendOptions);
        solanaResponse = await Promise.race([transactionPromise, timeoutPromise]);
        break;

      } catch (sendError) {
        const isBlockhashError = sendError.message?.includes('Blockhash not found') ||
                              sendError.message?.includes('Transaction timeout') ||
                              sendError.message?.includes('timeout');

        const isUserRejection = sendError.message?.includes('User rejected') ||
                               sendError.code === 4001 ||
                               sendError.name === 'WalletSignTransactionError';

        if (isUserRejection) throw new Error('Transaction was rejected by user.');

        if (isBlockhashError && attempts < maxAttempts) {
          const delay = attempts * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          throw sendError;
        }
      }
    }

    const txHash = solanaResponse.signature || solanaResponse;
    onProgress?.({ status: 'confirming', txHash });

    // Confirm transaction
    try {
      let transactionResult = null;

      for (const rpc of alternativeRpcs) {
        try {
          const connection = new Connection(rpc);
          const confirmationPromise = connection.confirmTransaction(txHash, 'confirmed');
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Confirmation timeout')), 30000);
          });
          await Promise.race([confirmationPromise, timeoutPromise]);

          const txDetails = await connection.getTransaction(txHash, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });

          if (txDetails) {
            transactionResult = txDetails;
            break;
          }
        } catch (rpcError) {
          continue;
        }
      }

      if (transactionResult) {
        if (transactionResult.meta && transactionResult.meta.err) {
          let errorMessage = 'Transaction failed on Solana network.';

          if (transactionResult.meta.err.InstructionError) {
            const instructionError = transactionResult.meta.err.InstructionError[1];
            if (typeof instructionError === 'object' && instructionError.Custom) {
              const customErrorCode = instructionError.Custom;
              const logMessages = transactionResult.meta.logMessages || [];
              const insufficientLamportsLog = logMessages.find(log =>
                log.includes('insufficient lamports')
              );

              switch (customErrorCode) {
                case 1:
                  if (insufficientLamportsLog) {
                    const match = insufficientLamportsLog.match(/insufficient lamports (\d+), need (\d+)/);
                    if (match) {
                      const shortfall = (parseInt(match[2]) - parseInt(match[1])) / 1000000000;
                      errorMessage = `Transaction failed: Insufficient SOL for bridge fees. You need ${shortfall.toFixed(4)} more SOL.`;
                    } else {
                      errorMessage = 'Transaction failed: Insufficient SOL for bridge transaction fees.';
                    }
                  } else {
                    errorMessage = 'Bridge transaction failed: Insufficient funds or invalid amount.';
                  }
                  break;
                case 2:
                  errorMessage = 'Bridge transaction failed: Invalid destination address.';
                  break;
                case 6001:
                  errorMessage = 'Bridge transaction failed: Slippage tolerance exceeded.';
                  break;
                case 6000:
                  errorMessage = 'Bridge transaction failed: Bridge is currently paused.';
                  break;
                default:
                  errorMessage = `Bridge transaction failed with error code ${customErrorCode}.`;
              }
            } else if (typeof instructionError === 'object' && instructionError.InsufficientFunds) {
              errorMessage = 'Transaction failed: Insufficient funds for transaction fees.';
            } else if (typeof instructionError === 'string') {
              errorMessage = `Transaction failed: ${instructionError}`;
            }
          }

          throw new Error(errorMessage);
        } else {
          onProgress?.({ status: 'confirmed' });
          return { success: true, txHash: txHash };
        }
      } else {
        onProgress?.({ status: 'confirmed' });
        return {
          success: true, txHash: txHash,
          warning: 'Transaction submitted but could not verify status. Please check manually.',
          showWarningNotification: true
        };
      }
    } catch (confirmationError) {
      throw new Error(confirmationError.message || 'Transaction failed to confirm on Solana network.');
    }

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unknown error during Solana transaction'
    };
  }
};
