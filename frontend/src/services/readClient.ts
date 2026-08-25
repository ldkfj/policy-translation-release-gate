/**
 * Shared Read Client for GenLayer Studionet Contract Views.
 * Fully wallet-free, centralized, cached, and rate-limited via rpcExecutor.
 *
 * Invariants:
 * - Distinguishes: (a) documented not-found/empty, (b) transient RPC errors, (c) malformed decoder errors.
 * - Never treats RPC failure or malformed payload as empty records.
 * - Throws typed errors to allow views to retain stale valid data and show honest retry prompts.
 */

import { createClient, chains } from 'genlayer-js';
import { activeContractConfig, STUDIONET_CONFIG } from '../config/studionet';
import { rpcExecutor } from './rpcBudget';
import {
  PublisherProfile,
  ActiveCanonicalSummary,
  CanonicalRevision,
  TranslationCandidate,
  Assessment,
  ObjectionRecord,
  ConsumerBinding,
  EffectiveLocale,
  NonceResult,
  ContractEvent,
  PaginatedResponse,
} from '../types/contract';
import {
  decodePublisherProfile,
  decodeActiveCanonical,
  decodeCanonicalRevision,
  decodeTranslationCandidate,
  decodeAssessment,
  decodeObjectionRecord,
  decodeConsumerBinding,
  decodeEffectiveLocale,
  decodeNonceResult,
  decodeContractEvent,
  decodePaginatedResponse,
  DecoderError,
} from '../utils/decoders';

export class RpcNetworkError extends Error {
  constructor(public readonly functionName: string, originalError: unknown) {
    const msg = originalError instanceof Error ? originalError.message : String(originalError);
    super(`[RpcNetworkError] Network error during view call '${functionName}': ${msg}`);
    this.name = 'RpcNetworkError';
  }
}

export class ContractDecodeError extends Error {
  constructor(public readonly functionName: string, originalError: unknown) {
    const msg = originalError instanceof Error ? originalError.message : String(originalError);
    super(`[ContractDecodeError] Corrupted response schema from '${functionName}': ${msg}`);
    this.name = 'ContractDecodeError';
  }
}

export class ContractNotConfiguredError extends Error {
  constructor() {
    super('Contract address is not configured. Read views unavailable.');
    this.name = 'ContractNotConfiguredError';
  }
}

// Centralized read client instance for Studionet (wallet-free)
const readClient = createClient({
  chain: chains.studionet,
  endpoint: STUDIONET_CONFIG.rpcUrl,
});

async function callContractView(
  functionName: string,
  args: unknown[] = [],
  journey?: string,
  bypassCache?: boolean,
  signal?: AbortSignal
): Promise<unknown> {
  if (!activeContractConfig.isConfigured || !activeContractConfig.contractAddress) {
    throw new ContractNotConfiguredError();
  }

  const contractAddress = activeContractConfig.contractAddress as `0x${string}`;
  const cacheKey = `read:${contractAddress}:${functionName}:${JSON.stringify(args)}`;

  try {
    return await rpcExecutor.execute(
      cacheKey,
      async () => {
        const result = await readClient.readContract({
          address: contractAddress,
          functionName,
          args: args as any,
        });
        return result;
      },
      { journey, bypassCache, signal }
    );
  } catch (err: unknown) {
    if (err instanceof ContractNotConfiguredError || err instanceof DecoderError) {
      throw err;
    }
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    throw new RpcNetworkError(functionName, err);
  }
}

export const contractReadService = {
  async getPublisherProfile(
    journey: string = 'overview',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<PublisherProfile> {
    const raw = await callContractView('get_publisher_profile', [], journey, bypassCache, signal);
    try {
      return decodePublisherProfile(raw);
    } catch (err) {
      throw new ContractDecodeError('get_publisher_profile', err);
    }
  },

  async getActiveCanonical(
    journey: string = 'overview',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<ActiveCanonicalSummary> {
    const raw = await callContractView('get_active_canonical', [], journey, bypassCache, signal);
    try {
      return decodeActiveCanonical(raw);
    } catch (err) {
      throw new ContractDecodeError('get_active_canonical', err);
    }
  },

  async getCanonicalRevision(
    canonicalId: number,
    journey: string = 'publisher',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<CanonicalRevision | null> {
    const raw = await callContractView('get_canonical_revision', [canonicalId], journey, bypassCache, signal);
    try {
      return decodeCanonicalRevision(raw);
    } catch (err) {
      throw new ContractDecodeError('get_canonical_revision', err);
    }
  },

  async getCanonicalRevisionsPage(
    offset: number = 0,
    limit: number = 20,
    journey: string = 'publisher',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<CanonicalRevision>> {
    const raw = await callContractView('get_canonical_revisions_page', [offset, limit], journey, bypassCache, signal);
    try {
      return decodePaginatedResponse(raw, (item) => {
        const decoded = decodeCanonicalRevision(item);
        if (!decoded) throw new DecoderError('Null canonical revision in page');
        return decoded;
      });
    } catch (err) {
      throw new ContractDecodeError('get_canonical_revisions_page', err);
    }
  },

  async getTranslationCandidate(
    candidateId: number,
    journey: string = 'localizer',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<TranslationCandidate | null> {
    const raw = await callContractView('get_translation_candidate', [candidateId], journey, bypassCache, signal);
    try {
      return decodeTranslationCandidate(raw);
    } catch (err) {
      throw new ContractDecodeError('get_translation_candidate', err);
    }
  },

  async getTranslationCandidatesPage(
    offset: number = 0,
    limit: number = 20,
    canonicalId: number = 0,
    journey: string = 'localizer',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<TranslationCandidate>> {
    const raw = await callContractView(
      'get_translation_candidates_page',
      [offset, limit, canonicalId],
      journey,
      bypassCache,
      signal
    );
    try {
      return decodePaginatedResponse(raw, (item) => {
        const decoded = decodeTranslationCandidate(item);
        if (!decoded) throw new DecoderError('Null translation candidate in page');
        return decoded;
      });
    } catch (err) {
      throw new ContractDecodeError('get_translation_candidates_page', err);
    }
  },

  async getAssessment(
    candidateId: number,
    journey: string = 'assess',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<Assessment | null> {
    const raw = await callContractView('get_assessment', [candidateId], journey, bypassCache, signal);
    try {
      return decodeAssessment(raw);
    } catch (err) {
      throw new ContractDecodeError('get_assessment', err);
    }
  },

  async getObjectionsPage(
    candidateId: number,
    offset: number = 0,
    limit: number = 20,
    journey: string = 'audit',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<ObjectionRecord>> {
    const raw = await callContractView('get_objections_page', [candidateId, offset, limit], journey, bypassCache, signal);
    try {
      return decodePaginatedResponse(raw, decodeObjectionRecord);
    } catch (err) {
      throw new ContractDecodeError('get_objections_page', err);
    }
  },

  async getEffectiveLocale(
    locale: string,
    journey: string = 'consumer',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<EffectiveLocale> {
    const raw = await callContractView('get_effective_locale', [locale], journey, bypassCache, signal);
    try {
      return decodeEffectiveLocale(raw);
    } catch (err) {
      throw new ContractDecodeError('get_effective_locale', err);
    }
  },

  async getConsumerBinding(
    namespace: string,
    locale: string,
    journey: string = 'consumer',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<ConsumerBinding> {
    const raw = await callContractView('get_consumer_binding', [namespace, locale], journey, bypassCache, signal);
    try {
      return decodeConsumerBinding(raw);
    } catch (err) {
      throw new ContractDecodeError('get_consumer_binding', err);
    }
  },

  async getNonceResult(
    clientNonce: string,
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<NonceResult> {
    const raw = await callContractView('get_nonce_result', [clientNonce], 'overview', bypassCache, signal);
    try {
      return decodeNonceResult(raw);
    } catch (err) {
      throw new ContractDecodeError('get_nonce_result', err);
    }
  },

  async getEventsPage(
    offset: number = 0,
    limit: number = 20,
    journey: string = 'audit',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<ContractEvent>> {
    const raw = await callContractView('get_events_page', [offset, limit], journey, bypassCache, signal);
    try {
      return decodePaginatedResponse(raw, decodeContractEvent);
    } catch (err) {
      throw new ContractDecodeError('get_events_page', err);
    }
  },

  async getUpgrader(
    journey: string = 'audit',
    bypassCache: boolean = false,
    signal?: AbortSignal
  ): Promise<string> {
    const raw = await callContractView('get_upgrader', [], journey, bypassCache, signal);
    if (typeof raw === 'string') return raw.toLowerCase();
    throw new ContractDecodeError('get_upgrader', 'Expected string address');
  },
};
