import { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { Pc, PostConditionMode, uintCV, principalCV } from '@stacks/transactions';
import { useWallet } from '../contexts/WalletContext';
import { API_BASE_URL, SBTC_CONTRACT } from '../utils/config';

interface X402PaymentRequired {
  maxAmountRequired: string;
  resource: string;
  payTo: string;
  network: string;
  nonce: string;
  expiresAt: string;
  tokenType: string;
}

interface PaymentResult {
  success: boolean;
  txid?: string;
  error?: string;
  data?: unknown;
}

export function useX402Payment() {
  const { address, network, refreshBalance } = useWallet();
  const [isPaying, setIsPaying] = useState(false);

  const makeX402Request = async (
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, unknown>
  ): Promise<PaymentResult> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsPaying(true);

    try {
      // Step 1: Make initial request
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Stacks-Address': address,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Step 2: Check if payment required
      if (response.status === 402) {
        const paymentRequired: X402PaymentRequired = await response.json();

        // Step 3: Prompt user to sign sBTC transfer
        const paymentSuccess = await promptSBTCPayment(
          paymentRequired.payTo,
          BigInt(paymentRequired.maxAmountRequired),
          address
        );

        if (!paymentSuccess) {
          return { success: false, error: 'Payment cancelled or failed' };
        }

        // Step 4: Retry request after payment
        // In production, the x402 flow would include the signed tx in headers
        // For now, we're using a simplified flow where payment is verified on-chain
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Stacks-Address': address,
            'X-Payment-Verified': 'pending', // Simplified for demo
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          return { success: false, error: errorData.error || 'Payment failed' };
        }

        const data = await retryResponse.json();
        await refreshBalance();
        return { success: true, data, txid: data.txid };
      }

      // No payment required (shouldn't happen for protected endpoints)
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Request failed' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('X402 payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    } finally {
      setIsPaying(false);
    }
  };

  const promptSBTCPayment = (
    recipient: string,
    amountSats: bigint,
    sender: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      // Create post condition for sBTC transfer using the Pc builder
      const postCondition = Pc.principal(sender)
        .willSendLte(amountSats)
        .ft(`${SBTC_CONTRACT.address}.${SBTC_CONTRACT.name}`, 'sbtc');

      openContractCall({
        network,
        contractAddress: SBTC_CONTRACT.address,
        contractName: SBTC_CONTRACT.name,
        functionName: 'transfer',
        functionArgs: [
          uintCV(amountSats),
          principalCV(sender),
          principalCV(recipient),
          // memo: none
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [postCondition],
        onFinish: (data) => {
          console.log('sBTC transfer submitted:', data.txId);
          resolve(true);
        },
        onCancel: () => {
          console.log('sBTC transfer cancelled');
          resolve(false);
        },
      });
    });
  };

  return {
    makeX402Request,
    isPaying,
  };
}
