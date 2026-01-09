import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useX402Payment } from '../hooks/useX402Payment';
import { formatSats, formatUSD } from '../utils/format';
import type { RaffleEntry } from '../types/lottery';

interface BuyTicketsProps {
  ticketPriceSats: number;
  ticketPriceUSD: number;
  btcPriceUSD: number;
  isActive: boolean;
  userEntries: RaffleEntry[];
  onPurchase: () => void;
}

export function BuyTickets({
  ticketPriceSats,
  ticketPriceUSD,
  btcPriceUSD,
  isActive,
  userEntries,
  onPurchase,
}: BuyTicketsProps) {
  const { isConnected, connect, address, sbtcBalance, isLoadingBalance } = useWallet();
  const { makeX402Request, isPaying } = useX402Payment();
  const [purchaseResult, setPurchaseResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
    txid?: string;
  } | null>(null);

  const canAfford = sbtcBalance !== null && sbtcBalance >= ticketPriceSats;

  const handleBuyTicket = async () => {
    console.log('handleBuyTicket called, isConnected:', isConnected);
    if (!isConnected) {
      console.log('Not connected, calling connect()');
      connect();
      return;
    }

    if (!canAfford) {
      setPurchaseResult({
        success: false,
        message: 'Insufficient sBTC balance',
      });
      return;
    }

    setPurchaseResult(null);

    const result = await makeX402Request('/btc-raffle-enter', 'POST', {
      recipient: address,
    });

    if (result.success && result.data) {
      const data = result.data as { code?: string };
      setPurchaseResult({
        success: true,
        message: 'Bitcoin Face generated! Raffle ticket included.',
        code: data.code,
        txid: result.txid,
      });
      onPurchase();
    } else {
      setPurchaseResult({
        success: false,
        message: result.error || 'Purchase failed',
      });
    }
  };

  const isDisabled = !isActive || isPaying || isLoadingBalance;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-white mb-4">Generate Your Bitcoin Face</h3>

      {purchaseResult && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            purchaseResult.success
              ? 'bg-green-900/30 border border-green-800'
              : 'bg-red-900/30 border border-red-800'
          }`}
        >
          <p className={purchaseResult.success ? 'text-green-400' : 'text-red-400'}>
            {purchaseResult.message}
          </p>
          {purchaseResult.code && (
            <div className="mt-2 p-2 bg-black/30 rounded font-mono text-sm">
              <p className="text-gray-400 text-xs mb-1">Your Raffle Ticket:</p>
              <p className="text-[#f7931a] font-bold">{purchaseResult.code}</p>
            </div>
          )}
          {purchaseResult.txid && (
            <a
              href={`https://explorer.stacks.co/txid/${purchaseResult.txid}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline mt-2 block"
            >
              View transaction
            </a>
          )}
        </div>
      )}

      {isConnected && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Your sBTC Balance</span>
            <span className="text-[#f7931a] font-medium">
              {isLoadingBalance ? 'Loading...' : formatSats(sbtcBalance || 0)}
            </span>
          </div>
        </div>
      )}

      {userEntries.length > 0 && (
        <div className="mb-4">
          <div className="p-3 bg-green-900/30 border border-green-800 rounded-lg mb-2">
            <p className="text-green-400 text-sm">
              You have <span className="font-bold">{userEntries.length}</span> entr
              {userEntries.length > 1 ? 'ies' : 'y'} for this week
            </p>
          </div>
          <details className="text-sm">
            <summary className="text-gray-400 cursor-pointer hover:text-white transition">
              View your entry codes
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {userEntries.map((entry) => (
                <div
                  key={entry.code}
                  className="p-2 bg-gray-800/50 rounded font-mono text-xs flex justify-between"
                >
                  <span className="text-[#f7931a]">{entry.code}</span>
                  <span className="text-gray-500">{formatSats(entry.amountSats)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {!isActive && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-red-400 text-sm">Raffle is currently paused</p>
        </div>
      )}

      <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Price</span>
          <div className="text-right">
            <span className="text-[#f7931a] font-semibold">{formatUSD(ticketPriceUSD)}</span>
            <span className="text-gray-500 text-xs ml-2">({formatSats(ticketPriceSats)})</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>BTC Price</span>
          <span>{formatUSD(btcPriceUSD)}</span>
        </div>
      </div>

      {isConnected && !canAfford && !isLoadingBalance && (
        <div className="mb-4 text-center">
          <p className="text-red-400 text-sm mb-2">Insufficient sBTC balance</p>
          <a
            href="https://stx.city/swap"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#f7931a] hover:underline"
          >
            Get sBTC on STX.city
          </a>
        </div>
      )}

      <button
        onClick={handleBuyTicket}
        disabled={isDisabled || (isConnected && !canAfford)}
        className={`w-full py-3 rounded-lg font-bold text-lg transition ${
          isDisabled || (isConnected && !canAfford)
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-[#f7931a] hover:bg-[#e88a15] text-black'
        }`}
      >
        {!isConnected
          ? 'Connect Wallet'
          : isPaying
          ? 'Generating...'
          : `Generate Face (${formatUSD(ticketPriceUSD)})`}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Pay with sBTC via x402. Each face includes a weekly BTC raffle ticket.
      </p>
    </div>
  );
}
