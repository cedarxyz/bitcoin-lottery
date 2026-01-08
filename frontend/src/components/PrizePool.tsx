import { useState, useEffect } from 'react';
import { formatSTX, formatCountdown } from '../utils/format';

interface PrizePoolProps {
  prizePool: number;
  ticketsSold: number;
  currentRound: number;
  secondsUntilDrawing: number | null;
}

export function PrizePool({
  prizePool,
  ticketsSold,
  currentRound,
  secondsUntilDrawing,
}: PrizePoolProps) {
  const [countdown, setCountdown] = useState(secondsUntilDrawing);

  useEffect(() => {
    setCountdown(secondsUntilDrawing);
  }, [secondsUntilDrawing]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="text-center py-12">
      <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
        Round #{currentRound} Prize Pool
      </p>

      <div className="relative">
        <h2 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f7931a] to-yellow-400 animate-pulse">
          {formatSTX(prizePool)} STX
        </h2>
        <div className="absolute inset-0 blur-3xl bg-[#f7931a]/20 -z-10" />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{ticketsSold}</p>
          <p className="text-sm text-gray-400">Tickets Sold</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-white">
            {countdown !== null ? formatCountdown(countdown) : 'TBD'}
          </p>
          <p className="text-sm text-gray-400">Until Drawing</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-white">
            {ticketsSold > 0 ? `1/${ticketsSold}` : '-'}
          </p>
          <p className="text-sm text-gray-400">Your Odds (per ticket)</p>
        </div>
      </div>
    </div>
  );
}
