import React from 'react';
import { useWallet } from '../context/WalletContext';
import { activeContractConfig } from '../config/studionet';
import { formatAddress } from '../utils/formatters';
import { getExplorerAddressUrl } from '../utils/github';

export const Header: React.FC = () => {
  const {
    connectedAccount,
    selectedProviderInfo,
    isWrongChain,
    openSelector,
    disconnectWallet,
    switchChain,
  } = useWallet();

  const contractAddress = activeContractConfig.contractAddress;
  const explorerUrl = contractAddress ? getExplorerAddressUrl(contractAddress) : '#';

  return (
    <header className="app-header">
      <div className="brand-section">
        <h1 className="brand-title">
          <span>Policy Translation Release Gate</span>
          <span className="brand-badge">Studionet</span>
        </h1>
        {contractAddress ? (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="badge badge-active font-mono"
            title="View contract on GenLayer Explorer"
          >
            Contract: {formatAddress(contractAddress)}
          </a>
        ) : (
          <span className="badge badge-revision">Contract Unconfigured</span>
        )}
      </div>

      <div className="header-actions">
        {connectedAccount ? (
          <>
            {isWrongChain ? (
              <button
                type="button"
                className="btn btn-danger"
                onClick={switchChain}
                title="Switch to GenLayer Studionet (61999)"
              >
                Switch to Studionet
              </button>
            ) : (
              <span className="badge badge-active" title="Connected to GenLayer Studionet">
                Studionet (61999)
              </span>
            )}

            <div className="btn btn-secondary" style={{ padding: '6px 12px', gap: '8px' }}>
              {selectedProviderInfo?.icon && (
                <img
                  src={selectedProviderInfo.icon}
                  alt={selectedProviderInfo.name}
                  style={{ width: 18, height: 18, borderRadius: 4 }}
                />
              )}
              <span className="font-mono">{formatAddress(connectedAccount)}</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={disconnectWallet}
              title="Disconnect Wallet"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={openSelector}>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};
