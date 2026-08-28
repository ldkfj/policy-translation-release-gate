/**
 * Native EIP-6963 Wallet Discovery and Provider Management Service.
 * Strictly supports MetaMask, OKX Wallet, and Rabby by exact RDNS allowlisting.
 * Never uses window.ethereum or substring name-based guessing.
 */

import {
  EIP6963ProviderDetail,
  EIP6963AnnounceProviderEvent,
  EIP1193Provider,
  SupportedWalletBrand,
} from '../types/wallet';
import { STUDIONET_CONFIG } from '../config/studionet';

export interface WalletRecognition {
  brand: SupportedWalletBrand;
  displayName: string;
}

const SUPPORTED_RDNS_MAP: Record<string, WalletRecognition> = {
  'io.metamask': { brand: 'MetaMask', displayName: 'MetaMask' },
  'com.okex.wallet': { brand: 'OKX Wallet', displayName: 'OKX Wallet' },
  'com.okx.wallet': { brand: 'OKX Wallet', displayName: 'OKX Wallet' },
  'io.rabby': { brand: 'Rabby', displayName: 'Rabby Wallet' },
};

/**
 * Recognizes supported wallets ONLY by exact RDNS allowlisting.
 * Name-based fallback is intentionally omitted to prevent provider impersonation.
 */
export function recognizeSupportedWallet(
  rdns: string | undefined,
  _name?: string | undefined
): WalletRecognition | null {
  if (!rdns || typeof rdns !== 'string') return null;
  const cleanRdns = rdns.toLowerCase().trim();
  return SUPPORTED_RDNS_MAP[cleanRdns] || null;
}

export class WalletDiscoveryManager {
  private providers: Map<string, EIP6963ProviderDetail> = new Map();
  private providerUuids: WeakMap<object, string> = new WeakMap();
  private listeners: Set<(providers: EIP6963ProviderDetail[]) => void> = new Set();
  private handler: ((event: Event) => void) | null = null;

  public init(): void {
    if (typeof window === 'undefined' || this.handler) return;

    this.handler = (event: Event) => {
      const customEvent = event as EIP6963AnnounceProviderEvent;
      if (!customEvent.detail || !customEvent.detail.info || !customEvent.detail.provider) {
        return;
      }

      const { info, provider } = customEvent.detail;
      if (
        !info.uuid ||
        typeof info.uuid !== 'string' ||
        !info.rdns ||
        typeof info.rdns !== 'string' ||
        !info.name ||
        typeof info.name !== 'string' ||
        !provider ||
        typeof provider.request !== 'function'
      ) {
        return;
      }

      const recognition = recognizeSupportedWallet(info.rdns, info.name);
      if (!recognition) {
        // Reject unsupported wallets
        return;
      }

      const providerObject = provider as object;
      const existingUuid = this.providerUuids.get(providerObject);
      if (existingUuid && existingUuid !== info.uuid) {
        // The same provider object must not appear as multiple chooser options.
        return;
      }

      const existing = this.providers.get(info.uuid);
      if (existing && existing.provider !== provider) {
        this.providerUuids.delete(existing.provider as object);
      }

      // UUID re-announcements update details; provider identity prevents duplicate options.
      this.providerUuids.set(providerObject, info.uuid);
      this.providers.set(info.uuid, { info, provider });
      this.notify();
    };

    window.addEventListener('eip6963:announceProvider', this.handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  }

  public subscribe(listener: (providers: EIP6963ProviderDetail[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getProviders());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getProviders(): EIP6963ProviderDetail[] {
    return Array.from(this.providers.values());
  }

  public destroy(): void {
    if (typeof window !== 'undefined' && this.handler) {
      window.removeEventListener('eip6963:announceProvider', this.handler);
      this.handler = null;
    }
    this.providers.clear();
    this.providerUuids = new WeakMap();
    this.listeners.clear();
  }

  private notify(): void {
    const list = this.getProviders();
    for (const listener of this.listeners) {
      listener(list);
    }
  }
}

export const walletDiscovery = new WalletDiscoveryManager();

/**
 * Connect to an exact EIP-6963 provider.
 * Never uses window.ethereum or global fallback.
 */
export async function connectSelectedProvider(
  providerDetail: EIP6963ProviderDetail
): Promise<{ account: string; chainId: number }> {
  const provider = providerDetail.provider;
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Selected provider does not support standard EIP-1193 requests.');
  }

  // Request accounts
  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[];

  if (!accounts || !Array.isArray(accounts) || accounts.length === 0 || !accounts[0]) {
    throw new Error('No accounts authorized by selected wallet.');
  }

  const account = accounts[0].toLowerCase();
  if (!/^0x[0-9a-fA-F]{40}$/.test(account)) {
    throw new Error(`Invalid Ethereum address returned by wallet: ${account}`);
  }

  // Switch or add chain to Studionet
  const chainId = await switchSelectedProviderChain(provider);
  if (chainId !== STUDIONET_CONFIG.chainId) {
    throw new Error(`Failed to switch to Studionet (61999). Active chain is ${chainId}.`);
  }

  return { account, chainId };
}

/**
 * Switch chain on the exact selected provider.
 * Treats only error code 4902 as unknown-chain authorization to call wallet_addEthereumChain.
 */
export async function switchSelectedProviderChain(provider: EIP1193Provider): Promise<number> {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Provider does not support EIP-1193 request method.');
  }

  let chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
  let chainId = parseInt(chainIdHex, 16);

  if (chainId === STUDIONET_CONFIG.chainId) {
    return chainId;
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CONFIG.chainIdHex }],
    });
  } catch (switchErr: unknown) {
    const err = switchErr as { code?: number; message?: string };
    // Only 4902 indicates chain not added. Generic -32603 is NOT treated as unknown chain.
    if (err && err.code === 4902) {
      await provider.request({
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
      // Call switch again after adding
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIONET_CONFIG.chainIdHex }],
      });
    } else {
      throw switchErr;
    }
  }

  chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
  chainId = parseInt(chainIdHex, 16);

  if (chainId !== STUDIONET_CONFIG.chainId) {
    throw new Error(`Chain switch verification failed: expected ${STUDIONET_CONFIG.chainId}, got ${chainId}`);
  }

  return chainId;
}
