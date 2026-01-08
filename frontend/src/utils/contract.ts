import {
  fetchCallReadOnlyFunction,
  cvToValue,
  uintCV,
  principalCV,
} from '@stacks/transactions';
import type { StacksNetwork } from '@stacks/network';
import type { LotteryState, RoundResult } from '../types/lottery';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from './config';

async function callReadOnly(
  network: StacksNetwork,
  functionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = []
) {
  const result = await fetchCallReadOnlyFunction({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName,
    functionArgs: args,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result);
}

export async function getLotteryState(network: StacksNetwork): Promise<LotteryState> {
  const [currentRound, ticketsSold, prizePool, ticketPriceSats, drawingBlock, isActive, isInCutoffPeriod] =
    await Promise.all([
      callReadOnly(network, 'get-current-round'),
      callReadOnly(network, 'get-tickets-sold'),
      callReadOnly(network, 'get-prize-pool'),
      callReadOnly(network, 'get-ticket-price'),
      callReadOnly(network, 'get-drawing-block'),
      callReadOnly(network, 'is-lottery-active'),
      callReadOnly(network, 'is-in-cutoff-period'),
    ]);

  return {
    currentRound: Number(currentRound),
    ticketsSold: Number(ticketsSold),
    prizePool: Number(prizePool),
    ticketPriceSats: Number(ticketPriceSats),
    drawingBlock: Number(drawingBlock),
    isActive: Boolean(isActive),
    isInCutoffPeriod: Boolean(isInCutoffPeriod),
  };
}

export async function getUserTicketCount(
  network: StacksNetwork,
  round: number,
  userAddress: string
): Promise<number> {
  const result = await callReadOnly(network, 'get-participant-tickets', [
    uintCV(round),
    principalCV(userAddress),
  ]);
  return Number(result);
}

export async function getRoundResults(
  network: StacksNetwork,
  round: number
): Promise<RoundResult | null> {
  const result = await callReadOnly(network, 'get-round-results', [uintCV(round)]);

  if (!result) return null;

  return {
    round,
    winner: result.winner || null,
    winningTicket: Number(result['winning-ticket']),
    prizeAmount: Number(result['prize-amount']),
    blockHashUsed: result['block-hash-used'],
    totalTickets: Number(result['total-tickets']),
  };
}

export async function getPastWinners(
  network: StacksNetwork,
  currentRound: number,
  limit: number = 10
): Promise<RoundResult[]> {
  const winners: RoundResult[] = [];
  const startRound = Math.max(1, currentRound - limit);

  for (let round = currentRound - 1; round >= startRound; round--) {
    const result = await getRoundResults(network, round);
    if (result && result.winner) {
      winners.push(result);
    }
  }

  return winners;
}
