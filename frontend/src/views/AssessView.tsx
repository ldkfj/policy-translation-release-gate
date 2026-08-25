import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { contractReadService } from '../services/readClient';
import { transactionService } from '../services/transactionService';
import {
  PublisherProfile,
  TranslationCandidate,
  Assessment,
  AssessmentOutcome,
} from '../types/contract';
import { formatCoverageBps, formatSha } from '../utils/formatters';
import { getGitHubCommitUrl } from '../utils/github';

const OUTCOME_BADGE_CLASSES: Record<AssessmentOutcome, string> = {
  MATERIALLY_EQUIVALENT: 'badge-accepted',
  OBLIGATION_DRIFT: 'badge-revision',
  RIGHT_OR_EXCEPTION_LOSS: 'badge-revision',
  SCOPE_OR_THRESHOLD_DRIFT: 'badge-revision',
  NOT_COMPARABLE: 'badge-hold',
  UNRESOLVED: 'badge-hold',
};

export const AssessView: React.FC = () => {
  const { connectedAccount, selectedProvider } = useWallet();

  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [candidates, setCandidates] = useState<TranslationCandidate[]>([]);
  const [selectedCandId, setSelectedCandId] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
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
        contractReadService.getPublisherProfile('assess', true),
        contractReadService.getTranslationCandidatesPage(0, 50, 0, 'assess', true),
      ]);
      setProfile(prof);
      setCandidates(candPage.items);

      if (candPage.items.length > 0 && selectedCandId === null) {
        const first = candPage.items[0];
        setSelectedCandId(first.id);
        if (first.has_assessment) {
          const ass = await contractReadService.getAssessment(first.id, 'assess', true);
          setAssessment(ass);
        }
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
    setAssessment(null);
    setError(null);
    try {
      const cand = candidates.find((c) => c.id === candidateId);
      if (cand && cand.has_assessment) {
        const ass = await contractReadService.getAssessment(candidateId, 'assess', true);
        setAssessment(ass);
      }
    } catch {
      // Handled via null state
    }
  };

  const handleTriggerAssessment = async () => {
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
        'assess_translation',
        [selectedCandId]
      );
      await loadData();
      const ass = await contractReadService.getAssessment(selectedCandId, 'assess', true);
      setAssessment(ass);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRetryUnresolved = async () => {
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
        'retry_unresolved',
        [selectedCandId]
      );
      await loadData();
      const ass = await contractReadService.getAssessment(selectedCandId, 'assess', true);
      setAssessment(ass);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const currentCand = candidates.find((c) => c.id === selectedCandId);

  const canCommitUrl =
    profile?.owner && profile.repo && assessment?.canonical_commit
      ? getGitHubCommitUrl(profile.owner, profile.repo, assessment.canonical_commit)
      : null;

  const transCommitUrl =
    profile?.owner && profile.repo && assessment?.translation_commit
      ? getGitHubCommitUrl(profile.owner, profile.repo, assessment.translation_commit)
      : null;

  return (
    <div className="assess-view" role="tabpanel" id="panel-assess" aria-labelledby="tab-assess">
      {fetchError && (
        <div className="banner banner-warning">
          <span>Failed to load live assessment data: {fetchError}. Displaying retained state.</span>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <span>GenLayer Intelligent Consensus Assessment</span>
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
        <p className="card-desc">
          Trigger GenLayer validator consensus to perform deep semantic equivalence assessment between canonical policies and translations.
        </p>

        {error && <div className="banner banner-warning">{error}</div>}

        {/* Candidate Selector */}
        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="select-candidate">
              Select Translation Candidate
            </label>
            <select
              id="select-candidate"
              className="form-select font-mono"
              value={selectedCandId || ''}
              onChange={(e) => handleSelectCandidate(Number(e.target.value))}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.locale} (State: {c.state}, Attempts: {c.attempts})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {currentCand && currentCand.state === 'FROZEN' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!connectedAccount || isLocked}
                  onClick={handleTriggerAssessment}
                >
                  {isLocked ? 'Assessing...' : 'Trigger AI Consensus Assessment'}
                </button>
              )}

              {currentCand && currentCand.state === 'HOLD_UNRESOLVED' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!connectedAccount || isLocked}
                  onClick={handleRetryUnresolved}
                >
                  {isLocked ? 'Retrying...' : 'Retry Unresolved Assessment'}
                </button>
              )}
            </div>
          </div>
        </div>

        {currentCand && (
          <div className="banner banner-info" style={{ marginBottom: 20 }}>
            <span>
              Candidate #{currentCand.id} ({currentCand.locale}) is in state{' '}
              <strong>{currentCand.state}</strong> with {currentCand.attempts} assessment attempt(s).
            </span>
          </div>
        )}
      </div>

      {/* Assessment Breakdown (17 fields) */}
      {assessment ? (
        <div className="card">
          <div className="card-title">
            <span>Assessment Breakdown (17-Field Consensus Schema)</span>
            <span className={`badge ${OUTCOME_BADGE_CLASSES[assessment.outcome]}`}>
              {assessment.outcome}
            </span>
          </div>

          <div className="form-grid" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <span className="form-label">Consensus Outcome</span>
              <span style={{ fontWeight: 600 }}>{assessment.outcome}</span>
            </div>

            <div className="form-group">
              <span className="form-label">Coverage BPS</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>
                {formatCoverageBps(assessment.coverage_bps)}
              </span>
            </div>

            <div className="form-group">
              <span className="form-label">Canonical Commit</span>
              <div className="font-mono">
                {canCommitUrl ? (
                  <a href={canCommitUrl} target="_blank" rel="noopener noreferrer">
                    {formatSha(assessment.canonical_commit)}
                  </a>
                ) : (
                  formatSha(assessment.canonical_commit)
                )}
              </div>
            </div>

            <div className="form-group">
              <span className="form-label">Translation Commit</span>
              <div className="font-mono">
                {transCommitUrl ? (
                  <a href={transCommitUrl} target="_blank" rel="noopener noreferrer">
                    {formatSha(assessment.translation_commit)}
                  </a>
                ) : (
                  formatSha(assessment.translation_commit)
                )}
              </div>
            </div>

            <div className="form-group">
              <span className="form-label">Canonical Sections</span>
              <span className="font-mono">
                {assessment.canonical_section_count} ({assessment.canonical_section_ids.join(', ')})
              </span>
            </div>

            <div className="form-group">
              <span className="form-label">Translation Sections</span>
              <span className="font-mono">
                {assessment.translation_section_count} ({assessment.translation_section_ids.join(', ')})
              </span>
            </div>

            <div className="form-group">
              <span className="form-label">Matched Section Count</span>
              <span className="font-mono">{assessment.matched_section_count} sections</span>
            </div>

            <div className="form-group">
              <span className="form-label">Changed Dimensions</span>
              <div>
                {assessment.changed_dimensions.length > 0 ? (
                  assessment.changed_dimensions.map((dim) => (
                    <span key={dim} className="badge badge-revision" style={{ marginRight: 6 }}>
                      {dim}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>None</span>
                )}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <span className="form-label">Consensus Fingerprint</span>
              <span className="font-mono" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {assessment.fingerprint}
              </span>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <span className="form-label">Validator Consensus Reasoning</span>
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}
              >
                {assessment.reason || 'No detailed reason provided.'}
              </div>
            </div>
          </div>

          {/* Section Results Table */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>
            Section-by-Section Dimensional Analysis ({assessment.section_results.length})
          </h3>

          {assessment.section_results.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Section ID</th>
                    <th>Rights</th>
                    <th>Obligations</th>
                    <th>Prohibitions</th>
                    <th>Exceptions</th>
                    <th>Scope</th>
                    <th>Thresholds</th>
                    <th>Deadlines</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.section_results.map((sec, idx) => (
                    <tr key={sec.section_id || idx}>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {sec.section_id}
                      </td>
                      <td>
                        <span className={`badge ${sec.rights === 'EQUIVALENT' ? 'badge-accepted' : 'badge-revision'}`}>
                          {sec.rights}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sec.obligations === 'EQUIVALENT' ? 'badge-accepted' : 'badge-revision'}`}>
                          {sec.obligations}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sec.prohibitions === 'EQUIVALENT' ? 'badge-accepted' : 'badge-revision'}`}>
                          {sec.prohibitions}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sec.exceptions === 'EQUIVALENT' ? 'badge-accepted' : 'badge-revision'}`}>
                          {sec.exceptions}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sec.scope === 'EQUIVALENT' ? 'badge-accepted' : 'badge-revision'}`}>
                          {sec.scope}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sec.thresholds === 'EQUIVALENT' ? 'badge-accepted' : 'badge-revision'}`}>
                          {sec.thresholds}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sec.deadlines === 'EQUIVALENT' ? 'badge-accepted' : 'badge-revision'}`}>
                          {sec.deadlines}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>No individual section results recorded.</div>
          )}
        </div>
      ) : (
        selectedCandId && (
          <div className="card" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>
            {currentCand?.state === 'FROZEN' ? (
              <p>Candidate is FROZEN and awaiting assessment. Click above to trigger consensus.</p>
            ) : (
              <p>No assessment recorded for candidate #{selectedCandId}.</p>
            )}
          </div>
        )
      )}
    </div>
  );
};
