import React, { useEffect, useState } from 'react';
import { rpcExecutor, RpcMetrics } from '../services/rpcBudget';

export const RpcMetricsBar: React.FC = () => {
  const [metrics, setMetrics] = useState<RpcMetrics>(rpcExecutor.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(rpcExecutor.getMetrics());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    rpcExecutor.invalidate();
    setMetrics(rpcExecutor.getMetrics());
  };

  return (
    <div className="metrics-bar" aria-label="RPC Call Budget and Metrics">
      <div className="metrics-item">
        <span>RPC Requests:</span>
        <span className="metrics-val">{metrics.totalRequests}</span>
      </div>

      <div className="metrics-item">
        <span>Cache Hits:</span>
        <span className="metrics-val" style={{ color: 'var(--accent-success)' }}>
          {metrics.cacheHits}
        </span>
      </div>

      <div className="metrics-item">
        <span>Dedup Hits:</span>
        <span className="metrics-val" style={{ color: 'var(--accent-primary)' }}>
          {metrics.dedupHits}
        </span>
      </div>

      <div className="metrics-item">
        <span>Network Calls:</span>
        <span className="metrics-val" style={{ color: 'var(--accent-warning)' }}>
          {metrics.networkCalls}
        </span>
      </div>

      <div className="metrics-item" style={{ marginLeft: 'auto', gap: 8 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Pub:{metrics.journeyCalls.publisher} | Loc:{metrics.journeyCalls.localizer} | Ass:{metrics.journeyCalls.assess} | Publi:{metrics.journeyCalls.publish} | Con:{metrics.journeyCalls.consumer} | Aud:{metrics.journeyCalls.audit}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
          onClick={handleClearCache}
          title="Invalidate safe read cache"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
};
