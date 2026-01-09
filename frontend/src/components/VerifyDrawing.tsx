import { useState } from 'react';
import { API_BASE_URL } from '../utils/config';
import { formatSats, formatAddress } from '../utils/format';

interface RoundInfo {
  round_number: number;
  status: string;
  winner_code: string | null;
  winner_address: string | null;
  prize_amount_sats: number | null;
  total_entries: number | null;
  drawn_at: string | null;
}

export function VerifyDrawing() {
  const [roundNumber, setRoundNumber] = useState('');
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const round = parseInt(roundNumber, 10);
    if (isNaN(round) || round < 1) {
      setError('Please enter a valid round number');
      return;
    }

    setLoading(true);
    setError(null);
    setRoundInfo(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/rounds`);
      if (!response.ok) {
        throw new Error('Failed to fetch rounds');
      }

      const data = await response.json();
      const foundRound = data.rounds.find(
        (r: RoundInfo) => r.round_number === round
      );

      if (!foundRound) {
        setError('Round not found');
        return;
      }

      setRoundInfo(foundRound);
    } catch (err) {
      console.error('Lookup failed:', err);
      setError('Failed to fetch round information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="verify" className="py-12">
      <h3 className="text-2xl font-bold text-white mb-6">Look Up a Round</h3>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-400 text-sm mb-4">
          Enter a round number to see the details including the winner,
          prize amount, and number of entries.
        </p>

        <div className="flex gap-3 mb-6">
          <input
            type="number"
            min="1"
            value={roundNumber}
            onChange={(e) => setRoundNumber(e.target.value)}
            placeholder="Enter round number"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#f7931a]"
          />
          <button
            onClick={handleVerify}
            disabled={loading}
            className="px-6 py-2 bg-[#f7931a] hover:bg-[#e88a15] text-black font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'Look Up'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {roundInfo && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg flex items-center justify-between">
              <span className="text-gray-400">Round Status</span>
              <span
                className={`font-semibold ${
                  roundInfo.status === 'completed'
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}
              >
                {roundInfo.status.charAt(0).toUpperCase() + roundInfo.status.slice(1)}
              </span>
            </div>

            {roundInfo.status === 'completed' && roundInfo.winner_address && (
              <>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Winner</p>
                  <p className="text-white font-semibold">
                    {formatAddress(roundInfo.winner_address)}
                  </p>
                  {roundInfo.winner_code && (
                    <p className="text-[#f7931a] font-mono text-sm mt-1">
                      {roundInfo.winner_code}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Prize Won</p>
                    <p className="text-xl font-bold text-[#f7931a]">
                      {roundInfo.prize_amount_sats
                        ? formatSats(roundInfo.prize_amount_sats)
                        : '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Total Entries</p>
                    <p className="text-xl font-bold text-white">
                      {roundInfo.total_entries || '-'}
                    </p>
                  </div>
                </div>

                {roundInfo.drawn_at && (
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Drawn At</p>
                    <p className="text-white">
                      {new Date(roundInfo.drawn_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}

            {roundInfo.status === 'active' && (
              <div className="p-4 bg-yellow-900/30 border border-yellow-800 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  This round is currently active. Check back after the drawing!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
