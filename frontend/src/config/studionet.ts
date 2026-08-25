/**
 * Studionet network and contract configuration.
 * Fails closed if VITE_GENLAYER_CONTRACT_ADDRESS is invalid, missing, zero, or placeholder.
 */

export const STUDIONET_CONFIG = {
  chainId: 61999,
  chainIdHex: '0xf22f',
  chainName: 'GenLayer Studionet',
  rpcUrl: 'https://studio.genlayer.com/api',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  blockExplorerUrl: 'https://explorer-studio.genlayer.com',
} as const;

export interface ContractConfigResult {
  isConfigured: boolean;
  contractAddress: string;
  configError: string | null;
}

const PLACEHOLDER_PATTERNS = [
  /^0x0{40}$/i,
  /your_contract_address/i,
  /placeholder/i,
  /0x1234/i,
  /0xdead/i,
  /replace_me/i,
];

export function validateContractAddress(rawAddress: unknown): ContractConfigResult {
  if (typeof rawAddress !== 'string' || !rawAddress.trim()) {
    return {
      isConfigured: false,
      contractAddress: '',
      configError: 'VITE_GENLAYER_CONTRACT_ADDRESS is not configured in environment. Read-only views active; contract writes are disabled.',
    };
  }

  const trimmed = rawAddress.trim();

  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    return {
      isConfigured: false,
      contractAddress: '',
      configError: 'VITE_GENLAYER_CONTRACT_ADDRESS must be a valid 20-byte hexadecimal address starting with 0x.',
    };
  }

  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isConfigured: false,
        contractAddress: '',
        configError: 'VITE_GENLAYER_CONTRACT_ADDRESS is set to a placeholder or zero address. Provide an active Studionet contract address.',
      };
    }
  }

  return {
    isConfigured: true,
    contractAddress: trimmed.toLowerCase(),
    configError: null,
  };
}

export const activeContractConfig: ContractConfigResult = validateContractAddress(
  import.meta.env.VITE_GENLAYER_CONTRACT_ADDRESS
);
