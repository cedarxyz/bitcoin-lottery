export interface RoundResult {
  round: number;
  winner: string | null;
  winnerCode: string | null;
  prizeAmountSats: number;
  totalEntries: number;
  drawnAt: string | null;
  status: 'active' | 'completed';
}

export interface RaffleState {
  currentRound: number;
  totalEntries: number;
  prizePoolSats: number;
  prizePoolUSD: number;
  ticketPriceSats: number;
  ticketPriceUSD: number;
  btcPriceUSD: number;
  status: 'active' | 'drawing' | 'paused';
}

export interface RaffleEntry {
  code: string;
  amountSats: number;
  createdAt: string;
}

export interface UserEntries {
  round: number;
  entries: RaffleEntry[];
  count: number;
}

// Legacy aliases for backward compatibility
export type LotteryState = RaffleState;
export type TicketEntry = RaffleEntry;
export type UserTickets = UserEntries;
