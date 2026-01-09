import { formatSats, formatUSD } from '../utils/format';

interface PrizePoolProps {
  prizePoolSats: number;
  prizePoolUSD: number;
  totalEntries: number;
  currentRound: number;
  ticketPriceUSD: number;
}

export function PrizePool({
  prizePoolSats,
  prizePoolUSD,
  totalEntries,
  currentRound,
  ticketPriceUSD,
}: PrizePoolProps) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
        Weekly Raffle #{currentRound} Prize Pool
      </p>

      <div className="relative">
        <h2 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f7931a] to-yellow-400 animate-pulse">
          {formatSats(prizePoolSats)}
        </h2>
        <p className="text-2xl text-gray-400 mt-2">
          {formatUSD(prizePoolUSD)}
        </p>
        <div className="absolute inset-0 blur-3xl bg-[#f7931a]/20 -z-10" />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{totalEntries}</p>
          <p className="text-sm text-gray-400">Raffle Entries</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-white">
            {formatUSD(ticketPriceUSD)}
          </p>
          <p className="text-sm text-gray-400">Per Entry</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-white">
            {totalEntries > 0 ? `1/${totalEntries}` : '-'}
          </p>
          <p className="text-sm text-gray-400">Your Odds (per entry)</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        95% of entry fees go to the prize pool. Winner takes all!
      </p>
    </div>
  );
}
