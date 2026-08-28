/**
 * Centralized Transaction Lifecycle and Pending Write Safety Service.
 *
 * Invariants:
 * - Uses exact captured EIP-1193 provider object; validates 20-byte account and 61999 chain ID.
 * - Fail-closed receipt classifier requiring both finalized status AND explicit execution success.
 * - App-wide single-flight lock; once hash is captured, lock is immutable until verified terminal state.
 * - Polling timeout transitions to 'reconciliation_required' with immutable hash and active lock.
 * - Strict, fail-closed method-specific authoritative readbacks (unknown method => false).
 * - Restored operations from storage are strictly validated.
 */

import { createClient, chains } from 'genlayer-js';
import { activeContractConfig, STUDIONET_CONFIG } from '../config/studionet';
import { EIP1193Provider } from '../types/wallet';
import { contractReadService } from './readClient';
import { rpcExecutor } from './rpcBudget';

export type TxPhase =
  | 'idle'
  | 'validating'
  | 'awaiting_signature'
  | 'submitted'
  | 'pending_consensus'
  | 'accepted'
  | 'finalized'
  | 'verifying_readback'
  | 'success'
  | 'failed'
  | 'reconciliation_required';

export interface PendingOperation {
  version: 1;
  contractAddress: string;
  chainId: number;
  account: string;
  walletName: string;
  method: string;
  args: unknown[];
  clientNonce?: string;
  preAttempts?: number;
  preLastAssessedAt?: string;
  createdTime: number;
  txHash?: string;
  phase: TxPhase;
  error?: string;
  isExecutionFailed?: boolean;
}

export interface TxStatus {
  phase: TxPhase;
  txHash: string | null;
  error: string | null;
  method: string | null;
  readbackConfirmed: boolean;
  isLocked: boolean;
}

export interface ReceiptClassification {
  isDecided: boolean;
  isSuccess: boolean;
  isError: boolean;
  statusName: string;
  errorReason?: string;
}

const PENDING_OP_KEY = 'genlayer_ptrg_pending_operation_v2';
type GenLayerTransactionHash = `0x${string}` & { length: 66 };

export function testStorageCapability(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  const testKey = '__storage_probe_v2__';
  try {
    localStorage.setItem(testKey, '1');
    const val = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return val === '1';
  } catch {
    return false;
  }
}

/**
 * Fail-closed receipt classifier checking GenLayer execution results and finality.
 */
export function classifyReceipt(receipt: Record<string, unknown> | null | undefined): ReceiptClassification {
  if (!receipt || typeof receipt !== 'object') {
    return { isDecided: false, isSuccess: false, isError: false, statusName: 'UNKNOWN' };
  }

  // GenLayer's transaction status is exposed as both a numeric `status` and a
  // decoded `statusName`; the generic EVM receipt status (`success`) is not
  // sufficient to establish Studionet finality.
  const rawStatus = String(receipt.statusName || receipt.status || '').toUpperCase();
  const consensusData = receipt.consensus_data as Record<string, unknown> | undefined;
  const consensusDataAlt = receipt.consensusData as Record<string, unknown> | undefined;
  const finality = String(consensusData?.finality || consensusDataAlt?.finality || '').toUpperCase();
  const consensusStatus = String(receipt.consensusStatus || consensusData?.status || consensusDataAlt?.status || '').toUpperCase();

  // Current GenLayer Studionet responses expose the authoritative execution
  // result inside the leader receipt rather than at transaction top level.
  const leaderReceipts =
    consensusData?.leader_receipt ||
    consensusDataAlt?.leader_receipt ||
    consensusData?.leaderReceipt ||
    consensusDataAlt?.leaderReceipt;
  const leaderReceipt = Array.isArray(leaderReceipts)
    ? leaderReceipts.find((item) => item && typeof item === 'object' && String((item as Record<string, unknown>).mode || '').toLowerCase() === 'leader')
      || leaderReceipts.find((item) => item && typeof item === 'object')
    : leaderReceipts && typeof leaderReceipts === 'object'
      ? leaderReceipts
      : undefined;
  const leaderExecutionResult = leaderReceipt && typeof leaderReceipt === 'object'
    ? String((leaderReceipt as Record<string, unknown>).execution_result || (leaderReceipt as Record<string, unknown>).executionResult || '').toUpperCase()
    : '';

  const execResultName = String(receipt.txExecutionResultName || receipt.execution_result || receipt.executionResult || '').toUpperCase();
  const execResultNum = receipt.txExecutionResult;
  const resultName = String(receipt.resultName || '').toUpperCase();

  // 1. Consensus error
  const isConsensusError =
    consensusStatus === 'INVALID' ||
    consensusStatus === 'UNDETERMINED' ||
    consensusStatus === 'FAILED' ||
    rawStatus === 'INVALID' ||
    rawStatus === 'UNDETERMINED';

  // 2. Explicit execution failure
  const isExplicitError =
    execResultName === 'FINISHED_WITH_ERROR' ||
    execResultName === 'ERROR' ||
    leaderExecutionResult === 'ERROR' ||
    execResultNum === 2 ||
    rawStatus === 'FAILED' ||
    rawStatus === 'REVERTED' ||
    rawStatus === 'CANCELED';

  // 3. Explicit execution success
  const isExplicitSuccess =
    execResultName === 'FINISHED_WITH_RETURN' ||
    execResultName === 'SUCCESS' ||
    leaderExecutionResult === 'SUCCESS' ||
    execResultNum === 1 ||
    resultName === 'SUCCESS';

  // 4. Finalized/Decided state
  const isFinalized =
    rawStatus === 'FINALIZED' ||
    finality === 'FINALIZED' ||
    rawStatus === 'CANCELED';

  if (isConsensusError || (isExplicitError && (isFinalized || rawStatus === 'FAILED' || rawStatus === 'REVERTED'))) {
    return {
      isDecided: true,
      isSuccess: false,
      isError: true,
      statusName: rawStatus || consensusStatus || 'FAILED',
      errorReason: isConsensusError
        ? 'Consensus rejected or undetermined on GenLayer.'
        : 'Transaction execution failed on GenLayer VM.',
    };
  }

  if (isFinalized && isExplicitSuccess) {
    return {
      isDecided: true,
      isSuccess: true,
      isError: false,
      statusName: 'FINALIZED',
    };
  }

  if (isFinalized) {
    return {
      isDecided: true,
      isSuccess: false,
      isError: false,
      statusName: 'FINALIZED',
    };
  }

  if (rawStatus === 'ACCEPTED' || rawStatus === 'PENDING' || rawStatus === 'PROPOSING' || rawStatus === 'COMMITTING' || rawStatus === 'REVEALING') {
    return {
      isDecided: false,
      isSuccess: false,
      isError: false,
      statusName: rawStatus,
    };
  }

  // A blockNumber alone without explicit execution result is NOT success
  return {
    isDecided: false,
    isSuccess: false,
    isError: false,
    statusName: rawStatus || 'UNKNOWN',
  };
}

export class TransactionService {
  public isLocked = false;
  private currentOp: PendingOperation | null = null;
  private listeners: Set<(status: TxStatus) => void> = new Set();

  constructor() {
    this.restorePendingFromStorage();
  }

  public subscribe(listener: (status: TxStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): TxStatus {
    if (!this.currentOp) {
      return {
        phase: 'idle',
        txHash: null,
        error: null,
        method: null,
        readbackConfirmed: false,
        isLocked: this.isLocked,
      };
    }
    return {
      phase: this.currentOp.phase,
      txHash: this.currentOp.txHash || null,
      error: this.currentOp.error || null,
      method: this.currentOp.method,
      readbackConfirmed: this.currentOp.phase === 'success',
      isLocked: this.isLocked,
    };
  }

  private notify(): void {
    const status = this.getStatus();
    for (const listener of this.listeners) {
      listener(status);
    }
  }

  private persistPending(): void {
    if (!testStorageCapability()) return;
    try {
      if (this.currentOp && this.currentOp.phase !== 'idle' && this.currentOp.phase !== 'success') {
        localStorage.setItem(PENDING_OP_KEY, JSON.stringify(this.currentOp));
      } else {
        localStorage.removeItem(PENDING_OP_KEY);
      }
    } catch {
      // Storage error must not drop in-memory lock
    }
  }

  private restorePendingFromStorage(): void {
    if (!testStorageCapability()) return;
    try {
      const raw = localStorage.getItem(PENDING_OP_KEY);
      if (!raw) return;
      const op = JSON.parse(raw) as PendingOperation;

      // Strict validation of restored operation
      if (
        !op ||
        op.version !== 1 ||
        !op.contractAddress ||
        op.contractAddress.toLowerCase() !== (activeContractConfig.contractAddress || '').toLowerCase() ||
        op.chainId !== STUDIONET_CONFIG.chainId ||
        !op.account ||
        !/^0x[0-9a-fA-F]{40}$/.test(op.account) ||
        !op.method ||
        typeof op.method !== 'string' ||
        !Array.isArray(op.args) ||
        !op.txHash ||
        !/^0x[0-9a-fA-F]{64}$/.test(op.txHash)
      ) {
        // Malformed or wrong contract/chain: remove without submitting
        localStorage.removeItem(PENDING_OP_KEY);
        return;
      }

      this.currentOp = op;
      this.isLocked = true;
      // Resume reconciliation in background without requiring wallet reconnection
      this.reconcileExistingHash(op);
    } catch {
      localStorage.removeItem(PENDING_OP_KEY);
    }
  }

  public async executeWrite(
    provider: EIP1193Provider,
    account: string,
    method: string,
    args: unknown[],
    clientNonce?: string
  ): Promise<boolean> {
    if (this.isLocked) {
      throw new Error('A transaction is already in flight. Please wait for consensus and readback.');
    }

    if (!activeContractConfig.isConfigured || !activeContractConfig.contractAddress) {
      throw new Error('Contract address is not configured. Writes are disabled.');
    }

    if (!/^0x[0-9a-fA-F]{40}$/.test(account)) {
      throw new Error(`Invalid 20-byte account address: ${account}`);
    }

    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Valid EIP-1193 provider instance is required for transaction signing.');
    }

    // 1. Verify provider chain ID is exactly Studionet (61999) immediately before submission
    const currentChainHex = await provider.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(String(currentChainHex), 16);
    if (currentChainId !== STUDIONET_CONFIG.chainId) {
      throw new Error(
        `Selected wallet provider is on chain ID ${currentChainId}, but Studionet (${STUDIONET_CONFIG.chainId}) is required.`
      );
    }

    // 2. Storage capability probe (Fail-closed)
    if (!testStorageCapability()) {
      throw new Error('Local browser storage is unavailable or restricted. Cannot guarantee write idempotency.');
    }

    // 3. Capture pre-write state for retry_unresolved
    let preAttempts: number | undefined;
    let preLastAssessedAt: string | undefined;
    if (method === 'retry_unresolved' && typeof args[0] === 'number') {
      try {
        const cand = await contractReadService.getTranslationCandidate(args[0], 'assess', true);
        if (cand) {
          preAttempts = cand.attempts;
          preLastAssessedAt = cand.last_assessed_at;
        }
      } catch {
        // Proceed if pre-read fails
      }
    }

    // 4. Set in-memory single-flight lock
    this.isLocked = true;

    this.currentOp = {
      version: 1,
      contractAddress: activeContractConfig.contractAddress,
      chainId: STUDIONET_CONFIG.chainId,
      account: account.toLowerCase(),
      walletName: 'selected-wallet',
      method,
      args,
      clientNonce,
      preAttempts,
      preLastAssessedAt,
      createdTime: Date.now(),
      phase: 'validating',
    };
    this.persistPending();
    this.notify();

    try {
      // 5. Nonce preflight idempotency check (shared domain)
      if (clientNonce) {
        const nonceResult = await contractReadService.getNonceResult(clientNonce, true);
        if (nonceResult && nonceResult.exists && nonceResult.id > 0) {
          const verified = await this.verifyReadback(method, args, account, clientNonce, preAttempts, preLastAssessedAt);
          if (verified) {
            this.currentOp.phase = 'success';
            this.persistPending();
            rpcExecutor.invalidate();
            this.notify();
            this.isLocked = false;
            return true;
          }
        }
      }

      // 6. Awaiting signature
      this.currentOp.phase = 'awaiting_signature';
      this.persistPending();
      this.notify();

      // Construct GenLayer client with the exact captured provider object
      const writeClient = createClient({
        chain: chains.studionet,
        endpoint: STUDIONET_CONFIG.rpcUrl,
        provider: provider as any,
        account: account as `0x${string}`,
      });

      const txHashRaw = await writeClient.writeContract({
        address: activeContractConfig.contractAddress as `0x${string}`,
        functionName: method,
        args: args as any,
        value: BigInt(0),
      });

      const txHash = typeof txHashRaw === 'string' ? txHashRaw : String(txHashRaw);
      if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
        throw new Error(`Invalid transaction hash returned by wallet: ${txHash}`);
      }

      // 7. Hash captured into immutable authority
      this.currentOp.txHash = txHash;
      this.currentOp.phase = 'submitted';
      this.persistPending();
      this.notify();

      // 8. Poll receipt and consensus with fail-closed classifier
      return await this.pollReceiptAndConsensus(
        txHash,
        method,
        args,
        account,
        clientNonce,
        preAttempts,
        preLastAssessedAt
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      // Only unlock if no txHash was captured (e.g. user rejected signature)
      if (!this.currentOp?.txHash) {
        if (this.currentOp) {
          this.currentOp.phase = 'failed';
          this.currentOp.error = message;
          this.persistPending();
        }
        this.isLocked = false;
        this.notify();
      } else {
        // If hash was captured, retain lock and transition to reconciliation_required
        if (this.currentOp) {
          this.currentOp.phase = 'reconciliation_required';
          this.currentOp.error = message;
          this.persistPending();
        }
        this.notify();
      }
      throw err;
    }
  }

  private async pollReceiptAndConsensus(
    txHash: string,
    method: string,
    args: unknown[],
    account: string,
    clientNonce?: string,
    preAttempts?: number,
    preLastAssessedAt?: string
  ): Promise<boolean> {
    const client = createClient({
      chain: chains.studionet,
      endpoint: STUDIONET_CONFIG.rpcUrl,
    });

    const startTime = Date.now();
    const maxDurationMs = 10 * 60 * 1000; // 10 minutes max
    let delayMs = 2500;

    while (Date.now() - startTime < maxDurationMs) {
      // Pause polling while tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      try {
        const receipt = await rpcExecutor.execute(
          `transaction:${txHash}`,
          async () => (await client.getTransaction({
            // The exact 64-hex validation above establishes the branded SDK hash shape.
            hash: txHash as unknown as GenLayerTransactionHash,
          })) as Record<string, unknown> | null,
          { bypassCache: true, journey: 'transaction' }
        );

        const classification = classifyReceipt(receipt);

        if (classification.statusName === 'ACCEPTED' || classification.statusName === 'PENDING') {
          if (this.currentOp && this.currentOp.phase !== 'accepted') {
            this.currentOp.phase = 'accepted';
            this.persistPending();
            this.notify();
          }
        }

        if (classification.isDecided) {
          if (classification.isError) {
            // Authoritative finalized execution error => Terminal failure, release lock
            if (this.currentOp) {
              this.currentOp.phase = 'failed';
              this.currentOp.error = classification.errorReason || 'Transaction execution failed on chain.';
              this.currentOp.isExecutionFailed = true;
              this.persistPending();
            }
            this.isLocked = false;
            this.notify();
            return false;
          }

          if (classification.isSuccess) {
            if (this.currentOp) {
              this.currentOp.phase = 'verifying_readback';
              this.persistPending();
              this.notify();
            }

            // Perform authoritative on-chain state readback
            const verified = await this.verifyReadback(
              method,
              args,
              account,
              clientNonce,
              preAttempts,
              preLastAssessedAt
            );

            if (verified) {
              if (this.currentOp) {
                this.currentOp.phase = 'success';
                this.persistPending();
              }
              rpcExecutor.invalidate();
              this.isLocked = false;
              this.notify();
              return true;
            }
          }
        }
      } catch {
        // Continue polling on transient errors
      }

      await new Promise((r) => setTimeout(r, delayMs));
      delayMs = Math.min(delayMs * 1.5, 10000);
    }

    // Polling timeout: retain immutable txHash, retain lock, mark as reconciliation_required
    if (this.currentOp) {
      this.currentOp.phase = 'reconciliation_required';
      this.currentOp.error =
        'Consensus polling timed out after 10 minutes. Transaction may still finalize on chain. Reconciliation required.';
      this.persistPending();
    }
    // Lock is NOT cleared on timeout after hash exists
    this.notify();
    return false;
  }

  public async reconcileExistingHash(op: PendingOperation): Promise<void> {
    if (!op.txHash) return;
    try {
      await this.pollReceiptAndConsensus(
        op.txHash,
        op.method,
        op.args,
        op.account,
        op.clientNonce,
        op.preAttempts,
        op.preLastAssessedAt
      );
    } catch {
      // Handled in polling
    }
  }

  /**
   * Exact, fail-closed authoritative state readback.
   * Unknown methods fail closed (return false).
   */
  public async verifyReadback(
    method: string,
    args: unknown[],
    account: string,
    clientNonce?: string,
    preAttempts?: number,
    preLastAssessedAt?: string
  ): Promise<boolean> {
    rpcExecutor.invalidate();

    try {
      switch (method) {
        case 'initialize_publisher': {
          const expectedOwner = String(args[0]);
          const expectedRepo = String(args[1]);
          const profile = await contractReadService.getPublisherProfile('publisher', true);
          return (
            profile !== null &&
            profile.initialized === true &&
            profile.owner.toLowerCase() === expectedOwner.toLowerCase() &&
            profile.repo.toLowerCase() === expectedRepo.toLowerCase() &&
            profile.admin.toLowerCase() === account.toLowerCase()
          );
        }

        case 'register_canonical': {
          if (!clientNonce) return false;
          const nonceRes = await contractReadService.getNonceResult(clientNonce, true);
          if (!nonceRes || !nonceRes.exists || nonceRes.entity_type !== 'canonical' || nonceRes.id <= 0) {
            return false;
          }
          const rev = await contractReadService.getCanonicalRevision(nonceRes.id, 'publisher', true);
          const expectedCommit = String(args[1]);
          const expectedPath = String(args[2]);
          const expectedDigest = String(args[3]);
          return (
            rev !== null &&
            rev.commit.toLowerCase() === expectedCommit.toLowerCase() &&
            rev.path === expectedPath &&
            rev.digest.toLowerCase() === expectedDigest.toLowerCase()
          );
        }

        case 'activate_canonical': {
          const canonicalId = Number(args[0]);
          const activeCan = await contractReadService.getActiveCanonical('publisher', true);
          const rev = await contractReadService.getCanonicalRevision(canonicalId, 'publisher', true);
          return (
            activeCan !== null &&
            activeCan.id === canonicalId &&
            activeCan.state === 'ACTIVE' &&
            rev !== null &&
            rev.state === 'ACTIVE'
          );
        }

        case 'register_translation': {
          if (!clientNonce) return false;
          const nonceRes = await contractReadService.getNonceResult(clientNonce, true);
          if (!nonceRes || !nonceRes.exists || nonceRes.entity_type !== 'translation' || nonceRes.id <= 0) {
            return false;
          }
          const cand = await contractReadService.getTranslationCandidate(nonceRes.id, 'localizer', true);
          const expectedCanId = Number(args[1]);
          const expectedLocale = String(args[2]);
          const expectedCommit = String(args[3]);
          const expectedPath = String(args[4]);
          const expectedDigest = String(args[5]);
          return (
            cand !== null &&
            cand.canonical_id === expectedCanId &&
            cand.locale.toLowerCase() === expectedLocale.toLowerCase() &&
            cand.commit.toLowerCase() === expectedCommit.toLowerCase() &&
            cand.path === expectedPath &&
            cand.digest.toLowerCase() === expectedDigest.toLowerCase() &&
            cand.localizer.toLowerCase() === account.toLowerCase()
          );
        }

        case 'update_translation_draft': {
          const candId = Number(args[0]);
          const expectedCommit = String(args[1]);
          const expectedPath = String(args[2]);
          const expectedDigest = String(args[3]);
          const cand = await contractReadService.getTranslationCandidate(candId, 'localizer', true);
          return (
            cand !== null &&
            cand.state === 'DRAFT' &&
            cand.commit.toLowerCase() === expectedCommit.toLowerCase() &&
            cand.path === expectedPath &&
            cand.digest.toLowerCase() === expectedDigest.toLowerCase()
          );
        }

        case 'freeze_translation': {
          const candId = Number(args[0]);
          const cand = await contractReadService.getTranslationCandidate(candId, 'localizer', true);
          return cand !== null && cand.state === 'FROZEN';
        }

        case 'assess_translation': {
          const candId = Number(args[0]);
          const cand = await contractReadService.getTranslationCandidate(candId, 'assess', true);
          const assessment = await contractReadService.getAssessment(candId, 'assess', true);
          return (
            cand !== null &&
            cand.has_assessment === true &&
            ['ACCEPTED', 'REVISION_REQUIRED', 'HOLD_UNRESOLVED'].includes(cand.state) &&
            assessment !== null &&
            assessment.candidate_id === candId
          );
        }

        case 'retry_unresolved': {
          const candId = Number(args[0]);
          const cand = await contractReadService.getTranslationCandidate(candId, 'assess', true);
          const assessment = await contractReadService.getAssessment(candId, 'assess', true);
          const attemptsIncremented = preAttempts !== undefined ? cand?.attempts === preAttempts + 1 : (cand?.attempts || 0) > 0;
          const timestampUpdated = preLastAssessedAt !== undefined
            ? BigInt(cand?.last_assessed_at || '0') > BigInt(preLastAssessedAt)
            : true;

          return (
            cand !== null &&
            attemptsIncremented &&
            timestampUpdated &&
            cand.has_assessment === true &&
            ['ACCEPTED', 'REVISION_REQUIRED', 'HOLD_UNRESOLVED'].includes(cand.state) &&
            assessment !== null
          );
        }

        case 'record_objection': {
          const candId = Number(args[0]);
          const expectedDigest = String(args[1]).toLowerCase();
          const expectedReason = String(args[2]);
          const page = await contractReadService.getObjectionsPage(candId, 0, 64, 'audit', true);
          return page.items.some(
            (obj) =>
              obj.candidate_id === candId &&
              obj.observer.toLowerCase() === account.toLowerCase() &&
              obj.objection_digest.toLowerCase() === expectedDigest &&
              obj.reason === expectedReason
          );
        }

        case 'publish_translation': {
          const candId = Number(args[0]);
          const cand = await contractReadService.getTranslationCandidate(candId, 'publish', true);
          if (!cand || cand.state !== 'PUBLISHED') return false;

          const activeCan = await contractReadService.getActiveCanonical('publish', true);
          if (!activeCan || activeCan.id !== cand.canonical_id || activeCan.state !== 'ACTIVE') {
            return false;
          }

          const eff = await contractReadService.getEffectiveLocale(cand.locale, 'publish', true);
          return (
            eff !== null &&
            eff.is_effective === true &&
            eff.candidate_id === cand.id &&
            eff.canonical_id === cand.canonical_id &&
            eff.commit.toLowerCase() === cand.commit.toLowerCase() &&
            eff.path === cand.path &&
            eff.digest.toLowerCase() === cand.digest.toLowerCase()
          );
        }

        case 'bind_consumer': {
          const namespace = String(args[0]);
          const locale = String(args[1]);
          const candId = Number(args[2]);
          const binding = await contractReadService.getConsumerBinding(namespace, locale, 'consumer', true);
          return (
            binding !== null &&
            binding.exists === true &&
            binding.namespace === namespace &&
            binding.locale === locale &&
            binding.candidate_id === candId
          );
        }

        default:
          // FAIL CLOSED on unknown methods
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Only allows clearing if operation is terminal or was rejected before a hash existed.
   * Refuses to clear hashed unresolved operations.
   */
  public clearPending(): boolean {
    if (!this.currentOp) {
      this.isLocked = false;
      return true;
    }

    const phase = this.currentOp.phase;
    const hasHash = Boolean(this.currentOp.txHash);
    const isExecutionFailed = Boolean(this.currentOp.isExecutionFailed);

    // Can clear only if: idle, success, or failed without a hash, or authoritative execution failure
    if (phase === 'idle' || phase === 'success' || (phase === 'failed' && (!hasHash || isExecutionFailed))) {
      this.currentOp = null;
      this.isLocked = false;
      if (testStorageCapability()) {
        try {
          localStorage.removeItem(PENDING_OP_KEY);
        } catch {
          // Ignore
        }
      }
      this.notify();
      return true;
    }

    // Refuse to clear unresolved hashed operation
    return false;
  }
}

export const transactionService = new TransactionService();
