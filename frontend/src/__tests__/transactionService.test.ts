import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TransactionService,
  testStorageCapability,
  classifyReceipt,
} from '../services/transactionService';
import { activeContractConfig } from '../config/studionet';

describe('Transaction Service & Safety Invariants', () => {
  const testContractAddress = '0xabcdef0123456789abcdef0123456789abcdef01';
  const testTxHash = '0x' + '1'.repeat(64);
  const originalAddr = activeContractConfig.contractAddress;

  beforeEach(() => {
    localStorage.clear();
    activeContractConfig.contractAddress = testContractAddress;
  });

  afterEach(() => {
    activeContractConfig.contractAddress = originalAddr;
  });

  describe('classifyReceipt (Fail-Closed Finality & Execution Evaluation)', () => {
    it('does not treat raw SUCCESS as finalized without explicit finality', () => {
      const result = classifyReceipt({
        status: 'SUCCESS',
        txExecutionResultName: 'FINISHED_WITH_RETURN',
      });
      expect(result.isDecided).toBe(false);
      expect(result.isSuccess).toBe(false);
    });

    it('classifies finalized and successful transaction correctly', () => {
      const receipt = {
        status: 'FINALIZED',
        txExecutionResultName: 'FINISHED_WITH_RETURN',
      };
      const result = classifyReceipt(receipt);
      expect(result.statusName).toBe('FINALIZED');
      expect(result.isDecided).toBe(true);
      expect(result.isSuccess).toBe(true);
      expect(result.isError).toBe(false);
    });

    it('classifies the actual GenLayer transaction shape returned by getTransaction', () => {
      const result = classifyReceipt({
        status: 7,
        statusName: 'FINALIZED',
        result: 6,
        resultName: 'MAJORITY_AGREE',
        txExecutionResult: 1,
        txExecutionResultName: 'FINISHED_WITH_RETURN',
      });

      expect(result).toEqual({
        isDecided: true,
        isSuccess: true,
        isError: false,
        statusName: 'FINALIZED',
      });
    });

    it('uses the finalized leader receipt when SDK omits top-level execution result', () => {
      const result = classifyReceipt({
        status: 7,
        statusName: 'FINALIZED',
        result: 6,
        resultName: 'MAJORITY_AGREE',
        consensus_data: {
          leader_receipt: [{
            mode: 'leader',
            execution_result: 'SUCCESS',
            result: { status: 'return' },
          }],
        },
      });

      expect(result.isDecided).toBe(true);
      expect(result.isSuccess).toBe(true);
      expect(result.isError).toBe(false);
    });

    it('classifies finalized execution error as terminal failure', () => {
      const receipt = {
        status: 'FINALIZED',
        txExecutionResultName: 'FINISHED_WITH_ERROR',
        error: 'Execution reverted',
      };
      const result = classifyReceipt(receipt);
      expect(result.statusName).toBe('FINALIZED');
      expect(result.isDecided).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.isError).toBe(true);
    });

    it('classifies consensus rejection or invalid consensus as terminal failure', () => {
      const receipt = {
        status: 'FINALIZED',
        consensusStatus: 'INVALID',
      };
      const result = classifyReceipt(receipt);
      expect(result.isDecided).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.isError).toBe(true);
    });

    it('treats missing execution result on finalized status as non-success pending/inconclusive', () => {
      const receipt = {
        status: 'FINALIZED',
      };
      const result = classifyReceipt(receipt);
      expect(result.isDecided).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.isError).toBe(false);
    });

    it('treats pending, accepted, proposing, and voting as non-finalized pending states', () => {
      expect(classifyReceipt({ status: 'PENDING' }).isSuccess).toBe(false);
      expect(classifyReceipt({ status: 'ACCEPTED' }).isSuccess).toBe(false);
      expect(classifyReceipt({ status: 'PROPOSING' }).isSuccess).toBe(false);
      expect(classifyReceipt({ status: 'VOTING' }).isSuccess).toBe(false);
    });

    it('treats blockNumber-only receipt as pending and never mistakes it for success', () => {
      const receipt = {
        blockNumber: 12345,
        blockHash: '0xabc',
      };
      const result = classifyReceipt(receipt);
      expect(result.statusName).toBe('UNKNOWN');
      expect(result.isDecided).toBe(false);
      expect(result.isSuccess).toBe(false);
      expect(result.isError).toBe(false);
    });

    it('handles null and undefined receipts safely', () => {
      expect(classifyReceipt(null)).toEqual({
        isDecided: false,
        isSuccess: false,
        isError: false,
        statusName: 'UNKNOWN',
      });
      expect(classifyReceipt(undefined)).toEqual({
        isDecided: false,
        isSuccess: false,
        isError: false,
        statusName: 'UNKNOWN',
      });
    });
  });

  describe('Storage & Locking Invariants', () => {
    it('probes browser localStorage capability successfully', () => {
      expect(testStorageCapability()).toBe(true);
    });

    it('rejects write when contract address is unconfigured', async () => {
      const service = new TransactionService();
      activeContractConfig.contractAddress = '';

      await expect(
        service.executeWrite({ request: vi.fn() }, '0xabcdef0123456789abcdef0123456789abcdef01', 'test', [])
      ).rejects.toThrow(/Contract address is not configured/);
    });

    it('notifies subscribers of status changes', () => {
      const service = new TransactionService();
      let currentStatus = service.getStatus();
      const unsub = service.subscribe((s) => {
        currentStatus = s;
      });

      expect(currentStatus.phase).toBe('idle');
      expect(currentStatus.readbackConfirmed).toBe(false);
      unsub();
    });

    it('clears idle operation cleanly', () => {
      const service = new TransactionService();
      service.clearPending();
      const status = service.getStatus();
      expect(status.phase).toBe('idle');
      expect(status.txHash).toBeNull();
      expect(status.isLocked).toBe(false);
    });

    it('restores valid stored state from localStorage safely', () => {
      const validStored = {
        version: 1,
        contractAddress: testContractAddress,
        chainId: 61999,
        account: '0xabcdef0123456789abcdef0123456789abcdef01',
        walletName: 'MetaMask',
        method: 'register_canonical',
        args: [],
        createdTime: Date.now(),
        txHash: testTxHash,
        phase: 'reconciliation_required',
        error: 'Timeout',
      };
      localStorage.setItem('genlayer_ptrg_pending_operation_v2', JSON.stringify(validStored));

      const service = new TransactionService();
      const status = service.getStatus();
      expect(status.phase).toBe('reconciliation_required');
      expect(status.txHash).toBe(testTxHash);
      expect(status.isLocked).toBe(true);
    });

    it('discards corrupted or invalid JSON in localStorage safely', () => {
      localStorage.setItem('genlayer_ptrg_pending_operation_v2', 'invalid-json{{{');
      const service = new TransactionService();
      expect(service.getStatus().phase).toBe('idle');

      localStorage.setItem('genlayer_ptrg_pending_operation_v2', JSON.stringify({ phase: 'invalid_phase_name' }));
      const service2 = new TransactionService();
      expect(service2.getStatus().phase).toBe('idle');
    });

    it('prevents clearPending when operation has an immutable txHash lock', () => {
      const stored = {
        version: 1,
        contractAddress: testContractAddress,
        chainId: 61999,
        account: '0xabcdef0123456789abcdef0123456789abcdef01',
        walletName: 'MetaMask',
        method: 'register_canonical',
        args: [],
        createdTime: Date.now(),
        txHash: testTxHash,
        phase: 'reconciliation_required',
      };
      localStorage.setItem('genlayer_ptrg_pending_operation_v2', JSON.stringify(stored));

      const service = new TransactionService();
      service.clearPending();
      // Should remain locked and in reconciliation_required
      expect(service.getStatus().phase).toBe('reconciliation_required');
      expect(service.getStatus().isLocked).toBe(true);
    });
  });
});
