import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { contractReadService } from '../services/readClient';
import { transactionService } from '../services/transactionService';
import {
  PublisherProfile,
  TranslationCandidate,
  EffectiveLocale,
  ConsumerBinding,
} from '../types/contract';
import { isValidNamespace, isValidLocale } from '../utils/validation';
import { formatSha, formatTimestamp } from '../utils/formatters';
import { getGitHubCommitUrl, getGitHubRawUrl } from '../utils/github';

export const ConsumerView: React.FC = () => {
  const { connectedAccount, selectedProvider } = useWallet();

  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [publishedCandidates, setPublishedCandidates] = useState<TranslationCandidate[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(transactionService.isLocked);

  // Bind Consumer Form
  const [bindNamespace, setBindNamespace] = useState('web-portal');
  const [bindLocale, setBindLocale] = useState('es');
  const [bindCandidateId, setBindCandidateId] = useState<string>('');
  const [bindError, setBindError] = useState<string | null>(null);

  // Effective Locale Query
  const [queryLocale, setQueryLocale] = useState('es-MX');
  const [effectiveResult, setEffectiveResult] = useState<EffectiveLocale | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Consumer Binding Lookup
  const [lookupNs, setLookupNs] = useState('web-portal');
  const [lookupLoc, setLookupLoc] = useState('es');
  const [bindingResult, setBindingResult] = useState<ConsumerBinding | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = transactionService.subscribe((status) => {
      setIsLocked(status.isLocked);
    });
    return unsub;
  }, []);

  const loadData = async () => {
    setFetchError(null);
    try {
      const [prof, candPage] = await Promise.all([
        contractReadService.getPublisherProfile('consumer', true),
        contractReadService.getTranslationCandidatesPage(0, 50, 0, 'consumer', true),
      ]);
      setProfile(prof);
      const published = candPage.items.filter((c) => c.state === 'PUBLISHED');
      setPublishedCandidates(published);
      if (published.length > 0 && !bindCandidateId) {
        setBindCandidateId(String(published[0].id));
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBindConsumer = async (e: React.FormEvent) => {
    e.preventDefault();
    setBindError(null);

    if (!connectedAccount || !selectedProvider) {
      setBindError('Please connect your authorized wallet first.');
      return;
    }

    if (isLocked) {
      setBindError('A transaction is currently in flight.');
      return;
    }

    if (!isValidNamespace(bindNamespace)) {
      setBindError('Invalid namespace (alphanumeric, dash, underscore, 1-64 chars).');
      return;
    }

    if (!isValidLocale(bindLocale)) {
      setBindError('Invalid BCP-47 locale tag.');
      return;
    }

    const candIdNum = parseInt(bindCandidateId, 10);
    if (isNaN(candIdNum) || candIdNum <= 0) {
      setBindError('Invalid published candidate ID.');
      return;
    }

    try {
      await transactionService.executeWrite(
        selectedProvider,
        connectedAccount,
        'bind_consumer',
        [bindNamespace.trim(), bindLocale.trim(), candIdNum]
      );
      await loadData();
    } catch (err: unknown) {
      setBindError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleQueryEffectiveLocale = async (e: React.FormEvent) => {
    e.preventDefault();
    setQueryError(null);
    setIsQuerying(true);

    if (!isValidLocale(queryLocale)) {
      setQueryError('Invalid BCP-47 locale format.');
      setIsQuerying(false);
      return;
    }

    try {
      const result = await contractReadService.getEffectiveLocale(queryLocale.trim(), 'consumer', true);
      setEffectiveResult(result);
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsQuerying(false);
    }
  };

  const handleLookupBinding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setIsLookingUp(true);

    if (!isValidNamespace(lookupNs) || !isValidLocale(lookupLoc)) {
      setLookupError('Invalid namespace or locale format.');
      setIsLookingUp(false);
      return;
    }

    try {
      const result = await contractReadService.getConsumerBinding(
        lookupNs.trim(),
        lookupLoc.trim(),
        'consumer',
        true
      );
      setBindingResult(result);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLookingUp(false);
    }
  };

  const effCommitUrl =
    profile?.owner && profile.repo && effectiveResult?.commit
      ? getGitHubCommitUrl(profile.owner, profile.repo, effectiveResult.commit)
      : null;

  const effRawUrl =
    profile?.owner && profile.repo && effectiveResult?.commit && effectiveResult?.path
      ? getGitHubRawUrl(profile.owner, profile.repo, effectiveResult.commit, effectiveResult.path)
      : null;

  return (
    <div className="consumer-view" role="tabpanel" id="panel-consumer" aria-labelledby="tab-consumer">
      {fetchError && (
        <div className="banner banner-warning">
          <span>Failed to load live consumer data: {fetchError}. Displaying retained state.</span>
        </div>
      )}

      {/* 1. Bind Consumer Namespace */}
      <div className="card">
        <h2 className="card-title">Bind Consumer Namespace</h2>
        <p className="card-desc">
          Associate an application namespace (e.g. web portal, mobile app, api client) with a published translation policy candidate.
        </p>

        <form onSubmit={handleBindConsumer}>
          {bindError && <div className="banner banner-warning">{bindError}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="bind-namespace">
                Consumer Namespace
              </label>
              <input
                id="bind-namespace"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. web-portal, mobile-app, api-gateway"
                value={bindNamespace}
                onChange={(e) => setBindNamespace(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bind-locale">
                Target Locale (BCP-47)
              </label>
              <input
                id="bind-locale"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. es, fr, zh-CN"
                value={bindLocale}
                onChange={(e) => setBindLocale(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bind-cand-id">
                Published Candidate ID
              </label>
              <select
                id="bind-cand-id"
                className="form-select font-mono"
                value={bindCandidateId}
                onChange={(e) => setBindCandidateId(e.target.value)}
                required
              >
                {publishedCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    Candidate #{c.id} — Locale: {c.locale} (Canonical #{c.canonical_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!connectedAccount || isLocked || publishedCandidates.length === 0}
          >
            {isLocked ? 'Binding in Flight...' : 'Bind Consumer Namespace'}
          </button>
        </form>
      </div>

      {/* 2. Effective Locale Resolution Engine */}
      <div className="card">
        <h2 className="card-title">Effective Locale Fallback Resolution Engine</h2>
        <p className="card-desc">
          Query the on-chain locale resolution chain to resolve regional dialects (e.g. <code>es-MX</code>, <code>fr-CA</code>) down to exact or base-language published translations.
        </p>

        <form onSubmit={handleQueryEffectiveLocale} style={{ marginBottom: 20 }}>
          {queryError && <div className="banner banner-warning">{queryError}</div>}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="query-locale">
                Client Request Locale (BCP-47)
              </label>
              <input
                id="query-locale"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. es-MX, es-ES, fr-CA, pt-BR, zh-HK"
                value={queryLocale}
                onChange={(e) => setQueryLocale(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isQuerying}
                style={{ marginTop: 22 }}
              >
                {isQuerying ? 'Querying...' : 'Resolve Effective Locale'}
              </button>
            </div>
          </div>
        </form>

        {effectiveResult && (
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            {effectiveResult.is_effective ? (
              <div className="form-grid">
                <div className="form-group">
                  <span className="form-label">Resolved Candidate ID</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    #{effectiveResult.candidate_id}
                  </span>
                </div>

                <div className="form-group">
                  <span className="form-label">Resolved Match Locale</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {effectiveResult.locale}
                  </span>
                </div>

                <div className="form-group">
                  <span className="form-label">Commit SHA</span>
                  <div className="font-mono">
                    {effCommitUrl ? (
                      <a href={effCommitUrl} target="_blank" rel="noopener noreferrer">
                        {formatSha(effectiveResult.commit)}
                      </a>
                    ) : (
                      formatSha(effectiveResult.commit)
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <span className="form-label">File Path</span>
                  <div className="font-mono">
                    {effRawUrl ? (
                      <a href={effRawUrl} target="_blank" rel="noopener noreferrer">
                        {effectiveResult.path}
                      </a>
                    ) : (
                      effectiveResult.path
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <span className="form-label">SHA-256 Digest</span>
                  <span className="font-mono" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    {effectiveResult.digest}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>
                No published translation found for locale <strong>{queryLocale}</strong> or its fallback base.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Consumer Binding Lookup */}
      <div className="card">
        <h2 className="card-title">Consumer Binding Verification</h2>
        <p className="card-desc">
          Inspect active bindings for specific application namespaces and locales.
        </p>

        <form onSubmit={handleLookupBinding} style={{ marginBottom: 20 }}>
          {lookupError && <div className="banner banner-warning">{lookupError}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="lookup-ns">
                Namespace
              </label>
              <input
                id="lookup-ns"
                type="text"
                className="form-input font-mono"
                value={lookupNs}
                onChange={(e) => setLookupNs(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lookup-loc">
                Locale
              </label>
              <input
                id="lookup-loc"
                type="text"
                className="form-input font-mono"
                value={lookupLoc}
                onChange={(e) => setLookupLoc(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isLookingUp}
                style={{ marginTop: 22 }}
              >
                {isLookingUp ? 'Searching...' : 'Lookup Binding'}
              </button>
            </div>
          </div>
        </form>

        {bindingResult && (
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            {bindingResult.exists ? (
              <div className="form-grid">
                <div className="form-group">
                  <span className="form-label">Bound Candidate ID</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    #{bindingResult.candidate_id}
                  </span>
                </div>

                <div className="form-group">
                  <span className="form-label">Canonical ID</span>
                  <span className="font-mono">#{bindingResult.canonical_id}</span>
                </div>

                <div className="form-group">
                  <span className="form-label">Candidate State</span>
                  <span className="badge badge-published">{bindingResult.candidate_state}</span>
                </div>

                <div className="form-group">
                  <span className="form-label">Bound Timestamp</span>
                  <span>{formatTimestamp(bindingResult.bound_at).formatted}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>
                No active binding found for namespace <strong>{lookupNs}</strong> / locale <strong>{lookupLoc}</strong>.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
