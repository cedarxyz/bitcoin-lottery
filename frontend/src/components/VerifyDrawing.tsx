import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getRoundResults } from '../utils/contract';

export function VerifyDrawing() {
  const { network } = useWallet();
  const [roundNumber, setRoundNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    blockHash: string;
    totalTickets: number;
    winningTicket: number;
    calculatedTicket: number;
    isValid: boolean;
  } | null>(null);
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
    setVerificationResult(null);

    try {
      const result = await getRoundResults(network, round);

      if (!result || !result.winner) {
        setError('Round not found or no winner for this round');
        return;
      }

      // Calculate the winning ticket from block hash
      // Convert first 16 bytes of hex hash to BigInt
      const hashHex = result.blockHashUsed.startsWith('0x')
        ? result.blockHashUsed.slice(2, 34)
        : result.blockHashUsed.slice(0, 32);
      const hashValue = BigInt('0x' + hashHex);
      const calculatedTicket =
        Number(hashValue % BigInt(result.totalTickets)) + 1;

      setVerificationResult({
        blockHash: result.blockHashUsed,
        totalTickets: result.totalTickets,
        winningTicket: result.winningTicket,
        calculatedTicket,
        isValid: calculatedTicket === result.winningTicket,
      });
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Failed to verify round. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="verify" className="py-12">
      <h3 className="text-2xl font-bold text-white mb-6">Verify a Drawing</h3>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-400 text-sm mb-4">
          Enter a round number to verify that the drawing was fair. We'll show you
          the block hash used and recalculate the winning ticket.
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
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {verificationResult && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Block Hash Used</p>
              <p className="font-mono text-sm text-white break-all">
                {verificationResult.blockHash}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Total Tickets</p>
                <p className="text-xl font-bold text-white">
                  {verificationResult.totalTickets}
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Recorded Winner</p>
                <p className="text-xl font-bold text-white">
                  #{verificationResult.winningTicket}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Our Calculation</p>
              <p className="font-mono text-sm text-gray-300 mb-2">
                ({verificationResult.blockHash.slice(0, 16)}... % {verificationResult.totalTickets}) + 1
                = <span className="text-white font-bold">#{verificationResult.calculatedTicket}</span>
              </p>
            </div>

            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${
                verificationResult.isValid
                  ? 'bg-green-900/30 border border-green-800'
                  : 'bg-red-900/30 border border-red-800'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  verificationResult.isValid ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {verificationResult.isValid ? '✓' : '✗'}
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    verificationResult.isValid ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {verificationResult.isValid
                    ? 'Drawing Verified!'
                    : 'Verification Failed'}
                </p>
                <p className="text-sm text-gray-400">
                  {verificationResult.isValid
                    ? 'The winning ticket matches our calculation.'
                    : 'The winning ticket does not match. This should not happen.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
