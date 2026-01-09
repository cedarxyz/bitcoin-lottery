import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { API_BASE_URL } from '../utils/config';
import type { RaffleState, RoundResult, RaffleEntry } from '../types/lottery';

const POLL_INTERVAL = 30000; // 30 seconds

export function useRaffle() {
  const { address } = useWallet();
  const [state, setState] = useState<RaffleState | null>(null);
  const [userEntries, setUserEntries] = useState<RaffleEntry[]>([]);
  const [pastWinners, setPastWinners] = useState<RoundResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      // Fetch raffle status from backend API
      const response = await fetch(`${API_BASE_URL}/raffle/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch raffle status');
      }
      const data = await response.json();

      setState({
        currentRound: data.currentRound,
        totalEntries: data.totalEntries,
        prizePoolSats: data.prizePoolSats,
        prizePoolUSD: data.prizePoolUSD,
        ticketPriceSats: data.ticketPriceSats,
        ticketPriceUSD: data.ticketPriceUSD,
        btcPriceUSD: data.btcPriceUSD,
        status: data.status,
      });

      // Fetch past winners from admin/rounds (public endpoint)
      try {
        const roundsResponse = await fetch(`${API_BASE_URL}/admin/rounds`);
        if (roundsResponse.ok) {
          const roundsData = await roundsResponse.json();
          const completedRounds = roundsData.rounds
            .filter((r: { status: string }) => r.status === 'completed')
            .map((r: {
              round_number: number;
              winner_address: string | null;
              winner_code: string | null;
              prize_amount_sats: number;
              total_entries: number;
              drawn_at: string | null;
              status: string;
            }) => ({
              round: r.round_number,
              winner: r.winner_address,
              winnerCode: r.winner_code,
              prizeAmountSats: r.prize_amount_sats,
              totalEntries: r.total_entries,
              drawnAt: r.drawn_at,
              status: r.status,
            }));
          setPastWinners(completedRounds);
        }
      } catch {
        // Ignore errors fetching past winners
      }

      // Fetch user's entries if connected
      if (address) {
        try {
          const entriesResponse = await fetch(
            `${API_BASE_URL}/raffle/entries/${address}`
          );
          if (entriesResponse.ok) {
            const entriesData = await entriesResponse.json();
            setUserEntries(
              entriesData.entries.map((e: { code: string; amount_sats: number; created_at: string }) => ({
                code: e.code,
                amountSats: e.amount_sats,
                createdAt: e.created_at,
              }))
            );
          }
        } catch {
          // Ignore errors fetching user entries
        }
      } else {
        setUserEntries([]);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch raffle state:', err);
      setError('Failed to load raffle data');
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Initial fetch and polling
  useEffect(() => {
    fetchState();

    const interval = setInterval(() => {
      fetchState();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchState]);

  return {
    state,
    userEntries,
    userEntriesCount: userEntries.length,
    pastWinners,
    loading,
    error,
    refresh: fetchState,
  };
}
