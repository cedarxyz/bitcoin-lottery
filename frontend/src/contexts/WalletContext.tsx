import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
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

      const sbtcKey = `${SBTC_CONTRACT.address}.${SBTC_CONTRACT.name}::sbtc`;
      const balance = data.fungible_tokens?.[sbtcKey]?.balance || '0';
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

  const connect = useCallback(() => {
    showConnect({
      appDetails: {
        name: 'Bitcoin Daily Lottery',
        icon: window.location.origin + '/bitcoin.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        setIsConnected(true);
        const userData = userSession.loadUserData();
        const newAddress = userData.profile.stxAddress.mainnet;
        setAddress(newAddress);
      },
      userSession,
    });
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
