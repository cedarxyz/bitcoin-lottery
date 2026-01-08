import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import {
  getLotteryState,
  getUserTicketCount,
  getPastWinners,
} from '../utils/contract';
import {
  DEMO_MODE,
  getDemoState,
  getDemoUserTickets,
  getMockCurrentBlock,
  MOCK_PAST_WINNERS,
} from '../utils/demo';
import type { LotteryState, RoundResult } from '../types/lottery';

const POLL_INTERVAL = 30000; // 30 seconds
const BLOCK_TIME_SECONDS = 600; // ~10 minutes per Stacks block

// API URLs for Stacks networks
const API_URLS = {
  mainnet: 'https://api.mainnet.hiro.so',
  testnet: 'https://api.testnet.hiro.so',
} as const;

export function useLottery() {
  const { network, address } = useWallet();
  const [state, setState] = useState<LotteryState | null>(null);
  const [userTickets, setUserTickets] = useState(0);
  const [pastWinners, setPastWinners] = useState<RoundResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState(0);

  const fetchState = useCallback(async () => {
    // Demo mode - use mock data
    if (DEMO_MODE) {
      setState(getDemoState());
      setPastWinners(MOCK_PAST_WINNERS);
      setUserTickets(getDemoUserTickets());
      setCurrentBlock(getMockCurrentBlock());
      setLoading(false);
      return;
    }

    // Production mode - fetch from contract
    try {
      const lotteryState = await getLotteryState(network);
      setState(lotteryState);

      // Fetch past winners
      const winners = await getPastWinners(network, lotteryState.currentRound);
      setPastWinners(winners);

      // Fetch user's tickets if connected
      if (address) {
        const tickets = await getUserTicketCount(
          network,
          lotteryState.currentRound,
          address
        );
        setUserTickets(tickets);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch lottery state:', err);
      setError('Failed to load lottery data');
    } finally {
      setLoading(false);
    }
  }, [network, address]);

  // Fetch current block height
  const fetchBlockHeight = useCallback(async () => {
    if (DEMO_MODE) {
      setCurrentBlock(getMockCurrentBlock());
      return;
    }

    try {
      const isMainnet = network.chainId === 1;
      const apiUrl = isMainnet ? API_URLS.mainnet : API_URLS.testnet;
      const response = await fetch(`${apiUrl}/v2/info`);
      const data = await response.json();
      setCurrentBlock(data.stacks_tip_height);
    } catch (err) {
      console.error('Failed to fetch block height:', err);
    }
  }, [network]);

  // Initial fetch and polling
  useEffect(() => {
    fetchState();
    fetchBlockHeight();

    const interval = setInterval(() => {
      fetchState();
      fetchBlockHeight();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchState, fetchBlockHeight]);

  // Calculate countdown to drawing
  const getSecondsUntilDrawing = useCallback(() => {
    if (!state || state.drawingBlock === 0 || currentBlock === 0) {
      return null;
    }

    const blocksUntilDrawing = state.drawingBlock - currentBlock;
    if (blocksUntilDrawing <= 0) return 0;

    return blocksUntilDrawing * BLOCK_TIME_SECONDS;
  }, [state, currentBlock]);

  return {
    state,
    userTickets,
    pastWinners,
    loading,
    error,
    currentBlock,
    getSecondsUntilDrawing,
    refresh: fetchState,
  };
}
