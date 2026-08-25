import React from 'react';
import { activeContractConfig } from '../config/studionet';

export const ContractConfigBanner: React.FC = () => {
  if (activeContractConfig.isConfigured) return null;

  return (
    <div className="banner banner-warning" role="alert">
      <div>
        <strong>Contract Address Not Configured: </strong>
        <span>
          Set <code className="font-mono">VITE_GENLAYER_CONTRACT_ADDRESS</code> in your{' '}
          <code className="font-mono">.env</code> file or deployment environment to enable read
          views and write transactions.
        </span>
      </div>
    </div>
  );
};
