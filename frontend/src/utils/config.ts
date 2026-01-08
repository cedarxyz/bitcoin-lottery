// Environment configuration
export const IS_MAINNET = true;
export const DEMO_MODE = false;

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lottery-api.example.com';

// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 'SP356QQ3WZFYACA35T0K9MW51ZRH04VDBAJK4NBEZ';
export const CONTRACT_NAME = import.meta.env.VITE_CONTRACT_NAME || 'lottery-x402';

// sBTC contract on mainnet
export const SBTC_CONTRACT = {
  address: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
  name: 'sbtc-token',
};

// Ticket pricing (in sats)
export const TICKET_PRICE_SATS = 100; // 100 sats per ticket

// Stacks API URLs
export const STACKS_API_URL = IS_MAINNET
  ? 'https://api.mainnet.hiro.so'
  : 'https://api.testnet.hiro.so';
