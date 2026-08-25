import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { contractReadService } from '../services/readClient';
import { transactionService } from '../services/transactionService';
import { PublisherProfile, TranslationCandidate } from '../types/contract';
import {
  isValidCommitSha,
  isValidDigest,
  isValidSafePath,
  isValidLocale,
  isValidClientNonce,
  generateClientNonce,
} from '../utils/validation';
import { formatSha, formatTimestamp } from '../utils/formatters';
import { getGitHubCommitUrl, getGitHubRawUrl } from '../utils/github';

export const LocalizerView: React.FC = () => {
  const { connectedAccount, selectedProvider } = useWallet();

  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [candidates, setCandidates] = useState<TranslationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(transactionService.isLocked);

  // Register Candidate Form
  const [regNonce, setRegNonce] = useState(generateClientNonce());
  const [regCanId, setRegCanId] = useState<string>('1');
  const [regLocale, setRegLocale] = useState('es');
  const [regCommit, setRegCommit] = useState('');
  const [regPath, setRegPath] = useState('i18n/es/policy.md');
  const [regDigest, setRegDigest] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Edit Draft Form
  const [editingCandidate, setEditingCandidate] = useState<TranslationCandidate | null>(null);
  const [editCommit, setEditCommit] = useState('');
  const [editPath, setEditPath] = useState('');
  const [editDigest, setEditDigest] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
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
      const [prof, actCan, candPage] = await Promise.all([
        contractReadService.getPublisherProfile('localizer', true),
        contractReadService.getActiveCanonical('localizer', true),
        contractReadService.getTranslationCandidatesPage(0, 50, 0, 'localizer', true),
      ]);
      setProfile(prof);
      setCandidates(candPage.items);
      if (actCan?.is_active && actCan.id > 0) {
        setRegCanId(String(actCan.id));
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

  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!connectedAccount || !selectedProvider) {
      setRegError('Please connect your authorized wallet first.');
      return;
    }

    if (isLocked) {
      setRegError('A transaction is currently in flight.');
      return;
    }

    const canIdNum = parseInt(regCanId, 10);
    if (isNaN(canIdNum) || canIdNum <= 0) {
      setRegError('Invalid Canonical ID.');
      return;
    }

    if (!isValidClientNonce(regNonce)) {
      setRegError('Invalid client nonce format.');
      return;
    }

    if (!isValidLocale(regLocale)) {
      setRegError('Invalid BCP-47 locale tag (e.g. es, fr, zh-CN).');
      return;
    }

    if (!isValidCommitSha(regCommit)) {
      setRegError('Invalid 40-character hex commit SHA.');
      return;
    }

    if (!isValidSafePath(regPath)) {
      setRegError('Invalid relative policy file path (must not contain .. or start with /).');
      return;
    }

    if (!isValidDigest(regDigest)) {
      setRegError('Invalid 64-character hex SHA-256 digest.');
      return;
    }

    try {
      await transactionService.executeWrite(
        selectedProvider,
        connectedAccount,
        'register_translation',
        [
          regNonce,
          canIdNum,
          regLocale.trim(),
          regCommit.trim().toLowerCase(),
          regPath.trim(),
          regDigest.trim().toLowerCase(),
        ],
        regNonce
      );
      setRegNonce(generateClientNonce());
      setRegCommit('');
      setRegDigest('');
      await loadData();
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStartEditDraft = (cand: TranslationCandidate) => {
    setEditingCandidate(cand);
    setEditCommit(cand.commit);
    setEditPath(cand.path);
    setEditDigest(cand.digest);
    setEditError(null);
  };

  const handleUpdateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingCandidate) return;
    if (!connectedAccount || !selectedProvider) {
      setEditError('Please connect your authorized wallet first.');
      return;
    }

    if (isLocked) {
      setEditError('A transaction is currently in flight.');
      return;
    }

    if (!isValidCommitSha(editCommit)) {
      setEditError('Invalid 40-character hex commit SHA.');
      return;
    }

    if (!isValidSafePath(editPath)) {
      setEditError('Invalid relative policy file path (must not contain .. or start with /).');
      return;
    }

    if (!isValidDigest(editDigest)) {
      setEditError('Invalid 64-character hex SHA-256 digest.');
      return;
    }

    try {
      await transactionService.executeWrite(
        selectedProvider,
        connectedAccount,
        'update_translation_draft',
        [
          editingCandidate.id,
          editCommit.trim().toLowerCase(),
          editPath.trim(),
          editDigest.trim().toLowerCase(),
        ]
      );
      setEditingCandidate(null);
      await loadData();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFreezeCandidate = async (candidateId: number) => {
    setActionError(null);
    if (!connectedAccount || !selectedProvider) {
      setActionError('Please connect your authorized wallet first.');
      return;
    }

    if (isLocked) {
      setActionError('A transaction is currently in flight.');
      return;
    }

    try {
      await transactionService.executeWrite(
        selectedProvider,
        connectedAccount,
        'freeze_translation',
        [candidateId]
      );
      await loadData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="localizer-view" role="tabpanel" id="panel-localizer" aria-labelledby="tab-localizer">
      {fetchError && (
        <div className="banner banner-warning">
          <span>Failed to load live localizer data: {fetchError}. Displaying retained state.</span>
        </div>
      )}

      {/* 1. Register Translation Candidate */}
      <div className="card">
        <h2 className="card-title">Register Translation Candidate</h2>
        <p className="card-desc">
          Submit a localized translation draft for a specific canonical policy revision and target locale.
        </p>

        <form onSubmit={handleRegisterCandidate}>
          {regError && <div className="banner banner-warning">{regError}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="cand-nonce">
                Client Idempotency Nonce
              </label>
              <input
                id="cand-nonce"
                type="text"
                className="form-input font-mono"
                value={regNonce}
                onChange={(e) => setRegNonce(e.target.value)}
                required
              />
              <span className="form-hint">Generated automatically to prevent duplicate on-chain writes.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cand-can-id">
                Canonical Policy ID
              </label>
              <input
                id="cand-can-id"
                type="number"
                min="1"
                className="form-input font-mono"
                value={regCanId}
                onChange={(e) => setRegCanId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cand-locale">
                Target Locale (BCP-47)
              </label>
              <input
                id="cand-locale"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. es, fr, zh-CN, de, ja-JP"
                value={regLocale}
                onChange={(e) => setRegLocale(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cand-commit">
                Translation Commit SHA (40-char Hex)
              </label>
              <input
                id="cand-commit"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. 4ac37ed34ac37ed34ac37ed34ac37ed34ac37ed3"
                value={regCommit}
                onChange={(e) => setRegCommit(e.target.value)}
                maxLength={40}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cand-path">
                Relative Translation Path
              </label>
              <input
                id="cand-path"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. i18n/es/policy.md"
                value={regPath}
                onChange={(e) => setRegPath(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cand-digest">
                Translation SHA-256 Digest (64-char Hex)
              </label>
              <input
                id="cand-digest"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
                value={regDigest}
                onChange={(e) => setRegDigest(e.target.value)}
                maxLength={64}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={!connectedAccount || isLocked}>
            {isLocked ? 'Transaction in Flight...' : 'Register Translation Candidate'}
          </button>
        </form>
      </div>

      {/* Edit Draft Modal */}
      {editingCandidate && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-draft-title">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 id="edit-draft-title" className="card-title" style={{ margin: 0 }}>
                Update Draft #{editingCandidate.id} ({editingCandidate.locale})
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingCandidate(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateDraft}>
              {editError && <div className="banner banner-warning">{editError}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-commit">
                    New Commit SHA
                  </label>
                  <input
                    id="edit-commit"
                    type="text"
                    className="form-input font-mono"
                    value={editCommit}
                    onChange={(e) => setEditCommit(e.target.value)}
                    maxLength={40}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-path">
                    New File Path
                  </label>
                  <input
                    id="edit-path"
                    type="text"
                    className="form-input font-mono"
                    value={editPath}
                    onChange={(e) => setEditPath(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="edit-digest">
                    New SHA-256 Digest
                  </label>
                  <input
                    id="edit-digest"
                    type="text"
                    className="form-input font-mono"
                    value={editDigest}
                    onChange={(e) => setEditDigest(e.target.value)}
                    maxLength={64}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingCandidate(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLocked}>
                  {isLocked ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Translation Candidates List */}
      <div className="card">
        <div className="card-title">
          <span>Translation Candidates ({candidates.length})</span>
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

        {actionError && <div className="banner banner-warning">{actionError}</div>}

        {candidates.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Canonical</th>
                  <th>Locale</th>
                  <th>State</th>
                  <th>Commit</th>
                  <th>Path</th>
                  <th>Digest</th>
                  <th>Attempts</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand) => {
                  const stateBadgeClass =
                    cand.state === 'PUBLISHED'
                      ? 'badge-published'
                      : cand.state === 'ACCEPTED'
                      ? 'badge-accepted'
                      : cand.state === 'FROZEN'
                      ? 'badge-frozen'
                      : cand.state === 'REVISION_REQUIRED'
                      ? 'badge-revision'
                      : cand.state === 'HOLD_UNRESOLVED'
                      ? 'badge-hold'
                      : 'badge-draft';

                  const commitUrl =
                    profile?.owner && profile.repo
                      ? getGitHubCommitUrl(profile.owner, profile.repo, cand.commit)
                      : null;
                  const rawUrl =
                    profile?.owner && profile.repo
                      ? getGitHubRawUrl(profile.owner, profile.repo, cand.commit, cand.path)
                      : null;

                  return (
                    <tr key={cand.id}>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        #{cand.id}
                      </td>
                      <td className="font-mono">#{cand.canonical_id}</td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {cand.locale}
                      </td>
                      <td>
                        <span className={`badge ${stateBadgeClass}`}>{cand.state}</span>
                      </td>
                      <td className="font-mono">
                        {commitUrl ? (
                          <a href={commitUrl} target="_blank" rel="noopener noreferrer">
                            {formatSha(cand.commit)}
                          </a>
                        ) : (
                          formatSha(cand.commit)
                        )}
                      </td>
                      <td className="font-mono">
                        {rawUrl ? (
                          <a href={rawUrl} target="_blank" rel="noopener noreferrer">
                            {cand.path}
                          </a>
                        ) : (
                          cand.path
                        )}
                      </td>
                      <td className="font-mono" title={cand.digest}>
                        {formatSha(cand.digest)}
                      </td>
                      <td className="font-mono">{cand.attempts}</td>
                      <td>{formatTimestamp(cand.created_at).formatted}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {cand.state === 'DRAFT' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                onClick={() => handleStartEditDraft(cand)}
                                disabled={isLocked}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                disabled={!connectedAccount || isLocked}
                                onClick={() => handleFreezeCandidate(cand.id)}
                              >
                                Freeze
                              </button>
                            </>
                          )}
                          {cand.state === 'REVISION_REQUIRED' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                              disabled={!connectedAccount || isLocked}
                              onClick={() => handleFreezeCandidate(cand.id)}
                            >
                              Refreeze
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>
            No translation candidates registered yet.
          </div>
        )}
      </div>
    </div>
  );
};
