import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { contractReadService } from '../services/readClient';
import { transactionService } from '../services/transactionService';
import {
  TranslationCandidate,
  ObjectionRecord,
  ContractEvent,
} from '../types/contract';
import { isValidDigest, isValidObjectionReason } from '../utils/validation';
import { formatAddress, formatSha, formatTimestamp } from '../utils/formatters';

export const PublicAuditView: React.FC = () => {
  const { connectedAccount, selectedProvider } = useWallet();

  const [candidates, setCandidates] = useState<TranslationCandidate[]>([]);
  const [selectedCandId, setSelectedCandId] = useState<number | null>(null);
  const [objections, setObjections] = useState<ObjectionRecord[]>([]);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [upgrader, setUpgrader] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(transactionService.isLocked);

  // Record Objection Form
  const [objDigest, setObjDigest] = useState('');
  const [objReason, setObjReason] = useState('');
  const [objError, setObjError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = transactionService.subscribe((status) => {
      setIsLocked(status.isLocked);
    });
    return unsub;
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [candPage, evPage, upg] = await Promise.all([
        contractReadService.getTranslationCandidatesPage(0, 50, 0, 'audit', true),
        contractReadService.getEventsPage(0, 50, 'audit', true),
        contractReadService.getUpgrader('audit', true),
      ]);
      setCandidates(candPage.items);
      setEvents(evPage.items);
      setUpgrader(upg);

      if (candPage.items.length > 0 && selectedCandId === null) {
        const first = candPage.items[0];
        setSelectedCandId(first.id);
        setObjDigest(first.digest);
        const objPage = await contractReadService.getObjectionsPage(first.id, 0, 50, 'audit', true);
        setObjections(objPage.items);
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCandidate = async (candidateId: number) => {
    setSelectedCandId(candidateId);
    setObjError(null);
    const cand = candidates.find((c) => c.id === candidateId);
    if (cand) {
      setObjDigest(cand.digest);
    }
    try {
      const objPage = await contractReadService.getObjectionsPage(candidateId, 0, 50, 'audit', true);
      setObjections(objPage.items);
    } catch {
      setObjections([]);
    }
  };

  const handleRecordObjection = async (e: React.FormEvent) => {
    e.preventDefault();
    setObjError(null);

    if (!selectedCandId) return;

    if (!connectedAccount || !selectedProvider) {
      setObjError('Please connect your authorized wallet to record an on-chain objection.');
      return;
    }

    if (isLocked) {
      setObjError('A transaction is currently in flight. Please wait.');
      return;
    }

    const selectedCand = candidates.find((c) => c.id === selectedCandId);
    if (selectedCand && (selectedCand.state === 'PUBLISHED' || selectedCand.state === 'STALE_BY_CANONICAL_REVISION')) {
      setObjError(`Contract rejects objections against ${selectedCand.state} translation candidates.`);
      return;
    }

    if (!isValidDigest(objDigest)) {
      setObjError('Invalid 64-character hex SHA-256 digest.');
      return;
    }

    if (!isValidObjectionReason(objReason)) {
      setObjError('Objection reason must be between 1 and 500 characters.');
      return;
    }

    try {
      await transactionService.executeWrite(
        selectedProvider,
        connectedAccount,
        'record_objection',
        [selectedCandId, objDigest.trim().toLowerCase(), objReason.trim()]
      );
      setObjReason('');
      await handleSelectCandidate(selectedCandId);
    } catch (err: unknown) {
      setObjError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="audit-view" role="tabpanel" id="panel-audit" aria-labelledby="tab-audit">
      {fetchError && (
        <div className="banner banner-warning">
          <span>Failed to load live audit data: {fetchError}. Displaying retained state.</span>
        </div>
      )}

      {/* 1. Record Community Objection */}
      <div className="card">
        <h2 className="card-title">Public Objection Registry</h2>
        <p className="card-desc">
          Community members and independent auditors can record verifiable objections against active translation candidates (in DRAFT, FROZEN, ACCEPTED, REVISION_REQUIRED, or HOLD_UNRESOLVED state). The contract strictly rejects objections against PUBLISHED or STALE_BY_CANONICAL_REVISION candidates.
        </p>

        {objError && <div className="banner banner-warning">{objError}</div>}

        <form onSubmit={handleRecordObjection}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="audit-cand-select">
                Target Translation Candidate
              </label>
              <select
                id="audit-cand-select"
                className="form-select font-mono"
                value={selectedCandId || ''}
                onChange={(e) => handleSelectCandidate(Number(e.target.value))}
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    Candidate #{c.id} — Locale: {c.locale} (State: {c.state})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="obj-digest">
                Candidate SHA-256 Digest (64 hex chars)
              </label>
              <input
                id="obj-digest"
                type="text"
                className="form-input font-mono"
                value={objDigest}
                onChange={(e) => setObjDigest(e.target.value)}
                maxLength={64}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="obj-reason">
                Objection Rationale & Discrepancy Evidence (1–500 chars)
              </label>
              <textarea
                id="obj-reason"
                className="form-textarea"
                rows={3}
                placeholder="Describe the discrepancy, omitted right/obligation, or material inaccuracy..."
                value={objReason}
                onChange={(e) => setObjReason(e.target.value)}
                minLength={1}
                maxLength={500}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!connectedAccount || !selectedCandId || isLocked}
          >
            {isLocked ? 'Transaction in Flight...' : 'Record Formal Objection'}
          </button>
        </form>
      </div>

      {/* 2. Registered Objections */}
      <div className="card">
        <div className="card-title">
          <span>Objections for Candidate #{selectedCandId || '-'} ({objections.length})</span>
        </div>

        {objections.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Observer</th>
                  <th>Objection Digest</th>
                  <th>Reason</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {objections.map((obj, idx) => (
                  <tr key={idx}>
                    <td className="font-mono">{formatAddress(obj.observer)}</td>
                    <td className="font-mono" title={obj.objection_digest || obj.digest}>
                      {formatSha(obj.objection_digest || obj.digest || '')}
                    </td>
                    <td>{obj.reason}</td>
                    <td>{formatTimestamp(obj.created_at).formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>
            No objections recorded for this translation candidate.
          </div>
        )}
      </div>

      {/* 3. On-Chain Event Audit Trail */}
      <div className="card">
        <div className="card-title">
          <span>Contract Event Audit Trail ({events.length})</span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            onClick={loadData}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {events.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Payload Data</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, idx) => (
                  <tr key={idx}>
                    <td className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {ev.event_type}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                      {ev.payload ? JSON.stringify(ev.payload) : ev.payload_json}
                    </td>
                    <td>{formatTimestamp(ev.timestamp).formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>
            No contract events recorded yet.
          </div>
        )}
      </div>

      {/* 4. Contract Governance & Upgrader */}
      <div className="card">
        <h2 className="card-title">Security & Governance</h2>
        <div className="form-grid">
          <div className="form-group">
            <span className="form-label">Contract Upgrader Authority</span>
            <span className="font-mono">{upgrader ? formatAddress(upgrader) : 'None configured'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
