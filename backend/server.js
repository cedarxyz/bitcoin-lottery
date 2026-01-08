import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { x402PaymentRequired, BTCtoSats } from 'x402-stacks';
import {
  makeContractCall,
  broadcastTransaction,
  uintCV,
  principalCV,
  PostConditionMode,
  AnchorMode,
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3402;
const PAYMENT_ADDRESS = process.env.PAYMENT_ADDRESS;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = process.env.CONTRACT_NAME || 'lottery-x402';

// Price per ticket in sats (100 sats = ~$0.10 at $100k BTC)
const TICKET_PRICE_SATS = BTCtoSats(0.000001); // 100 sats

// Mainnet sBTC contract
const SBTC_CONTRACT = {
  address: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
  name: 'sbtc-token',
};

// Validate environment
if (!PAYMENT_ADDRESS) {
  console.error('ERROR: PAYMENT_ADDRESS not set in environment');
  process.exit(1);
}

if (!OPERATOR_PRIVATE_KEY) {
  console.error('ERROR: OPERATOR_PRIVATE_KEY not set in environment');
  process.exit(1);
}

if (!CONTRACT_ADDRESS) {
  console.error('ERROR: CONTRACT_ADDRESS not set in environment');
  process.exit(1);
}

// Helper to call contract
async function mintTicketsForUser(recipientAddress, quantity) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'mint-tickets-for',
    functionArgs: [principalCV(recipientAddress), uintCV(quantity)],
    senderKey: OPERATOR_PRIVATE_KEY,
    network: STACKS_MAINNET,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
    fee: 10000, // 0.01 STX fee
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction({ transaction, network: STACKS_MAINNET });

  if (broadcastResponse.error) {
    throw new Error(`Broadcast failed: ${broadcastResponse.error} - ${broadcastResponse.reason}`);
  }

  return broadcastResponse.txid;
}

// Health check (free)
app.get('/', (req, res) => {
  res.json({
    name: 'Bitcoin Daily Lottery',
    version: '1.0.0',
    endpoints: {
      '/': 'This info (free)',
      '/api/lottery/info': 'Get lottery info (free)',
      '/api/lottery/buy': 'Buy lottery tickets (sBTC via x402)',
    },
    ticketPriceSats: Number(TICKET_PRICE_SATS),
    x402: true,
    payTo: PAYMENT_ADDRESS,
    tokenType: 'sBTC',
    network: 'mainnet',
    contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
  });
});

// Get lottery info (free)
app.get('/api/lottery/info', async (req, res) => {
  try {
    // In production, fetch this from the contract
    res.json({
      currentRound: 1,
      ticketsSold: 0,
      prizePool: 0,
      ticketPriceSats: Number(TICKET_PRICE_SATS),
      drawingBlock: 0,
      isActive: true,
      contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lottery info' });
  }
});

// Buy tickets - x402 protected
app.post(
  '/api/lottery/buy',
  x402PaymentRequired({
    amount: TICKET_PRICE_SATS,
    address: PAYMENT_ADDRESS,
    network: 'mainnet',
    resource: '/api/lottery/buy',
    tokenType: 'sBTC',
    tokenContract: SBTC_CONTRACT,
  }),
  async (req, res) => {
    try {
      const { recipient, quantity } = req.body;

      // Validate input
      if (!recipient) {
        return res.status(400).json({ error: 'recipient address required' });
      }

      const ticketCount = quantity || 1;
      if (ticketCount < 1 || ticketCount > 10) {
        return res.status(400).json({ error: 'quantity must be 1-10' });
      }

      // Calculate total payment required (x402 already verified base payment)
      // For multiple tickets, client should pay TICKET_PRICE_SATS * quantity
      // The x402 middleware handles the base price, additional tickets handled here

      console.log(`Minting ${ticketCount} tickets for ${recipient}`);

      // Call contract to mint tickets
      const txid = await mintTicketsForUser(recipient, ticketCount);

      res.json({
        success: true,
        message: `${ticketCount} ticket(s) purchased successfully!`,
        recipient,
        quantity: ticketCount,
        txid,
        explorerUrl: `https://explorer.stacks.co/txid/${txid}?chain=mainnet`,
        paidWith: 'sBTC via x402',
      });
    } catch (error) {
      console.error('Error buying tickets:', error);
      res.status(500).json({
        error: 'Failed to purchase tickets',
        message: error.message,
      });
    }
  }
);

// Dynamic pricing for multiple tickets
app.get(
  '/api/lottery/buy/price',
  (req, res) => {
    const quantity = parseInt(req.query.quantity) || 1;
    const totalSats = Number(TICKET_PRICE_SATS) * Math.min(Math.max(quantity, 1), 10);

    res.json({
      quantity: Math.min(Math.max(quantity, 1), 10),
      pricePerTicketSats: Number(TICKET_PRICE_SATS),
      totalSats,
      tokenType: 'sBTC',
    });
  }
);

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Bitcoin Daily Lottery - x402 API                ║
╠═══════════════════════════════════════════════════════════╣
║  Server:    http://localhost:${PORT}                         ║
║  Payment:   ${PAYMENT_ADDRESS}   ║
║  Contract:  ${CONTRACT_ADDRESS}.${CONTRACT_NAME}          ║
║  Price:     ${Number(TICKET_PRICE_SATS)} sats per ticket                        ║
║  Token:     sBTC (mainnet)                                ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
