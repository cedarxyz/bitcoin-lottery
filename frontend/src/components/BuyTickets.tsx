import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useX402Payment } from '../hooks/useX402Payment';

interface BuyTicketsProps {
  ticketPriceSats: number;
  isActive: boolean;
  isInCutoffPeriod: boolean;
  userTickets: number;
  onPurchase: () => void;
}

const TICKET_OPTIONS = [1, 5, 10];

function formatSats(sats: number): string {
  if (sats >= 100000000) {
    return `${(sats / 100000000).toFixed(8)} BTC`;
  }
  return `${sats.toLocaleString()} sats`;
}

export function BuyTickets({
  ticketPriceSats,
  isActive,
  isInCutoffPeriod,
  userTickets,
  onPurchase,
}: BuyTicketsProps) {
  const { isConnected, connect, address, sbtcBalance, isLoadingBalance } = useWallet();
  const { makeX402Request, isPaying } = useX402Payment();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState('');
  const [purchaseResult, setPurchaseResult] = useState<{
    success: boolean;
    message: string;
    txid?: string;
  } | null>(null);

  const quantity = customQuantity ? parseInt(customQuantity, 10) : selectedQuantity;
  const totalCostSats = quantity * ticketPriceSats;
  const canAfford = sbtcBalance !== null && sbtcBalance >= totalCostSats;

  const handleBuyTickets = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (quantity <= 0 || quantity > 10) {
      setPurchaseResult({
        success: false,
        message: 'Please select between 1 and 10 tickets',
      });
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

    const result = await makeX402Request('/btc-lottery-buy', 'POST', {
      recipient: address,
      quantity,
    });

    if (result.success) {
      setPurchaseResult({
        success: true,
        message: `Successfully purchased ${quantity} ticket${quantity > 1 ? 's' : ''}!`,
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

  const isDisabled = !isActive || isInCutoffPeriod || isPaying || isLoadingBalance;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-white mb-4">Buy Tickets with sBTC</h3>

      {purchaseResult && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            purchaseResult.success
              ? 'bg-green-900/30 border border-green-800'
              : 'bg-red-900/30 border border-red-800'
          }`}
        >
          <p className={purchaseResult.success ? 'text-green-400' : 'text-red-400'}>
            {purchaseResult.message}
          </p>
          {purchaseResult.txid && (
            <a
              href={`https://explorer.stacks.co/txid/${purchaseResult.txid}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline mt-1 block"
            >
              View transaction
            </a>
          )}
        </div>
      )}

      {userTickets > 0 && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg">
          <p className="text-green-400 text-sm">
            You have <span className="font-bold">{userTickets}</span> ticket
            {userTickets > 1 ? 's' : ''} for this round
          </p>
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

      {isInCutoffPeriod && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded-lg">
          <p className="text-yellow-400 text-sm">
            Ticket sales are closed. Drawing in progress...
          </p>
        </div>
      )}

      {!isActive && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-red-400 text-sm">Lottery is currently paused</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Select Quantity</label>
        <div className="grid grid-cols-3 gap-2">
          {TICKET_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setSelectedQuantity(opt);
                setCustomQuantity('');
              }}
              disabled={isDisabled}
              className={`py-2 rounded-lg font-semibold transition ${
                selectedQuantity === opt && !customQuantity
                  ? 'bg-[#f7931a] text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Or enter custom (1-10)</label>
        <input
          type="number"
          min="1"
          max="10"
          value={customQuantity}
          onChange={(e) => setCustomQuantity(e.target.value)}
          disabled={isDisabled}
          placeholder="Custom amount"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#f7931a] disabled:opacity-50"
        />
      </div>

      <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Price per ticket</span>
          <span className="text-[#f7931a]">{formatSats(ticketPriceSats)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Quantity</span>
          <span>{quantity}</span>
        </div>
        <div className="border-t border-gray-700 my-2" />
        <div className="flex justify-between text-lg font-bold text-white">
          <span>Total</span>
          <span className="text-[#f7931a]">{formatSats(totalCostSats)}</span>
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
        onClick={handleBuyTickets}
        disabled={isDisabled || quantity <= 0 || (isConnected && !canAfford)}
        className={`w-full py-3 rounded-lg font-bold text-lg transition ${
          isDisabled || quantity <= 0 || (isConnected && !canAfford)
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-[#f7931a] hover:bg-[#e88a15] text-black'
        }`}
      >
        {!isConnected
          ? 'Connect Wallet'
          : isPaying
          ? 'Processing Payment...'
          : `Buy ${quantity} Ticket${quantity > 1 ? 's' : ''} (${formatSats(totalCostSats)})`}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Pay with sBTC via x402 protocol
      </p>
    </div>
  );
}
