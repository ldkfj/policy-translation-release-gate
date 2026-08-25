/**
 * EIP-6963 and wallet provider interfaces.
 * Strictly supports MetaMask, OKX Wallet, and Rabby.
 */

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends Event {
  type: 'eip6963:announceProvider';
  detail: {
    info: EIP6963ProviderInfo;
    provider: EIP1193Provider;
  };
}

export type SupportedWalletBrand = 'MetaMask' | 'OKX Wallet' | 'Rabby';

export interface WalletState {
  connectedAccount: string | null;
  selectedProvider: EIP1193Provider | null;
  selectedProviderInfo: EIP6963ProviderInfo | null;
  chainId: number | null;
  isConnecting: boolean;
  isWrongChain: boolean;
  availableProviders: EIP6963ProviderDetail[];
  isSelectorOpen: boolean;
  error: string | null;
}
