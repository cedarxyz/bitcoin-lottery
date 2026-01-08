import type { LotteryState, RoundResult } from '../types/lottery';

// Demo mode flag - set to true to use mock data instead of contract calls
export const DEMO_MODE = false;

// Mock lottery state
export const MOCK_LOTTERY_STATE: LotteryState = {
  currentRound: 42,
  ticketsSold: 127,
  prizePool: 11_430_000, // 11.43 STX
  ticketPriceSats: 100, // 100 sats per ticket
  drawingBlock: 0, // Will be calculated dynamically
  isActive: true,
  isInCutoffPeriod: false,
};

// Mock past winners
export const MOCK_PAST_WINNERS: RoundResult[] = [
  {
    round: 41,
    winner: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    winningTicket: 89,
    prizeAmount: 8_100_000,
    blockHashUsed: '0x7f8e9d4c3b2a1f0e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d6c5b4a3928170',
    totalTickets: 95,
  },
  {
    round: 40,
    winner: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
    winningTicket: 23,
    prizeAmount: 5_400_000,
    blockHashUsed: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    totalTickets: 62,
  },
  {
    round: 39,
    winner: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    winningTicket: 156,
    prizeAmount: 14_850_000,
    blockHashUsed: '0xdeadbeef12345678deadbeef12345678deadbeef12345678deadbeef12345678',
    totalTickets: 172,
  },
  {
    round: 38,
    winner: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
    winningTicket: 7,
    prizeAmount: 2_700_000,
    blockHashUsed: '0xcafebabe87654321cafebabe87654321cafebabe87654321cafebabe87654321',
    totalTickets: 31,
  },
];

// Get mock current block (simulates ~10 minute blocks)
export function getMockCurrentBlock(): number {
  const startBlock = 150000;
  const msPerBlock = 600000; // 10 minutes
  const elapsed = Date.now() - new Date('2024-01-01').getTime();
  return startBlock + Math.floor(elapsed / msPerBlock);
}

// Get mock drawing block (next drawing at midnight UTC)
export function getMockDrawingBlock(): number {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setUTCHours(24, 0, 0, 0);

  const msUntilMidnight = nextMidnight.getTime() - now.getTime();
  const blocksUntilMidnight = Math.ceil(msUntilMidnight / 600000); // 10 min blocks

  return getMockCurrentBlock() + blocksUntilMidnight;
}

// Simulate ticket purchase in demo mode
let demoTicketCount = MOCK_LOTTERY_STATE.ticketsSold;
let demoPrizePool = MOCK_LOTTERY_STATE.prizePool;
let demoUserTickets = 0;

export function demoBuyTickets(quantity: number): void {
  demoTicketCount += quantity;
  demoPrizePool += quantity * MOCK_LOTTERY_STATE.ticketPriceSats * 0.9;
  demoUserTickets += quantity;
}

export function getDemoState(): LotteryState {
  return {
    ...MOCK_LOTTERY_STATE,
    ticketsSold: demoTicketCount,
    prizePool: demoPrizePool,
    drawingBlock: getMockDrawingBlock(),
  };
}

export function getDemoUserTickets(): number {
  return demoUserTickets;
}

export function resetDemoState(): void {
  demoTicketCount = MOCK_LOTTERY_STATE.ticketsSold;
  demoPrizePool = MOCK_LOTTERY_STATE.prizePool;
  demoUserTickets = 0;
}
