import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { contractReadService } from '../services/readClient';
import { transactionService } from '../services/transactionService';
import { PublisherProfile, TranslationCandidate } from '../types/contract';
import { formatSha, formatTimestamp } from '../utils/formatters';
import { getGitHubCommitUrl, getGitHubRawUrl } from '../utils/github';

export const PublishView: React.FC = () => {
  const { connectedAccount, selectedProvider } = useWallet();

  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [candidates, setCandidates] = useState<TranslationCandidate[]>([]);
  const [selectedCandId, setSelectedCandId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(transactionService.isLocked);
  const [error, setError] = useState<string | null>(null);
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
      const [prof, candPage] = await Promise.all([
        contractReadService.getPublisherProfile('publish', true),
        contractReadService.getTranslationCandidatesPage(0, 50, 0, 'publish', true),
      ]);
      setProfile(prof);
      setCandidates(candPage.items);

      const accepted = candPage.items.filter((c) => c.state === 'ACCEPTED');
      if (accepted.length > 0 && selectedCandId === null) {
        setSelectedCandId(accepted[0].id);
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

  const handlePublish = async () => {
    if (!selectedCandId) return;
    setError(null);

    if (!connectedAccount || !selectedProvider) {
      setError('Please connect your authorized wallet first.');
      return;
    }

    if (isLocked) {
      setError('A transaction is currently in flight.');
      return;
    }

    try {
      await transactionService.executeWrite(
        selectedProvider,
        connectedAccount,
        'publish_translation',
        [selectedCandId]
      );
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const acceptedCandidates = candidates.filter((c) => c.state === 'ACCEPTED');
  const publishedCandidates = candidates.filter((c) => c.state === 'PUBLISHED');
  const currentCand = candidates.find((c) => c.id === selectedCandId);

  return (
    <div className="publish-view" role="tabpanel" id="panel-publish" aria-labelledby="tab-publish">
      {fetchError && (
        <div className="banner banner-warning">
          <span>Failed to load live publish data: {fetchError}. Displaying retained state.</span>
        </div>
      )}

      {/* 1. Release Gate Publisher */}
      <div className="card">
        <h2 className="card-title">Translation Release Gate</h2>
        <p className="card-desc">
          Authorize and execute the formal release gate for translation candidates that have successfully achieved consensus acceptance.
        </p>

        {error && <div className="banner banner-warning">{error}</div>}

        {acceptedCandidates.length > 0 ? (
          <div>
            <div className="form-grid" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="publish-select">
                  Select Accepted Translation Candidate
                </label>
                <select
                  id="publish-select"
                  className="form-select font-mono"
                  value={selectedCandId || ''}
                  onChange={(e) => setSelectedCandId(Number(e.target.value))}
                >
                  {acceptedCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      Candidate #{c.id} — Locale: {c.locale} (Canonical #{c.canonical_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!connectedAccount || isLocked || !selectedCandId}
                  onClick={handlePublish}
                >
                  {isLocked ? 'Publishing...' : 'Publish Translation'}
                </button>
              </div>
            </div>

            {currentCand && (
              <div className="banner banner-info">
                <span>
                  Ready to publish <strong>Candidate #{currentCand.id}</strong> ({currentCand.locale})
                  for Canonical Policy #{currentCand.canonical_id}.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>
            No candidates currently in <strong>ACCEPTED</strong> state. Complete the assessment step in the Assess journey first.
          </div>
        )}
      </div>

      {/* 2. Published Policies Table */}
      <div className="card">
        <div className="card-title">
          <span>Published Translation Policies ({publishedCandidates.length})</span>
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

        {publishedCandidates.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate ID</th>
                  <th>Canonical ID</th>
                  <th>Locale</th>
                  <th>State</th>
                  <th>Commit SHA</th>
                  <th>File Path</th>
                  <th>Digest</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {publishedCandidates.map((cand) => {
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
                        <span className="badge badge-published">PUBLISHED</span>
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
                      <td>{formatTimestamp(cand.created_at).formatted}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>
            No translations published yet.
          </div>
        )}
      </div>
    </div>
  );
};
