import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { AppConfig, UserSession, connect as stacksConnect } from '@stacks/connect';
import { STACKS_MAINNET, type StacksNetwork } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// sBTC contract on mainnet
const SBTC_CONTRACT = {
  address: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
  name: 'sbtc-token',
};

const STACKS_API_URL = 'https://api.mainnet.hiro.so';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  sbtcBalance: number | null;
  isLoadingBalance: boolean;
  connect: () => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  userSession: UserSession;
  network: StacksNetwork;
}

const WalletContext = createContext<WalletContextType | null>(null);

const network: StacksNetwork = STACKS_MAINNET;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(userSession.isUserSignedIn());
  const [address, setAddress] = useState<string | null>(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      return userData.profile.stxAddress.mainnet;
    }
    return null;
  });
  const [sbtcBalance, setSbtcBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchSbtcBalance = useCallback(async (addr: string) => {
    setIsLoadingBalance(true);
    try {
      const response = await fetch(
        `${STACKS_API_URL}/extended/v1/address/${addr}/balances`
      );
      const data = await response.json();

      console.log('Balance API response for address:', addr);
      console.log('Full balance data:', JSON.stringify(data, null, 2));
      console.log('Fungible tokens:', data.fungible_tokens);

      const sbtcKey = `${SBTC_CONTRACT.address}.${SBTC_CONTRACT.name}::sbtc-token`;
      console.log('Looking for sBTC key:', sbtcKey);

      // Also log all available token keys to find the correct one
      if (data.fungible_tokens) {
        console.log('Available token keys:', Object.keys(data.fungible_tokens));
      }

      const balance = data.fungible_tokens?.[sbtcKey]?.balance || '0';
      console.log('Found sBTC balance:', balance);
      setSbtcBalance(parseInt(balance, 10));
    } catch (error) {
      console.error('Failed to fetch sBTC balance:', error);
      setSbtcBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address) {
      await fetchSbtcBalance(address);
    }
  }, [address, fetchSbtcBalance]);

  useEffect(() => {
    if (address) {
      fetchSbtcBalance(address);
    }
  }, [address, fetchSbtcBalance]);

  const connect = useCallback(async () => {
    console.log('Connect button clicked');
    console.log('Window origin:', window.location.origin);

    try {
      console.log('Calling stacksConnect...');
      const response = await stacksConnect({
        forceWalletSelect: true,
      });

      console.log('Connect response:', response);

      if (response && response.addresses) {
        // Find STX address from response
        const stxAddress = response.addresses.find(
          (addr: { symbol?: string; address: string }) =>
            addr.symbol === 'STX' || addr.address.startsWith('SP') || addr.address.startsWith('SM')
        );

        if (stxAddress) {
          console.log('STX address found:', stxAddress.address);
          setIsConnected(true);
          setAddress(stxAddress.address);
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    userSession.signUserOut('/');
    setIsConnected(false);
    setAddress(null);
    setSbtcBalance(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        sbtcBalance,
        isLoadingBalance,
        connect,
        disconnect,
        refreshBalance,
        userSession,
        network,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
