import { formatSTX, formatAddress } from '../utils/format';
import type { RoundResult } from '../types/lottery';

interface WinnersProps {
  winners: RoundResult[];
}

export function Winners({ winners }: WinnersProps) {
  if (winners.length === 0) {
    return (
      <section id="winners" className="py-12">
        <h3 className="text-2xl font-bold text-white mb-6">Recent Winners</h3>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No winners yet. Be the first!</p>
        </div>
      </section>
    );
  }

  return (
    <section id="winners" className="py-12">
      <h3 className="text-2xl font-bold text-white mb-6">Recent Winners</h3>

      <div className="space-y-3">
        {winners.map((result) => (
          <div
            key={result.round}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f7931a]/20 flex items-center justify-center">
                <span className="text-[#f7931a] font-bold">#{result.round}</span>
              </div>
              <div>
                <p className="text-white font-semibold">
                  {formatAddress(result.winner || 'Unknown')}
                </p>
                <p className="text-sm text-gray-400">
                  Ticket #{result.winningTicket} of {result.totalTickets}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[#f7931a] font-bold text-lg">
                {formatSTX(result.prizeAmount)} STX
              </p>
              <a
                href={`https://explorer.stacks.co/txid/${result.blockHashUsed}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-white transition"
              >
                View on Explorer
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
