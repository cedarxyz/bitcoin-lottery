import { useWallet } from '../contexts/WalletContext';
import { formatAddress } from '../utils/format';
import { DEMO_MODE } from '../utils/demo';

export function Header() {
  const { isConnected, address, connect, disconnect } = useWallet();

  return (
    <>
      {DEMO_MODE && (
        <div className="bg-yellow-500 text-black text-center py-2 text-sm font-medium">
          Demo Mode - No real transactions. Data is simulated.
        </div>
      )}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f7931a] flex items-center justify-center">
              <span className="text-xl font-bold text-black">B</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Bitcoin Lottery</h1>
              <p className="text-xs text-gray-400">Provably Fair Daily Drawing</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition">
              How It Works
            </a>
            <a href="#winners" className="text-gray-400 hover:text-white transition">
              Winners
            </a>
            <a href="#verify" className="text-gray-400 hover:text-white transition">
              Verify
            </a>
          </nav>

          {DEMO_MODE ? (
            <span className="px-4 py-2 text-sm bg-gray-800 text-gray-400 rounded-lg">
              Demo Mode
            </span>
          ) : isConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 hidden sm:block">
                {formatAddress(address || '')}
              </span>
              <button
                onClick={disconnect}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="px-4 py-2 text-sm bg-[#f7931a] hover:bg-[#e88a15] text-black font-semibold rounded-lg transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>
    </>
  );
}
