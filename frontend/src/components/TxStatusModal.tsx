import React, { useEffect, useState } from 'react';
import { transactionService, TxStatus } from '../services/transactionService';
import { getExplorerTxUrl } from '../utils/github';
import { formatAddress } from '../utils/formatters';

const PHASE_LABELS: Record<string, string> = {
  idle: 'Idle',
  validating: '1. Validating input & browser storage capability...',
  awaiting_signature: '2. Awaiting wallet signature on selected provider...',
  submitted: '3. Transaction submitted to Studionet...',
  pending_consensus: '4. Waiting for validator consensus...',
  accepted: '5. Transaction accepted by validators...',
  finalized: '6. Consensus finalized on Studionet...',
  verifying_readback: '7. Performing authoritative contract readback...',
  success: 'Transaction Verified & Authoritatively Confirmed!',
  failed: 'Transaction Execution Failed or Reverted',
  reconciliation_required: 'Consensus Polling Timed Out — Reconciliation Required',
};

export const TxStatusModal: React.FC = () => {
  const [status, setStatus] = useState<TxStatus>(transactionService.getStatus());

  useEffect(() => {
    const unsubscribe = transactionService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  if (status.phase === 'idle') return null;

  const isSuccess = status.phase === 'success';
  const isFailedTerminal = status.phase === 'failed' && !status.isLocked;
  const isReconciling = status.phase === 'reconciliation_required';
  const explorerUrl = status.txHash ? getExplorerTxUrl(status.txHash) : null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tx-modal-title">
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="tx-modal-title" className="card-title" style={{ margin: 0 }}>
            {isSuccess
              ? 'Transaction Confirmed'
              : isFailedTerminal
              ? 'Transaction Error'
              : isReconciling
              ? 'Consensus Reconciliation Required'
              : 'Processing Transaction'}
          </h2>
          {(isSuccess || isFailedTerminal) && (
            <button
              type="button"
              className="modal-close"
              onClick={() => transactionService.clearPending()}
              aria-label="Dismiss modal"
            >
              &times;
            </button>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
            Operation
          </div>
          <div className="font-mono" style={{ fontWeight: 600 }}>
            {status.method || 'writeContract'}
          </div>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {!isSuccess && !isFailedTerminal && !isReconciling && (
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid var(--accent-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}
            <span
              style={{
                fontWeight: 600,
                color: isSuccess
                  ? 'var(--accent-success)'
                  : isFailedTerminal
                  ? 'var(--accent-danger)'
                  : isReconciling
                  ? 'var(--accent-warning)'
                  : 'var(--accent-primary)',
              }}
            >
              {PHASE_LABELS[status.phase] || status.phase}
            </span>
          </div>

          {status.txHash && (
            <div style={{ fontSize: '0.85rem', marginTop: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Immutable Tx Hash: </span>
              <a
                href={explorerUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono"
              >
                {formatAddress(status.txHash, 6)}
              </a>
            </div>
          )}
        </div>

        {isReconciling && (
          <div className="banner banner-warning" style={{ marginBottom: 20 }}>
            <div>
              <strong>Recovery in progress: </strong>
              <span>
                Transaction was submitted to Studionet. Lock is retained to prevent duplicate execution. Check the Studionet Explorer for finality status.
              </span>
            </div>
          </div>
        )}

        {status.error && !isReconciling && (
          <div className="banner banner-warning" style={{ marginBottom: 20 }}>
            <div>
              <strong>Error: </strong>
              <span>{status.error}</span>
            </div>
          </div>
        )}

        {isSuccess && status.readbackConfirmed && (
          <div className="banner banner-info" style={{ marginBottom: 20 }}>
            <span>Authoritative state readback verified on-chain. Safe cache invalidated.</span>
          </div>
        )}

        {(isSuccess || isFailedTerminal) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => transactionService.clearPending()}
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
