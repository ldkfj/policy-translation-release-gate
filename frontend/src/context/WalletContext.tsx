/**
 * React Context for Wallet Discovery, Selection, and Provider Isolation.
 * Full reloads always start disconnected.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  WalletState,
  EIP6963ProviderDetail,
  EIP1193Provider,
  EIP6963ProviderInfo,
} from '../types/wallet';
import {
  walletDiscovery,
  connectSelectedProvider,
  switchSelectedProviderChain,
} from '../services/walletService';
import { STUDIONET_CONFIG } from '../config/studionet';

export interface WalletContextValue extends WalletState {
  openSelector: () => void;
  closeSelector: () => void;
  connectWallet: (providerDetail: EIP6963ProviderDetail) => Promise<void>;
  disconnectWallet: () => void;
  switchChain: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<EIP1193Provider | null>(null);
  const [selectedProviderInfo, setSelectedProviderInfo] = useState<EIP6963ProviderInfo | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isWrongChain, setIsWrongChain] = useState<boolean>(false);
  const [availableProviders, setAvailableProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupListenersRef = useRef<(() => void) | null>(null);

  // Initialize EIP-6963 discovery once on mount.
  // Full reloads start disconnected: no auto-request of eth_accounts.
  useEffect(() => {
    walletDiscovery.init();
    const unsubscribe = walletDiscovery.subscribe((providers) => {
      setAvailableProviders(providers);
    });

    return () => {
      unsubscribe();
      walletDiscovery.destroy();
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
        cleanupListenersRef.current = null;
      }
    };
  }, []);

  const openSelector = useCallback(() => {
    setError(null);
    setIsSelectorOpen(true);
  }, []);

  const closeSelector = useCallback(() => {
    setIsSelectorOpen(false);
    setError(null);
  }, []);

  const disconnectWallet = useCallback(() => {
    if (cleanupListenersRef.current) {
      cleanupListenersRef.current();
      cleanupListenersRef.current = null;
    }
    setConnectedAccount(null);
    setSelectedProvider(null);
    setSelectedProviderInfo(null);
    setChainId(null);
    setIsWrongChain(false);
    setError(null);
  }, []);

  const connectWallet = useCallback(
    async (providerDetail: EIP6963ProviderDetail) => {
      setIsConnecting(true);
      setError(null);

      try {
        const { account, chainId: newChainId } = await connectSelectedProvider(providerDetail);

        if (cleanupListenersRef.current) {
          cleanupListenersRef.current();
          cleanupListenersRef.current = null;
        }

        const provider = providerDetail.provider;

        // Set up provider event listeners on the exact provider object
        const handleAccountsChanged = (accounts: unknown) => {
          if (!Array.isArray(accounts) || accounts.length === 0 || !accounts[0]) {
            disconnectWallet();
          } else {
            setConnectedAccount((accounts[0] as string).toLowerCase());
          }
        };

        const handleChainChanged = (newChainHex: unknown) => {
          if (typeof newChainHex === 'string') {
            const parsed = parseInt(newChainHex, 16);
            setChainId(parsed);
            setIsWrongChain(parsed !== STUDIONET_CONFIG.chainId);
          }
        };

        const handleDisconnect = () => {
          disconnectWallet();
        };

        if (typeof provider.on === 'function') {
          provider.on('accountsChanged', handleAccountsChanged);
          provider.on('chainChanged', handleChainChanged);
          provider.on('disconnect', handleDisconnect);

          cleanupListenersRef.current = () => {
            if (typeof provider.removeListener === 'function') {
              provider.removeListener('accountsChanged', handleAccountsChanged);
              provider.removeListener('chainChanged', handleChainChanged);
              provider.removeListener('disconnect', handleDisconnect);
            }
          };
        }

        setConnectedAccount(account);
        setSelectedProvider(provider);
        setSelectedProviderInfo(providerDetail.info);
        setChainId(newChainId);
        setIsWrongChain(newChainId !== STUDIONET_CONFIG.chainId);
        setIsSelectorOpen(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to connect wallet.';
        setError(message);
      } finally {
        setIsConnecting(false);
      }
    },
    [disconnectWallet]
  );

  const switchChain = useCallback(async () => {
    if (!selectedProvider) return;
    setError(null);
    try {
      const newChainId = await switchSelectedProviderChain(selectedProvider);
      setChainId(newChainId);
      setIsWrongChain(newChainId !== STUDIONET_CONFIG.chainId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to switch network.';
      setError(message);
    }
  }, [selectedProvider]);

  const value: WalletContextValue = {
    connectedAccount,
    selectedProvider,
    selectedProviderInfo,
    chainId,
    isConnecting,
    isWrongChain,
    availableProviders,
    isSelectorOpen,
    error,
    openSelector,
    closeSelector,
    connectWallet,
    disconnectWallet,
    switchChain,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
