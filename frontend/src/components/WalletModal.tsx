import React, { useEffect } from 'react';
import { useWallet } from '../context/WalletContext';

export const WalletModal: React.FC = () => {
  const { isSelectorOpen, closeSelector, availableProviders, connectWallet, isConnecting, error } =
    useWallet();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectorOpen) {
        closeSelector();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectorOpen, closeSelector]);

  if (!isSelectorOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSelector();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="wallet-modal-title" className="card-title" style={{ margin: 0 }}>
            Connect Wallet
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={closeSelector}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <p className="card-desc">
          Select an EIP-6963 detected wallet provider (MetaMask, OKX Wallet, or Rabby).
        </p>

        {error && (
          <div className="banner banner-warning" style={{ marginBottom: 16 }}>
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {availableProviders.length > 0 ? (
            availableProviders.map((providerDetail) => (
              <button
                key={providerDetail.info.uuid}
                type="button"
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  width: '100%',
                }}
                disabled={isConnecting}
                onClick={() => connectWallet(providerDetail)}
              >
                {providerDetail.info.icon ? (
                  <img
                    src={providerDetail.info.icon}
                    alt={providerDetail.info.name}
                    style={{ width: 24, height: 24, borderRadius: 6 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: 'var(--border-color)',
                    }}
                  />
                )}
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{providerDetail.info.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {providerDetail.info.rdns}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: 12 }}>No supported EIP-6963 wallets detected.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Please ensure you have MetaMask, OKX Wallet, or Rabby installed and enabled in your browser.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  MetaMask
                </a>
                <a
                  href="https://www.okx.com/web3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  OKX Wallet
                </a>
                <a
                  href="https://rabby.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Rabby
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
