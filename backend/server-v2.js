import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import 'dotenv/config';
import { x402PaymentRequired } from 'x402-stacks';
import pg from 'pg';

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3402;
const PRIZE_POOL_WALLET = process.env.PRIZE_POOL_WALLET;
const PROFIT_WALLET = process.env.PROFIT_WALLET;
const ADMIN_SECRET = process.env.ADMIN_SECRET || crypto.randomBytes(32).toString('hex');

// Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// sBTC contract on mainnet
const SBTC_CONTRACT = {
  address: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
  name: 'sbtc-token',
};

// Ticket price in USD
const TICKET_PRICE_USD = 1.00;

// Cache for BTC price (refresh every 5 minutes)
let btcPriceCache = { price: null, timestamp: 0 };
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Validate environment
if (!PRIZE_POOL_WALLET) {
  console.error('ERROR: PRIZE_POOL_WALLET not set in environment');
  process.exit(1);
}

if (!PROFIT_WALLET) {
  console.error('ERROR: PROFIT_WALLET not set in environment');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in environment');
  process.exit(1);
}

// Initialize database tables
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS lottery_entries (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        wallet_address TEXT NOT NULL,
        amount_sats BIGINT NOT NULL,
        btc_price_usd DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        round INTEGER NOT NULL DEFAULT 1,
        is_winner BOOLEAN DEFAULT FALSE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lottery_rounds (
        id SERIAL PRIMARY KEY,
        round_number INTEGER UNIQUE NOT NULL,
        status TEXT DEFAULT 'active',
        winner_code TEXT,
        winner_address TEXT,
        prize_amount_sats BIGINT,
        total_entries INTEGER,
        drawn_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_entries_round ON lottery_entries(round)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_entries_wallet ON lottery_entries(wallet_address)
    `);

    // Ensure round 1 exists
    await client.query(`
      INSERT INTO lottery_rounds (round_number, status)
      VALUES (1, 'active')
      ON CONFLICT (round_number) DO NOTHING
    `);

    console.log('Database initialized');
  } finally {
    client.release();
  }
}

// Fetch BTC price from CoinGecko
async function getBTCPrice() {
  const now = Date.now();

  // Return cached price if still valid
  if (btcPriceCache.price && (now - btcPriceCache.timestamp) < PRICE_CACHE_TTL) {
    return btcPriceCache.price;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );
    const data = await response.json();
    const price = data.bitcoin.usd;

    btcPriceCache = { price, timestamp: now };
    console.log(`BTC price updated: $${price}`);
    return price;
  } catch (error) {
    console.error('Failed to fetch BTC price:', error);
    // Return last known price or default
    return btcPriceCache.price || 100000;
  }
}

// Convert USD to sats
async function usdToSats(usdAmount) {
  const btcPrice = await getBTCPrice();
  const btcAmount = usdAmount / btcPrice;
  const sats = Math.ceil(btcAmount * 100_000_000);
  return { sats, btcPrice };
}

// Generate unique ticket code
function generateTicketCode() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `BTC-${timestamp}-${random}`.toUpperCase();
}

// Get current active round
async function getCurrentRound() {
  const result = await pool.query(
    `SELECT round_number FROM lottery_rounds WHERE status = 'active' ORDER BY round_number DESC LIMIT 1`
  );
  return result.rows[0]?.round_number || 1;
}

// Health check / info endpoint
app.get('/', async (req, res) => {
  try {
    const { sats, btcPrice } = await usdToSats(TICKET_PRICE_USD);
    const currentRound = await getCurrentRound();

    const entriesResult = await pool.query(
      `SELECT COUNT(*) as count FROM lottery_entries WHERE round = $1`,
      [currentRound]
    );
    const totalEntries = parseInt(entriesResult.rows[0]?.count || 0);

    res.json({
      name: 'Bitcoin Faces Raffle',
      version: '2.1.0',
      endpoints: {
        '/': 'This info (free)',
        '/btc-raffle-enter': 'Enter raffle for $1 sBTC (x402)',
        '/raffle/status': 'Current raffle status (free)',
        '/raffle/entries/:address': 'Get entries for address (free)',
      },
      entryPriceUSD: TICKET_PRICE_USD,
      entryPriceSats: sats,
      btcPriceUSD: btcPrice,
      currentRound,
      totalEntries,
      prizePoolSplit: '95%',
      profitSplit: '5%',
      x402: true,
      prizePoolWallet: PRIZE_POOL_WALLET,
      tokenType: 'sBTC',
      network: 'mainnet',
    });
  } catch (error) {
    console.error('Error in root endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current raffle status
app.get('/raffle/status', async (req, res) => {
  try {
    const { sats, btcPrice } = await usdToSats(TICKET_PRICE_USD);
    const currentRound = await getCurrentRound();

    const entriesResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount_sats), 0) as total_sats
       FROM lottery_entries WHERE round = $1`,
      [currentRound]
    );

    const totalEntries = parseInt(entriesResult.rows[0]?.count || 0);
    const totalSats = parseInt(entriesResult.rows[0]?.total_sats || 0);
    const prizePoolSats = Math.floor(totalSats * 0.95);

    res.json({
      currentRound,
      totalEntries,
      ticketPriceUSD: TICKET_PRICE_USD,
      ticketPriceSats: sats,
      btcPriceUSD: btcPrice,
      prizePoolSats,
      prizePoolUSD: (prizePoolSats / 100_000_000) * btcPrice,
      status: 'active',
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch raffle status' });
  }
});

// Alias for backward compatibility
app.get('/lottery/status', (req, res) => res.redirect(307, '/raffle/status'));

// Get entries for a specific address
app.get('/raffle/entries/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const currentRound = await getCurrentRound();

    const result = await pool.query(
      `SELECT code, amount_sats, created_at
       FROM lottery_entries
       WHERE wallet_address = $1 AND round = $2
       ORDER BY created_at DESC`,
      [address, currentRound]
    );

    res.json({
      address,
      round: currentRound,
      entries: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Alias for backward compatibility
app.get('/lottery/entries/:address', (req, res) => res.redirect(307, `/raffle/entries/${req.params.address}`));

// Enter raffle - x402 protected (dynamic pricing)
app.post('/btc-raffle-enter', async (req, res, next) => {
  try {
    // Calculate current price in sats
    const { sats, btcPrice } = await usdToSats(TICKET_PRICE_USD);

    // Apply x402 middleware with dynamic price
    // Payment goes to prize pool wallet
    const middleware = x402PaymentRequired({
      amount: BigInt(sats),
      address: PRIZE_POOL_WALLET,
      network: 'mainnet',
      resource: '/btc-raffle-enter',
      tokenType: 'sBTC',
      tokenContract: SBTC_CONTRACT,
    });

    // Store price info for the handler
    req.ticketPrice = { sats, btcPrice };

    middleware(req, res, next);
  } catch (error) {
    console.error('Error setting up x402:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
}, async (req, res) => {
  try {
    const walletAddress = req.headers['x-stacks-address'];
    const { sats, btcPrice } = req.ticketPrice;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required (X-Stacks-Address header)' });
    }

    // Generate unique ticket code
    const code = generateTicketCode();
    const currentRound = await getCurrentRound();

    // Store entry in database
    await pool.query(
      `INSERT INTO lottery_entries (code, wallet_address, amount_sats, btc_price_usd, round)
       VALUES ($1, $2, $3, $4, $5)`,
      [code, walletAddress, sats, btcPrice, currentRound]
    );

    console.log(`Raffle entry: ${code} by ${walletAddress} for ${sats} sats`);

    res.json({
      success: true,
      code,
      message: 'Raffle entry confirmed!',
      walletAddress,
      amountPaidSats: sats,
      amountPaidUSD: TICKET_PRICE_USD,
      btcPriceUSD: btcPrice,
      round: currentRound,
      prizePoolContribution: Math.floor(sats * 0.95),
    });
  } catch (error) {
    console.error('Error processing raffle entry:', error);
    res.status(500).json({
      error: 'Failed to enter raffle',
      message: error.message,
    });
  }
});

// Alias for backward compatibility
app.post('/btc-lottery-buy', (req, res) => res.redirect(307, '/btc-raffle-enter'));

// Admin: Draw winner (protected by secret)
app.post('/admin/draw', async (req, res) => {
  const { secret } = req.body;

  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentRound = await getCurrentRound();

    // Get all entries for current round
    const entriesResult = await client.query(
      `SELECT * FROM lottery_entries WHERE round = $1`,
      [currentRound]
    );

    if (entriesResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No entries in current round' });
    }

    // Random selection using crypto
    const randomIndex = crypto.randomInt(0, entriesResult.rows.length);
    const winner = entriesResult.rows[randomIndex];

    // Calculate prize (95% of total)
    const totalSats = entriesResult.rows.reduce((sum, e) => sum + parseInt(e.amount_sats), 0);
    const prizeSats = Math.floor(totalSats * 0.95);
    const profitSats = totalSats - prizeSats;

    // Update winner entry
    await client.query(
      `UPDATE lottery_entries SET is_winner = TRUE WHERE code = $1`,
      [winner.code]
    );

    // Update round
    await client.query(
      `UPDATE lottery_rounds
       SET status = 'completed', winner_code = $1, winner_address = $2,
           prize_amount_sats = $3, total_entries = $4, drawn_at = CURRENT_TIMESTAMP
       WHERE round_number = $5`,
      [winner.code, winner.wallet_address, prizeSats, entriesResult.rows.length, currentRound]
    );

    // Create new round
    await client.query(
      `INSERT INTO lottery_rounds (round_number, status) VALUES ($1, 'active')`,
      [currentRound + 1]
    );

    await client.query('COMMIT');

    console.log(`Round ${currentRound} winner: ${winner.code} - ${winner.wallet_address}`);

    res.json({
      success: true,
      round: currentRound,
      winner: {
        code: winner.code,
        address: winner.wallet_address,
      },
      totalEntries: entriesResult.rows.length,
      totalCollectedSats: totalSats,
      prizeSats,
      profitSats,
      prizePoolWallet: PRIZE_POOL_WALLET,
      profitWallet: PROFIT_WALLET,
      instructions: {
        prize: `Send ${prizeSats} sats to winner: ${winner.wallet_address}`,
        profit: `Transfer ${profitSats} sats from prize pool to profit wallet`,
      },
      nextRound: currentRound + 1,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error drawing winner:', error);
    res.status(500).json({ error: 'Failed to draw winner' });
  } finally {
    client.release();
  }
});

// Admin: Get round history
app.get('/admin/rounds', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM lottery_rounds ORDER BY round_number DESC LIMIT 20`
    );
    res.json({ rounds: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rounds' });
  }
});

// Admin: Get all entries for current round
app.get('/admin/entries', async (req, res) => {
  const { secret } = req.query;

  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const currentRound = await getCurrentRound();
    const result = await pool.query(
      `SELECT code, wallet_address, amount_sats, btc_price_usd, created_at
       FROM lottery_entries WHERE round = $1 ORDER BY created_at DESC`,
      [currentRound]
    );
    res.json({
      round: currentRound,
      entries: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Start server
async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           Bitcoin Faces Raffle - x402 API v2.1                ║
╠═══════════════════════════════════════════════════════════════╣
║  Server:      http://localhost:${PORT}                           ║
║  Prize Pool:  ${PRIZE_POOL_WALLET}   ║
║  Profit:      ${PROFIT_WALLET}   ║
║  Entry:       $${TICKET_PRICE_USD} USD per entry (dynamic sats)           ║
║  Split:       95% prize pool / 5% profit                      ║
║  Token:       sBTC (mainnet)                                  ║
║  Database:    Neon PostgreSQL                                 ║
╚═══════════════════════════════════════════════════════════════╝
    `);
    console.log('Admin secret:', ADMIN_SECRET);
  });
}

start().catch(console.error);
