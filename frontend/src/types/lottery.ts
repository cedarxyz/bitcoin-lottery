export interface RoundResult {
  winner: string | null;
  winningTicket: number;
  prizeAmount: number;
  blockHashUsed: string;
  totalTickets: number;
  round: number;
}

export interface LotteryState {
  currentRound: number;
  ticketsSold: number;
  prizePool: number;
  ticketPriceSats: number;
  drawingBlock: number;
  isActive: boolean;
  isInCutoffPeriod: boolean;
}

export interface UserTickets {
  round: number;
  count: number;
}
