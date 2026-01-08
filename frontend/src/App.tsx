import { WalletProvider } from './contexts/WalletContext';
import { useLottery } from './hooks/useLottery';
import { Header } from './components/Header';
import { PrizePool } from './components/PrizePool';
import { BuyTickets } from './components/BuyTickets';
import { Winners } from './components/Winners';
import { HowItWorks } from './components/HowItWorks';
import { VerifyDrawing } from './components/VerifyDrawing';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

function LotteryApp() {
  const {
    state,
    userTickets,
    pastWinners,
    loading,
    error,
    getSecondsUntilDrawing,
    refresh,
  } = useLottery();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#f7931a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading lottery...</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error || 'Failed to load lottery'}</p>
          <button
            onClick={refresh}
            className="px-6 py-2 bg-[#f7931a] hover:bg-[#e88a15] text-black font-semibold rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 w-full">
        <PrizePool
          prizePool={state.prizePool}
          ticketsSold={state.ticketsSold}
          currentRound={state.currentRound}
          secondsUntilDrawing={getSecondsUntilDrawing()}
        />

        <div className="py-8">
          <BuyTickets
            ticketPriceSats={state.ticketPriceSats}
            isActive={state.isActive}
            isInCutoffPeriod={state.isInCutoffPeriod}
            userTickets={userTickets}
            onPurchase={refresh}
          />
        </div>

        <HowItWorks />

        <Winners winners={pastWinners} />

        <VerifyDrawing />
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <LotteryApp />
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;
