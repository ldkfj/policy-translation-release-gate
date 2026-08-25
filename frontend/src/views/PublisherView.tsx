import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { contractReadService } from '../services/readClient';
import { transactionService } from '../services/transactionService';
import { PublisherProfile, CanonicalRevision } from '../types/contract';
import {
  isValidCommitSha,
  isValidDigest,
  isValidSafePath,
  isValidOwnerRepo,
  isValidClientNonce,
  generateClientNonce,
} from '../utils/validation';
import { formatAddress, formatSha, formatTimestamp } from '../utils/formatters';
import { getGitHubCommitUrl, getGitHubRawUrl } from '../utils/github';

export const PublisherView: React.FC = () => {
  const { connectedAccount, selectedProvider } = useWallet();

  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [revisions, setRevisions] = useState<CanonicalRevision[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(transactionService.isLocked);

  // Initialize Publisher Form
  const [initOwner, setInitOwner] = useState('');
  const [initRepo, setInitRepo] = useState('');
  const [initError, setInitError] = useState<string | null>(null);

  // Register Canonical Form
  const [regNonce, setRegNonce] = useState(generateClientNonce());
  const [regCommit, setRegCommit] = useState('');
  const [regPath, setRegPath] = useState('policy.md');
  const [regDigest, setRegDigest] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Activate Canonical Error
  const [actError, setActError] = useState<string | null>(null);
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
      const [prof, revPage] = await Promise.all([
        contractReadService.getPublisherProfile('publisher', true),
        contractReadService.getCanonicalRevisionsPage(0, 50, 'publisher', true),
      ]);
      setProfile(prof);
      setRevisions(revPage.items);
      if (prof?.owner) setInitOwner(prof.owner);
      if (prof?.repo) setInitRepo(prof.repo);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitializePublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitError(null);

    if (!connectedAccount || !selectedProvider) {
      setInitError('Please connect your authorized wallet first.');
      return;
    }

    if (isLocked) {
      setInitError('A transaction is currently in flight.');
      return;
    }

    if (!isValidOwnerRepo(initOwner, initRepo)) {
      setInitError('Invalid GitHub owner or repository name.');
      return;
    }

    try {
      await transactionService.executeWrite(
        selectedProvider,
        connectedAccount,
        'initialize_publisher',
        [initOwner.trim(), initRepo.trim()]
      );
      await loadData();
    } catch (err: unknown) {
      setInitError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRegisterCanonical = async (e: React.FormEvent) => {
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

    if (!isValidClientNonce(regNonce)) {
      setRegError('Invalid client nonce format.');
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
        'register_canonical',
        [regNonce, regCommit.trim().toLowerCase(), regPath.trim(), regDigest.trim().toLowerCase()],
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

  const handleActivateCanonical = async (idToActivate: number) => {
    setActError(null);
    if (!connectedAccount || !selectedProvider) {
      setActError('Please connect your authorized wallet first.');
      return;
    }

    if (isLocked) {
      setActError('A transaction is currently in flight.');
      return;
    }

    try {
      await transactionService.executeWrite(
        selectedProvider,
        connectedAccount,
        'activate_canonical',
        [idToActivate]
      );
      await loadData();
    } catch (err: unknown) {
      setActError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="publisher-view" role="tabpanel" id="panel-publisher" aria-labelledby="tab-publisher">
      {fetchError && (
        <div className="banner banner-warning">
          <span>Failed to load live publisher data: {fetchError}. Displaying retained state.</span>
        </div>
      )}

      {/* 1. Publisher Profile */}
      <div className="card">
        <h2 className="card-title">Publisher Profile Initialization</h2>
        <p className="card-desc">
          Configure the official GitHub repository authority for canonical policies and localized translations.
        </p>

        {profile?.initialized ? (
          <div className="banner banner-info" style={{ marginBottom: 16 }}>
            <span>
              Publisher is initialized for repository{' '}
              <strong>
                {profile.owner}/{profile.repo}
              </strong>{' '}
              by authority <code className="font-mono">{formatAddress(profile.admin)}</code>.
            </span>
          </div>
        ) : (
          <form onSubmit={handleInitializePublisher}>
            {initError && <div className="banner banner-warning">{initError}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="init-owner">
                  GitHub Owner / Organization
                </label>
                <input
                  id="init-owner"
                  type="text"
                  className="form-input"
                  placeholder="e.g. acme-corp"
                  value={initOwner}
                  onChange={(e) => setInitOwner(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="init-repo">
                  GitHub Repository Name
                </label>
                <input
                  id="init-repo"
                  type="text"
                  className="form-input"
                  placeholder="e.g. policies"
                  value={initRepo}
                  onChange={(e) => setInitRepo(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={!connectedAccount || isLocked}>
              {isLocked ? 'Transaction in Flight...' : 'Initialize Publisher'}
            </button>
          </form>
        )}
      </div>

      {/* 2. Register Canonical Revision */}
      <div className="card">
        <h2 className="card-title">Register Canonical Policy Revision</h2>
        <p className="card-desc">
          Register an authoritative canonical policy source from a verified commit, path, and SHA-256 digest.
        </p>

        <form onSubmit={handleRegisterCanonical}>
          {regError && <div className="banner banner-warning">{regError}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-nonce">
                Client Idempotency Nonce
              </label>
              <input
                id="reg-nonce"
                type="text"
                className="form-input font-mono"
                value={regNonce}
                onChange={(e) => setRegNonce(e.target.value)}
                required
              />
              <span className="form-hint">Generated automatically to prevent duplicate on-chain writes.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-commit">
                Commit SHA (40-char Hex)
              </label>
              <input
                id="reg-commit"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. e424bfade424bfade424bfade424bfade424bfad"
                value={regCommit}
                onChange={(e) => setRegCommit(e.target.value)}
                maxLength={40}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-path">
                Relative Policy Path
              </label>
              <input
                id="reg-path"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. terms/privacy-policy.md"
                value={regPath}
                onChange={(e) => setRegPath(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-digest">
                SHA-256 Digest (64-char Hex)
              </label>
              <input
                id="reg-digest"
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
            {isLocked ? 'Transaction in Flight...' : 'Register Canonical Revision'}
          </button>
        </form>
      </div>

      {/* 3. Canonical Revisions List & Activation */}
      <div className="card">
        <div className="card-title">
          <span>Canonical Policy Revisions ({revisions.length})</span>
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

        {actError && <div className="banner banner-warning">{actError}</div>}

        {revisions.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>State</th>
                  <th>Commit</th>
                  <th>Path</th>
                  <th>Digest</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {revisions.map((rev) => {
                  const commitUrl =
                    profile?.owner && profile.repo
                      ? getGitHubCommitUrl(profile.owner, profile.repo, rev.commit)
                      : null;
                  const rawUrl =
                    profile?.owner && profile.repo
                      ? getGitHubRawUrl(profile.owner, profile.repo, rev.commit, rev.path)
                      : null;

                  return (
                    <tr key={rev.id}>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        #{rev.id}
                      </td>
                      <td>
                        <span className={`badge ${rev.state === 'ACTIVE' ? 'badge-active' : 'badge-draft'}`}>
                          {rev.state}
                        </span>
                      </td>
                      <td className="font-mono">
                        {commitUrl ? (
                          <a href={commitUrl} target="_blank" rel="noopener noreferrer">
                            {formatSha(rev.commit)}
                          </a>
                        ) : (
                          formatSha(rev.commit)
                        )}
                      </td>
                      <td className="font-mono">
                        {rawUrl ? (
                          <a href={rawUrl} target="_blank" rel="noopener noreferrer">
                            {rev.path}
                          </a>
                        ) : (
                          rev.path
                        )}
                      </td>
                      <td className="font-mono" title={rev.digest}>
                        {formatSha(rev.digest)}
                      </td>
                      <td>{formatTimestamp(rev.created_at).formatted}</td>
                      <td>
                        {rev.state !== 'ACTIVE' ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            disabled={!connectedAccount || isLocked}
                            onClick={() => handleActivateCanonical(rev.id)}
                          >
                            Activate
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>
            No canonical policy revisions registered yet.
          </div>
        )}
      </div>
    </div>
  );
};
