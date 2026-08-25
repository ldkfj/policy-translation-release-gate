import React, { useEffect, useState } from 'react';
import { contractReadService } from '../services/readClient';
import { PublisherProfile, ActiveCanonicalSummary } from '../types/contract';
import { JourneyTab } from '../components/Navigation';
import { formatAddress, formatTimestamp, formatSha } from '../utils/formatters';
import { getGitHubCommitUrl, getGitHubRawUrl } from '../utils/github';

interface OverviewViewProps {
  onNavigate: (tab: JourneyTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [activeCanonical, setActiveCanonical] = useState<ActiveCanonicalSummary | null>(null);
  const [upgrader, setUpgrader] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prof, actCan, upg] = await Promise.all([
        contractReadService.getPublisherProfile('overview'),
        contractReadService.getActiveCanonical('overview'),
        contractReadService.getUpgrader('overview'),
      ]);
      setProfile(prof);
      setActiveCanonical(actCan);
      setUpgrader(upg);
    } catch {
      // Handled via fallback defaults
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const commitUrl =
    profile?.owner && profile.repo && activeCanonical?.commit
      ? getGitHubCommitUrl(profile.owner, profile.repo, activeCanonical.commit)
      : null;

  const rawUrl =
    profile?.owner && profile.repo && activeCanonical?.commit && activeCanonical?.path
      ? getGitHubRawUrl(profile.owner, profile.repo, activeCanonical.commit, activeCanonical.path)
      : null;

  return (
    <div className="overview-view" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
      <div className="card">
        <div className="card-title">
          <span>System Status & Publisher Configuration</span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            onClick={loadData}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <span className="form-label">Publisher Profile</span>
            <div>
              {profile?.initialized ? (
                <span className="badge badge-active">Initialized</span>
              ) : (
                <span className="badge badge-revision">Uninitialized</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <span className="form-label">Repository Target</span>
            <div className="font-mono">
              {profile?.initialized && profile.owner && profile.repo ? (
                <a
                  href={`https://github.com/${profile.owner}/${profile.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {profile.owner}/{profile.repo}
                </a>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Not configured</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <span className="form-label">Publisher Authority Address</span>
            <div className="font-mono">
              {profile?.admin ? (
                formatAddress(profile.admin)
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>None</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <span className="form-label">Contract Upgrader</span>
            <div className="font-mono">
              {upgrader ? formatAddress(upgrader) : <span style={{ color: 'var(--text-muted)' }}>None</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Active Canonical Policy</h2>
        {activeCanonical && activeCanonical.is_active ? (
          <div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <span className="form-label">Canonical ID</span>
                <span className="font-mono" style={{ fontWeight: 600 }}>
                  #{activeCanonical.id}
                </span>
              </div>

              <div className="form-group">
                <span className="form-label">Commit SHA</span>
                <div className="font-mono">
                  {commitUrl ? (
                    <a href={commitUrl} target="_blank" rel="noopener noreferrer">
                      {formatSha(activeCanonical.commit)}
                    </a>
                  ) : (
                    formatSha(activeCanonical.commit)
                  )}
                </div>
              </div>

              <div className="form-group">
                <span className="form-label">Policy Path</span>
                <div className="font-mono">
                  {rawUrl ? (
                    <a href={rawUrl} target="_blank" rel="noopener noreferrer">
                      {activeCanonical.path}
                    </a>
                  ) : (
                    activeCanonical.path
                  )}
                </div>
              </div>

              <div className="form-group">
                <span className="form-label">SHA-256 Digest</span>
                <span className="font-mono" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  {activeCanonical.digest}
                </span>
              </div>

              <div className="form-group">
                <span className="form-label">Created At</span>
                <span>{formatTimestamp(activeCanonical.created_at).formatted}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '12px 0' }}>
            <p>No active canonical policy revision is currently configured.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Register and activate a canonical policy revision in the <strong>Publisher</strong> journey.
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Release Gate Journeys</h2>
        <p className="card-desc">
          Navigate through the six release gate journeys to manage canonical policies, localize translations, execute AI consensus assessments, publish validated policies, and verify consumer bindings.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          <div
            className="card"
            style={{
              margin: 0,
              backgroundColor: 'var(--bg-card)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('publisher')}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-primary)' }}>
              1. Publisher Journey
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Initialize publisher profile, register canonical revisions, and activate policies.
            </p>
          </div>

          <div
            className="card"
            style={{
              margin: 0,
              backgroundColor: 'var(--bg-card)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('localizer')}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-primary)' }}>
              2. Localizer Journey
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Register translation candidates, edit draft metadata, and freeze for consensus assessment.
            </p>
          </div>

          <div
            className="card"
            style={{
              margin: 0,
              backgroundColor: 'var(--bg-card)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('assess')}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-primary)' }}>
              3. Assess Journey
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Trigger GenLayer validator consensus, inspect 17-field breakdown, and retry unresolved.
            </p>
          </div>

          <div
            className="card"
            style={{
              margin: 0,
              backgroundColor: 'var(--bg-card)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('publish')}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-primary)' }}>
              4. Publish Journey
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Execute release gate to transition accepted candidates into published status.
            </p>
          </div>

          <div
            className="card"
            style={{
              margin: 0,
              backgroundColor: 'var(--bg-card)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('consumer')}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-primary)' }}>
              5. Consumer Journey
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Bind consumer namespaces and query effective translation resolution paths.
            </p>
          </div>

          <div
            className="card"
            style={{
              margin: 0,
              backgroundColor: 'var(--bg-card)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('audit')}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-primary)' }}>
              6. Public Audit Journey
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Inspect on-chain event logs, review community objections, and record new objections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
