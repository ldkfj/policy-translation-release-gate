import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  recognizeSupportedWallet,
  WalletDiscoveryManager,
  connectSelectedProvider,
} from '../services/walletService';
import { EIP1193Provider, EIP6963ProviderDetail } from '../types/wallet';
import { STUDIONET_CONFIG } from '../config/studionet';

describe('EIP-6963 Wallet Discovery & Provider Isolation', () => {
  describe('recognizeSupportedWallet', () => {
    it('recognizes MetaMask strictly by RDNS', () => {
      const match = recognizeSupportedWallet('io.metamask');
      expect(match?.brand).toBe('MetaMask');
      expect(match?.displayName).toBe('MetaMask');
    });

    it('recognizes OKX Wallet by RDNS variants', () => {
      const match1 = recognizeSupportedWallet('com.okex.wallet');
      expect(match1?.brand).toBe('OKX Wallet');
      const match2 = recognizeSupportedWallet('com.okx.wallet');
      expect(match2?.brand).toBe('OKX Wallet');
    });

    it('recognizes Rabby Wallet strictly by RDNS', () => {
      const match = recognizeSupportedWallet('io.rabby');
      expect(match?.brand).toBe('Rabby');
      expect(match?.displayName).toBe('Rabby Wallet');
    });

    it('rejects forged RDNS even if wallet name mimics supported brand', () => {
      expect(recognizeSupportedWallet('com.fake.wallet', 'MetaMask')).toBeNull();
      expect(recognizeSupportedWallet('org.evil.extension', 'OKX Wallet')).toBeNull();
      expect(recognizeSupportedWallet('io.phishing.wallet', 'Rabby')).toBeNull();
      expect(recognizeSupportedWallet(undefined, 'MetaMask')).toBeNull();
      expect(recognizeSupportedWallet('', 'MetaMask')).toBeNull();
    });

    it('rejects unsupported or unknown wallets', () => {
      expect(recognizeSupportedWallet('com.coinbase.wallet')).toBeNull();
      expect(recognizeSupportedWallet('com.brave.wallet')).toBeNull();
    });
  });

  describe('WalletDiscoveryManager', () => {
    let manager: WalletDiscoveryManager;

    beforeEach(() => {
      manager = new WalletDiscoveryManager();
    });

    afterEach(() => {
      manager.destroy();
    });

    it('subscribes and discovers announced EIP-6963 providers', () => {
      manager.init();

      let discovered: EIP6963ProviderDetail[] = [];
      const unsub = manager.subscribe((list) => {
        discovered = list;
      });

      const mockProvider: EIP1193Provider = {
        request: vi.fn(),
      };

      const event = new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: {
            uuid: 'mock-uuid-1',
            name: 'MetaMask',
            icon: 'data:image/svg+xml;base64,...',
            rdns: 'io.metamask',
          },
          provider: mockProvider,
        },
      });

      window.dispatchEvent(event);

      expect(discovered.length).toBe(1);
      expect(discovered[0].info.name).toBe('MetaMask');
      expect(discovered[0].info.rdns).toBe('io.metamask');
      unsub();
    });

    it('updates provider reference on re-announcement of existing UUID', () => {
      manager.init();

      let discovered: EIP6963ProviderDetail[] = [];
      manager.subscribe((list) => {
        discovered = list;
      });

      const initialProvider: EIP1193Provider = { request: vi.fn() };
      const updatedProvider: EIP1193Provider = { request: vi.fn() };

      const event1 = new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: {
            uuid: 'same-uuid',
            name: 'MetaMask',
            icon: '',
            rdns: 'io.metamask',
          },
          provider: initialProvider,
        },
      });
      window.dispatchEvent(event1);
      expect(discovered.length).toBe(1);
      expect(discovered[0].provider).toBe(initialProvider);

      const event2 = new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: {
            uuid: 'same-uuid',
            name: 'MetaMask Updated',
            icon: '',
            rdns: 'io.metamask',
          },
          provider: updatedProvider,
        },
      });
      window.dispatchEvent(event2);
      expect(discovered.length).toBe(1);
      expect(discovered[0].info.name).toBe('MetaMask Updated');
      expect(discovered[0].provider).toBe(updatedProvider);
    });

    it('deduplicates repeated announcements by provider object identity', () => {
      manager.init();

      let discovered: EIP6963ProviderDetail[] = [];
      manager.subscribe((list) => {
        discovered = list;
      });

      const provider: EIP1193Provider = { request: vi.fn() };
      const announce = (uuid: string) => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid, name: 'MetaMask', icon: '', rdns: 'io.metamask' },
          provider,
        },
      }));

      announce('first-uuid');
      announce('first-uuid');
      announce('second-uuid');

      expect(discovered).toHaveLength(1);
      expect(discovered[0].info.uuid).toBe('first-uuid');
      expect(discovered[0].provider).toBe(provider);
    });

    it('ignores unsupported wallets announced via EIP-6963', () => {
      manager.init();

      let discovered: EIP6963ProviderDetail[] = [];
      manager.subscribe((list) => {
        discovered = list;
      });

      const event = new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: {
            uuid: 'mock-unsupported-uuid',
            name: 'Other Wallet',
            icon: '',
            rdns: 'com.other.wallet',
          },
          provider: { request: vi.fn() },
        },
      });

      window.dispatchEvent(event);
      expect(discovered.length).toBe(0);
    });
  });

  describe('connectSelectedProvider & chain verification', () => {
    it('requests accounts and verifies chain id', async () => {
      const mockRequest = vi.fn().mockImplementation(async ({ method }) => {
        if (method === 'eth_requestAccounts') {
          return ['0x1234567890123456789012345678901234567890'];
        }
        if (method === 'eth_chainId') {
          return STUDIONET_CONFIG.chainIdHex;
        }
        return null;
      });

      const mockDetail: EIP6963ProviderDetail = {
        info: {
          uuid: 'uuid-1',
          name: 'MetaMask',
          icon: '',
          rdns: 'io.metamask',
        },
        provider: {
          request: mockRequest,
        },
      };

      const result = await connectSelectedProvider(mockDetail);
      expect(result.account).toBe('0x1234567890123456789012345678901234567890');
      expect(result.chainId).toBe(STUDIONET_CONFIG.chainId);
      expect(mockRequest).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    });

    it('switches chain when connected to wrong network', async () => {
      let currentChainHex = '0x1'; // Ethereum Mainnet

      const mockRequest = vi.fn().mockImplementation(async ({ method }) => {
        if (method === 'eth_requestAccounts') {
          return ['0x1234567890123456789012345678901234567890'];
        }
        if (method === 'eth_chainId') {
          return currentChainHex;
        }
        if (method === 'wallet_switchEthereumChain') {
          currentChainHex = STUDIONET_CONFIG.chainIdHex;
          return null;
        }
        return null;
      });

      const mockDetail: EIP6963ProviderDetail = {
        info: {
          uuid: 'uuid-1',
          name: 'OKX Wallet',
          icon: '',
          rdns: 'com.okex.wallet',
        },
        provider: {
          request: mockRequest,
        },
      };

      const result = await connectSelectedProvider(mockDetail);
      expect(result.chainId).toBe(STUDIONET_CONFIG.chainId);
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIONET_CONFIG.chainIdHex }],
      });
    });

    it('triggers wallet_addEthereumChain ONLY on error code 4902', async () => {
      let addedChain = false;
      const mockRequest = vi.fn().mockImplementation(async ({ method }) => {
        if (method === 'eth_requestAccounts') {
          return ['0x1234567890123456789012345678901234567890'];
        }
        if (method === 'eth_chainId') {
          return addedChain ? STUDIONET_CONFIG.chainIdHex : '0x1';
        }
        if (method === 'wallet_switchEthereumChain') {
          if (!addedChain) {
            const err = new Error('Chain not added') as Error & { code?: number };
            err.code = 4902;
            throw err;
          }
          return null;
        }
        if (method === 'wallet_addEthereumChain') {
          addedChain = true;
          return null;
        }
        return null;
      });

      const mockDetail: EIP6963ProviderDetail = {
        info: {
          uuid: 'uuid-1',
          name: 'Rabby',
          icon: '',
          rdns: 'io.rabby',
        },
        provider: {
          request: mockRequest,
        },
      };

      const result = await connectSelectedProvider(mockDetail);
      expect(result.chainId).toBe(STUDIONET_CONFIG.chainId);
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: STUDIONET_CONFIG.chainIdHex,
            chainName: STUDIONET_CONFIG.chainName,
            rpcUrls: [STUDIONET_CONFIG.rpcUrl],
            nativeCurrency: STUDIONET_CONFIG.nativeCurrency,
            blockExplorerUrls: [STUDIONET_CONFIG.blockExplorerUrl],
          },
        ],
      });
    });

    it('does NOT trigger wallet_addEthereumChain on non-4902 switch errors', async () => {
      const mockRequest = vi.fn().mockImplementation(async ({ method }) => {
        if (method === 'eth_requestAccounts') {
          return ['0x1234567890123456789012345678901234567890'];
        }
        if (method === 'eth_chainId') {
          return '0x1';
        }
        if (method === 'wallet_switchEthereumChain') {
          const err = new Error('User rejected network switch') as Error & { code?: number };
          err.code = 4001; // User rejected
          throw err;
        }
        return null;
      });

      const mockDetail: EIP6963ProviderDetail = {
        info: {
          uuid: 'uuid-1',
          name: 'MetaMask',
          icon: '',
          rdns: 'io.metamask',
        },
        provider: {
          request: mockRequest,
        },
      };

      await expect(connectSelectedProvider(mockDetail)).rejects.toThrow(/User rejected network switch/);
      expect(mockRequest).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'wallet_addEthereumChain' }));
    });
  });
});
